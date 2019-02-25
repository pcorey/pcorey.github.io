---
layout: post
title:  "Phoenix Todos - Adding Lists and Tasks"
description: "Part eight of our 'Phoenix Todos' Literate Commits series. Building out support for adding todo lists and tasks to those lists."
author: "Pete Corey"
date:   2016-10-19
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos"]
---


## [Creating Public Lists]({{page.repo}}/commit/47ab3b920db799b8099ea1ada73895cde83b274a)

Now that we're loading and displaying all public lists, we'll want to be
able to create new lists.

To emulate our [Meteor application](https://github.com/meteor/todos/tree/react/), new lists will be given unique names,
starting with `"List A"`{:.language-javascript}. If `"List A"`{:.language-javascript} already exists, we'll use `"List B"`{:.language-javascript}, and so on.

We'll implement this functionality in a `create`{:.language-elixir} function on our `List`{:.language-elixir}
model. When `create`{:.language-elixir} is called with no arguments, we'll default to using
`"List"`{:.language-javascript} as the base name, and `"A"`{:.language-javascript} as the suffix:

<pre class='language-elixir'><code class='language-elixir'>
def create, do: create("List", "A")
</code></pre>

When `create`{:.language-elixir} is called with two arguments (`name`{:.language-elixir}, and `suffix`{:.language-elixir}), we'll
find any lists that exist with the given name:

<pre class='language-elixir'><code class='language-elixir'>
PhoenixTodos.List
|> findByName("#{name} #{suffix}")
|> Repo.all
</code></pre>

If we find one or more lists with that name, we'll increment our
`suffix`{:.language-elixir} to the next character and try again:

<pre class='language-elixir'><code class='language-elixir'>
def handle_create_find(_, name, suffix) do
  [char] = to_char_list suffix
  create(name, to_string [char + 1])
end
</code></pre>

If we don't find a list with that name, we know that our `name`{:.language-elixir}/`suffix`{:.language-elixir} combination is unique, so
we'll insert the list.

We'll call our `create`{:.language-elixir} function whenever our `"lists.public"`{:.language-elixir} channel
receives a `"create_list"`{:.language-elixir} message:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("create_list", _, socket) do
  list = List.create
</code></pre>

Once the list is added, we'll want to broadcast this change to all
connected clients, so they can add the new list to their UI:

<pre class='language-elixir'><code class='language-elixir'>
broadcast! socket, "add_list", list
</code></pre>

Finally, we'll reply with the newly created list.

On the client, we removed all references to `insert.call`{:.language-javascript} in favor of a
newly created `createList`{:.language-javascript} thunk. `createList`{:.language-javascript} pushes
the `"create_list"`{:.language-javascript} message up to the server, and handles all responses.


<pre class='language-elixirDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-elixirDiff'>
 ...
 
+  def handle_in("create_list", _, socket) do
+    list = List.create
+    |> Repo.preload(:todos)
+
+    broadcast! socket, "add_list", list
+
+    {:reply, {:ok, list}, socket}
+  end
+
 end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
 ...
 
+  alias PhoenixTodos.Repo
+
   @derive {Poison.Encoder, only: [
 ...
 
+  def create(name, suffix) do
+    PhoenixTodos.List
+    |> findByName("#{name} #{suffix}")
+    |> Repo.all
+    |> handle_create_find(name, suffix)
+  end
+  def create, do: create("List", "A")
+
+  def handle_create_find([], name, suffix) do
+    changeset(%PhoenixTodos.List{}, %{
+      name: "#{name} #{suffix}",
+      incomplete_count: 0
+    })
+    |> Repo.insert!
+  end
+
+  def handle_create_find(_, name, suffix) do
+    [char] = to_char_list suffix
+    create(name, to_string [char + 1])
+  end
+
   def public(query) do
 ...
 
+  def findByName(query, name) do
+    from list in query,
+    where: list.name == ^name
+  end
+
 end
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const CREATE_LIST_REQUEST = "CREATE_LIST_REQUEST";
+export const CREATE_LIST_SUCCESS = "CREATE_LIST_SUCCESS";
+export const CREATE_LIST_FAILURE = "CREATE_LIST_FAILURE";
+
 export function signUpRequest() {
 ...
 
-export function joinListsChannel(channel) {
+export function joinListsChannel(channelName) {
   return (dispatch, getState) => {
 ...
 
-    socket
-      .channel(channel)
+    let channel = socket.channel(channelName);
+    channel
       .join()
 ...
         dispatch(joinListsChannelSuccess(channel));
+        dispatch(createAddListListeners(channel));
       })
 ...
 }
+
+export function createListRequest() {
+  return { type: CREATE_LIST_REQUEST };
+}
+
+export function createListSuccess() {
+  return { type: CREATE_LIST_SUCCESS };
+}
+
+export function createListFailure() {
+  return { type: CREATE_LIST_FAILURE };
+}
+
+export function createList(router) {
+  return (dispatch, getState) => {
+    const { channel } = getState();
+    dispatch(createListRequest());
+    channel.push("create_list")
+      .receive("ok", (list) => {
+        dispatch(createListSuccess());
+        router.push(`/lists/${ list.id }`);
+      })
+      .receive("error", () => dispatch(createListFailure()))
+      .receive("timeout", () => dispatch(createListFailure()));
+  }
+}
+
+export function createAddListListeners(channel) {
+  return (dispatch, getState) => {
+    channel.on("add_list", list => {
+      dispatch(addList(list));
+    });
+  };
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListList.jsx</p><code class='language-javascriptDiff'>
 ...
     const { router } = this.context;
-    // const listId = insert.call((err) => {
-    //   if (err) {
-    //     router.push('/');
-    //     /* eslint-disable no-alert */
-    //     alert('Could not create list.');
-    //   }
-    // });
-    // router.push(`/lists/${ listId }`);
+    this.props.createList(router);
   }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/layouts/App.jsx</p><code class='language-javascriptDiff'>
 ...
 import { connect } from "react-redux";
-import { signOut } from "../actions";
+import { signOut, createList } from "../actions";
 
 ...
           &lt;UserMenu user={user} logout={this.logout}/>
-          &lt;ListList lists={lists}/>
+          &lt;ListList lists={lists} createList={this.props.createList}/>
         &lt;/section>
 ...
         return dispatch(signOut(jwt));
+      },
+      createList: (router) => {
+        return dispatch(createList(router));
       }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   ADD_LIST,
+  JOIN_LISTS_CHANNEL_SUCCESS,
+  CREATE_LIST_SUCCESS,
 } from "../actions";
 ...
   socket: undefined,
+  channel: undefined,
   user: user ? JSON.parse(user) : user,
 ...
     return Object.assign({}, state, { socket: action.socket });
+  case JOIN_LISTS_CHANNEL_SUCCESS:
+    return Object.assign({}, state, { channel: action.channel });
   default:
</code></pre>



## [List Ordering]({{page.repo}}/commit/c9f4fccb73766a333fe0996163d083041f709147)

Our last commit had a small issue. When lists were added, they appeared
at the end of the list, as expected. However, when we reloaded the
application, lists would appear in a seemingly random order.

To fix this, we need to order the lists by when they were inserted into
the database.

A quick way to do this is to add an `order_by`{:.language-elixir} clause to our
`List.public`{:.language-elixir} query:

<pre class='language-elixir'><code class='language-elixir'>
order_by: list.inserted_at,
</code></pre>

Now our lists will be consistently ordered, even through refreshes.


<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
 ...
     where: is_nil(list.user_id),
+    order_by: list.inserted_at,
     preload: [:todos]
</code></pre>



## [Adding Tasks]({{page.repo}}/commit/48d3eb99077f0a418a6e16140505b8e7d45c4058)

Now that we can add lists, we should be able to add tasks to our
lists.

We'll start by adding an `add_task`{:.language-elixir} function to our `List`{:.language-elixir} module.
`add_task`{:.language-elixir} takes in the list's `id`{:.language-elixir} that we're updating, and the `text`{:.language-elixir}
of the new task.

After we grab our `list`{:.language-elixir} from the database, we can use
`Ecto.build_assoc`{:.language-elixir} to create a new `Task`{:.language-elixir} associated with it:

<pre class='language-elixir'><code class='language-elixir'>
Ecto.build_assoc(list, :todos, text: text)
|> Repo.insert!
</code></pre>

Next, we'll need to increment the list's `incomplete_count`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
list
|> PhoenixTodos.List.changeset(%{
  incomplete_count: list.incomplete_count + 1
})
|> Repo.update!
</code></pre>

Now we'll wire our new `add_task`{:.language-elixir} model function up to a `"add_task"`{:.language-elixir}
message handler on our `ListChannel`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("add_task", %{
  "list_id" => list_id,
  "text" => text
}, socket) do
  list = List.add_task(list_id, text)
</code></pre>

Once we've added the list, we need to inform all subscribed clients that
the list has been updated. We'll do this by broadcasting a
`"update_list"`{:.language-elixir} message:

<pre class='language-elixir'><code class='language-elixir'>
broadcast! socket, "update_list", list
</code></pre>

Finally, we can replace our call to `insert.call`{:.language-javascript} with a Redux thunk
that triggers our `"add_task"`{:.language-javascript} channel message:

<pre class='language-javascript'><code class='language-javascript'>
this.props.addTask(this.props.list.id, input.value);
</code></pre>

Now we can add new tasks to each of our todos!


<pre class='language-elixirDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-elixirDiff'>
 ...
 
+  def handle_in("add_task", %{
+    "list_id" => list_id,
+    "text" => text
+  }, socket) do
+    list = List.add_task(list_id, text)
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
 
+  def add_task(id, text) do
+    list = Repo.get(PhoenixTodos.List, id)
+
+    Ecto.build_assoc(list, :todos, text: text)
+    |> Repo.insert!
+
+    list
+    |> PhoenixTodos.List.changeset(%{
+      incomplete_count: list.incomplete_count + 1
+    })
+    |> Repo.update!
+  end
+
   def public(query) do
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 export const ADD_LIST = "ADD_LIST";
+export const UPDATE_LIST = "UPDATE_LIST";
 
 ...
 
+export const ADD_TASK_REQUEST = "ADD_TASK_REQUEST";
+export const ADD_TASK_SUCCESS = "ADD_TASK_SUCCESS";
+export const ADD_TASK_FAILURE = "ADD_TASK_FAILURE";
+
 export function signUpRequest() {
 ...
 
+export function updateList(list) {
+  return { type: UPDATE_LIST, list };
+}
+
 export function connectSocket(jwt) {
 ...
 
+export function addTaskRequest() {
+  return { type: ADD_TASK_REQUEST };
+}
+
+export function addTaskSuccess() {
+  return { type: ADD_TASK_SUCCESS };
+}
+
+export function addTaskFailure() {
+  return { type: ADD_TASK_FAILURE };
+}
+
+export function addTask(list_id, text) {
+  return (dispatch, getState) => {
+    const { channel } = getState();
+    dispatch(addTaskRequest());
+    channel.push("add_task", { list_id, text })
+      .receive("ok", (list) => {
+        dispatch(addTaskSuccess());
+      })
+      .receive("error", () => dispatch(addTaskFailure()))
+      .receive("timeout", () => dispatch(addTaskFailure()));
+  }
+}
+
 ...
+    channel.on("update_list", list => {
+      dispatch(updateList(list));
+    })
   };
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListHeader.jsx</p><code class='language-javascriptDiff'>
 ...
     if (input.value.trim()) {
-      insert.call({
-        listId: this.props.list._id,
-        text: input.value,
-      }, alert);
+      this.props.addTask(this.props.list.id, input.value);
       input.value = '';
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
 import Message from '../components/Message.jsx';
+import { connect } from "react-redux";
+import { addTask } from "../actions";
 
-export default class ListPage extends React.Component {
+class ListPage extends React.Component {
   constructor(props) {
 ...
       &lt;div className="page lists-show">
-        &lt;ListHeader list={list}/>
+        &lt;ListHeader list={list} addTask={this.props.addTask}/>
         &lt;div className="content-scrollable list-items">
 ...
     };
+
+
+export default connect(
+    (state) => state,
+    (dispatch) => ({
+      addTask: (list_id, text) => {
+        return dispatch(addTask(list_id, text));
+      }
+    })
+)(ListPage);
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   ADD_LIST,
+  UPDATE_LIST,
   JOIN_LISTS_CHANNEL_SUCCESS,
 ...
 });
+  case UPDATE_LIST:
+    let lists = state.lists.map(list => {
+      return list.id === action.list.id ? action.list : list;
+    });
+    return Object.assign({}, state, { lists });
   case CONNECT_SOCKET:
</code></pre>



## [Checking Tasks]({{page.repo}}/commit/51a6364bf738fd763d3ef0ea2d274957c1fed893)

Next up on our feature list is giving users the ability to toggle tasks
as completed or incomplete.

To do this, we'll create a `set_checked_status`{:.language-elixir} helper method in our
`List`{:.language-elixir} model. Oddly, `set_checked_status`{:.language-elixir} takes in a `todo_id`{:.language-elixir} and a
`checked`{:.language-elixir} boolean. This will likely be a good place for a future refactor.

The `set_checked_status`{:.language-elixir} function starts by grabbing the specified todo
and it's associated todo:

<pre class='language-elixir'><code class='language-elixir'>
todo = Repo.get(PhoenixTodos.Todo, todo_id)
|> Repo.preload(:list)
list = todo.list
</code></pre>

Next, it uses `checked`{:.language-elixir} to determine if we'll be incrementing or
decrementing `incomplete_count`{:.language-elixir} on our list:

<pre class='language-elixir'><code class='language-elixir'>
inc = if (checked), do: - 1, else: 1
</code></pre>

We can update our todo by setting the `checked`{:.language-elixir} field:

<pre class='language-elixir'><code class='language-elixir'>
todo
|> PhoenixTodos.Todo.changeset(%{
  checked: checked
})
|> Repo.update!
</code></pre>

And we can update our list by setting the `incomplete_count`{:.language-elixir} field:

<pre class='language-elixir'><code class='language-elixir'>
list
|> PhoenixTodos.List.changeset(%{
  incomplete_count: list.incomplete_count + inc
})
|> Repo.update!
</code></pre>

Now that we have a functional helper method in our model, we can call it
whenever we receive a `"set_checked_status"`{:.language-elixir} message in our list
channel:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("set_checked_status", %{
    "todo_id" => todo_id,
    "status" => status
  }, socket) do
  list = List.set_checked_status(todo_id, status)
</code></pre>

Lastly, we'll broadcast a `"update_list"`{:.language-elixir} message to all connected
clients so they can see this change in realtime.

Now we can replace our call to the old `setCheckedStatus`{:.language-elixir} Meteor method
with a call to an asynchronous action creator which pushes our
`"set_checked_status"`{:.language-elixir} message up to the server.

With that, our users can check and uncheck todos.


<pre class='language-elixirDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-elixirDiff'>
 ...
 
+  def handle_in("set_checked_status", %{
+      "todo_id" => todo_id,
+      "status" => status
+    }, socket) do
+    list = List.set_checked_status(todo_id, status)
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
 
+  def set_checked_status(todo_id, checked) do
+    todo = Repo.get(PhoenixTodos.Todo, todo_id)
+    |> Repo.preload(:list)
+    list = todo.list
+    inc = if (checked), do: - 1, else: 1
+
+    todo
+    |> PhoenixTodos.Todo.changeset(%{
+      checked: checked
+    })
+    |> Repo.update!
+
+    list
+    |> PhoenixTodos.List.changeset(%{
+      incomplete_count: list.incomplete_count + inc
+    })
+    |> Repo.update!
+  end
+
   def public(query) do
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const SET_CHECKED_STATUS_REQUEST = "SET_CHECKED_STATUS_REQUEST";
+export const SET_CHECKED_STATUS_SUCCESS = "SET_CHECKED_STATUS_SUCCESS";
+export const SET_CHECKED_STATUS_FAILURE = "SET_CHECKED_STATUS_FAILURE";
+
 export function signUpRequest() {
 ...
 
+export function setCheckedStatusRequest() {
+  return { type: SET_CHECKED_STATUS_REQUEST };
+}
+
+export function setCheckedStatusSuccess() {
+  return { type: SET_CHECKED_STATUS_SUCCESS };
+}
+
+export function setCheckedStatusFailure() {
+  return { type: SET_CHECKED_STATUS_FAILURE };
+}
+
+
+export function setCheckedStatus(todo_id, status) {
+  return (dispatch, getState) => {
+    const { channel } = getState();
+    dispatch(setCheckedStatusRequest());
+    channel.push("set_checked_status", { todo_id, status })
+      .receive("ok", (list) => {
+        dispatch(setCheckedStatusSuccess());
+      })
+      .receive("error", () => dispatch(setCheckedStatusFailure()))
+      .receive("timeout", () => dispatch(setCheckedStatusFailure()));
+  }
+}
+
 export function createAddListListeners(channel) {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/TodoItem.jsx</p><code class='language-javascriptDiff'>
 ...
 
-/* import {
- *   setCheckedStatus,
- *   updateText,
- *   remove,
- * } from '../../api/todos/methods.js';*/
-
 export default class TodoItem extends React.Component {
 ...
   setTodoCheckStatus(event) {
-    setCheckedStatus.call({
-      todoId: this.props.todo.id,
-      newCheckedStatus: event.target.checked,
-    });
+    this.props.setCheckedStatus(this.props.todo.id, event.target.checked);
   }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
 import { connect } from "react-redux";
-import { addTask } from "../actions";
+import {
+  addTask,
+  setCheckedStatus
+} from "../actions";
 
 ...
           onEditingChange={this.onEditingChange}
+          setCheckedStatus={this.props.setCheckedStatus}
         /&gt;
 ...
         return dispatch(addTask(list_id, text));
+      },
+      setCheckedStatus: (todo_id, status) => {
+        return dispatch(setCheckedStatus(todo_id, status));
       }
</code></pre>



## [Sorting Tasks]({{page.repo}}/commit/5a296240d5c91e10468da8478f51b44550f9da41)

Just like our lists, our tasks are having a sorting problem. Checking
and unchecking a task will randomize its position in the list.

There are two ways to solve this issue. We can either sort our `todos`{:.language-elixir}
when we `Preload`{:.language-elixir} them on the server, or we can do our sorting on the
client. For variety, let's go with the second option.

Let's sort primarily based on the "created at" timestamp of each task.
To do this, we'll need to serialize the `inserted_at`{:.language-elixir} timestamp for each
task we send to the client.

<pre class='language-elixir'><code class='language-elixir'>
@derive {Poison.Encoder, only: [
  ...
  :inserted_at
]}
</code></pre>

We can then sort our `todos`{:.language-javascript} on this timestamp before rendering our
`<TodoItem>`{:.language-javascript} components:

<pre class='language-javascript'><code class='language-javascript'>
.sort((a, b) => {
  return new Date(a.inserted_at) - new Date(b.inserted_at);
})
</code></pre>

We'll also want to have a secondary sort on the task's text to break and
ties that may occur (especially in seed data):

<pre class='language-javascript'><code class='language-javascript'>
.sort((a, b) => {
  let diff = new Date(a.inserted_at) - new Date(b.inserted_at);
  return diff == 0 ? a.text > b.text : diff;
})
</code></pre>

With those changes, our tasks order themselves correctly in each list.


<pre class='language-elixirDiff'><p class='information'>web/models/todo.ex</p><code class='language-elixirDiff'>
 ...
     :text,
-    :checked
+    :checked,
+    :inserted_at
   ]}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
     } else {
-      Todos = todos.map(todo => (
+      Todos = todos
+        .sort((a, b) => {
+          let diff = new Date(a.inserted_at) - new Date(b.inserted_at);
+          return diff == 0 ? a.text > b.text : diff;
+        })
+        .map(todo => (
         <TodoItem
</code></pre>


## Final Thoughts

As we implement more and more functionality, we’re falling into a pattern. Phoenix channel events can be used just like we’d use Meteor methods, and we can manually broadcast events that act like Meteor publication messages.

Most of the work of implementing these features is happening on the front end of the application. The Redux boilerplate required to implement any feature is significant and time consuming.

Next week we should finish up the rest of the list/task functionality and then we can turn our attention to handling private lists.
