---
layout: post
title:  "Phoenix Todos - Authorized Sockets"
description: "Part ten of our 'Phoenix Todos' Literate Commits series. Implementing authorization over Phoenix sockets."
author: "Pete Corey"
date:   2016-11-09
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos"]
---

# [Authenticated Sockets]({{page.repo}}/commit/a366d906d856c2db754f6528626e5c04d6ef9934)

Now that we've implemented the bulk of the unauthenticated functionality
in our application, we need to turn our attention to authenticated
functionality.

To do that, we'll need to authenticate the channel we're using to
communicate with the client. We can do this with a custom `connect`{:.language-elixir}
function that verified the user's provided `guardian_token`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def connect(%{"guardian_token" => jwt}, socket) do
  case sign_in(socket, jwt) do
    {:ok, authed_socket, guardian_params} ->
      {:ok, authed_socket}
    _ ->
      {:ok, socket}
  end
end
</code></pre>

If the user is authenticated correctly, we'll swap their socket out for
an `auth_socket`{:.language-elixir}, which can be used to access the current user's object
and claims.

If the user doesn't provide a `guardian_token`{:.language-elixir}, we'll fall back to our
old `connect`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
  def connect(_params, socket) do
    {:ok, socket}
  end
</code></pre>

All of the old functionality will continue to work as expected.


<pre class='language-elixirDiff'><p class='information'>web/channels/user_socket.ex</p><code class='language-elixirDiff'>
 ...
   use Phoenix.Socket
+  import Guardian.Phoenix.Socket
 
 ...
   # performing token verification on connect.
+  def connect(%{"guardian_token" => jwt}, socket) do
+    case sign_in(socket, jwt) do
+      {:ok, authed_socket, _guardian_params} ->
+        {:ok, authed_socket}
+      _ ->
+        {:ok, socket}
+    end
+  end
+
   def connect(_params, socket) do
</code></pre>



# [Guardian Token]({{page.repo}}/commit/20d30697ddb515f3277feb293716536c0914071d)

Now that our socket connection is expecting a `guardian_token`{:.language-elixir}
parameter, we need to supply it in our `connectSocket`{:.language-javascript} action.


<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
     params: {
-      token: jwt
+      guardian_token: jwt
     }
</code></pre>



# [Connect Socket Thunk]({{page.repo}}/commit/b26627c6562df4603c281ae5edc87dab9fad055c)

Because our entire socket connection will be authenticated or
unauthenticated, we need to prepare ourselves to re-establish the
connection every time we log in/out.

To start, we'll need to clear out our local set of `lists`{:.language-javascript} every time we
connect to the socket.

We also need to trigger a call to our `joinListsChannel`{:.language-javascript} thunk every
time we connect.


<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 export function connectSocket(jwt) {
-  let socket = new Socket("/socket", {
-    params: {
-      guardian_token: jwt
-    }
-  });
-  socket.connect();
-  return { type: CONNECT_SOCKET, socket };
+  return (dispatch, getState) => {
+    let socket = new Socket("/socket", {
+      params: {
+        guardian_token: jwt
+      }
+    });
+    socket.connect();
+    dispatch({ type: CONNECT_SOCKET, socket });
+    dispatch(joinListsChannel("lists.public"));
+  };
 }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/app.js</p><code class='language-javascriptDiff'>
 ...
 store.dispatch(connectSocket(store.getState().jwt));
-store.dispatch(joinListsChannel("lists.public"));
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   case CONNECT_SOCKET:
-    return Object.assign({}, state, { socket: action.socket });
+    return Object.assign({}, state, { socket: action.socket, lists: [] });
   case JOIN_LISTS_CHANNEL_SUCCESS:
</code></pre>



# [Reconnect]({{page.repo}}/commit/913a3ed64cdb85d7aeb98cbb7b31301a4a2399b3)

Now we'll reconnect to our socket every time a user signs in, signs up,
or signs out. This ensures that the socket connection is always properly
authenticated.

These changes also introduced a few small bugs which we quickly fixed.


<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
           dispatch(signUpSuccess(res.user, res.jwt));
+          dispatch(connectSocket(res.jwt));
           return true;
 ...
           dispatch(signOutSuccess());
+          dispatch(connectSocket(res.jwt));
           return true;
 ...
           dispatch(signInSuccess(res.user, res.jwt));
+          dispatch(connectSocket(res.jwt));
           return true;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/layouts/App.jsx</p><code class='language-javascriptDiff'>
 ...
 import { signOut, createList } from "../actions";
+import _ from "lodash";
 
 ...
             const list = _.find(this.props.lists, list => list.id == this.props.params.id);
-            if (list.user_id) {
+            if (list && list.user_id) {
               const publicList = _.find(this.props.list, list => !list.user_id);
</code></pre>



# [Fetching All Lists]({{page.repo}}/commit/e326eb84243ae7916599ec912ec82ef7f96a4021)

To make things simpler, and to show off a feature of Phoenix, I've
decided to merge the `"lists.public"`{:.language-elixir} and `"lists.private"`{:.language-elixir} publications
into a single channel: `"lists"`{:.language-elixir}.

This channel will return all lists accessible by the current user, based
on their authenticated socket.

We replaced the `List.public`{:.language-elixir} function with `List.all`{:.language-elixir}, which takes in a
`user_id`{:.language-elixir}. When `user_id`{:.language-elixir} is `nil`{:.language-elixir}, we return all public lists, as
before. However, when `user_id`{:.language-elixir} isn't `nil`{:.language-elixir}, we return all lists owned
by that user (`^user_id == list.user_id`{:.language-elixir}), and all public lists.


<pre class='language-elixirDiff'><p class='information'>test/models/list_test.exs</p><code class='language-elixirDiff'>
 ...
 
-  test "public" do
+  test "all" do
     user = User.changeset(%User{}, %{
 ...
     })
-    Repo.insert!(%List{
+    |> Repo.preload(:todos)
+    private = Repo.insert!(%List{
       name: "private",
 ...
     })
+    |> Repo.preload(:todos)
 
-    lists = List |> List.public |> Repo.all
+    public_lists = List |> List.all(nil) |> Repo.all |> Repo.preload(:todos)
+    all_lists = List |> List.all(user.id) |> Repo.all |> Repo.preload(:todos)
 
-    assert lists == [public]
+    assert public_lists == [public]
+    assert all_lists == [public, private]
   end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-elixirDiff'>
 ...
 
-  def join("lists.public", _message, socket) do
-    lists = List |> List.public |> Repo.all
+  defp get_user_id(socket) do
+    case Guardian.Phoenix.Socket.current_resource(socket) do
+      user ->
+        user.id
+      _ ->
+        nil
+    end
+  end
+
+  def join("lists", _message, socket) do
+    lists = List |> List.all(get_user_id(socket)) |> Repo.all
     {:ok, lists, socket}
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/channels/user_socket.ex</p><code class='language-elixirDiff'>
 ...
   # channel "rooms:*", PhoenixTodos.RoomChannel
-  channel "lists.public", PhoenixTodos.ListChannel
+  channel "lists", PhoenixTodos.ListChannel
 
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
 ...
 
-  def public(query) do
+  def all(query, nil) do
     from list in query,
 ...
 
+  def all(query, user_id) do
+    from list in query,
+    where: ^user_id == list.user_id or is_nil(list.user_id),
+    order_by: list.inserted_at,
+    preload: [:todos]
+  end
+
   def findByName(query, name) do
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
     dispatch({ type: CONNECT_SOCKET, socket });
-    dispatch(joinListsChannel("lists.public"));
+    dispatch(joinListsChannel("lists"));
   };
</code></pre>


# Final Thoughts

In hashing out this authorization scheme, I've realized there are lots of problems with this approach. Splitting communication across both WebSockets and REST endpoints creates lots of confusion around a user's authorization state.

In hindsight, it would have been better to do everything over WebSockets and forget the REST user and sessions endpoints altogether. I'll be sure to write up my thoughts around the problems with this kind of authorization and how to to it better in the future.

Next week, we should be able to finish up all authenticated functionality and finish up the Meteor to Phoeix migration project!
