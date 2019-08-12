---
layout: post
title:  "Golfing for FizzBuzz in Clojure and Elixir"
excerpt: "Let's take a look at an interesting Clojure-based solution to the FizzBuzz problem and see if we can eloquently restate it using Elixir."
author: "Pete Corey"
date:   2018-07-09
tags: ["Elixir", "Clojure"]
related: []
---

I recently came across [this riff on the FizzBuzz problem written in Clojure](https://gist.github.com/krisajenkins/3333741). While it's admittedly not terribly obvious what's going on, I thought it was a novel solution to [the FizzBuzz problem](https://en.wikipedia.org/wiki/Fizz_buzz).

How could we recreate this solution using [Elixir](https://elixir-lang.org/)? There are some obvious similarities between Clojure's `cycle`{:.language-elixir} and [Elixir's `Stream.cycle/1`{:.language-elixir}](https://hexdocs.pm/elixir/Stream.html#cycle/1). As someone who's always been a fanboy of Lisp syntax, which solution would I prefer?

There's only one way to find out…

## But First, an Explanation

Before we dive into our Elixir solution, we should work out what exactly this Clojure solution is doing:

<pre class='language-elixir'><code class='language-elixir'>
(clojure.pprint/pprint
  (map vector
    (range 25)
    (cycle [:fizz :_ :_])
    (cycle [:buzz :_ :_ :_ :_])))
</code></pre>

Clojure's `clojure.pprint/pprint`{:.language-elixir} obviously just prints whatever's passed into it. In this case, we're printing the result of this expression:

<pre class='language-elixir'><code class='language-elixir'>
(map vector
  (range 25)
  (cycle [:fizz :_ :_])
  (cycle [:buzz :_ :_ :_ :_])))
</code></pre>

But what exactly's happening here? Clojure's [`map`{:.language-elixir}](https://clojuredocs.org/clojure.core/map) function is interesting. It let's you map a function over any number of collections. The result of the `map`{:.language-elixir}  expression is the result of applying the function to each of the first values of each collection, followed by the result of applying the mapped function to each of the second values, and so on.

In this case, we're mapping the [`vector`{:.language-elixir}](https://clojuredocs.org/clojure.core/vector) function over three collections: the range of numbers from zero to twenty four (`(range 25)`{:.language-elixir}), [the infinite cycle](https://clojuredocs.org/clojure.core/cycle) of `:fizz`{:.language-elixir}, `:_`{:.language-elixir}, and `:_`{:.language-elixir} (`(cycle [:fizz :_ :_])`{:.language-elixir}), and the infinite cycle of `:buzz`{:.language-elixir}, `:_`{:.language-elixir}, `:_`{:.language-elixir}, `:_`{:.language-elixir}, `:_`{:.language-elixir} (`(cycle [:buzz :_ :_ :_ :_])`{:.language-elixir}).

Mapping `vector`{:.language-elixir} over each of these collections creates a vector for each index, and whether it should display Fizz, Buzz, or FizzBuzz for that particular index.

The result looks just like we'd expect:

<pre class='language-elixir'><code class='language-elixir'>
([0 :fizz :buzz]
 [1 :_ :_]
 [2 :_ :_]
 [3 :fizz :_]
 [4 :_ :_]
 [5 :_ :buzz]
 ...
 [24 :fizz :_])
</code></pre>

## An Elixir Solution

So how would we implement this style of FizzBuzz solution using Elixir? As we mentioned earlier, Elixir's `Stream.cycle/1`{:.language-elixir} function is almost identical to Clojure's `cycle`{:.language-elixir}. Let's start there.

We'll make two cycles of our Fizz and Buzz sequences:

<pre class='language-elixir'><code class='language-elixir'>
Stream.cycle([:fizz, :_, :_])
Stream.cycle([:buzz, :_, :_, :_, :_])
</code></pre>

On their own, these two cycles don't do much.

Let's use [`Stream.zip/2`{:.language-elixir}](https://hexdocs.pm/elixir/Stream.html#zip/2) to effectively perform the same operation as Clojure's `map vector`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
Stream.zip(Stream.cycle([:fizz, :_, :_]), Stream.cycle([:buzz, :_, :_, :_, :_])) 
</code></pre>

Now we can print the first twenty five pairs by piping our zipped streams into `Enum.take/2`{:.language-elixir} and printing the result with `IO.inspect/1`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
Stream.zip(Stream.cycle([:fizz, :_, :_]), Stream.cycle([:buzz, :_, :_, :_, :_])) 
|> Enum.take(25)
|> IO.inspect
</code></pre>

Our result looks similar:

<pre class='language-elixir'><code class='language-elixir'>
[
  fizz: :buzz,
  _: :_,
  _: :_,
  fizz: :_,
  _: :_,
  _: :buzz,
  ...
  fizz: :_
]
</code></pre>

While our solution works, I'm not completely happy with it.

## Polishing Our Solution

For purely aesthetic reasons, let's import the function's we're using from `Stream`{:.language-elixir}, `Enum`{:.language-elixir} and `IO`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
import Stream, only: [cycle: 1, zip: 2]
import Enum, only: [take: 2]
import IO, only: [inspect: 1]
</code></pre>

This simplifies the visual complexity of our solution:

<pre class='language-elixir'><code class='language-elixir'>
zip(cycle([:fizz, :_, :_]), cycle([:buzz, :_, :_, :_, :_]))
|> take(25)
|> inspect
</code></pre>

But we can take it one step further.

{% include newsletter.html %}

Rather than using `Stream.zip/2`{:.language-elixir}, which expects a `left`{:.language-elixir} and `right`{:.language-elixir} argument, let's use [`Stream.zip/1`{:.language-elixir}](https://hexdocs.pm/elixir/Stream.html#zip/1), which expects to be passed an enumerable of streams:

<pre class='language-elixir'><code class='language-elixir'>
[
  cycle([:fizz, :_, :_]),
  cycle([:buzz, :_, :_, :_, :_])
]
|> zip
|> take(25)
|> inspect
</code></pre>

And that's our final solution.

## Final Thoughts

To be honest, I've been having troubles lately coming to terms with some of Elixir's aesthetic choices. As someone who's always admired the simplicity of Lisp syntax, I fully expected myself to prefer the Clojure solution over the Elixir solution.

That being said, I hugely prefer the Elixir solution we came up with!

The overall attack plan of the algorithm is much more apparent. It's immediately clear that we start with two cycles of `:fizz`{:.language-elixir}/`:buzz`{:.language-elixir} and some number of empty atoms. From there, we zip together the streams and take the first twenty five results. Lastly, we inspect the result.

Which solution do you prefer?
