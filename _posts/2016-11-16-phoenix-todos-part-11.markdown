---
layout: post
title:  "Phoenix Todos - Public and Private Lists"
excerpt: "Part eleven of our 'Phoenix Todos' Literate Commits series. Implementing public and private lists."
author: "Pete Corey"
date:   2016-11-16
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos"]
---


## [Make Private]({{page.repo}}/commit/0d8dae4dc90b11ead495e51be873da98d99ae3c9)

Now that our channel connection can be authenticated, we can gives users
the ability to make their lists private.

To start, we'll add a `"make_private"`{:.language-javascript} channel event handler. This
handler will call `List.make_private`{:.language-javascript} and set the list's `user_id`{:.language-javascript} equal
to the socket's currently authenticated user:

<pre class='language-javascript'><code class='language-javascript'>
list = get_user_id(socket)
|> List.make_private(list_id)
|> Repo.preload(:todos)
</code></pre>

Once we've done that, we'll broadcast a `"update_list"`{:.language-javascript} event to all
connected clients.

However, if a list becomes private, we'll want to remove it from other
users' clients, instead of just showing the change. To do this, we'll
have to intercept all outbound `"update_list"`{:.language-javascript} events:

<pre class='language-javascript'><code class='language-javascript'>
intercept ["update_list"]
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
def handle_out("update_list", list, socket) do
</code></pre>

If a user has permission to see the outgoing list, we'll `push`{:.language-javascript}
another `"update_list"`{:.language-javascript} event. Otherwise, we'll push a `"remove_list"`{:.language-javascript}
event:

<pre class='language-javascript'><code class='language-javascript'>
case List.canView?(get_user_id(socket), list) do
  true ->
    push(socket, "update_list", list)
  false ->
    push(socket, "remove_list", list)
end
</code></pre>

After wiring up all of the necessary Redux plumbing to call our
`"make_private"`{:.language-javascript} event, the functionality it complete.


<pre class='language-javascriptDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-javascriptDiff'>
 ...
 
+  intercept ["update_list"]
+
   defp get_user_id(socket) do
 ...
 
+  def handle_in("make_private", %{
+    "list_id" => list_id,
+  }, socket) do
+    list = get_user_id(socket)
+    |> List.make_private(list_id)
+    |> Repo.preload(:todos)
+
+    broadcast! socket, "update_list", list
+
+    {:noreply, socket}
+  end
+
   def handle_in("delete_todo", %{
 ...
 
+  def handle_out("update_list", list, socket) do
+    case List.canView?(get_user_id(socket), list) do
+      true ->
+        push(socket, "update_list", list)
+      false ->
+        push(socket, "remove_list", list)
+    end
+    {:noreply, socket}
+  end
+
 end
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/models/list.ex</p><code class='language-javascriptDiff'>
 ...
   @required_fields ~w(name incomplete_count)
-  @optional_fields ~w()
+  @optional_fields ~w(user_id)
 
 ...
 
+  def make_private(user_id, id) do
+    Repo.get(PhoenixTodos.List, id)
+    |> changeset(%{
+      user_id: user_id
+    })
+    |> Repo.update!
+  end
+
   def delete_todo(todo_id) do
 ...
 
+  def canView?(_, %{user_id: nil}), do: true
+  def canView?(user_id, %{user_id: user_id}), do: true
+  def canView?(_, _), do: false
+
 end
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const MAKE_PRIVATE_REQUEST = "MAKE_PRIVATE_REQUEST";
+export const MAKE_PRIVATE_SUCCESS = "MAKE_PRIVATE_SUCCESS";
+export const MAKE_PRIVATE_FAILURE = "MAKE_PRIVATE_FAILURE";
+
 export const DELETE_TODO_REQUEST = "DELETE_TODO_REQUEST";
 ...
     channel.on("update_list", list => {
+      console.log("update_list", list)
       dispatch(updateList(list));
 ...
 
+export function makePrivateRequest() {
+  return { type: MAKE_PRIVATE_REQUEST };
+}
+
+export function makePrivateSuccess() {
+  return { type: MAKE_PRIVATE_SUCCESS };
+}
+
+export function makePrivateFailure() {
+  return { type: MAKE_PRIVATE_FAILURE };
+}
+
+export function makePrivate(list_id) {
+  return (dispatch, getState) => {
+    const { channel } = getState();
+    dispatch(makePrivateRequest());
+    channel.push("make_private", { list_id })
+      .receive("ok", (list) => {
+        dispatch(makePrivateSuccess());
+      })
+      .receive("error", () => dispatch(makePrivateFailure()))
+      .receive("timeout", () => dispatch(makePrivateFailure()));
+  }
+}
+
 export function deleteTodoRequest() {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListHeader.jsx</p><code class='language-javascriptDiff'>
 ...
     } else {
-      makePrivate.call({ listId: list._id }, alert);
+      this.props.makePrivate(list.id);
     }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
   deleteList,
+  makePrivate,
   deleteTodo
 ...
                     updateName={this.props.updateName}
-                    deleteList={this.props.deleteList}/>
+                    deleteList={this.props.deleteList}
+                    makePrivate={this.props.makePrivate}
+        />
         &lt;div className="content-scrollable list-items">
 ...
       },
+      makePrivate: (list_id) => {
+        return dispatch(makePrivate(list_id));
+      },
       deleteTodo: (todo_id) => {
</code></pre>




## [Make Public]({{page.repo}}/commit/3f0f95a214001bba35536a2016d3fe634c4ad0eb)

Just as we let users make their lists private, we need to let them make
their private lists public again.

We'll do this by adding a `"make_public"`{:.language-javascript} channel event that sets the
`user_id`{:.language-javascript} field on the specified list to `nil`{:.language-javascript} and broadcasts an
`"update_list"`{:.language-javascript} event.

<pre class='language-javascript'><code class='language-javascript'>
list = List.make_public(list_id)
|> Repo.preload(:todos)
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
broadcast! socket, "update_list", list
</code></pre>

Unfortunately, this introduces a situation where lists are added back
into the UI through a `"update_list"`{:.language-javascript} event rather than a `"add_list"`{:.language-javascript}
event.

To handle this, we need to check if the `"UPDATE_LIST"`{:.language-javascript} Redux reducer
actually found the list it was trying to update. If it didn't, we'll
push the list to the end of the list, adding it to the UI:

<pre class='language-javascript'><code class='language-javascript'>
if (!found) {
  lists.push(action.list);
}
</code></pre>

And with that, users can make their private lists public.


<pre class='language-javascriptDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-javascriptDiff'>
 ...
 
+  def handle_in("make_public", %{
+    "list_id" => list_id,
+  }, socket) do
+    list = List.make_public(list_id)
+    |> Repo.preload(:todos)
+
+    broadcast! socket, "update_list", list
+
+    {:noreply, socket}
+  end
+
   def handle_in("delete_todo", %{
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/models/list.ex</p><code class='language-javascriptDiff'>
 ...
 
+  def make_public(id) do
+    Repo.get(PhoenixTodos.List, id)
+    |> changeset(%{
+      user_id: nil
+    })
+    |> Repo.update!
+  end
+
   def delete_todo(todo_id) do
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const MAKE_PUBLIC_REQUEST = "MAKE_PUBLIC_REQUEST";
+export const MAKE_PUBLIC_SUCCESS = "MAKE_PUBLIC_SUCCESS";
+export const MAKE_PUBLIC_FAILURE = "MAKE_PUBLIC_FAILURE";
+
 export const DELETE_TODO_REQUEST = "DELETE_TODO_REQUEST";
 ...
     channel.on("update_list", list => {
-      console.log("update_list", list)
       dispatch(updateList(list));
 ...
 
+export function makePublicRequest() {
+  return { type: MAKE_PUBLIC_REQUEST };
+}
+
+export function makePublicSuccess() {
+  return { type: MAKE_PUBLIC_SUCCESS };
+}
+
+export function makePublicFailure() {
+  return { type: MAKE_PUBLIC_FAILURE };
+}
+
+export function makePublic(list_id) {
+  return (dispatch, getState) => {
+    const { channel } = getState();
+    dispatch(makePublicRequest());
+    channel.push("make_public", { list_id })
+      .receive("ok", (list) => {
+        dispatch(makePublicSuccess());
+      })
+      .receive("error", () => dispatch(makePublicFailure()))
+      .receive("timeout", () => dispatch(makePublicFailure()));
+  }
+}
+
 export function deleteTodoRequest() {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListHeader.jsx</p><code class='language-javascriptDiff'>
 ...
     if (list.user_id) {
-      makePublic.call({ listId: list._id }, alert);
+      this.props.makePublic(list.id);
     } else {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
   makePrivate,
+  makePublic,
   deleteTodo
 ...
                     makePrivate={this.props.makePrivate}
+                    makePublic={this.props.makePublic}
         />
 ...
       },
+      makePublic: (list_id) => {
+        return dispatch(makePublic(list_id));
+      },
       deleteTodo: (todo_id) => {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   case UPDATE_LIST:
+    let found = false;
     let lists = state.lists.map(list => {
-      return list.id === action.list.id ? action.list : list;
+      if (list.id === action.list.id) {
+        found = true;
+        return action.list;
+      }
+      else {
+        return list;
+      }
     });
+    if (!found) {
+      lists.push(action.list);
+    }
     return Object.assign({}, state, { lists });
</code></pre>



## Final Thoughts

At this point, we’ve roughly recreated all of the features of the Meteor Todos application in Phoenix and Elixir.

I’ll be the first to admit that there are many problems with the project as it currently stands. My solution to channel authentication isn’t the best, many channel events aren’t making proper authorization checks, the front-end Redux architecture is awful, etc… That being said, this was a _fantastic_ learning experience.

Building out Meteor-esque functionality in Phoenix is definitely more work than using Meteor, but I still believe that the benefits of using an Elixir backend outweigh the drawbacks. With a little more effort, I think I’ll be able to reduce the upfront burden quite a bit through packages and libraries.

Expect many upcoming articles discussing what I’ve learned from this conversion and how to approach building Elixir and Phoenix applications from the perspective of a Meteor developer.
