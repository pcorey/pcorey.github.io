---
layout: post
title:  "Basic Meteor Authentication in Phoenix"
excerpt: "Learn how to use the front-end portion of Meteor's accounts and authentication system with an Elixir and Phoenix backend."
author: "Pete Corey"
date:   2016-11-14
tags: ["Elixir", "Phoenix", "Meteor", "Authentication"]
---

A question that often comes up when I’m talking to [Meteor](https://www.meteor.com/) developers about transitioning to [Phoenix](http://www.phoenixframework.org/) is how to handle authentication.

When transitioning, a developer with an existing application and data may want to integrate with Meteor’s existing authentication data in their Elixir/Phoenix application instead of jumping ship and switching to an entirely different authentication scheme.

Let’s dig into how Meteor’s password authentication works and how to use it within a [Elixir](http://elixir-lang.org/)/Phoenix application.

## Setting Up Our Projects

To start, let’s assume that you have a Meteor application built with user accounts managed through the `accounts-password`{:.language-javascript} package.

For development purposes, let’s assume that your Meteor server is running locally on port `3000`{:.language-javascript}, and your [MongoDB](https://www.mongodb.com/) database instance is running locally on port `3001`{:.language-javascript}.

If you want to follow along, a quick way to set this up would be to clone the example [Todos application](https://github.com/meteor/todos) and spin it up on your machine:

<pre class='language-bash'><code class='language-bash'>
git clone https://github.com/meteor/todos
cd todos
meteor
</code></pre>

Next, register a dummy user account (e.g., `"user@example.com"`{:.language-javascript}/`"password"`{:.language-javascript}) in your browser.

---- 

Now that Meteor has [MongoDB](https://www.mongodb.com/) running and populated with a Meteor-style user account, we’ll set up a new Phoenix project.

We’ll use [Mix](http://elixir-lang.org/getting-started/mix-otp/introduction-to-mix.html) to create our application, and because we’re using MongoDB as our database, we’ll specify that [we don’t want to use Ecto](http://www.east5th.co/blog/2016/10/31/how-to-use-mongodb-with-elixir/):

<pre class='language-bash'><code class='language-bash'>
mix phoenix.new meteor_auth --no-ecto
</code></pre>

Following the instructions in the [`mongodb`{:.language-elixir} driver package](https://github.com/ericmj/mongodb/), we’ll add dependencies on the `mongodb`{:.language-elixir} and `poolboy`{:.language-elixir} packages, and create a `MongoPool`{:.language-elixir} module.

Finally, we’ll add the `MongoPool`{:.language-elixir} to our list of supervised worker processes:

<pre class='language-elixir'><code class='language-elixir'>
children = [
  # Start the endpoint when the application starts
  supervisor(MeteorAuth.Endpoint, []),
  # Here you could define other workers and supervisors as children
  worker(MongoPool, [[database: "meteor", port: 3001]])
]
</code></pre>

After restarting our Phoenix server, our application should be wired up and communicating with our local MongoDB database.

## Anatomy of Meteor Authentication

At first glance, Meteor’s password-based authentication system can be confusing.

However, once you untangle the mess of asynchronous, highly configurable and pluggable code, you’re left with a fairly straight-forward authentication process.

Authenticating an existing user usually begins with a call to the [`"login"`{:.language-javascript} Meteor method](https://github.com/meteor/meteor/blob/5f0303699a847416d087dd2660a75f286094bb06/packages/accounts-base/accounts_server.js#L524-L534). This method will call the login handler registered in the `accounts-password`{:.language-javascript} package, which [simply does a password check](https://github.com/meteor/meteor/blob/5f0303699a847416d087dd2660a75f286094bb06/packages/accounts-password/password_server.js#L246-L295). The result of the password check is passed into [the  `_attemptLogin`{:.language-javascript} function](https://github.com/meteor/meteor/blob/5f0303699a847416d087dd2660a75f286094bb06/packages/accounts-base/accounts_server.js#L312-L363), which actually [logs the user in](https://github.com/meteor/meteor/blob/5f0303699a847416d087dd2660a75f286094bb06/packages/accounts-base/accounts_server.js#L273-L302) if the password check was successful, or returns an error if the check was unsuccessful.

The results of a successful login are that the authenticated user will be associated with the current connection, and that the user’s `_id`{:.language-javascript}, resume `token`{:.language-javascript}, and a `tokenExpires`{:.language-javascript} timestamp will be returned to the client.

## Building an Accounts Module

To support the ability to log into a Meteor application through Elixir, we’ll build a (hugely simplified) accounts module. The module will be responsible for transforming the email and password combination passed to the server into an authenticated user session.

Let’s start by defining the module and the module’s entry points:

<pre class='language-elixir'><code class='language-elixir'>
defmodule MeteorAuth.Accounts do

  def login(socket, %{
              "user" => %{"email" => email},
              "password" => password
            }) when is_binary(email) and is_binary(password) do
    socket
    |> attempt_login(%{query: %{"emails.0.address": email}}, password)
  end

end
</code></pre>

The `login`{:.language-elixir} function in our `MeteorAuth.Accounts`{:.language-elixir} module will take in a [Phoenix channel](http://www.phoenixframework.org/docs/channels) socket and a map that holds the user’s provided email address and password.

<p style="border: 1px dashed tomato; padding: 1em; background-color: #F9F0F0!important">Notice that we're asserting that both <code class=" highlighter-rouge language-elixir">email</code> and <code class="highlighter-rogue language-elixir">password</code> should be "binary" types? This helps prevent <a href="http://www.east5th.co/blog/2016/11/07/nosql-injection-in-phoenix-applications/">NoSQL injection vulnerabilities</a>.</p>

The `login`{:.language-elixir} function calls `attempt_login`{:.language-elixir}, which grabs the user from MongoDB based on the constructed query (`get_user_from_query`{:.language-elixir}), checks the user’s password (`valid_credentials?`{:.language-elixir}), and finally attempt to  log the user in (`log_in_user`{:.language-elixir}):

<pre class='language-elixir'><code class='language-elixir'>
defp attempt_login(socket, %{query: query}, password) do
  user = get_user_from_query(query)
  valid? = valid_credentials?(user, password)
  log_in_user(valid?, socket, user)
end
</code></pre>

To fetch the user document from MongoDB, we’re running a `find`{:.language-elixir} query against the `"users"`{:.language-elixir} collection, transforming the resulting database cursor into a list, and then returning the first element from that list:

<pre class='language-elixir'><code class='language-elixir'>
defp get_user_from_query(query) do
  MongoPool
  |> Mongo.find("users", query)
  |> Enum.to_list
  |> List.first
end
</code></pre>

To check the user’s password, we transform the user-provided `password`{:.language-elixir} string into a format that Meteor’s accounts package expects, and then we use the [Comeonin](https://github.com/riverrun/comeonin) package to securely compare the hashed version of the password string with the hashed password saved in the user’s document:

<pre class='language-elixir'><code class='language-elixir'>
defp valid_credentials?(%{"services" => %{"password" => %{"bcrypt" => bcrypt}}},
                        password) do
  password
  |> get_password_string
  |> Comeonin.Bcrypt.checkpw(bcrypt)
end
</code></pre>


<p style="border: 1px dashed #690; padding: 1em; background-color: #F0F9F0">
Notice how we’re using pattern matching to destructure a complex user document and grab only the fields we care about. Isn't Elixir awesome?
</p>

Before [Bcrypt hashing](https://en.wikipedia.org/wiki/Bcrypt) a password string, [Meteor expects](https://github.com/meteor/meteor/blob/5f0303699a847416d087dd2660a75f286094bb06/packages/accounts-password/password_server.js#L32-L43) it to be [SHA256 hashed](https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/sha/sha256.js#L136-L137) and converted into a lowercased base16 (hexadecimal) string. This is fairly painless thanks to Erlang’s `:crypto`{:.language-elixir} library:

<pre class='language-elixir'><code class='language-elixir'>
defp get_password_string(password) do
  :crypto.hash(:sha256, password)
  |> Base.encode16
  |> String.downcase
end
</code></pre>

Our `valid_credentials?`{:.language-elixir} function will return either a `true`{:.language-elixir} or a `false`{:.language-elixir} if the user-provided credentials are correct or incorrect.

We can pattern match our `log_in_user`{:.language-elixir} function to do different things for valid and invalid credentials. If a user has provided a valid email address and password, we’ll log them in by assigning their user document to the current socket:

<pre class='language-elixir'><code class='language-elixir'>
defp log_in_user(true, socket, user) do
  auth_socket = Phoenix.Socket.assign(socket, :user, user)
  {:ok, %{"id" => user["_id"]}, auth_socket}
end
</code></pre>

For invalid credentials, we’ll simply return an error:

<pre class='language-elixir'><code class='language-elixir'>
defp log_in_user(false, _socket, _user) do
  {:error}
end
</code></pre>

## Logging in Through Channels

Now that our `MeteorAuth.Accounts`{:.language-elixir} module is finished up, we can wire it up to a Phoenix channel to test the end-to-end functionality.

We’ll start by creating a `"ddp"`{:.language-elixir} channel in our default `UserSocket`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
channel "ddp", MeteorAuth.DDPChannel
</code></pre>

In our `MeteorAuth.DDPChannel`{:.language-elixir} module, we’ll create a `"login"`{:.language-elixir} event handler that calls our `MeteorAuth.Accounts.login`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("login", params, socket) do
  case MeteorAuth.Accounts.login(socket, params) do
    {:ok, res, auth_socket} ->
      {:reply, {:ok, res}, auth_socket}
    {:error} ->
      {:reply, {:error}, socket}
  end
end
</code></pre>

If `login`{:.language-elixir} returns an `:ok`{:.language-elixir} atom, we’ll reply back with an `:ok`{:.language-elixir} status and the results of the login process (the user’s `_id`{:.language-elixir}).

If `login`{:.language-elixir} returns an `:error`{:.language-elixir}, we’ll reply back to the client with an error.

To make sure that everything’s working correctly, we can make another event handler for a `"foo"`{:.language-elixir} event. This event handler will simply inspect and return the currently assigned `:user`{:.language-elixir} on the socket:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("foo", _, socket) do
  user = socket.assigns[:user] |> IO.inspect
  case user do
    nil ->
      {:reply, :ok, socket}
    %{"_id" => id} ->
      {:reply, {:ok, %{"id" => id}}, socket}
  end
end
</code></pre>

On the client, we can test to make sure that everything’s working as expected by running through a few different combinations of `"foo"`{:.language-javascript} and `"login"`{:.language-javascript} events:

<pre class='language-javascript'><code class='language-javascript'>
let channel = socket.channel("ddp", {})
channel.join()

channel.push("foo")
    .receive("ok", resp => { console.log("foo ok", resp) })
    .receive("error", resp => { console.log("foo error", resp) })

...

channel.push("login", {user: {email: "user@example.com"}, password: "password"})
    .receive("ok", resp => { console.log("login ok", resp) })
    .receive("error", resp => { console.log("login error", resp) })

channel.push("foo")
    .receive("ok", resp => { console.log("foo ok", resp) })
    .receive("error", resp => { console.log("foo error", resp) })
</code></pre>


And as expected, everything works!

<img style="width: 40%; margin: 0em 0 0em 1em; float:right;" title="Meteor authentication in a Phoenix application" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/meteor_auth.png">

We can now check if a user is currently authenticated on a socket by looking for the assigned `:user`{:.language-elixir}. If none exists, the current user is unauthenticated. If `:user`{:.language-elixir} exists, we know that the current user has been authenticated and is who they say they are.

## Future Work

So far, we’ve only been able to log in with credentials set up through a Meteor application. We’re not creating or accepting resume tokens, and we’re missing lots of functionality related to signing up, logging out, resetting passwords, etc…

If your goal is to recreate the entirety of Meteor’s accounts package in Elixir/Phoenix, you have a long march ahead of you. The purpose of this article is to simply show that it’s possible and fairly painlessly to integrate these two stacks together.

It’s important to know that for green-field projects, or projects seriously planning on doing a full Elixir/Phoenix transition, there are better, more Phoenix-centric ways of approaching and handling user authentication and authorization.

That being said, if there’s any interest, I may do some future work related to resume tokens, signing up and out, and potentially turning this code into a more full-fledged Elixir package.

For now, feel free to check out [the entire project on GitHub](https://github.com/pcorey/meteor_auth) to get the full source. Let me know if there’s anything in particular you’d like to see come out of this!
