---
layout: post
title:  "Phoenix Todos - Public Lists"
description: "Part six of our 'Phoenix Todos' Literate Commits series. Sending public lists down to the client."
author: "Pete Corey"
date:   2016-10-05
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos"]
---


## [List and Todo Models]({{page.repo}}/commit/28cd479ad1ed33bf330c3f500c429aa8e932d255)

We're getting to the point where we'll be wanting real data in our
application. To use real data, we'll need to define
the schemas and models that describe the data.

Looking at our original [`Lists`{:.language-javascript}
schema](https://github.com/meteor/todos/blob/master/imports/api/lists/lists.js#L37-L42),
we know that each list needs a `name`{:.language-javascript}, an `incompleteCount`{:.language-javascript} (which we'll
call `incomplete_count`{:.language-elixir}), and an optional reference to a user. 

We can use Phoenix's `phoenix.gen.model`{:.language-javascript} generator to create this model for us:

<pre class='language-javascript'><code class='language-javascript'>
mix phoenix.gen.model List lists name:string \
                                 incomplete_count:integer \
                                 user_id:references:users
</code></pre>

Running this command creates a migration to create the `"users"`{:.language-elixir} table
in our database. It also creates our `PhoenixTodos.List`{:.language-elixir} model.

We can repeat this process for our `Todos`{:.language-javascript} collection. Looking at the
[`Todos`{:.language-javascript}
schema](https://github.com/meteor/todos/blob/master/imports/api/todos/todos.js#L39-L62),
we know we'll need a `text`{:.language-javascript} field, a `checked`{:.language-javascript} field, a reference to its
parent list, and a timestamp.

Once again, we can use the `phoenix.gen.model`{:.language-javascript} generator to create this
model and migration for us:

<pre class='language-bash'><code class='language-bash'>
mix phoenix.gen.model Todo todos text:string \
                                 checked:boolean \
                                 list_id:references:lists
</code></pre>

Notice that we left the timestamp out of our generator call. Phoenix adds timestamp fields for us automatically.

Nearly all of the code generated for us is perfect. We only need to make
one small tweak to our `PhoenixTodos.List`{:.language-elixir} model. In addition to
specifying that it `belongs_to`{:.language-elixir} the `PhoenixTodos.User`{:.language-elixir} model, we need
to specify that each `PhoenixTodos.List`{:.language-elixir} model `has_many`{:.language-elixir}
`PhoenixTodos.Todo`{:.language-elixir} children:

<pre class='language-elixir'><code class='language-elixir'>
has_many :todos, PhoenixTodos.Todo
</code></pre>

Specifying this relationship on the parent `List`{:.language-elixir} as well as the child
`Todo`{:.language-elixir} model will be very helpful down the line.


<pre class='language-elixirDiff'><p class='information'>priv/repo/migrations/20160920202201_create_list.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.Repo.Migrations.CreateList do
+  use Ecto.Migration
+
+  def change do
+    create table(:lists) do
+      add :name, :string
+      add :incomplete_count, :integer
+      add :user_id, references(:users, on_delete: :delete_all)
+
+      timestamps
+    end
+    create index(:lists, [:user_id])
+
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>priv/repo/migrations/20160920202208_create_todo.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.Repo.Migrations.CreateTodo do
+  use Ecto.Migration
+
+  def change do
+    create table(:todos) do
+      add :text, :string
+      add :checked, :boolean, default: false
+      add :list_id, references(:lists, on_delete: :delete_all)
+
+      timestamps
+    end
+    create index(:todos, [:list_id])
+
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>test/models/list_test.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.ListTest do
+  use PhoenixTodos.ModelCase
+
+  alias PhoenixTodos.List
+
+  @valid_attrs %{incomplete_count: 42, name: "some content"}
+  @invalid_attrs %{}
+
+  test "changeset with valid attributes" do
+    changeset = List.changeset(%List{}, @valid_attrs)
+    assert changeset.valid?
+  end
+
+  test "changeset with invalid attributes" do
+    changeset = List.changeset(%List{}, @invalid_attrs)
+    refute changeset.valid?
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>test/models/todo_test.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.TodoTest do
+  use PhoenixTodos.ModelCase
+
+  alias PhoenixTodos.Todo
+
+  @valid_attrs %{checked: true, text: "some content"}
+  @invalid_attrs %{}
+
+  test "changeset with valid attributes" do
+    changeset = Todo.changeset(%Todo{}, @valid_attrs)
+    assert changeset.valid?
+  end
+
+  test "changeset with invalid attributes" do
+    changeset = Todo.changeset(%Todo{}, @invalid_attrs)
+    refute changeset.valid?
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.List do
+  use PhoenixTodos.Web, :model
+
+  schema "lists" do
+    field :name, :string
+    field :incomplete_count, :integer
+    belongs_to :user, PhoenixTodos.User
+    has_many :todos, PhoenixTodos.Todo
+
+    timestamps
+  end
+
+  @required_fields ~w(name incomplete_count)
+  @optional_fields ~w()
+
+  @doc """
+  Creates a changeset based on the `model` and `params`.
+
+  If no params are provided, an invalid changeset is returned
+  with no validation performed.
+  """
+  def changeset(model, params \\ :empty) do
+    model
+    |> cast(params, @required_fields, @optional_fields)
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/todo.ex</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.Todo do
+  use PhoenixTodos.Web, :model
+
+  schema "todos" do
+    field :text, :string
+    field :checked, :boolean, default: false
+    belongs_to :list, PhoenixTodos.List
+
+    timestamps
+  end
+
+  @required_fields ~w(text checked)
+  @optional_fields ~w()
+
+  @doc """
+  Creates a changeset based on the `model` and `params`.
+
+  If no params are provided, an invalid changeset is returned
+  with no validation performed.
+  """
+  def changeset(model, params \\ :empty) do
+    model
+    |> cast(params, @required_fields, @optional_fields)
+  end
+end
</code></pre>



## [Seeding Data]({{page.repo}}/commit/304fa36f2a77d79f1ee60d4905cf529bbd30ab6a)

Now that we've defined our schemas and models, we need to seed our
database with data.

But before we do anything, we need to make sure that our migrations are up
to date:

<pre class='language-javascript'><code class='language-javascript'>
mix ecto.migrate
</code></pre>

This will create our `"lists"`{:.language-elixir} and `"todos"`{:.language-elixir} tables our PostgreSQL database.

Now we can start writing our seeding script. We'll model this script
after the [original `fixtures.js`{:.language-bash}
file](https://github.com/meteor/todos/blob/master/imports/startup/server/fixtures.js)
in our Meteor application.

We'll start by creating a list of in-memory lists and todos that we'll
use to build our database objects:

<pre class='language-elixir'><code class='language-elixir'>
[
  %{
    name: "Meteor Principles",
    items: [
      "Data on the Wire",
      "One Language",
      "Database Everywhere",
      "Latency Compensation",
      "Full Stack Reactivity",
      "Embrace the Ecosystem",
      "Simplicity Equals Productivity",
    ]
  },
  ...
]
</code></pre>

Notice that we're using double quote strings here instead of single
quote strings, like the original Meteor appliaction. This is because
single quote strings have a [special
meaning](http://elixir-lang.org/getting-started/binaries-strings-and-char-lists.html#char-lists)
in Elixir.

Next, we'll `Enum.map`{:.language-elixir} over each object in this list. Each object
represents a `List`{:.language-elixir}, so we'll build a `List`{:.language-elixir} model object and `insert`{:.language-elixir}
it into our database:

<pre class='language-elixir'><code class='language-elixir'>
list = Repo.insert!(%List{
  name: data.name,
  incomplete_count: length(data.items)
})
</code></pre>

Each string in `list.items`{:.language-elixir} represents a single `Todo`{:.language-elixir}. We'll map over
this list build a new `Todo`{:.language-elixir} model object, associating it with the
`List`{:.language-elixir} we just created using `Ecto.build_assoc`{:.language-elixir}, and inserting it into
the database:

<pre class='language-elixir'><code class='language-elixir'>
Ecto.build_assoc(list, :todos, text: item)
|> Repo.insert!
</code></pre>

Now we can run our seed script with the following command:

<pre class='language-javascript'><code class='language-javascript'>
mix run priv/repo/seeds.exs
</code></pre>

Or we can wipe our database and re-run our migrations and seed script
with the following command:

<pre class='language-javascript'><code class='language-javascript'>
mix ecto.reset
</code></pre>

After running either of these, our database should have three lists,
each with a set of associated todos.


<pre class='language-elixirDiff'><p class='information'>priv/repo/seeds.exs</p><code class='language-elixirDiff'>
 #     mix run priv/repo/seeds.exs
-#
-# Inside the script, you can read and write to any of your
-# repositories directly:
-#
-#     PhoenixTodos.Repo.insert!(%PhoenixTodos.SomeModel{})
-#
-# We recommend using the bang functions (`insert!`, `update!`
-# and so on) as they will fail if something goes wrong.
+
+alias PhoenixTodos.{Repo, List}
+
+[
+  %{
+    name: "Meteor Principles",
+    items: [
+      "Data on the Wire",
+      "One Language",
+      "Database Everywhere",
+      "Latency Compensation",
+      "Full Stack Reactivity",
+      "Embrace the Ecosystem",
+      "Simplicity Equals Productivity",
+    ]
+  },
+  %{
+    name: "Languages",
+    items: [
+      "Lisp",
+      "C",
+      "C++",
+      "Python",
+      "Ruby",
+      "JavaScript",
+      "Scala",
+      "Erlang",
+      "6502 Assembly",
+    ]
+  },
+  %{
+    name: "Favorite Scientists",
+    items: [
+      "Ada Lovelace",
+      "Grace Hopper",
+      "Marie Curie",
+      "Carl Friedrich Gauss",
+      "Nikola Tesla",
+      "Claude Shannon",
+    ]
+  }
+]
+|> Enum.map(fn data ->
+  list = Repo.insert!(%List{
+    name: data.name,
+    incomplete_count: length(data.items)
+  })
+  Enum.map(data.items, fn item ->
+    Ecto.build_assoc(list, :todos, text: item)
+    |> Repo.insert!
+  end)
+end)
</code></pre>



## [Public Lists]({{page.repo}}/commit/851ce21cb9a6b4d21125d410ecfe2baa0ac7a7f0)

Now that our database is populated with `Lists`{:.language-elixir} and `Todos`{:.language-elixir}, we're in a
position where we can start passing this data down the the client.

To keep things as similar to our original Meteor application as
possible, we'll be doing all of our commuication via WebSockets.
Specifically, we'll be using [Phoenix
Channels](http://www.phoenixframework.org/docs/channels).

We'll start by creating a `"lists.public"`{:.language-elixir} channel. This channel will
emulate the `"lists.public"`{:.language-elixir} publication in our Meteor application:

<pre class='language-elixir'><code class='language-elixir'>
channel "lists.public", PhoenixTodos.ListChannel
</code></pre>

When a client joins this channel, we'll send them all public lists:

<pre class='language-elixir'><code class='language-elixir'>
lists = List |> List.public |> Repo.all
{:ok, lists, socket}
</code></pre>

Where public lists are lists without an associated `User`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def public(query) do
  from list in query,
  where: is_nil(list.user_id)
end
</code></pre>

In order to send these lists down the wire, we need to use
[Poison](https://github.com/devinus/poison) to tell Phoenix how to
serialize our `List`{:.language-elixir} objects into JSON:

<pre class='language-elixir'><code class='language-elixir'>
@derive {Poison.Encoder, only: [
  :id,
  :name,
  :incomplete_count,
  :user_id
]}
</code></pre>

Now our client can connect to our server and join the `"lists.public"`{:.language-elixir}
channel:

<pre class='language-javascript'><code class='language-javascript'>
socket.connect();
socket.channel("lists.public", {})
  .join()
</code></pre>

For each of the lists we receive back, well fire an `ADD_LIST`{:.language-javascript} Redux
action. The resolver for this action simply pushes the `List`{:.language-javascript} object
onto our application's `lists`{:.language-javascript} array:

<pre class='language-javascript'><code class='language-javascript'>
return Object.assign({}, state, {
  lists: [...state.lists, action.list]
});
</code></pre>

And with that (and a few minor bug fixes), our application is now
showing lists pulled from the server!


<pre class='language-elixirDiff'><p class='information'>test/models/list_test.exs</p><code class='language-elixirDiff'>
 ...
   alias PhoenixTodos.List
+  alias PhoenixTodos.User
+  alias PhoenixTodos.Repo
 
 ...
   end
+
+  test "public" do
+    user = User.changeset(%User{}, %{
+      email: "user@example.com",
+      password: "password"
+    }) |> Repo.insert!
+    public = Repo.insert!(%List{
+      name: "public",
+      incomplete_count: 1
+    })
+    Repo.insert!(%List{
+      name: "private",
+      incomplete_count: 1,
+      user_id: user.id
+    })
+
+    lists = List |> List.public |> Repo.all
+
+    assert lists == [public]
+  end
 end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/channels/list_channel.ex</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.ListChannel do
+  use Phoenix.Channel
+  alias PhoenixTodos.{Repo, List}
+
+  def join("lists.public", _message, socket) do
+    lists = List |> List.public |> Repo.all
+    {:ok, lists, socket}
+  end
+
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/channels/user_socket.ex</p><code class='language-elixirDiff'>
 ...
   # channel "rooms:*", PhoenixTodos.RoomChannel
+  channel "lists.public", PhoenixTodos.ListChannel
 
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/list.ex</p><code class='language-elixirDiff'>
 ...
 
+  @derive {Poison.Encoder, only: [
+    :id,
+    :name,
+    :incomplete_count,
+    :user_id
+  ]}
+
   schema "lists" do
 ...
   end
+
+  def public(query) do
+    from list in query,
+      where: is_nil(list.user_id)
+  end
+
 end
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const ADD_LIST = "ADD_LIST";
+
 export function signUpRequest() {
 ...
 
+export function addList(list) {
+  return { type: ADD_LIST, list };
+}
+
 export function signUp(email, password, password_confirm) {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/app.js</p><code class='language-javascriptDiff'>
 ...
 import thunkMiddleware from "redux-thunk";
+import {
+  addList
+} from "./actions";
+import socket from "./socket";
 
 ...
 store.subscribe(render);
+
+socket.connect();
+socket.channel("lists.public", {})
+    .join()
+    .receive("ok", (res) => {
+      res.forEach((list) => {
+        store.dispatch(addList(list));
+      });
+    })
+    .receive("error", (res) => {
+        console.log("error", res);
+    });
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListList.jsx</p><code class='language-javascriptDiff'>
 ...
       <Link
-            to={`/lists/${ list._id }`{:.language-javascript}}
-            key={list._id}
+            to={`/lists/${ list.id }`{:.language-javascript}}
+            key={list.id}
         title={list.name}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/layouts/App.jsx</p><code class='language-javascriptDiff'>
 ...
 // redirect / to a list once lists are ready
-    if (!loading && !children) {
-      const list = Lists.findOne();
-      this.context.router.replace(`/lists/${ list._id }`{:.language-javascript});
+    if (!loading && !children && this.props.lists.length) {
+      const list = this.props.lists[0];
+      this.context.router.replace(`/lists/${ list.id }`{:.language-javascript});
 }
 ...
           const publicList = Lists.findOne({ userId: { $exists: false } });
-              this.context.router.push(`/lists/${ publicList._id }`{:.language-javascript});
+              this.context.router.push(`/lists/${ publicList.id }`{:.language-javascript});
         }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   SIGN_IN_FAILURE,
+  ADD_LIST,
 } from "../actions";
 ...
 });
+  case ADD_LIST:
+    return Object.assign({}, state, {
+      lists: [...state.lists, action.list]
+    });
   default:
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/socket.js</p><code class='language-javascriptDiff'>
 ...
 
-// Now that you are connected, you can join channels with a topic:
-let channel = socket.channel("topic:subtopic", {})
-channel.join()
-  .receive("ok", resp => { console.log("Joined successfully", resp) })
-  .receive("error", resp => { console.log("Unable to join", resp) })
-
 export default socket
</code></pre>


