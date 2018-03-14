---
layout: post
title:  "Who Needs Lodash When You Have Elixir?"
description: "Watch how Elixir's standard library outclasses Javascript's Lodash in day-to-day tasks."
author: "Pete Corey"
date:   2017-04-17
tags: ["Elixir", "Javascript"]
---

Before adventuring into the land of [Elixir](http://elixir-lang.org/), I used Javascript day in and day out for both front-end and back-end development. Javascript’s (lack of) standard libraries forced me to rely heavily on third-party tools and libraries such as [Underscore](http://underscorejs.org/) and [Lodash](https://lodash.com/).

I became very proficient at working with these tools, and after initially starting with Elixir, I felt very clumsy with the new language. I wasn’t able to accomplish the things I could easily and quickly do with Javascript and Lodash.

Over the past few months, I’ve become much more comfortable with the language, and I’ve realized that Elixir’s standard library outclasses Lodash in nearly every way.

Let’s dig into the two and see how we would translate the Lodash-isms we know and love into Elixir code.

## The Usual Suspects

For many functions in Lodash, there’s an obvious mapping to an equivalent function in Elixir’s standard library.

For example, the usual suspects like `_.map`{:.language-javascript}, `_.reduce`{:.language-javascript}, `_.find`{:.language-javascript}, and `_.filter`{:.language-javascript} all have equivalent functions in Elixir’s `Enum`{:.language-elixir} module:

<pre class='language-javascript'><code class='language-javascript'>
_.map([1, 2, 3], n => n + 1)  // Enum.map([1, 2, 3], &(&1 + 1))
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
_.reduce([1, 2, 3], (s, n) => s + n)  // Enum.reduce([1, 2, 3], &(&2 + &1))
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
_.includes([1, 2, 3], 2)  // Enum.member?([1, 2, 3], 2)
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
_.filter([1, 2, 3], n => n < 3)  // Enum.filter([1, 2, 3], &(&1 < 3))
</code></pre>

Other commonly used Lodash functions such as `_.uniq`{:.language-javascript} (`Enum.uniq`{:.language-elixir}), `_.find`{:.language-javascript} (`Enum.find`{:.language-elixir}), `_.keyBy`{:.language-javascript} (`Enum.group_by`{:.language-elixir}), etc. also have their counterparts in the Elixir standard library.

## Getting Nested Values

I’ve also come to heavily rely on Lodash’s `_.get`{:.language-javascript} and `_.set`{:.language-javascript} functions to grab and update values in deeply nested data structures.

Using `_.get`{:.language-javascript} lets me grab a nested value (or `undefined`{:.language-javascript}) even if the intermediary objects and arrays don’t exist. For example, instead of writing:

<pre class='language-javascript'><code class='language-javascript'>
if (foo && foo.bar && foo.bar.baz) {
  return foo.bar.baz.bot;
}
</code></pre>

I can simply write:

<pre class='language-elixir'><code class='language-elixir'>
return _.get(foo, "bar.baz.bot");
</code></pre>

When I first started working with Elixir, I really missed being able to do this. Working with complex, nested data structures felt so clunky! That was before I found out about the awesome power of Elixir’s [`Access`{:.language-elixir} behavior](https://hexdocs.pm/elixir/master/Access.html) and the family of functions built around it.

In Elixir, we can use the `get_in`{:.language-elixir} function to grab values (or `nil`{:.language-elixir}) out of nested structures, even if the intermediary values don’t exist:

<pre class='language-elixir'><code class='language-elixir'>
get_in(foo, [:bar, :baz, :bot])
</code></pre>

We can even pass in [dynamic lookup fields](https://hexdocs.pm/elixir/master/Access.html#module-dynamic-lookups), which would have required string manipulation in the Javascript example:

<pre class='language-elixir'><code class='language-elixir'>
get_in(foo, [:bar, some_id, :baz])
</code></pre>

Additionally, we can use [Accessor functions](https://hexdocs.pm/elixir/master/Access.html#module-accessors) to take our Elixir-foo to the next level. For example, we could grab the second user’s name (if it exists, otherwise we get `nil`{:.language-elixir}):

<pre class='language-elixir'><code class='language-elixir'>
get_in(..., [:users, Access.at(1), :name])
</code></pre>

Or we could grab all of the users’ names:

<pre class='language-elixir'><code class='language-elixir'>
get_in(..., [:users, Access.all(), :name])
</code></pre>

If we wanted any of these values or intermediary values to have a default value, we could use `Access.key`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
get_in(..., [:users, Access.all(), Access.key(:name, "Anonymous")])
</code></pre>

Let’s see Lodash’s `_.get`{:.language-javascript} do that!

{% include newsletter.html %}

## Setting Nested Values

All of these ideas apply to updating values as well. We can use `put_in`{:.language-elixir} to directly set a value in a nested data structure, or `update_in`{:.language-elixir} to update it with a function we provide.

For example, we can set values deep in a data structure, even if the intermediary values don’t exist, with `put_in`{:.language-elixir} and `Access.key`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
put_in(%{}, [Access.key(:foo, %{}), :bar], "baz")
</code></pre>

Similarly, we can update values with `update_in`{:.language-elixir} or `get_and_update_in`{:.language-elixir}.

If the Accessors provided by Elixir’s `Access`{:.language-elixir} module aren’t enough for your use case, you can even write your own custom accessor functions!

## Out of the Box Chaining

Elixir’s proverbial cherry on top is undoubtedly its built-in pipe operator.

To pipe Lodash function calls together, you need to explicitly construct a function chain with `_.chain`{:.language-javascript}, passing in your initial value, and then call `_.value`{:.language-javascript} at the end of your chain to retrieve the resulting value.

For example, let’s say we want to count the number of orders a set of users has made:

<pre class='language-javascript'><code class='language-javascript'>
_.chain(users)
 .map("orders")
 .map(orders => orders.length)
 .sum()
 .value();
</code></pre>

Because of Elixir’s stateless, functional nature, the barrier of entry for starting a chain is nonexistent:

<pre class='language-elixir'><code class='language-elixir'>
users
|> Enum.map(&(&1.orders))
|> Enum.map(&length/1)
|> Enum.sum
</code></pre>

## Final Thoughts

I’ve yet to find a problem easily solvable with Lodash that isn’t easily solvable with an out-of-the-box tool provided by Elixir. In my experience, Elixir has proven to be incredibly more flexible and more powerful than Lodash.

While I originally felt uncomfortable and clumsy working with data in Elixir, my ever growing understanding of the tools the language provides is helping me regain my confidence.

If you haven’t already checked out Elixir, do it!

If you’re new to Elixir and feeling like a fish out of water, my only advice is to stick with it and read through the [guides](http://elixir-lang.org/getting-started/introduction.html) and [documentation](http://elixir-lang.org/docs.html). You’ll be swimming again in no time.
