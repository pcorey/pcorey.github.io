---
layout: post
title:  "How to Use MongoDB with Elixir"
date:   2016-10-31
tags: []
---

Many of the application’s I’ve developed for myself and for clients over the recent years are [intimately tied to MongoDB](https://guide.meteor.com/collections.html). This means that any new technology stack I experiment with need to be able to work well with this database.

[Elixir](http://elixir-lang.org/) is no exception to this rule.

Thankfully, Elixir and the [Phoenix framework](http://www.phoenixframework.org/) are database agnostic. They don’t require you to be tied to a single database, and even offer options for interfacing with a wide variety of databases.

Let’s dig into how we can use [MongoDB](https://www.mongodb.com/) in an Elixir application.

<p style="border: 1px dashed #690; padding: 1em; background-color: #F0F9F0">
This article was written with version <code class="language-elixir">~0.1</code> of the MongoDB driver in mind. For instructions on using version <code class="language-elixir">0.2</code> of the MongoDB driver, see <a href="/blog/2016/12/05/how-to-use-mongodb-with-elixir-revisited/">How to Use MongoDB with Elixir - Revisited</a>.
</p>

## Ecto Adapter

A very common way of interacting with a database in an Elixir application is to use the [Ecto package](https://github.com/elixir-ecto/ecto).

Ecto acts as a repository layer around your database. It lets you write queries in a unified languages, and supports communicating with many types of databases through “adapters”.

The [Mongo.Ecto](https://github.com/michalmuskala/mongodb_ecto) package is the Ecto adapter for MongoDB. Unfortunately, Mongo.Ecto is currently in a state of flux.

Mongo.Ecto is currently [incompatible with Ecto 1.1](https://github.com/michalmuskala/mongodb_ecto/issues/60#issuecomment-173518054). On top of that, work to support Ecto 2.0 is very much a [work](https://github.com/michalmuskala/mongodb_ecto/pull/91) in [progress](https://github.com/michalmuskala/mongodb_ecto/pull/84).

All of this is to say that integrating with MongoDB through Ecto is not currently an option if you’re looking for a low-friction, fully supported solution.

## MongoDB Driver

<img style="width: 40%; margin: 0em 0 0em 1em; float:right;" title="Available MongoDB options" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/mongooptions.png">

Under the hood, the Mongo.Ecto adapter makes use of [Eric Meadows-Jönsson’s](https://github.com/ericmj) [MongoDB driver](https://github.com/ericmj/mongodb/) package.

While Mongo.Ecto is in a state of flux, the MongoDB driver package seems to be stable and functional.

Setting up the MongoDB driver in your Elixir application is a simple process. Get started by following the documentation on GitHub. Once you’ve defined your `MongoPool`{:.language-elixir} module, you can start the process and make your queries:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, _} = MongoPool.start_link(database: "test")

MongoPool
|> Mongo.find("collection", %{ "foo" => "bar" })
|> Enum.to_list
</code></pre>

Database options can be passed into the connection pool when you `start_link`{:.language-elixir}. For example, to connect to a `"meteor"`{:.language-elixir} database on `localhost:3001`{:.language-http}, you could initiate your connection pool with these options:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, _} = MongoPool.start_link(database: "meteor", port: 3001)
</code></pre>

You can find all available options in the [`Mongo.Connection`{:.language-elixir} module](https://github.com/ericmj/mongodb/blob/d9331fd5899529363962834a07844a01e3bdfe31/lib/mongo/connection.ex#L22-L43), or through `iex`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
iex -S mix
> h Mongo.Connection.start_link
</code></pre>



## Final Thoughts

It’s a shame that the Mongo.Ecto adapter isn’t in a stable state. While the MongoDB driver works beautifully, it would be nice to leverage the unified interface of Ecto when building applications.

When using the MongoDB driver directly, you need to concern yourself with tightly coupling your application to your persistence method. Ecto provides a nice layer of decoupling between the two.

Additionally, using the MongoDB driver directly opens yourself up to the possibility of being vulnerable to [NoSQL injection attacks](http://www.east5th.co/blog/2016/03/21/nosql-injection-in-modern-web-applications/). We’ll drive into that topic next week.
