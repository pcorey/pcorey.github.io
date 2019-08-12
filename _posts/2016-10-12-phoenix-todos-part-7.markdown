---
layout: post
title:  "Phoenix Todos - Preloading Todos"
excerpt: "Part seven of our 'Phoenix Todos' Literate Commits series. Populating our todo lists with Ecto's preload feature."
author: "Pete Corey"
date:   2016-10-12
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos"]
---

## [Redux Channel Actions]({{page.repo}}/commit/c26ec4c5937743e012929eb3fdb66b0bc5fda310)

Connecting to our socket and joining our channel in the base of our
application doesn't feel like the React Way™.

Instead, let's define actions and reducers to connect to the socket and
join our `"lists.public"`{:.language-javascript} channel.

We'll start by creating a `connectSocket`{:.language-javascript} action creator that
initializes our `Socket`{:.language-javascript} and connects it to our server. The
corresponding reducer for this action will save the `socket`{:.language-javascript} to our
state:

<pre class='language-javascript'><code class='language-javascript'>
export function connectSocket(jwt) {
  let socket = new Socket("/socket", {
    params: {
      token: jwt
    }
  });
  socket.connect();
  return { type: CONNECT_SOCKET, socket };
}
</code></pre>

Next, let's create a `joinListsChannel`{:.language-javascript} action creator that joins the
provided channel and dispatches `addList`{:.language-javascript} actions for each list returned
from the server:

<pre class='language-javascript'><code class='language-javascript'>
socket
  .channel(channel)
  .join()
  .receive("ok", (lists) => {
    lists.forEach((list) => {
      dispatch(addList(list));
    });
    dispatch(joinListsChannelSuccess(channel));
  })
  .receive("error", (error) => {
    dispatch(joinListsChannelFailure(channel, error));
  });
</code></pre>

Now we're connecting to our Phoenix channel in a much more
Redux-friendly way. Plus, we have access to our socket within our
application's state!


<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
+import { Socket } from "deps/phoenix/web/static/js/phoenix"
+
 export const SIGN_UP_REQUEST = "SIGN_UP_REQUEST";
 ...
 
+export const CONNECT_SOCKET = "CONNECT_SOCKET";
+
+export const JOIN_LISTS_CHANNEL_REQUEST = "JOIN_LISTS_CHANNEL_REQUEST";
+export const JOIN_LISTS_CHANNEL_SUCCESS = "JOIN_LISTS_CHANNEL_SUCCESS";
+export const JOIN_LISTS_CHANNEL_FAILURE = "JOIN_LISTS_CHANNEL_FAILURE";
+
 export const ADD_LIST = "ADD_LIST";
 ...
 
+export function connectSocket(jwt) {
+  let socket = new Socket("/socket", {
+    params: {
+      token: jwt
+    }
+  });
+  socket.connect();
+  return { type: CONNECT_SOCKET, socket };
+}
+
+export function joinListsChannelRequest(channel) {
+  return { type: JOIN_LISTS_CHANNEL_REQUEST, channel };
+}
+
+export function joinListsChannelSuccess(channel) {
+  return { type: JOIN_LISTS_CHANNEL_SUCCESS, channel };
+}
+
+export function joinListsChannelFailure(channel, error) {
+  return { type: JOIN_LISTS_CHANNEL_FAILURE, channel, error };
+}
+
 export function signUp(email, password, password_confirm) {
 ...
 }
+
+export function joinListsChannel(channel) {
+  return (dispatch, getState) => {
+    const { socket } = getState();
+
+    dispatch(joinListsChannelRequest());
+
+    socket
+      .channel(channel)
+      .join()
+      .receive("ok", (lists) => {
+        lists.forEach((list) => {
+          dispatch(addList(list));
+        });
+        dispatch(joinListsChannelSuccess(channel));
+      })
+      .receive("error", (error) => {
+        dispatch(joinListsChannelFailure(channel, error));
+      });
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/app.js</p><code class='language-javascriptDiff'>
 ...
 import {
-  addList
+  connectSocket,
+  joinListsChannel
 } from "./actions";
-import socket from "./socket";
 
 ...
 render();
-store.subscribe(render);
 
-socket.connect();
-socket.channel("lists.public", {})
-    .join()
-    .receive("ok", (res) => {
-      res.forEach((list) => {
-        store.dispatch(addList(list));
-      });
-    })
-    .receive("error", (res) => {
-        console.log("error", res);
-    });
+store.dispatch(connectSocket(store.getState().jwt));
+store.dispatch(joinListsChannel("lists.public"));
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   SIGN_IN_FAILURE,
+  CONNECT_SOCKET,
   ADD_LIST,
 ...
 const initialState = {
+  socket: undefined,
   user: user ? JSON.parse(user) : user,
 ...
 });
+  case CONNECT_SOCKET:
+    return Object.assign({}, state, { socket: action.socket });
   default:
</code></pre>



## [List Page]({{page.repo}}/commit/efbd2220769ab797b982a240872c741df56bec49)

Now that our lists are being populated in the sidebar of our
application, we should pull in the components, layouts, and pages
necessary to render them.

We'll grab the `ListPageContainer`{:.language-javascript}, `ListPage`{:.language-javascript}, `ListHeader`{:.language-javascript}, and
`TodoItem`{:.language-javascript} React components from our original Meteor application and
move them into our Phoenix project.

The main changes we've made to these components is renaming
variables to match our Ecto models (`incompleteCount`{:.language-javascript} to
`incomplete_count`{:.language-javascript}, and `userId`{:.language-javascript} to `user_id`{:.language-javascript}), and refactoring how we
fetch lists.

Also, instead of using Meteor collections to fetch lists from Minimongo, we refactored our components to
pull lists directly out of our application's state:

<pre class='language-javascript'><code class='language-javascript'>
let id = props.params.id;
let list = _.find(state.lists, list => list.id == id);
</code></pre>

Now that we've added the necessary React components to our project, we can add the new `ListPageContainer`{:.language-javascript} to our router:

<pre class='language-javascript'><code class='language-javascript'>
&lt;Route path="lists/:id" component={ListPageContainer}/>
</code></pre>

Clicking on a list in our sidebar shows the (empty) list in the main
panel. Success!


<pre class='language-javascriptDiff'><p class='information'>package.json</p><code class='language-javascriptDiff'>
 "brunch": "^2.0.0",
+    "classnames": "^2.2.5",
 "clean-css-brunch": ">= 1.0 &lt; 1.8",
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListHeader.jsx</p><code class='language-javascriptDiff'>
+...
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListList.jsx</p><code class='language-javascriptDiff'>
 ...
           >
-            {list.userId
+            {list.user_id
           ? &lt;span className="icon-lock">&lt;/span>
           : null}
-            {list.incompleteCount
-              ? &lt;span className="count-list">{list.incompleteCount}&lt;/span>
+            {list.incomplete_count
+              ? &lt;span className="count-list">{list.incomplete_count}&lt;/span>
           : null}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/TodoItem.jsx</p><code class='language-javascriptDiff'>
+...
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/containers/ListPageContainer.jsx</p><code class='language-javascriptDiff'>
+import ListPage from '../pages/ListPage.jsx';
+import { connect } from "react-redux";
+import _ from "lodash";
+
+const ListPageContainer = connect(
+  (state, props) => {
+    let id = props.params.id;
+    let list = _.find(state.lists, list => list.id == id);
+    return {
+      loading: state.loading,
+      list: list,
+      listExists: !!list,
+      todos: []
+    }
+  }
+)(ListPage);
+
+export default ListPageContainer;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/layouts/App.jsx</p><code class='language-javascriptDiff'>
 ...
           if (this.props.params.id) {
-            const list = Lists.findOne(this.props.params.id);
-            if (list.userId) {
-              const publicList = Lists.findOne({ userId: { $exists: false } });
+            const list = _.find(this.props.lists, list => list.id == this.props.params.id);
+            if (list.user_id) {
+              const publicList = _.find(this.props.list, list => !list.user_id);
           this.context.router.push(`/lists/${ publicList.id }`{:.language-javascript});
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
+...
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/routes.jsx</p><code class='language-javascriptDiff'>
 ...
 import NotFoundPage from './pages/NotFoundPage.jsx';
+import ListPageContainer from './containers/ListPageContainer.jsx';
 
 ...
     &lt;Router history={browserHistory}>
-        &lt;Route path="/" component={AppContainer}>
+      &lt;Route path="/" component={AppContainer}>
+        &lt;Route path="lists/:id" component={ListPageContainer}/>
         &lt;Route path="signin" component={AuthPageSignIn}/>
 ...
         &lt;Route path="*" component={NotFoundPage}/>
-        &lt;/Route>
+      &lt;/Route>
 &lt;/Router>
</code></pre>



## [Preloading Todos]({{page.repo}}/commit/5178ba07924f7d54cab9d68b0ce6d426b0241966)

One of the cool features of [Ecto](https://github.com/elixir-ecto/ecto) is that we can write queries that
automatically load, or "preload", related objects.

For our Todos application, we can configure our `List.public`{:.language-elixir} query to
preload all associated `Todo`{:.language-elixir} objects:

<pre class='language-elixir'><code class='language-elixir'>
from list in query,
where: is_nil(list.user_id),
preload: [:todos]
</code></pre>

Now the `todos`{:.language-elixir} field on our `List`{:.language-elixir} will be a fully populated list of
all `Todo`{:.language-elixir} objects associated with that particular list.

To send those todos to the client, we need to tell [Poison](https://github.com/devinus/poison) that we want the `todos`{:.language-elixir} field included in each serialized `List`{:.language-elixir} object:

<pre class='language-elixir'><code class='language-elixir'>
@derive {Poison.Encoder, only: [
  ...
  :todos
]}
</code></pre>

We'll also need to tell Poison how to serialize our `Todo`{:.language-elixir} documents:

<pre class='language-elixir'><code class='language-elixir'>
@derive {Poison.Encoder, only: [
  :id,
  :text,
  :checked
]}
</code></pre>

Now on the client, we can tell our `ListPageContainer`{:.language-javascript} to pull our list
of `todos`{:.language-javascript} out of the list itself:

<pre class='language-javascript'><code class='language-javascript'>
todos: _.get(list, "todos") || []
</code></pre>

After fixing up a few minor variable name issues, our todos show up in
each list page!


<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
 ...
     :incomplete_count,
-    :user_id
+    :user_id,
+    :todos
   ]}
 ...
     from list in query,
-      where: is_nil(list.user_id)
+    where: is_nil(list.user_id),
+    preload: [:todos]
   end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/todo.ex</p><code class='language-elixirDiff'>
 ...
 
+  @derive {Poison.Encoder, only: [
+    :id,
+    :text,
+    :checked
+  ]}
+
   schema "todos" do
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/TodoItem.jsx</p><code class='language-javascriptDiff'>
 ...
         updateText.call({
-          todoId: this.props.todo._id,
+          todoId: this.props.todo.id,
           newText: value,
 ...
   onFocus() {
-    this.props.onEditingChange(this.props.todo._id, true);
+    this.props.onEditingChange(this.props.todo.id, true);
   }
 ...
   onBlur() {
-    this.props.onEditingChange(this.props.todo._id, false);
+    this.props.onEditingChange(this.props.todo.id, false);
   }
 ...
     setCheckedStatus.call({
-      todoId: this.props.todo._id,
+      todoId: this.props.todo.id,
       newCheckedStatus: event.target.checked,
 ...
   deleteTodo() {
-    remove.call({ todoId: this.props.todo._id }, alert);
+    remove.call({ todoId: this.props.todo.id }, alert);
   }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/containers/ListPageContainer.jsx</p><code class='language-javascriptDiff'>
 ...
       listExists: !!list,
-      todos: []
+      todos: _.get(list, "todos") || []
     }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/ListPage.jsx</p><code class='language-javascriptDiff'>
 ...
           todo={todo}
-          key={todo._id}
-          editing={todo._id === editingTodo}
+          key={todo.id}
+          editing={todo.id === editingTodo}
           onEditingChange={this.onEditingChange}
</code></pre>


## Final Thoughts

Although it was briefly glossed over in the commits, representing the WebSocket connection process and state in terms of Redux actions led to quite a bit of internal conflict.

In my mind, a highly stateful, constantly changing object like a socket or channel connection doesn’t neatly fit into the idea of “state”.

Our Redux event log could show that we successfully instantiated a socket connection, but that doesn’t mean that the socket referenced by our state is currently connected. It might have timed out, or disconnected for any other unknown reason.

Trying to capture and track this kind of transient, ephemeral thing in pure, immutable Redux state seems like a slippery and dangerous slope.

We don’t track things like network connectivity in Redux state, so why track WebSocket connectivity? That analogy isn’t exactly accurate, but I think it helps to describe some of my concerns.

Ultimately, I decided to keep the socket connection in the application state so it can be easily accessible to all components and actions.
