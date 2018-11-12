---
layout: post
title:  "Permutations With and Without Repetition in Elixir"
description: "Let's get back to basics for a minute and use Elixir to write a function that will compute all possible permutations of a given list of elements."
author: "Pete Corey"
date:   2018-11-12
tags: ["Elixir"]
related: []
---

I've been hacking away at my [ongoing Chord project](https://github.com/pcorey/chord/), and I ran into a situation where I needed to generate all possible [permutations](https://en.wikipedia.org/wiki/Permutation) of length `k`{:.language-elixir} for a given `list`{:.language-elixir} of elements, where repetitions of elements from our `list`{:.language-elixir} are allowed. I figured this would be an excellent opportunity to flex our Elixir muscles and dive into a few possible solutions.

## Base Cases

Let's get the ball rolling by defining a `Permutation`{:.language-elixir} module to hold our solution and a `with_repetitions/2`{:.language-elixir} function that accepts a `list`{:.language-elixir} of elements, and a value for `k`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Permutation do
  def with_repetitions(list, k)
end
</code></pre>

We'll start by defining a few base cases for our `with_repetitions/2`{:.language-elixir} function. First, if `list`{:.language-elixir} is empty, we'll want to return a list who's first element is an empty list:

<pre class='language-elixir'><code class='language-elixir'>
def with_repetitions([], _k), do: [[]]
</code></pre>

We'll do the same if `k`{:.language-elixir} is `0`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def with_repetitions(_list, 0), do: [[]]
</code></pre>

Note that we're returning `[[]]`{:.language-elixir} because the only possible permutations of an empty `list`{:.language-elixir}, and the only possible zero-length permutation of a `list`{:.language-elixir} is `[]`{:.language-elixir}. The list of all possible permutations, in that case, is `[[]]`{:.language-elixir}.

## Building Our Permutator

Now we come to the interesting case where both `list`{:.language-elixir} and `k`{:.language-elixir} have workable values:

<pre class='language-elixir'><code class='language-elixir'>
def with_repetitions(list, k) do
  # ...
end
</code></pre>

We'll start by mapping over every element in our `list`{:.language-elixir}. We'll use each of these elements as the `head`{:.language-elixir} of a new `k`{:.language-elixir}-length permutation we're building.

<pre class='language-elixir'><code class='language-elixir'>
list
|> Enum.map(fn head ->
  # ...
end)
</code></pre>

For each value of `head`{:.language-elixir}, we want to calculate all `n - 1`{:.language-elixir} length sub-permutations of our `list`{:.language-elixir}, and concatenate each of these sub-permutations to our `head`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
list
|> with_repetitions(k - 1)
|> Enum.map(fn tail ->
  [head] ++ tail
end)
</code></pre>

At this point, the result of our `with_repetitions/2`{:.language-elixir} function is a list of a list of permutations. For every `head`{:.language-elixir}, we're returning a list of all `k`{:.language-elixir}-length permutations starting with that `head`{:.language-elixir}. What we really want is a singly nested list of all permutations we've found.

{% include newsletter.html %}

To reduce our list of lists of permutations, we need to append each list of permutations for every value of `head`{:.language-elixir} together:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.reduce(&(&2 ++ &1))
</code></pre>

This will order our permutations in lexical order (assuming our initial `list`{:.language-elixir} was sorted). If we wanted our final set of permutations in reverse order, we could switch the order of our concatenation:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.reduce(&(&2 ++ &1))
</code></pre>

Or we could just use `Kernel.++/2`{:.language-elixir} to accomplish the same thing:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.reduce(&Kernel.++/2)
</code></pre>

## Simplifying with Special Forms

This pattern of nested mapping and consolidating our result into a flat list of results is a fairly common pattern that we run into when writing functional code. It's so common, in fact, that Elixir includes a special form specifically designed to make this kind of computation easier to handle.

Behold [the list comprehension](https://elixir-lang.org/getting-started/comprehensions.html):

<pre class='language-elixir'><code class='language-elixir'>
def with_repetitions(list, k) do
  for head <- list, tail <- with_repetitions(list, k - 1), do: [head | tail]
end
</code></pre>

This single line is functionally equivalent to our original `with_repetitions/2`{:.language-elixir} function. The `for`{:.language-elixir} tells us that we're starting a list comprehension. For every value of `head`{:.language-elixir} and every value of `tail`{:.language-elixir}, we build a new permutation (`[head | tail]`{:.language-elixir}). The result of our list comprehension is simply a list of all of these permutations.

## Without Repetition

We've been trying to find permutations where repetitions of elements from `list`{:.language-elixir} are allowed. How would we solve a similar problem where repetitions _aren't allowed_?

It turns out that the solution is fairly straight-forward. When we generate our set of sub-permutations, or `tail`{:.language-elixir} values, we can simply pass in `list`{:.language-elixir} without the current value of `head`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def with_repetitions(list, k) do
  for head <- list, tail <- with_repetitions(list -- [head], k - 1), 
    do: [head | tail]
end
</code></pre>

That's it! Each level of our permutation removes the current value of `head`{:.language-elixir} preventing it from being re-used in future sub-permutations. It's fantastically convenient that previously computed values in our list comprehension, like `head`{:.language-elixir}, can be used in the subsequent values we iterate over.
