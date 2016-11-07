---
layout: post
title:  "NoSQL Injection in Phoenix Applications"
date:   2016-11-07
tags: []
---

NoSQL injection is a class of application vulnerability where a malicious user can inject control structures into a query against a NoSQL database. [MongoDB](https://www.mongodb.com/) is the usual victim in these types of attacks, for reasons we’ll discuss towards the end of the article.

Coming most recently from a Meteor background, NoSQL injection is no stranger to me. It’s one of the most prevalent vulnerabilities I find during [Meteor security assessments](http://www.east5th.co/blog/2016/05/30/anatomy-of-an-assessment/).

Interestingly, as I’ve been diving headfirst into [Elixir](http://elixir-lang.org/) and the [Phoenix framework](http://www.phoenixframework.org/), I’ve been seeing the NoSQL injection monster raising its ugly head.

Let’s take a look at what NoSQL injection actually is, what it looks like in an Elixir/Phoenix application, and how it can be prevented.

## What is NoSQL Injection

NoSQL injection is an interesting vulnerability that’s especially prevalent in systems built with MongoDB. NoSQL injection can occur when a user’s unvalidated, unsanitized input is inserted directly into a MongoDB query object.

To make things more real, let’s demonstrate NoSQL injection with a (slightly contrived) example.

Imagine you have a [Phoenix channel](http://www.phoenixframework.org/docs/channels) that removes shopping cart “item” documents from a MongoDB collection whenever it receives an `"empty_cart"`{:.language-elixir} event:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("empty_cart", cart_id, socket) do
  MongoPool
  |> Mongo.delete_many("items", %{"cart_id" => cart_id})
  {:noreply, socket}
end
</code></pre>

This code is making the assumption that the `"empty_cart"`{:.language-elixir} channel event will always be invoked with `cart_id`{:.language-elixir} as a string. However, it’s important to realize that `cart_id`{:.language-elixir} can be _any JSON-serializable type_.

What would happy if a malicious user passed in `{$gte: ""}`{:.language-javascript} as a `cart_id`{:.language-elixir}? Our resulting MongoDB query would look like this:

<pre class='language-elixir'><code class='language-elixir'>
Mongo.delete_many("items", %{"cart_id" => %{"$gte" => ""}})
</code></pre>

___This query would remove every item document in the database.___

Similar types of attacks can be used to fetch large amounts of unauthorized data [from `find`{:.language-javascript}](http://www.east5th.co/blog/2015/04/06/nosql-injection-or-always-check-your-arguments/) and [`findOne`{:.language-javascript} queries](http://www.east5th.co/blog/2015/07/21/exploiting-findone-to-aggregate-collection-data/).

---- 

Even more dangerously (and more contrived), let’s imagine we have a channel event handler that lets users search through their cart items for items matching a user-provided key/value pair:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("find_items", %{"key" => key, "value" => value}, socket) do
  items = MongoPool
  |> Mongo.find("items", %{
       key => value,
       "user_id" => socket.assigns[:user]._id
     })
  |> Enum.to_list
  {:reply, {:ok, items}, socket}
end
</code></pre>

This seems relatively safe. We’re assuming that the user will pass in values like `"foo"`{:.language-elixir}/`"bar"`{:.language-elixir} for `"key"`{:.language-elixir} and `"value"`{:.language-elixir}, respectively.

However, what would happen if a malicious user passed in `"$where"`{:.language-elixir} and `"d = new Date; do {c = new Date;} while (c - d < 10000);"`{:.language-elixir} as a `"key"`{:.language-elixir}/`"value"`{:.language-elixir} pair?

The resulting MongoDB query would look like this:

<pre class='language-elixir'><code class='language-elixir'>
Mongo.find("items", %{
  "$where" => "d = new Date; do {c = new Date;} while (c - d < 10000);",
  "user_id" => socket.assigns[:user].id
})
</code></pre>

By exploiting the [`$where`{:.language-elixir} operator](https://docs.mongodb.com/manual/reference/operator/query/where/) in this way, the malicious user could ___peg the CPU of the server running the MongoDB instance at 100%___ for ten seconds per document in the collection, preventing any other queries from executing during that time.

This malicious elixir loop could easily be modified to run indefinitely, requiring you to either kill the query manually, or restart your database process.

## How to Prevent It

Preventing this flavor of NoSQL injection is fairly straight-forward. You simply need to make assertions about the types of your user-provided data.

If you’re expecting `cart_id`{:.language-elixir} to be a string, _make sure it’s a string before working with it_.

In Elixir, this type of type checking can be neatly accomplished with pattern matching. We can patch up our first example with a simple pattern match that checks the type of `cart_id`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("empty_cart", cart_id, socket) when is_binary(cart_id) do
  MongoPool
  |> Mongo.delete_many("items", %{"cart_id" => cart_id})
  {:noreply, socket}
end
</code></pre>

<img style="width: 40%; margin: 0em 0 0em 1em; float:right;" title="Exploiting NoSQL injection from the browser" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/nosql-console.gif">

The `when is_binary(cart_id)`{:.language-elixir} [guard expression](http://elixir-lang.org/getting-started/case-cond-and-if.html#expressions-in-guard-clauses) asserts that `cart_id`{:.language-elixir} is a [binary type](http://elixir-lang.org/getting-started/binaries-strings-and-char-lists.html) (i.e., a string) before pattern matching on this instance of the `handle_in`{:.language-elixir} function.

If a malicious user passed in `%{"$gte" => ""}`{:.language-elixir} for an `cart_id`{:.language-elixir}, this version of our `"empty_cart"`{:.language-elixir} handler would not be evaluated, preventing the possibility of NoSQL injection.

---- 

Our `"find_items"`{:.language-elixir} example is also susceptible to query objects being passed in as `value`{:.language-elixir}, and would benefit from guard clauses.

However, the fundamental flaw with this example is that user input is being directly used to construct a root level MongoDB query.

A better version of our `"find_items"`{:.language-elixir} channel event handler might look something like this:

<pre class='language-elixir'><code class='language-elixir'>
def build_query("name", value), do: %{ "name" => value }
def build_query("category", value), do: %{ "category" => value }

def handle_in("find_items",
              %{"key" => key,
                "value" => value},
              socket) when is_binary(key) and is_binary(value)
  query = build_query(key, value)
  |> Map.put("user_id", socket.assigns[:user]._id
  items = MongoPool
  |> Mongo.find("items", query)
  |> Enum.to_list
  {:reply, {:ok, items}, socket}
end
</code></pre>

By mapping between the provided `key`{:.language-elixir} value and a list of known MongoDB query objects, we know that nothing can be injected into the root of our query.

Alternatively, we can continue to use the raw value of `key`{:.language-elixir} to construct our query, but we can add a `key in ["name", "category"]`{:.language-elixir} guard clause to our `handle_in`{:.language-elixir} function to assert that the user is only searching over the `"name"`{:.language-elixir} or `"category"`{:.language-elixir} fields:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("find_items",
              %{"key" => key,
                "value" => value},
              socket) when key in ["name", "category"] and is_binary(value)
</code></pre>

By preventing malicious users from controlling the root level of our MongoDB query, we can prevent several types of nasty NoSQL injection vulnerabilities within our application.

---- 

That being said, the best way to prevent these kinds of injection attacks is to use a query builder, like [Ecto](https://github.com/elixir-ecto/ecto).

Unfortunately, [as we discussed last week](http://www.east5th.co/blog/2016/10/31/how-to-use-mongodb-with-elixir/), the [Mongo.Ecto](https://github.com/michalmuskala/mongodb_ecto) adapter is currently in a state of flux and does not play nicely with Ecto 1.1 or Ecto 2.0.

## Picking on MongoDB

This type of NoSQL injection mostly applies to applications using MongoDB. This is because MongoDB has made the “interesting” design decision to intermix query control structures and query data in a single query object.

If a malicious user can inject data into this object, they can potentially inject query control structures as well. This is the fundamental idea behind NoSQL injection.

Looking at other NoSQL databases, it becomes apparent that MongoDB is alone in making this design decision.

[Redis](http://redis.io/), for example, is a much simpler solution overall. Redis doesn’t mix data and control structures. The query type is specified up-front, almost always by the application, and [unescapable](http://redis.io/topics/security#string-escaping-and-nosql-injection) data follows.

As another example, [CouchDB](http://couchdb.apache.org/) lets developers build custom queries through [“views”](http://guide.couchdb.org/draft/views.html), but these views are written in advance and stored on the server. They can’t be modified at runtime, let alone modified by a malicious user.

There are already a [host](http://cryto.net/~joepie91/blog/2015/07/19/why-you-should-never-ever-ever-use-mongodb/) of [compelling reasons](https://engineering.meteor.com/mongodb-queries-dont-always-return-all-matching-documents-654b6594a827) not to use MongoDB. I would add MongoDB’s decision to intermix data and control structures to this ever growing list.

## Final Thoughts

While MongoDB does have its short-comings, it’s important to realize that it’s still being used extensively in the Real World™. In fact, MongoDB is the [most popular NoSQL database](http://db-engines.com/en/ranking), standing heads and shoulders above its competition in usage statistics.

For this reason, it’s incredibly important to understand MongoDB-flavored NoSQL injection and how to prevent it in your applications.

For more information on NoSQL injection, check out the [“NoSQL Injection in Modern Web Applications”](http://www.east5th.co/blog/2016/03/21/nosql-injection-in-modern-web-applications/) presentation I gave at last year’s [Crater Conference](http://conf.crater.io/), and be sure to grab a copy of my [“Five Minute Introduction to NoSQL Injection”](http://www.east5th.co/blog/2016/10/24/a-five-minute-introduction-to-nosql-injection/).
