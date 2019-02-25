---
layout: post
title:  "Phoenix Todos - Updating and Deleting"
description: "Part nine of our 'Phoenix Todos' Literate Commits series. Updating and deleting items in our todo list."
author: "Pete Corey"
date:   2016-10-26
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos"]
---


## [Update List Name]({{page.repo}}/commit/9f8f646e9fc1d313c86ebc7e0a84bed461465c8e)

The next piece of functionality we need to knock out is the ability to
rename lists.

To do this, we'll create a helper method on our `List`{:.language-elixir} model called
`update_name`{:.language-elixir}. This method simply changes the `name`{:.language-elixir} of the given
`List`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
Repo.get(PhoenixTodos.List, id)
|> changeset(%{
  name: name
})
|> Repo.update!
</code></pre>

We'll create a new channel event, `"update_name"`{:.language-javascript}, to handle name change
requests, and we'll wire up a Redux thunk to push a `"update_name"`{:.language-javascript}
event onto our channel:

<pre class='language-javascript'><code class='language-javascript'>
channel.push("update_name", { list_id, name })
  .receive("ok", (list) => {
    dispatch(updateNameSuccess());
  })
  .receive("error", () => dispatch(updateNameFailure()))
  .receive("timeout", () => dispatch(updateNameFailure()));
</code></pre>

After wiring up the rest of the necessary Redux plumbing, we're able to
update the names of our lists.


<pre class='language-elixirDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-elixirDiff'>
 ...
 
+  def handle_in("update_name", %{
+    "list_id" => list_id,
+    "name" => name
+  }, socket) do
+    list = List.update_name(list_id, name)
+    |> Repo.preload(:todos)
+
+    broadcast! socket, "update_list", list
+
+    {:noreply, socket}
+  end
+
 end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
 ...
 
+  def update_name(id, name) do
+    Repo.get(PhoenixTodos.List, id)
+    |> changeset(%{
+      name: name
+    })
+    |> Repo.update!
+  end
+
   def set_checked_status(todo_id, checked) do
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const UPDATE_NAME_REQUEST = "UPDATE_NAME_REQUEST";
+export const UPDATE_NAME_SUCCESS = "UPDATE_NAME_SUCCESS";
+export const UPDATE_NAME_FAILURE = "UPDATE_NAME_FAILURE";
+
 export function signUpRequest() {
 ...
 }
+
+export function updateNameRequest() {
+  return { type: UPDATE_NAME_REQUEST };
+}
+
+export function updateNameSuccess() {
+  return { type: UPDATE_NAME_SUCCESS };
+}
+
+export function updateNameFailure() {
+  return { type: UPDATE_NAME_FAILURE };
+}
+
+export function updateName(list_id, name) {
+  return (dispatch, getState) => {
+    const { channel } = getState();
+    dispatch(updateNameRequest());
+    channel.push("update_name", { list_id, name })
+      .receive("ok", (list) => {
+        dispatch(updateNameSuccess());
+      })
+      .receive("error", () => dispatch(updateNameFailure()))
+      .receive("timeout", () => dispatch(updateNameFailure()));
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListHeader.jsx</p><code class='language-javascriptDiff'>
 ...
     this.setState({ editing: false });
-    updateName.call({
-      listId: this.props.list._id,
-      newName: this.refs.listNameInput.value,
-    }, alert);
+    this.props.updateName(this.props.list.id, this.refs.listNameInput.value);
   }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
   addTask,
-  setCheckedStatus
+  setCheckedStatus,
+  updateName
 } from "../actions";
 ...
       &lt;div className="page lists-show">
-        &lt;ListHeader list={list} addTask={this.props.addTask}/>
+        &lt;ListHeader list={list} addTask={this.props.addTask} updateName={this.props.updateName}/>
         &lt;div className="content-scrollable list-items">
 ...
         return dispatch(setCheckedStatus(todo_id, status));
+      },
+      updateName: (list_id, name) => {
+        return dispatch(updateName(list_id, name));
       }
</code></pre>



## [Delete Lists]({{page.repo}}/commit/625f96689455af66c4ac2bf9194ca0a90419ae3d)

Let's give users the ability to delete lists in our application.

We'll start by creating a `delete`{:.language-elixir} function in our `List`{:.language-elixir} model.
`delete`{:.language-elixir} simply deletes the specified model object:

<pre class='language-elixir'><code class='language-elixir'>
Repo.get(PhoenixTodos.List, id)
|> Repo.delete!
</code></pre>

We'll call `List.delete`{:.language-elixir} from a `"delete_list"`{:.language-elixir} channel event handler.
Once deleted, we'll also broadcast a `"remove_list"`{:.language-elixir} event down to all
connectd clients:

<pre class='language-elixir'><code class='language-elixir'>
list = List.delete(list_id)
|> Repo.preload(:todos)

broadcast! socket, "remove_list", list
</code></pre>

We'll trigger this `"delete_list"`{:.language-javascript} event with a Redux thunk:

<pre class='language-javascript'><code class='language-javascript'>
channel.push("delete_list", { list_id, name })
  .receive("ok", (list) => {
    dispatch(deleteListSuccess());
  })
  .receive("error", () => dispatch(deleteListFailure()))
  .receive("timeout", () => dispatch(deleteListFailure()));
</code></pre>

Lastly, we need to handle the new `"remove_list"`{:.language-javascript} event that will be
broadcast to all connected clients. We'll set up a `"remove_list"`{:.language-javascript} event
listener on the client, and trigger a `REMOVE_LIST`{:.language-javascript} action from the
listener:

<pre class='language-javascript'><code class='language-javascript'>
channel.on("remove_list", list => {
  dispatch(removeList(list));
});
</code></pre>

The `REMOVE_LISTENER`{:.language-javascript} action simply filters the specified list out of
our application's set of `lists`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
lists = state.lists.filter(list => {
  return list.id !== action.list.id
});
</code></pre>

After combining all of that with some Redux plumbing, users can delete
lists.


<pre class='language-elixirDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-elixirDiff'>
 ...
 
+  def handle_in("delete_list", %{
+    "list_id" => list_id,
+  }, socket) do
+    list = List.delete(list_id)
+    |> Repo.preload(:todos)
+
+    broadcast! socket, "remove_list", list
+
+    {:noreply, socket}
+  end
+
 end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
 ...
 
+  def delete(id) do
+    Repo.get(PhoenixTodos.List, id)
+    |> Repo.delete!
+  end
+
   def set_checked_status(todo_id, checked) do
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 export const UPDATE_LIST = "UPDATE_LIST";
+export const REMOVE_LIST = "REMOVE_LIST";
 
 ...
 
+export const DELETE_LIST_REQUEST = "DELETE_LIST_REQUEST";
+export const DELETE_LIST_SUCCESS = "DELETE_LIST_SUCCESS";
+export const DELETE_LIST_FAILURE = "DELETE_LIST_FAILURE";
+
 export function signUpRequest() {
 ...
 
+export function removeList(list) {
+  return { type: REMOVE_LIST, list };
+}
+
 export function connectSocket(jwt) {
 ...
     })
+    channel.on("remove_list", list => {
+      dispatch(removeList(list));
+    });
   };
 ...
 }
+
+export function deleteListRequest() {
+  return { type: DELETE_LIST_REQUEST };
+}
+
+export function deleteListSuccess() {
+  return { type: DELETE_LIST_SUCCESS };
+}
+
+export function deleteListFailure() {
+  return { type: DELETE_LIST_FAILURE };
+}
+
+export function deleteList(list_id, name) {
+  return (dispatch, getState) => {
+    const { channel } = getState();
+    dispatch(deleteListRequest());
+    channel.push("delete_list", { list_id, name })
+      .receive("ok", (list) => {
+        dispatch(deleteListSuccess());
+      })
+      .receive("error", () => dispatch(deleteListFailure()))
+      .receive("timeout", () => dispatch(deleteListFailure()));
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListHeader.jsx</p><code class='language-javascriptDiff'>
 ...
     if (confirm(message)) { // eslint-disable-line no-alert
-      remove.call({ listId: list._id }, alert);
-      /* this.context.router.push('/');*/
+      this.props.deleteList(list.id);
+      this.context.router.push('/');
 }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
   setCheckedStatus,
-  updateName
+  updateName,
+  deleteList
 } from "../actions";
 ...
       &lt;div className="page lists-show">
-        &lt;ListHeader list={list} addTask={this.props.addTask} updateName={this.props.updateName}/>
+        &lt;ListHeader list={list}
+                    addTask={this.props.addTask}
+                    updateName={this.props.updateName}
+                    deleteList={this.props.deleteList}/>
     &lt;div className="content-scrollable list-items">
 ...
     return dispatch(updateName(list_id, name));
+      },
+      deleteList: (list_id) => {
+        return dispatch(deleteList(list_id));
       }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   UPDATE_LIST,
+  REMOVE_LIST,
   JOIN_LISTS_CHANNEL_SUCCESS,
 ...
 return Object.assign({}, state, { lists });
+  case REMOVE_LIST:
+    lists = state.lists.filter(list => {
+      return list.id !== action.list.id
+    });
+    return Object.assign({}, state, { lists });
   case CONNECT_SOCKET:
</code></pre>



## [Delete Todos]({{page.repo}}/commit/7d49a9c0ff41eca8845e070ef687cc4961e1ede6)

Next, we'll give users the ability to delete completed todos from their
lists.

We'll start by creating a `delete_todo`{:.language-elixir} helper in our `List`{:.language-elixir} model. This
method deletes the specified `Todo`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
todo = Repo.get(PhoenixTodos.Todo, todo_id)
|> Repo.preload(:list)

Repo.delete!(todo)
</code></pre>

It's also interesting to note that the `delete_todo`{:.language-elixir} helper returns the parent list of the task:

<pre class='language-elixir'><code class='language-elixir'>
todo.list
</code></pre>

We use this returned list in our `"delete_todo"`{:.language-elixir} channel event handler
to broadcast an `"udpate_list"`{:.language-elixir} event to all connected clients:

<pre class='language-elixir'><code class='language-elixir'>
list = List.delete_todo(todo_id)
|> Repo.preload(:todos)

broadcast! socket, "update_list", list
</code></pre>

We'll kick off this `"delete_todo"`{:.language-javascript} event with a Redux thunk called
`deleteTodo`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
channel.push("delete_todo", { todo_id, name })
  .receive("ok", (list) => {
    dispatch(deleteTodoSuccess());
  })
  .receive("error", () => dispatch(deleteTodoFailure()))
  .receive("timeout", () => dispatch(deleteTodoFailure()));
</code></pre>

And with a little more Redux plumbing, users can remove completed todo
items.


<pre class='language-elixirDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-elixirDiff'>
 ...
 
+  def handle_in("delete_todo", %{
+    "todo_id" => todo_id,
+  }, socket) do
+    list = List.delete_todo(todo_id)
+    |> Repo.preload(:todos)
+
+    broadcast! socket, "update_list", list
+
+    {:noreply, socket}
+  end
+
 end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
 ...
 
+  def delete_todo(todo_id) do
+    todo = Repo.get(PhoenixTodos.Todo, todo_id)
+    |> Repo.preload(:list)
+
+    Repo.delete!(todo)
+
+    todo.list
+  end
+
   def set_checked_status(todo_id, checked) do
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const DELETE_TODO_REQUEST = "DELETE_TODO_REQUEST";
+export const DELETE_TODO_SUCCESS = "DELETE_TODO_SUCCESS";
+export const DELETE_TODO_FAILURE = "DELETE_TODO_FAILURE";
+
 export function signUpRequest() {
 ...
 }
+
+export function deleteTodoRequest() {
+  return { type: DELETE_TODO_REQUEST };
+}
+
+export function deleteTodoSuccess() {
+  return { type: DELETE_TODO_SUCCESS };
+}
+
+export function deleteTodoFailure() {
+  return { type: DELETE_TODO_FAILURE };
+}
+
+export function deleteTodo(todo_id, name) {
+  return (dispatch, getState) => {
+    const { channel } = getState();
+    dispatch(deleteTodoRequest());
+    channel.push("delete_todo", { todo_id, name })
+      .receive("ok", (list) => {
+        dispatch(deleteTodoSuccess());
+      })
+      .receive("error", () => dispatch(deleteTodoFailure()))
+      .receive("timeout", () => dispatch(deleteTodoFailure()));
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/TodoItem.jsx</p><code class='language-javascriptDiff'>
 ...
   deleteTodo() {
-    remove.call({ todoId: this.props.todo.id }, alert);
+    this.props.deleteTodo(this.props.todo.id);
   }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
   updateName,
-  deleteList
+  deleteList,
+  deleteTodo
 } from "../actions";
 ...
           setCheckedStatus={this.props.setCheckedStatus}
+          deleteTodo={this.props.deleteTodo}
         />
 ...
         return dispatch(deleteList(list_id));
+      },
+      deleteTodo: (todo_id) => {
+        return dispatch(deleteTodo(todo_id));
       }
</code></pre>


## Final Thoughts

These changes wrap up all of the list and task [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) functionality in our application. Again, it’s interesting to notice that the vast majority of the work required to implement these features lives in the front-end of the application.

Next week, we’ll work on introducing the concept of private lists into our application. Stay tuned!
