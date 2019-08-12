---
layout: post
title:  "GraphQL Authentication with Elixir and Absinthe"
excerpt: "Let's build out the back-end authentication functionality of an Absinthe-powered Elixir and Phoenix application."
author: "Pete Corey"
date:   2017-05-08
tags: ["Elixir", "Phoenix", "Absinthe", "GraphQL", "Authentication"]
---

You’ve assembled your superhero stack. [Your React front-end](http://www.east5th.co/blog/2017/04/03/using-create-react-app-with-phoenix/) is communicating with an [Elixir](http://elixir-lang.org/)/[Phoenix](http://www.phoenixframework.org/) back-end [through an Apollo/Absinthe GraphQL data layer](http://www.east5th.co/blog/2017/04/10/using-apollo-client-with-elixirs-absinthe/).

You feel invincible.

But that feeling of invincibility quickly turns to panic as your first real development task comes down the pipe. You need to add user authentication to your system.

How do we even do authentication in this stack?

Our application will need to handle both publicly accessible and private queries and mutations through its GraphQL API. How do we set up these queries on the server, and how do we manage users’ sessions on the client?

Great questions! [Let the panic pass over you](https://en.wikipedia.org/wiki/Bene_Gesserit#Litany_against_fear) and let’s dive in.

## Two Layers of Authentication

Every request made against our Absinthe-based GraphQL server is done through an HTTP request. This request layer provides a fantastic opportunity to lay the groundwork for our authentication system.

Every GraphQL request that’s made against our system will come with an optional `auth_token`{:.language-elixir}. A valid `auth_token`{:.language-elixir} will map to a single user in our system. This `auth_token`{:.language-elixir} is assigned to a user [when they sign in](http://www.east5th.co/blog/2017/04/24/passwordless-authentication-with-phoenix-tokens/).

On each request we’ll look up the user associated with the given `auth_token`{:.language-elixir} and attach them to [the context of our GraphQL resolvers](http://graphql.org/learn/execution/#root-fields-resolvers).

If we can’t find a user associated with a given `auth_token`{:.language-elixir}, we’ll return an authorization error (`403`{:.language-elixir}) at the HTTP level. Otherwise, if no `auth_token`{:.language-elixir} was provided, we simply won’t set the `user_id`{:.language-elixir} in our GraphQL context and we’ll move onto processing our query and mutation resolvers.

The key to our authentication (and authorization) system is that the currently signed in user can be pulled from the GraphQL context. This context can be accessed by all of our resolvers and can be used to make decisions about what data to return, which mutations to allow, etc…

## Writing Our Context Plug

The first step of building our authentication solution is to write a piece of [Plug middleware](https://hexdocs.pm/plug/readme.html) that populates our GraphQL context with the currently signed in user.

To make things more real, let’s consider the context middleware I’m using for the security-focused SaaS application I’m building ([Inject Detect](http://www.injectdetect.com/)). The middleware is based on [the middleware provided by the Absinthe guide](http://absinthe-graphql.org/guides/context-and-authentication/).

With that in mind, let’s build out our Plug in a module called `InjectDetect.Web.Context`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defmodule InjectDetect.Web.Context do
  @behaviour Plug

  import Plug.Conn

  def init(opts)
  def call(conn, _)

end
</code></pre>

To start, we’ll want our plug to implement the `Plug`{:.language-elixir} behavior, and to import `Plug.Conn`{:.language-elixir}. Implementing the `Plug`{:.language-elixir} behavior means that we’ll need to define an `init/1`{:.language-elixir} function, and a `call/2`{:.language-elixir} function.

The `call`{:.language-elixir} function is the entry point into our Plug middleware. Let’s flesh it out a bit:

<pre class='language-elixir'><code class='language-elixir'>
def call(conn, _) do
  case build_context(conn) do
    {:ok, context} ->
      put_private(conn, :absinthe, %{context: context})
    {:error, reason} ->
      conn
      |> send_resp(403, reason)
      |> halt()
    _ ->
      conn
      |> send_resp(400, "Bad Request")
      |> halt()
  end
end
</code></pre>

Here’s the meat of our context middleware. We call out to a function called `build_context`{:.language-elixir} which builds our GraphQL context, as the name suggests.

If `build_context`{:.language-elixir} returns an `:ok`{:.language-elixir} tuple, we stuff the resulting context into our `conn`{:.language-elixir} [as is expected by Absinthe](http://absinthe-graphql.org/guides/context-and-authentication/#context-and-plugs).

Otherwise, we return either a `403`{:.language-elixir} error or a `400`{:.language-elixir} error in the case of either a bad authentication token, or any other unexpected error.

Now we need to flesh out the `build_context`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
def build_context(conn) do
  with ["Bearer " <> auth_token] <- get_req_header(conn, "authorization"),
       {:ok, user_id}            <- authorize(auth_token)
  do
    {:ok, %{user_id: user_id}}
  else
    []    -> {:ok, %{}}
    error -> error
  end
end
</code></pre>

`build_context`{:.language-elixir} pulls the `auth_token`{:.language-elixir} out of the `authorization`{:.language-elixir} header of the request and passes it into an `authorize`{:.language-elixir} function. `authorize`{:.language-elixir} either returns an `:ok`{:.language-elixir} tuple with the current `user_id`{:.language-elixir}, or an `:error`{:.language-elixir}.

If `authorize`{:.language-elixir} returns an error, we’ll pass that back up to our `call`{:.language-elixir} function, which returns a `403`{:.language-elixir} for us.

Otherwise, if the `authorization`{:.language-elixir} header on the request is empty, we'll return an empty map in the place of our GraphQL context. This empty context will allow our resolvers to let unauthenticated users access public queries and mutations.

Lastly, let’s take a look at `authorize`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def authorize(auth_token) do
  InjectDetect.State.User.find(auth_token: auth_token)
  |> case do
       nil  -> {:error, "Invalid authorization token"}
       user -> {:ok, user.id}
     end
end
</code></pre>

`authorize`{:.language-elixir} is a relatively simple function.

It takes in an `auth_token`{:.language-elixir}, looks up the user associated with that token, and either returns that user’s `id`{:.language-elixir}, or an `:error`{:.language-elixir} tuple if no associated user was found.

----

Armed with our new `InjectDetect.Web.Context`{:.language-elixir} Plug, we can build a new `:graphql`{:.language-elixir} pipeline in our router:

<pre class='language-elixir'><code class='language-elixir'>
pipeline :graphql do
  plug :fetch_session
  plug :fetch_flash
  plug InjectDetect.Web.Context
end
</code></pre>

And pipe our `/graphql`{:.language-elixir} endpoint through it:

<pre class='language-elixir'><code class='language-elixir'>
scope "/graphql" do
  pipe_through :graphql
  forward "/", Absinthe.Plug, schema: InjectDetect.Schema
end
</code></pre>

Now all GraphQL requests made against our server will run through our authentication middleware, and the currently signed in user will be available to all of our GraphQL resolvers.

{% include newsletter.html %}

## Contextual Authentication and Authorization

Now that the currently signed in user can be accessed through our GraphQL context, we can start to perform authentication and authorization checks in our resolvers.

But first, let’s take a look at how we would set up a public query as a point of comparison.

### A Public Query

In our application the `user`{:.language-elixir} query must be public. It will either return the currently signed in user (if a user is signed in), or `nil`{:.language-elixir} if the current user is unauthenticated.

<pre class='language-elixir'><code class='language-elixir'>
field :user, :user do
  resolve &resolve_user/2
end
</code></pre>

The `user`{:.language-elixir} query takes no parameters, and it directly calls a function called `resolve_user`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def resolve_user(_args, %{context: %{user_id: user_id}}) do
  {:ok, User.find(user_id)}
end
def resolve_user(_args, _context), do: {:ok, nil}
</code></pre>

We use pattern matching to pull the current `user_id`{:.language-elixir} out of our GraphQL context, and then return the user with that `user_id`{:.language-elixir} back to our client. If our context is empty, the current user is unauthenticated, so we’ll return `nil`{:.language-elixir} back to our client.

Great, that makes sense. The query is returning data to both authenticated and unauthenticated users. It’s completely public and accessible by anyone with access to the GraphQL API.

But what about a private queries?

### A Private Query

Similarly, our application has an `application`{:.language-elixir} query that returns an object representing a user’s application registered with [Inject Detect](http://www.injectdetect.com/). This query should only return a specified application if it belongs to the currently signed in user.

<pre class='language-elixir'><code class='language-elixir'>
field :application, :application do
  arg :id, non_null(:string)
  resolve &resolve_application/2
end
</code></pre>

Once again, our `application`{:.language-elixir} query calls out to a resolver function called `resolve_application`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def resolve_application(%{id: id}, %{context: %{user_id: user_id}}) do
  case application = Application.find(id) do
    %{user_id: ^user_id} -> {:ok, application}
    _                    -> {:error, %{code: :not_found,
                                       error: "Not found",
                                       message: "Not found"}}
  end
end

def resolve_application(_args, _context), do:
  {:error, %{code: :not_found,
             error: "Not found",
             message: "Not found"}}
</code></pre>

In this case, we’re once again pattern matching on our GraphQL context to grab the current `user_id`{:.language-elixir}. Next, we look up the specified application. If the `user_id`{:.language-elixir} set on the application matches the current user’s `user_id`{:.language-elixir}, we return the application.

Otherwise, we return a `:not_found`{:.language-elixir} error. We’ll also return a `:not_found`{:.language-elixir} error if no `user_id`{:.language-elixir} is found in our GraphQL context.

By making these checks, an authenticated user can only access their own applications. Anyone else trying to query against their application will receive a `:not_found`{:.language-elixir} authorization error.

### A Private Mutation with Absinthe Middleware

Let’s take a look at another way of enforcing authentication at the query level.

We have a `sign_in`{:.language-elixir} mutation that should only be callable by a signed in user:

<pre class='language-elixir'><code class='language-elixir'>
field :sign_out, type: :user do
  middleware InjectDetect.Middleware.Auth
  resolve &handle_sign_out/2
end
</code></pre>

You’ll notice that we’ve added a call to an [Absinthe `middleware`{:.language-elixir} module](https://hexdocs.pm/absinthe/Absinthe.Middleware.html) before the call to our `&handle_sign_out/2`{:.language-elixir} resolver. As you might have guessed, the `InjectDetect.Middleware.Auth`{:.language-elixir} module is where we’re enforcing an authentication check.

<pre class='language-elixir'><code class='language-elixir'>
defmodule InjectDetect.Middleware.Auth do
  @behavior Absinthe.Middleware

  def call(resolution = %{context: %{user_id: _}}, _config) do
    resolution
  end

  def call(resolution, _config) do
    resolution
    |> Absinthe.Resolution.put_result({:error, %{code: :not_authenticated,
                                                 error: "Not authenticated",
                                                 message: "Not authenticated"}})
  end

end
</code></pre>

The `call`{:.language-elixir} function is our entry-point into our middleware module. It takes an `Absinthe.Resolution`{:.language-elixir} struct as an argument, which contains the current GraphQL context.

If the context contains a `user_id`{:.language-elixir}, we know that the user making the request is authorized. We can return the unmodified `resolution`{:.language-elixir} from our middleware function, which lets it continue on to the `&handle_sign_out/2`{:.language-elixir} resolver function.

Otherwise, if no `user_id`{:.language-elixir} is found in the context, we use `Absinthe.Resolution.put_result`{:.language-elixir} to modify the `resolution`{:.language-elixir} struct before returning it from our middleware. Giving the `resolution`{:.language-elixir} a result, in this case a `:not_authenticated`{:.language-elixir} `:error`{:.language-elixir} tuple, will short circuit the query or mutation’s resolution and immediately return that result to the client.

This piece of middleware effectively prevents unauthenticated users from accessing the `sign_out`{:.language-elixir} mutation.

Beautiful.

This middleware pattern is extremely powerful. It can easily be extended to check for specific user roles or other criteria, and can be easily added to an existing query or mutation.

Additionally, multiple middleware modules or functions can be chained together to create a very readable, declarative authentication and authorization scheme around your GraphQL API.

## Final Thoughts

At first, all of the moving parts related to handling authentication and authorization in a GraphQL application can be overwhelming.

Thankfully, once you wrap your head around the basic strategies and building blocks involved, the end solution easily falls into place. Authorization and authentication in a GraphQL-based system isn’t much different than in any other system.

Next week, we’ll move on to answering the second set of questions raised in the beginning of this article. How do we manage user sessions on the front-end of our application?

Stay tuned!
