---
layout: post
title:  "Generating Sequences with Elixir Streams"
description: "Elixir streams can be amazingly useful tools for generating potentially infinite sequences of data. Learn about three useful stream functions that can be used to generate complex enumerable sequences."
author: "Pete Corey"
date:   2017-12-11
tags: ["Elixir", "Advent of Code 2017"]
related: []
---

It’s almost Christmas, which means the 2017 edition of [Advent of Code](https://adventofcode.com/) is officially upon us! While studying other people’s solutions to the first few problems, [Sasa Juric‏’s use of streams](https://gist.github.com/sasa1977/028a13921489f16a41f8c346578c4b5f#file-aoc2017_day2-ex-L41-L48) stood out to me.

The `resource/3`{:.language-elixir} and the closely related `iterate/2`{:.language-elixir} and `unfold/2`{:.language-elixir} functions in [the `Stream`{:.language-elixir} module](https://hexdocs.pm/elixir/Stream.html) were completely unknown to me and seemed worthy of some deeper study.

After spending time researching and banging out a few examples, I realized that these functions are extremely useful and underrated tools for generating complex enumerable sequences in [Elixir](https://elixir-lang.org/).

Let’s dive into a few examples to find out why!

## Simple Sequences

The `resource/3`{:.language-elixir}, `iterate/2`{:.language-elixir}, and `unfold/2`{:.language-elixir} functions in the `Stream`{:.language-elixir} module are all designed to emit some new values based on previous information. While they all accomplish the same task, they each have their own nuances.

[`Stream.iterate/2`{:.language-elixir}](https://hexdocs.pm/elixir/Stream.html#iterate/2) is best suited for generating simple sequences. We'll define a “simple sequence” as a sequence who’s next value can entirely be determined by its preview value.

For example, we can implement a simple incrementing sequence:

<pre class='language-elixir'><code class='language-elixir'>
Stream.iterate(0, &(&1 + 1))
</code></pre>

Taking the first `5`{:.language-elixir} values from this stream (`|> Enum.take(5)`{:.language-elixir}) gives us `[0, 1, 2, 3, 4]`{:.language-elixir}.

We ramp the complexity up a notch and generate a [Mandelbrot sequence](https://en.wikipedia.org/wiki/Mandelbrot_set) for a given value of `c`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Mandelbrot do
  def sequence({cr, ci}) do
    Stream.iterate({0, 0}, fn {r, i} -> 
      # z₂ = z₁² + c
      {(r * r - i * i) + cr, (i * r + r * i) + ci}
    end)
  end
end
</code></pre>

The value of `z₂`{:.language-elixir} is entirely determined by the value of `z₁`{:.language-elixir} and some constant.

## Sequences with Accumulators

There are times when the next value in a sequence can’t be generated with the previous value alone. Sometimes we need to use other information we’ve built up along the way to generate the next value in our sequence.

A perfect example of this type of sequence is the [Fibonacci sequence](https://en.wikipedia.org/wiki/Fibonacci_number). To generate the `n`{:.language-elixir}th value in the Fibonacci sequence, we need to know the previous value, `n-1`{:.language-elixir}, and also the value before that, `n-2`{:.language-elixir}.

This is where [`Stream.unfold/2`{:.language-elixir}](https://hexdocs.pm/elixir/Stream.html#unfold/2) shines. The `unfold/2`{:.language-elixir} function lets us build up an accumulator as we generate each value in our sequence.

Here’s an stream that generates the Fibonacci sequence:

<pre class='language-elixir'><code class='language-elixir'>
Stream.unfold({0, 1}, fn {a, b} -> {a, {b, a + b}} end)
</code></pre>

`Stream.unfold/2`{:.language-elixir} takes the initial value of our accumulator and a `next_fun`{:.language-elixir} function. Our `next_fun`{:.language-elixir} function returns a tuple who’s first element is the value emitted by our stream, and who’s second element is the accumulator that will be passed into the next call to `next_fun`{:.language-elixir}.

Taking the first `10`{:.language-elixir} elements of this stream gives us a familiar sequence of numbers:

<pre class='language-elixir'><code class='language-elixir'>
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
</code></pre>

For a more complex example of the power of `Stream.unfold/2`{:.language-elixir}, check out how I implemented a stream that generates [an integer spiral](https://github.com/pcorey/advent_of_code_2017/blob/master/03/03.exs#L36-L38) as part of an [Advent of Code challenge](https://adventofcode.com/2017/day/3).

{% include newsletter.html %}

## Multiple Values per Accumulator

Sometimes we’re faced with a true doozy of a sequence, and even an accumulator isn’t enough to accurately describe the next value. For example, what if we need to emit _multiple sequential values_ for each invocation of our `next_fun`{:.language-elixir}?

[`Stream.resource/3`{:.language-elixir}](https://hexdocs.pm/elixir/Stream.html#resource/3) to the rescue!

The `Stream.resource/3`{:.language-elixir} function was originally intended to consume external resources, hence its name and `start_fun`{:.language-elixir} and `after_fun`{:.language-elixir} functions, but it also works beautifully for building sufficiently complex sequences.

[Wolfram-style cellular automata](https://en.wikipedia.org/wiki/Cellular_automaton#Classification), such as [Rule 30](https://en.wikipedia.org/wiki/Rule_30), is a perfect example of this type of complex sequence.

To generate our Rule 30 sequence, we'll start with an initial list of values (usually just `[1]`{:.language-elixir}). Every time we call our `next_fun`{:.language-elixir}, we want to calculate the entire next layer in one go (which would be `[1, 1, 1]`{:.language-elixir}). Unfortunately, the size of these layers continues to grow (the next would be `[1, 1, 0, 0, 1]`{:.language-elixir}, etc…).

How would we write a stream that outputs each cell of each layer in order, and tells us the cell’s value and depth?

<pre class='language-elixir'><code class='language-elixir'>
defmodule Rule30 do
  def stream(values) do
    Stream.resource(fn -> {values, 0} end, &next_fun/1, fn _ -> :ok end)
  end

  defp next_fun({values, layer}) do
    next = ([0, 0] ++ values ++ [0, 0])
    |> Enum.chunk_every(3, 1, :discard)
    |> Enum.map(&rule/1)
    {values |> Enum.map(&{layer, &1}), {next, layer + 1}}
  end

  defp rule([1, 1, 1]), do: 0
  defp rule([1, 1, 0]), do: 0
  defp rule([1, 0, 1]), do: 0
  defp rule([1, 0, 0]), do: 1
  defp rule([0, 1, 1]), do: 1
  defp rule([0, 1, 0]), do: 1
  defp rule([0, 0, 1]), do: 1
  defp rule([0, 0, 0]), do: 0
end
</code></pre>

`Stream.resource/3`{:.language-elixir} makes short work of this potentially difficult problem. We start with our initial set of `values`{:.language-elixir}, and a depth of `0`{:.language-elixir}. Each call to our `next_fun`{:.language-elixir} tacks on a few buffering `0`{:.language-elixir}s to each side of our `values`{:.language-elixir} list, and applies the `rule`{:.language-elixir} function to each chunk of `3`{:.language-elixir} values. Once we’ve finished calculating our `next`{:.language-elixir} layer, we emit each value grouped with the current `depth`{:.language-elixir} along with our updated accumulator tuple.

We can take the first `9`{:.language-elixir} values from this stream and notice that they match up perfectly with [what we would expect](https://en.wikipedia.org/wiki/Rule_30#Rule_set) from Rule 30:

<pre class='language-elixir'><code class='language-elixir'>
Rule30.stream([1])
|> Enum.take(9)
|> IO.inspect
# [                {0, 1},
#          {1, 1}, {1, 1}, {1, 1}, 
#  {2, 1}, {2, 1}, {2, 0}, {2, 0}, {2, 1}]
</code></pre>

## Final Thoughts

While we’ve mostly talked about mathematical sequences here, these and techniques ideas apply to any type of enumerative data that needs to be generated.

In closing, here are a few rules to remember when working with `Stream.iterate/2`{:.language-elixir}, `Stream.unfold/2`{:.language-elixir}, and `Stream.resource/3`{:.language-elixir}:

- Use `Stream.iterate/2`{:.language-elixir} when you want to emit one value per call to your `next_fun`{:.language-elixir} function, and that value can be entirely generated from the previously emitted value.
- Use `Stream.unfold/2`{:.language-elixir} when you want to emit one value per call to your `next_fun`{:.language-elixir} function, but need additional, accumulated data to generate that value.
- Use `Stream.resource/3`{:.language-elixir} when you want to emit multiple values per call to your `next_fun`{:.language-elixir} function.

I highly encourage you to check out [Elixir streams](http://elixir-lang.github.io/getting-started/enumerables-and-streams.html#streams) if you haven’t. The `Stream`{:.language-elixir} module is full of ridiculously useful tools to help streamline your data pipeline.
