---
layout: post
title:  "Property Testing a Permutation Generator"
excerpt: "Permutations have some nice, intrinsic properties that lend themselves well to property testing."
author: "Pete Corey"
date:   2018-11-19
tags: ["Elixir", "Testing"]
related: []
---

Last time we spent some time writing a function to generate permutations of length `k`{:.language-elixir} of a given `list`{:.language-elixir}. Our final solution was fairly concise, but there are quite a few places where we could have made a mistake in our implementation.

Our first instinct might be to check our work using unit tests. Unfortunately using unit tests to check the correctness of a permutation generator leaves something to be desired. The length of our resulting set of permutations grows rapidly when `k`{:.language-elixir} and `list`{:.language-elixir} increase in size, making it feasible to only manually calculate and test the smallest possible permutations.

Thankfully there's another way. We can use [property testing](https://elixir-lang.org/blog/2017/10/31/stream-data-property-based-testing-and-data-generation-for-elixir/) to test the underlying properties of our solution and the permutations we're generating. This will give us quite a bit more variation on the inputs we test and might uncover some hidden bugs!

## Our Permutation Generator

The [permutation generator that we'll be testing](https://github.com/pcorey/chord/blob/master/lib/permutation.ex) looks like this:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
defmodule Permutation do
  def generate(list, k \\ nil, repetitions \\ false)
  def generate([], _k, _repetitions), do: [[]]
  def generate(_list, 0, _repetitions), do: [[]]

  def generate(list, k, repetitions) do
    for head <- list,
        tail <- generate(next_list(list, head, repetitions), next_k(k)),
        do: [head | tail]
  end

  defp next_k(k) when is_number(k),
    do: k - 1

  defp next_k(k),
    do: k

  defp next_list(list, _head, true),
    do: list

  defp next_list(list, head, false),
    do: list -- [head]
end
</code></pre>

You'll notice that it's a little different than the generator we built last time. This generator supports the creation of permutations both with and without repetitions of elements from `list`{:.language-elixir}, and lets you optionally pass in the length of the final permutations, `k`{:.language-elixir}.

We can use our `Permutation.generate/3`{:.language-elixir} function like so:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
iex(1)> Permutation.generate([1, 2, 3])
[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
</code></pre>

We can also specify a value for `k`{:.language-elixir}:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
iex(2)> Permutation.generate([1, 2, 3], 2)
[[1, 2], [1, 3], [2, 1], [2, 3], [3, 1], [3, 2]]
</code></pre>

And we can tell our generator to allow repetitions in the final permutations:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
iex(3)> Permutation.generate([1, 2, 3], 2, true)
[[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3]]
</code></pre>

All looks good so far, but dragons hide in the depths. Let's dig deeper.

## List of Lists

Permutations have some fairly well-known and easily testable properties. For example, we know that the results of our calls to `Permutation.generate/3`{:.language-elixir} should always have the structure of a list of lists.

Using [Elixir's `StreamData`{:.language-elixir} package](https://github.com/whatyouhide/stream_data), we can easily model and check that this property holds for our `Permuatation.generate/3`{:.language-elixir} function across a wide range of inputs. Let's start by creating a new property test to verify this for us:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
property "returns a list of lists" do
end
</code></pre>

We start by telling `StreamData`{:.language-elixir} that we want it to generate lists of, at most, `@max_length`{:.language-elixir} (which we'll define at `5`{:.language-elixir} for now) integers.

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
property "returns a list of lists" do
+  check all list <- list_of(integer(), max_length: @max_length) do
+  end
end
</code></pre>

Next, we call our `Permutation.generate/3`{:.language-elixir} function to create the permutations of the `list`{:.language-elixir} that was just generated for us:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
  property "returns a list of lists" do
    check all list <- list_of(integer(), max_length: @max_length) do
+      permutations = Permutation.generate(list)
    end
  end
</code></pre>

Finally we'll make assertions about the structure of our resulting `permutations`{:.language-elixir}. We want to assert that the result of our call to `Permutation.generate/3`{:.language-elixir} is a list, but also that every element in that result is a list as well:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
property "returns a list of lists" do
  check all list <- list_of(integer(), max_length: @max_length) do
    permutations = Permutation.generate(list)
+    assert permutations |> is_list
+    Enum.map(permutations, &assert(&1 |> is_list))
  end
end
</code></pre>

And that's all there is to it. Running out test suite, we'll see that our first property test passed with flying colors (well, mostly green).

<pre class='language-*'><code class='language-*'>.

Finished in 0.06 seconds
1 property, 0 failures
</code></pre>

## Correct Number of Permutations

Now that we know that the structure of our resulting list of permutations is correct, the next obvious property that we can test is that the number of permutations returned by our `Permutation.generate/3`{:.language-elixir} function is what we'd expect.

Permutations are a well-defined mathematical concept, and so [a nice equation exists](https://en.wikipedia.org/wiki/Permutation#k-permutations_of_n) to determine how many `k`{:.language-elixir}-length permutations exist for a list of `n`{:.language-elixir} elements:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
P(n, k) = n! / (n - k)!
</code></pre>

Let's write a quick factorial function to help calculate this value:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
defp factorial(n) when n <= 0,
  do: 1

defp factorial(n),
  do: n * factorial(n - 1)
</code></pre>

Let's also rewrite our `P(n, k)`{:.language-elixir} calculation as an Elixir helper function:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
  defp pnk(list, k),
    do: div(factorial(length(list)), factorial(length(list) - k))
</code></pre>

Great!

{% include newsletter.html %}

Now we're set up to test that our `Permutation.generate/3`{:.language-elixir} function is giving us the correct number of permutations for a given `list`{:.language-elixir} and value of `k`{:.language-elixir}.

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
property "returns the correct number of permutations" do
end
</code></pre>

This time we'll generate our `list`{:.language-elixir}, along with a value for `k`{:.language-elixir} that ranges from `0`{:.language-elixir} to the length of `list`{:.language-elixir}:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
property "returns the correct number of permutations" do
+  check all list <- list_of(integer(), max_length: @max_length),
+            k <- integer(0..length(list)) do
  end
end
</code></pre>

Once we have values for `list`{:.language-elixir} and `k`{:.language-elixir}, we can generate our set of permutations and make an assertion about its length:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
property "returns the correct number of permutations" do
  check all list <- list_of(integer(), max_length: @max_length),
            k <- integer(0..length(list)) do
+    assert pnk(list, k) ==
+            list
+            |> Permutation.generate(k)
+            |> length
  end
end
</code></pre>

Once again, our tests pass.

<pre class='language-*'><code class='language-*'>..

Finished in 0.06 seconds
2 properties, 0 failures
</code></pre>

## Only Include Elements From the List

Another neatly testable property of the permutations we're generating is that they should only contain values from the `list`{:.language-elixir} being permutated. Once again, we'll start by defining the property we'll be testing and generate our values for `list`{:.language-elixir} and `k`{:.language-elixir}:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
property "permutations only include elements from list" do
  check all list <- list_of(integer(), max_length: @max_length),
            k <- integer(0..length(list)) do
  end
end
</code></pre>

Next, we'll want to generate our set of permutations for `list`{:.language-elixir} and `k`{:.language-elixir}, and reject any permutations from that set that include values not found in `list`{:.language-elixir}:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
property "permutations only include elements from list" do
  check all list <- list_of(integer(), max_length: @max_length),
            k <- integer(0..length(list)) do
+    assert [] ==
+              list
+             |> Permutation.generate(k)
+             |> Enum.reject(fn permutation ->
+                [] ==
+                  permutation
+                 |> Enum.reject(&Enum.member?(list, &1))
+              end)
  end
end
</code></pre>

We're asserting that the resulting list of permutations should be an empty list (`[]`{:.language-elixir}). There should be no permutations left that contain elements not found in `list`{:.language-elixir}!

And, as expected, our suite still passes.

<pre class='language-*'><code class='language-*'>...

Finished in 0.08 seconds
3 properties, 0 failures
</code></pre>

## Use Each Item Once

Our current implementation of `Permutation.generate/3`{:.language-elixir} allows for duplicate items to be passed in through `list`{:.language-elixir}. When we generate each possible permutation, it's important that each of these duplicate items, and more generally any item in the list, only be used once.

That is, if `list`{:.language-elixir} is `[1, 2, 2]`{:.language-elixir}, our set of possible permutations should look like this:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
[[1, 2, 2], [1, 2, 2], [2, 1, 2], [2, 2, 1], [2, 1, 2], [2, 2, 1]]
</code></pre>

Note that `2`{:.language-elixir} is used twice in each permutation, but never more than twice.

At first, it seems like we might need a new test to verify this property of our permutation generator. It's conceivable that we could group each set of equal elements, count them, and verify that the resulting permutation have the correct count of each element group. But that sounds complicated, and an added test just introduces more code into our codebase that we need to maintain.

It turns out that we can tweak our previous property test to verify this new property.

Instead of identifying duplicates, counting them, and verifying the correct counts in the final set of permutations, let's take a simpler approach. Let's ensure that each element in `list`{:.language-elixir} is unique by using Elixir's `Enum.with_index/1`{:.language-elixir} function to bundle the element with its index value.

For example, our previous `[1, 2, 2]`{:.language-elixir} value for `list`{:.language-elixir} would be transformed into:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
[{1, 0}, {2, 1}, {2, 2}]
</code></pre>

Now both of our `2`{:.language-elixir} elements are unique. The first is `{2, 1}`{:.language-elixir}, and the second is `{2, 2}`{:.language-elixir}. Using this technique, we can recycle our "permutations only include elements from list" with a few slight tweaks:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
  property "permutations only include elements from list" do
    check all list <- list_of(integer(), max_length: @max_length),
              k <- integer(0..length(list)) do
      assert [] ==
               list
+              |> Enum.with_index()
               |> Permutation.generate(k)
               |> Enum.reject(fn permutation ->
                 [] ==
                   permutation
-                  |> Enum.reject(&Enum.member?(list, &1))
+                  |> Enum.reject(&Enum.member?(list |> Enum.with_index(), &1))
               end)
    end
  end
</code></pre>

And once again, our suite passes:

<pre class='language-elixirDiff'><code class='language-elixirDiff'>
...

Finished in 0.08 seconds
3 properties, 0 failures
</code></pre>

## Final Thoughts

The current version of our property tests currently only test values of `list`{:.language-elixir} composed entirely of integers. This doesn't necessarily need to be the case. The `list`{:.language-elixir} being permutated can contain _literally anything_, in theory. Expanding our property tests to support a wider range of types might be a great opportunity to try out writing a custom generator function!

Our current test suite also defines `@max_length`{:.language-elixir} as `5`{:.language-elixir}. While testing, I noticed that values of `@max_length`{:.language-elixir} up to `8`{:.language-elixir} were very performant and finished in under a second on my machine. Running the suite with a `@max_length`{:.language-elixir} of `9`{:.language-elixir} took several seconds to complete, and using a value of `10`{:.language-elixir} took nearly two minutes to come back green. I'm not sure if these performance problems can easily be improved, but I'm happy about how obvious they became through property testing.

You'll also note that none of this testing covers generating permutations that allow infinite repetitions of elements from `list`{:.language-elixir}. The properties for these sets of permutations are completely different, so I'm going to leave this as an exercise for the truly motivated reader.

I'm enjoying my experiences with property testing so far. Hopefully you find these write-ups useful as well. If so, [let me know on Twitter](https://twitter.com/petecorey)!
