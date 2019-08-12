---
layout: post
title:  "Advent of Code: Not Quite Lisp"
excerpt: "This Literate Commits post solves a Lisp-flavored code kata using Elixir!"
author: "Pete Corey"
date:   2016-08-17
repo: "https://github.com/pcorey/advent_of_code_01"
literate: true
tags: ["Elixir", "Advent of Code 2017", "Literate Commits"]
---


## [Christmas in August]({{page.repo}}/commit/4cb1209115cdf91b386bec8b6f71ad7d81d84053)

Today's an exciting day! We'll be tackling an entirely new set of code
katas using an entirely different language! We'll be working on the
[first challenge](http://adventofcode.com/day/1) in the [Advent of
Code](http://adventofcode.com/) series.

In the same vein as one of our [recent
posts](http://www.east5th.co/blog/2016/08/15/meteor-in-front-phoenix-in-back-part-1/),
we'll be using the [Elixir](http://elixir-lang.org/) language to solve
this challenge.

This first commit is the result of `mix new advent_of_code_01`{:.language-elixir} and creates a base
Elixir project.


<pre class='language-elixirDiff'><p class='information'>config/config.exs</p><code class='language-elixirDiff'>
+use Mix.Config
</code></pre>

<pre class='language-elixirDiff'><p class='information'>lib/advent_of_code_01.ex</p><code class='language-elixirDiff'>
+defmodule AdventOfCode01 do
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>mix.exs</p><code class='language-elixirDiff'>
+defmodule AdventOfCode01.Mixfile do
+  use Mix.Project
+
+  def project do
+    [app: :advent_of_code_01,
+     version: "0.1.0",
+     elixir: "~> 1.3",
+     build_embedded: Mix.env == :prod,
+     start_permanent: Mix.env == :prod,
+     deps: deps()]
+  end
+
+  def application do
+    [applications: [:logger]]
+  end
+
+  defp deps do
+    []
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>test/advent_of_code_01_test.exs</p><code class='language-elixirDiff'>
+defmodule AdventOfCode01Test do
+  use ExUnit.Case
+  doctest AdventOfCode01
+
+  test "the truth" do
+    assert 1 + 1 == 2
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>test/test_helper.exs</p><code class='language-elixirDiff'>
+ExUnit.start()
</code></pre>



## [Watching Tests]({{page.repo}}/commit/f6eea76d9978bcf21bc3e799876000d4381dbd53)

Out of the box, Elixir comes with a fantastic [unit testing
framework](http://elixir-lang.org/docs/stable/ex_unit/ExUnit.html).
ExUnit can be run against our current project by running the `mix test`{:.language-elixir}
command. Unfortunately, this runs the test suite one time and quits. It doesn't
watch our project and rerun our suite when it detects changes.

Thankfully, the `mix_test_watch`{:.language-elixir} dependency does exactly that. We can
add it to our project, and run the `mix test.watch`{:.language-elixir} command. Our test
suite will rerun on every file change.

Now that our test suite is up and running, we'll remove the example test
Elixir provided for us.


<pre class='language-elixirDiff'><p class='information'>mix.exs</p><code class='language-elixirDiff'>
 ...
   defp deps do
-    []
+    [
+      {:mix_test_watch, "~> 0.2", only: :dev}
+    ]
   end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>test/advent_of_code_01_test.exs</p><code class='language-elixirDiff'>
 ...
   doctest AdventOfCode01
-
-  test "the truth" do
-    assert 1 + 1 == 2
-  end
 end
</code></pre>



## [Our First Test]({{page.repo}}/commit/7091c1fbc1289e87a1d65b7ec5e1016e60136836)

To get things going, let's write the simplest test we can think of.
Amazingly, tests for Elixir functions can be written within the
documentation for the function itself. For example, we can write our
first test like this:

<pre class='language-elixir'><code class='language-elixir'>
iex> AdventOfCode01.which_floor "("
1
</code></pre>

Elixir will tease these tests out of the function docs and run them as
part of our test suite.

We can make this first test pass by simply returning `1`{:.language-elixir} from our new
`which_floor`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
def which_floor(directions) do
  1
end
</code></pre>

And with that, our test suite flips back to green.


<pre class='language-elixirDiff'><p class='information'>lib/advent_of_code_01.ex</p><code class='language-elixirDiff'>
 defmodule AdventOfCode01 do
+
+  @doc """
+  Determines which floor Santa will end up on.
+
+  ## Examples
+
+  iex> AdventOfCode01.which_floor "("
+  1
+
+  """
+  def which_floor(directions) do
+    1
+  end
+
 end
</code></pre>



## [Jumping Forward]({{page.repo}}/commit/18a843c728ef34c3ed62a4d3f5e9008bebb35a0c)

Our next test is slightly more complicated:

<pre class='language-elixir'><code class='language-elixir'>
iex> AdventOfCode01.which_floor "(("
2
</code></pre>

Normally, we might take a bit more time to flesh out more naive,
intemediary solutions, but this is a fairly easy problem to solve. We
want to split our `directions`{:.language-elixir} string into its component characters,
`map`{:.language-elixir} those characters into numbers (`1`{:.language-elixir} in this case), and then `sum`{:.language-elixir}
the result:

<pre class='language-elixir'><code class='language-elixir'>
directions
|> String.split("", trim: true)
|> Enum.map(&handle_direction/1)
|> Enum.sum()
</code></pre>

Our `handle_direction`{:.language-elixir} private function expects to recieve a `"("`{:.language-elixir} as
its input and always returns a `1`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defp handle_direction("("), do: 1
</code></pre>

With those changes, our suite returns to green.


<pre class='language-elixirDiff'><p class='information'>lib/advent_of_code_01.ex</p><code class='language-elixirDiff'>
 ...
 
+  iex> AdventOfCode01.which_floor "(("
+  2
+
   """
   def which_floor(directions) do
-    1
+    directions
+    |> String.split("", trim: true)
+    |> Enum.map(&handle_direction/1)
+    |> Enum.sum()
   end
 
+  defp handle_direction("("), do: 1
+
 end
</code></pre>



## [Handling All Matches]({{page.repo}}/commit/0dd1a75856122071aa542059f5676a47c2cd6332)

Let's add one last test that excercises the ability to process "down"
directions:

<pre class='language-elixir'><code class='language-elixir'>
iex> AdventOfCode01.which_floor("()(")
1
</code></pre>

After adding this test, our suite fails. It complains that it
can't find a "function clause matching in
`AdventOfCode01.handle_direction/1`{:.language-elixir}".

This is because we're only handling "up" directions (`"("`{:.language-elixir}) in the
`handle_direction`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
defp handle_direction("("), do: 1
</code></pre>

Let's add a new match for "down" directions:

<pre class='language-elixir'><code class='language-elixir'>
defp handle_direction(")"), do: -1
</code></pre>

After adding that new function definition to our module, our tests
flip back to green. Victory!


<pre class='language-elixirDiff'><p class='information'>lib/advent_of_code_01.ex</p><code class='language-elixirDiff'>
 ...
 
+  iex> AdventOfCode01.which_floor "()("
+  1
+
   """
 ...
   defp handle_direction("("), do: 1
+  defp handle_direction(")"), do: -1
 
</code></pre>


## Final Thoughts

Elixir is a beautiful language with lots of exciting features. In this example, we got a taste of transformation [pipelines](http://elixir-lang.org/getting-started/enumerables-and-streams.html#the-pipe-operator) and how [pattern matching](http://elixir-lang.org/getting-started/pattern-matching.html) can be used to write expressive control flow structures.

The first class treatment of documentation and testing is a welcome surprise coming from an ecosystem where testing seems to be an afterthought.

Around here we’re big fans of using small practice problems and code katas to learn new languages and paradigms. Expect to see Elixir making appearances in upcoming [Literate Commit](/blog/2016/07/11/literate-commits/) posts!
