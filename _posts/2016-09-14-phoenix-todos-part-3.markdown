---
layout: post
title:  "Phoenix Todos - Back-end Authentication"
description: "Part three of our 'Phoenix Todos' Literate Commits series. Buiding out our back-end authentication solution."
author: "Pete Corey"
date:   2016-09-14
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos", "Authentication"]
---


# [Enter Guardian]({{page.repo}}/commit/a165dc982f029e2299d96a65ac9e3afa7981e648)

Now we're getting to the meat of our authentication system. We have our
`User`{:.language-elixir} model set up, but we need to associate users with active
sessions.

This is where [Guardian](https://github.com/ueberauth/guardian) comes
in. Guardian is an authentication framework that leverages [JSON Web Tokens (JWT)](https://jwt.io/introduction/) and plays
nicely with [Phoenix Channels](http://www.phoenixframework.org/docs/channels).

To use Guardian, we'll first add it as a depenency to our application:

<pre class='language-elixir'><code class='language-elixir'>
{:guardian, "~> 0.12.0"}
</code></pre>

Next, we need to do some configuring:

<pre class='language-elixir'><code class='language-elixir'>
config :guardian, Guardian,
  allowed_algos: ["HS512"], # optional
  verify_module: Guardian.JWT,  # optional
  issuer: "PhoenixTodos",
  ttl: { 30, :days },
  verify_issuer: true, # optional
  secret_key: %{"kty" => "oct", "k" => System.get_env("GUARDIAN_SECRET_KEY")},
  serializer: PhoenixTodos.GuardianSerializer
</code></pre>

You'll notice that I'm pulling my `secret_key`{:.language-elixir} from my system's
environment variables. It's a [bad idea](http://www.programmableweb.com/news/why-exposed-api-keys-and-sensitive-data-are-growing-cause-concern/analysis/2015/01/05) to keep secrets in version control.

I also specified a `serializer`{:.language-elixir} module. This is Guardian's bridge into
your system. It acts as a translation layer between Guardian's JWT and
your `User`{:.language-elixir} model.

Because it's unique to our system, we'll need to build the
`PhoenixTodos.GuardianSerializer`{:.language-elixir} ourselves.

Our serializer will need two fuctions. The first, `for_token`{:.language-elixir} translates a
`User`{:.language-elixir} model into a token string. An invalid `User`{:.language-elixir} should return an
`:error`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
test "generates token for valid user", %{user: user} do
  assert {:ok, _} = GuardianSerializer.for_token(user)
end
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
test "generates error for invalid user", %{} do
  assert {:error, "Invalid user"} = GuardianSerializer.for_token(%{})
end
</code></pre>

Thanks to Elixir's pattern matching, `for_token`{:.language-elixir} is a very simple
function:

<pre class='language-elixir'><code class='language-elixir'>
def for_token(%User{id: id}), do: {:ok, "User:#{id}"}
def for_token(_), do: {:error, "Invalid user"}
</code></pre>

Similarly, we need to define a `from_token`{:.language-elixir} function, which takes a
token string and returns the corresponding `User`{:.language-elixir} model:

<pre class='language-elixir'><code class='language-elixir'>
test "finds user from valid token", %{user: user} do
  {:ok, token} = GuardianSerializer.for_token(user)
  assert {:ok, _} = GuardianSerializer.from_token(token)
end
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
test "doesn't find user from invalid token", %{} do
  assert {:error, "Invalid user"} = GuardianSerializer.from_token("bad")
end
</code></pre>

To implement this, we'll pull the `User`{:.language-elixir} id out of the token string, and
look it up in the database:

<pre class='language-elixir'><code class='language-elixir'>
def from_token("User:" <> id), do: {:ok, Repo.get(User, String.to_integer(id))}
def from_token(_), do: {:error, "Invalid user"}
</code></pre>

Now that we've finished our serializer, we're in a position to wire up the
rest of our authentication system!


<pre class='language-elixirDiff'><p class='information'>config/config.exs</p><code class='language-elixirDiff'>
 ...
   binary_id: false
+
+config :guardian, Guardian,
+  allowed_algos: ["HS512"], # optional
+  verify_module: Guardian.JWT,  # optional
+  issuer: "PhoenixTodos",
+  ttl: { 30, :days },
+  verify_issuer: true, # optional
+  secret_key: %{"kty" => "oct", "k" => System.get_env("GUARDIAN_SECRET_KEY")},
+  serializer: PhoenixTodos.GuardianSerializer
</code></pre>

<pre class='language-elixirDiff'><p class='information'>lib/phoenix_todos/guardian_serializer.ex</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.GuardianSerializer do
+  @behavior Guardian.Serializer
+
+  alias PhoenixTodos.{User, Repo}
+
+  def for_token(%User{id: id}), do: {:ok, "User:#{id}"}
+  def for_token(_), do: {:error, "Invalid user"}
+
+  def from_token("User:" <> id), do: {:ok, Repo.get(User, String.to_integer(id))}
+  def from_token(_), do: {:error, "Invalid user"}
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>mix.exs</p><code class='language-elixirDiff'>
 ...
      {:mix_test_watch, "~> 0.2", only: :dev},
-     {:comeonin, "~> 2.0"}]
+     {:comeonin, "~> 2.0"},
+     {:guardian, "~> 0.12.0"}]
   end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>mix.lock</p><code class='language-elixirDiff'>
-%{"comeonin": {:hex, :comeonin, "2.5.2"},
+%{"base64url": {:hex, :base64url, "0.0.1"},
+  "comeonin": {:hex, :comeonin, "2.5.2"},
   "connection": {:hex, :connection, "1.0.4"},
   "gettext": {:hex, :gettext, "0.11.0"},
+  "guardian": {:hex, :guardian, "0.12.0"},
+  "jose": {:hex, :jose, "1.8.0"},
   "mime": {:hex, :mime, "1.0.1"},
   "postgrex": {:hex, :postgrex, "0.11.2"},
-  "ranch": {:hex, :ranch, "1.2.1"}}
+  "ranch": {:hex, :ranch, "1.2.1"},
+  "uuid": {:hex, :uuid, "1.1.4"}}
</code></pre>

<pre class='language-elixirDiff'><p class='information'>test/lib/guardian_serializer_test.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.GuardianSerializerTest do
+  use ExUnit.Case, async: true
+
+  alias PhoenixTodos.{User, Repo, GuardianSerializer}
+
+  setup_all do
+    user = User.changeset(%User{}, %{
+          email: "email@example.com",
+          password: "password"
+    })
+    |> Repo.insert!
+
+    {:ok, user: user}
+  end
+
+  test "generates token for valid user", %{user: user} do
+    assert {:ok, _} = GuardianSerializer.for_token(user)
+  end
+
+  test "generates error for invalid user", %{} do
+    assert {:error, "Invalid user"} = GuardianSerializer.for_token(%{})
+  end
+
+  test "finds user from valid token", %{user: user} do
+    {:ok, token} = GuardianSerializer.for_token(user)
+    assert {:ok, _} = GuardianSerializer.from_token(token)
+  end
+
+  test "doesn't find user from invalid token", %{} do
+    assert {:error, "Invalid user"} = GuardianSerializer.from_token("bad")
+  end
+end
</code></pre>



# [Sign-Up Route and Controller]({{page.repo}}/commit/c118f81324c5aa7392f1c998df279df7e36510d6)

The first step to implementing authentication in our application is creating a back-end sign-up route that creates a new user in our system.

To do this, we'll create an `"/api/users"`{:.language-elixir} route that sends `POST`{:.language-elixir}
requests to the `UserController.create`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
post "/users", UserController, :create
</code></pre>

We expect the user's `email`{:.language-elixir} and `password`{:.language-elixir} to be sent as parameters to
this endpoint. `UserController.create`{:.language-elixir} takes those `params`{:.language-elixir}, passes them
into our `User.changeset`{:.language-elixir}, and then attempts to `insert`{:.language-elixir} the resulting
`User`{:.language-elixir} into the database:

<pre class='language-elixir'><code class='language-elixir'>
User.changeset(%User{}, params)
|> Repo.insert
</code></pre>

If the `insert`{:.language-elixir} fails, we return the `changeset`{:.language-elixir} errors to the client:

<pre class='language-elixir'><code class='language-elixir'>
conn
|> put_status(:unprocessable_entity)
|> render(PhoenixTodos.ApiView, "error.json", error: changeset)
</code></pre>

Otherwise, we'll use Guardian to sign the new user's JWT and return the
`jwt`{:.language-elixir} and `user`{:.language-elixir} objects down to the client:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, jwt, _full_claims} = Guardian.encode_and_sign(user, :token)
conn
|> put_status(:created)
|> render(PhoenixTodos.ApiView, "data.json", data: %{jwt: jwt, user: user})
</code></pre>

Now all a user needs to do to sign up with our Todos application is send a
`POST`{:.language-elixir} request to `/api/users`{:.language-elixir} with their email and password. In turn,
they'll receive their JWT which they can send along with any subsequent
requests to verify their identity.


<pre class='language-elixirDiff'><p class='information'>test/controllers/user_controller_test.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.UserControllerTest do
+  use PhoenixTodos.ConnCase
+
+  test "creates a user", %{conn: conn} do
+    conn = post conn, "/api/users", user: %{
+      email: "email@example.com",
+      password: "password"
+    }
+    %{
+      "jwt" => _,
+      "user" => %{
+        "id" => _,
+        "email" => "email@example.com"
+      }
+    } = json_response(conn, 201)
+  end
+
+  test "fails user validation", %{conn: conn} do
+    conn = post conn, "/api/users", user: %{
+      email: "email@example.com",
+      password: "pass"
+    }
+    %{
+      "errors" => [
+        %{
+          "password" => "should be at least 5 character(s)"
+        }
+      ]
+    } = json_response(conn, 422)
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/controllers/user_controller.ex</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.UserController do
+  use PhoenixTodos.Web, :controller
+
+  alias PhoenixTodos.{User, Repo}
+
+  def create(conn, %{"user" => params}) do
+    User.changeset(%User{}, params)
+    |> Repo.insert
+    |> handle_insert(conn)
+  end
+
+  defp handle_insert({:ok, user}, conn) do
+    {:ok, jwt, _full_claims} = Guardian.encode_and_sign(user, :token)
+    conn
+    |> put_status(:created)
+    |> render(PhoenixTodos.ApiView, "data.json", data: %{jwt: jwt, user: user})
+  end
+  defp handle_insert({:error, changeset}, conn) do
+    conn
+    |> put_status(:unprocessable_entity)
+    |> render(PhoenixTodos.ApiView, "error.json", error: changeset)
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/user.ex</p><code class='language-elixirDiff'>
 ...
   use PhoenixTodos.Web, :model
+  @derive {Poison.Encoder, only: [:id, :email]}
 
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/router.ex</p><code class='language-elixirDiff'>
 ...
 
+  scope "/api", PhoenixTodos do
+    pipe_through :api
+
+    post "/users", UserController, :create
+  end
+
   scope "/", PhoenixTodos do
 ...
 
-  # Other scopes may use custom stacks.
-  # scope "/api", PhoenixTodos do
-  #   pipe_through :api
-  # end
 end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/views/api_view.ex</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.ApiView do
+  use PhoenixTodos.Web, :view
+
+  def render("data.json", %{data: data}) do
+    data
+  end
+
+  def render("error.json", %{error: changeset = %Ecto.Changeset{}}) do
+    errors = Enum.map(changeset.errors, fn {field, detail} ->
+      %{} |> Map.put(field, render_detail(detail))
+    end)
+
+    %{ errors: errors }
+  end
+
+  def render("error.json", %{error: error}), do: %{error: error}
+
+  def render("error.json", %{}), do: %{}
+
+  defp render_detail({message, values}) do
+    Enum.reduce(values, message, fn {k, v}, acc -> String.replace(acc, "%{#{k}}", to_string(v)) end)
+  end
+
+  defp render_detail(message) do
+    message
+  end
+
+end
</code></pre>



# [Sign-In Route and Controller]({{page.repo}}/commit/ce4631f35e1e4e43dd47d9f0445ed77250d2fb05)

Now that users have the ability to join our application, how will they
sign into their accounts?

We'll start implementing sign-in functionality by adding a new route
to our Phoenix application:

<pre class='language-elixir'><code class='language-elixir'>
post "/sessions", SessionController, :create
</code></pre>

When a user sends a `POST`{:.language-elixir} request to `/sessions`{:.language-elixir}, we'll route them to
the `create`{:.language-elixir} function in our `SessionController`{:.language-elixir} module. This function
will attempt to sign the user in with the credentials they provide.

At a high level, the `create`{:.language-elixir} function will be fairly straight-forward.
We want to look up the user based on the `email`{:.language-elixir} they gave, check if the
`password`{:.language-elixir} they supplied matches what we have on file:

<pre class='language-elixir'><code class='language-elixir'>
def create(conn, %{"email" => email, "password" => password}) do
  user = get_user(email)
  user
  |> check_password(password)
  |> handle_check_password(conn, user)
end
</code></pre>

If `get_user`{:.language-elixir} returns `nil`{:.language-elixir}, we couldn't find the user based on the
email address they provided. In that case, we'll return `false`{:.language-elixir} from
`check_password`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defp check_password(nil, _password), do: false
</code></pre>

Otherwise, we'll use `Comeonin`{:.language-elixir} to compare the hashed password we have
saved in `encrypted_password`{:.language-elixir} with the hash of the password the user
provided:

<pre class='language-elixir'><code class='language-elixir'>
defp check_password(user, password) do
  Comeonin.Bcrypt.checkpw(password, user.encrypted_password)
end
</code></pre>

If all goes well, we'll return a `jwt`{:.language-elixir} and the `user`{:.language-elixir} object for the
now-authenticated user:

<pre class='language-elixir'><code class='language-elixir'>
render(PhoenixTodos.ApiView, "data.json", data: %{jwt: jwt, user: user})
</code></pre>

We can test this sign-in route/controller combination just like we've
tested our sign-up functionality.


<pre class='language-elixirDiff'><p class='information'>test/controllers/session_controller_test.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.SessionControllerTest do
+  use PhoenixTodos.ConnCase
+
+  alias PhoenixTodos.{User, Repo}
+
+  test "creates a session", %{conn: conn} do
+    %User{}
+    |> User.changeset(%{
+      email: "email@example.com",
+      password: "password"
+    })
+    |> Repo.insert!
+
+    conn = post conn, "/api/sessions", email: "email@example.com", password: "password"
+    %{
+      "jwt" => _jwt,
+      "user" => %{
+        "id" => _id,
+        "email" => "email@example.com"
+      }
+    } = json_response(conn, 201)
+  end
+
+  test "fails authorization", %{conn: conn} do
+    conn = post conn, "/api/sessions", email: "email@example.com", password: "wrong"
+    %{
+      "error" => "Unable to authenticate"
+    } = json_response(conn, 422)
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/controllers/session_controller.ex</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.SessionController do
+  use PhoenixTodos.Web, :controller
+
+  alias PhoenixTodos.{User, Repo}
+
+  def create(conn, %{"email" => email, "password" => password}) do
+    user = get_user(email)
+    user
+    |> check_password(password)
+    |> handle_check_password(conn, user)
+  end
+
+  defp get_user(email) do
+    Repo.get_by(User, email: String.downcase(email))
+  end
+
+  defp check_password(nil, _password), do: false
+  defp check_password(user, password) do
+    Comeonin.Bcrypt.checkpw(password, user.encrypted_password)
+  end
+
+  defp handle_check_password(true, conn, user) do
+    {:ok, jwt, _full_claims} = Guardian.encode_and_sign(user, :token)
+    conn
+    |> put_status(:created)
+    |> render(PhoenixTodos.ApiView, "data.json", data: %{jwt: jwt, user: user})
+  end
+  defp handle_check_password(false, conn, _user) do
+    conn
+    |> put_status(:unprocessable_entity)
+    |> render(PhoenixTodos.ApiView, "error.json", error: "Unable to authenticate")
+  end
+
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/router.ex</p><code class='language-elixirDiff'>
 ...
     plug :accepts, ["json"]
+    plug Guardian.Plug.VerifyHeader
+    plug Guardian.Plug.LoadResource
   end
 ...
     post "/users", UserController, :create
+
+    post "/sessions", SessionController, :create
   end
</code></pre>



# [Sign-Out Route and Controller]({{page.repo}}/commit/ccdb3c6de0f6550e4833570a58e9b5fbd69a1cbd)

The final piece of our authorization trifecta is the ability for users
to sign out once they've successfully joined or signed into the
application.

To implement sign-out functionality, we'll want to create a route that
destroys a user's session when its called by an authenticated user:

<pre class='language-elixir'><code class='language-elixir'>
delete "/sessions", SessionController, :delete
</code></pre>

This new route points to `SessionController.delete`{:.language-elixir}. This function
doesn't exist yet, so let's create it:

<pre class='language-elixir'><code class='language-elixir'>
def delete(conn, _) do
  conn
  |> revoke_claims
  |> render(PhoenixTodos.ApiView, "data.json", data: %{})
end
</code></pre>

`revoke_claims`{:.language-elixir} will be a private function that simply looks up the
current user's token and [claims](https://jwt.io/introduction/#payload),
and then revokes them:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, claims} = Guardian.Plug.claims(conn)
Guardian.Plug.current_token(conn)
|> Guardian.revoke!(claims)
</code></pre>

In implementing this feature, we cleaned up our `SessionControllerTest`{:.language-elixir}
module a bit. We added a `create_user`{:.language-elixir} function, which creates a user
with a given email address and password, and a `create_session`{:.language-elixir} function
that logs that user in.

Using those functions we can create a user's session, and then construct
a `DELETE`{:.language-elixir} request with the user's JWT (`session_response["jwt"]`{:.language-elixir}) in
the `"authorization"`{:.language-elixir} header. If this request is successful, we've
successfully deleted the user's session.


<pre class='language-elixirDiff'><p class='information'>test/controllers/session_controller_test.exs</p><code class='language-elixirDiff'>
 ...
 
-  test "creates a session", %{conn: conn} do
+  defp create_user(email, password) do
     %User{}
     |> User.changeset(%{
-      email: "email@example.com",
-      password: "password"
-    })
+      email: email,
+      password: password
+    })
     |> Repo.insert!
+  end
 
-    conn = post conn, "/api/sessions", email: "email@example.com", password: "password"
-    %{
-      "jwt" => _jwt,
-      "user" => %{
-        "id" => _id,
-        "email" => "email@example.com"
-      }
-    } = json_response(conn, 201)
+  defp create_session(conn, email, password) do
+    post(conn, "/api/sessions", email: email, password: password)
+    |> json_response(201)
+  end
+
+  test "creates a session", %{conn: conn} do
+    create_user("email@example.com", "password")
+
+    response = create_session(conn, "email@example.com", "password")
+
+    assert response["jwt"]
+    assert response["user"]["id"]
+    assert response["user"]["email"]
   end
 ...
   end
+
+  test "deletes a session", %{conn: conn} do
+    create_user("email@example.com", "password")
+    session_response = create_session(conn, "email@example.com", "password")
+
+    conn
+    |> put_req_header("authorization", session_response["jwt"])
+    |> delete("/api/sessions")
+    |> json_response(200)
+  end
+
 end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/controllers/session_controller.ex</p><code class='language-elixirDiff'>
 ...
 
+  def delete(conn, _) do
+    conn
+    |> revoke_claims
+    |> render(PhoenixTodos.ApiView, "data.json", data: %{})
+  end
+
+  defp revoke_claims(conn) do
+    {:ok, claims} = Guardian.Plug.claims(conn)
+    Guardian.Plug.current_token(conn)
+    |> Guardian.revoke!(claims)
+    conn
+  end
+
   def create(conn, %{"email" => email, "password" => password}) do
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/router.ex</p><code class='language-elixirDiff'>
 ...
     post "/sessions", SessionController, :create
+    delete "/sessions", SessionController, :delete
   end
</code></pre>


## Final Thoughts

As a Meteor developer, it seems like we’re spending an huge amount of time implementing authorization in our Phoenix Todos application. This functionality comes out of the box with Meteor!

The truth is that authentication is a massive, nuanced problem. [Meteor’s Accounts system](https://guide.meteor.com/accounts.html) is a shining example of what Meteor does right. It abstracts away an incredibly tedious, but extremely important aspect of building web applications into an easy to use package.

On the other hand, Phoenix’s approach of forcing us to implement our own authentication system has its own set of benefits. By implementing authentication ourselves, we always know exactly what’s going on in every step of the process. There is no magic here. Complete control can be [liberating](https://github.com/meteor/meteor/issues/1834).

Check back next week when we turn our attention back to the front-end, and wire up our sign-up and sign-in React templates!
