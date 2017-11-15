---
layout: post
title:  "How to use MongoDB With Elixir - Revisited"
description: "A recent upgrade to Elixir's MongoDB package requires that we revisit how we interact with the database through Elixir."
author: "Pete Corey"
date:   2016-12-05
tags: ["Elixir", "MongoDB"]
---

I recently wrote an article on [how to use MongoDB with Elixir](http://www.east5th.co/blog/2016/10/31/how-to-use-mongodb-with-elixir/). Since that article was released, changes have been made to the [MongoDB Elixir package](https://github.com/ericmj/mongodb).

In many ways, these changes make the package more approachable and flexible for developers, but they left my old instructions outdated and incomplete.

---- 

Previous versions of the [MongoDB](https://www.mongodb.com/) driver (`< 0.2`{:.language-elixir}) required that you build your own `MongoPool`{:.language-elixir} module somewhere in your project:

<pre class='language-elixir'><code class='language-elixir'>
defmodule MongoPool do
  use Mongo.Pool, name: __MODULE__, adapter: Mongo.Pool.Poolboy
end
</code></pre>

This `MongoPool`{:.language-elixir} module set up your connection pooling (using `Mongo.Pool.Poolboy`{:.language-elixir}) and was the main process you would instantiate to establish a connection with your MongoDB database:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, _} = MongoPool.start_link(database: "test")
</code></pre>

Once the connection was established, you could query the database through the connection pool, without specifying the PID if the pool’s process:

<pre class='language-elixir'><code class='language-elixir'>
MongoPool
|> Mongo.find("collection", %{ "foo" => "bar" })
|> Enum.to_list
</code></pre>

---- 

However, with version `0.2`{:.language-elixir} of the MongoDB driver, things have changed.

Now, you instantiate your connection to your MongoDB database by spinning up the `Mongo`{:.language-elixir} process directly:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, mongo_pid} = Mongo.start_link(database: "test")
</code></pre>

The first argument to `Mongo.find`{:.language-elixir}/`Mongo.insert_one`{:.language-elixir}/etc… is now the `Mongo`{:.language-elixir} process ID:

<pre class='language-elixir'><code class='language-elixir'>
mongo_pid
|> Mongo.find("collection", %{ "foo" => "bar" })
|> Enum.to_list
</code></pre>

Alternatively, you can name your `Mongo`{:.language-elixir} process to avoid having to pass the `mongo_pid`{:.language-elixir} around your application:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, _} = Mongo.start_link(database: "test", name: :mongo)
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
:mongo
|> Mongo.find("collection", %{ "foo" => "bar" })
|> Enum.to_list
</code></pre>

---- 

Out of the box, this will establish a single connection to the database. To enable connection pooling, like we had with our old `MongoPool`{:.language-elixir}, we need to specify how we want our pooling handled when we spin up our `Mongo`{:.language-elixir} process:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, _} = Mongo.start_link(database: "test", name: :mongo, pool: DBConnection.Poolboy)
</code></pre>

You then need to specify the pool module you’re using when running MongoDB operations:

<pre class='language-elixir'><code class='language-elixir'>
:mongo
|> Mongo.find("collection", %{ "foo" => "bar" }, pool: DBConnection.Poolboy)
|> Enum.to_list
</code></pre>

The heart of these changes is that the `mongodb`{:.language-elixir} driver package is now using the [DBConnection package](https://hexdocs.pm/db_connection/DBConnection.html), instead of wrapping [Poolboy](https://github.com/devinus/poolboy) itself.

See the [changelog](https://github.com/ericmj/mongodb/blob/master/CHANGELOG.md#v020-2016-11-11) and the [GitHub documentation](https://github.com/ericmj/mongodb) and the [Hex documentation](https://hexdocs.pm/mongodb/readme.html) for more details.
