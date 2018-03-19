---
layout: post
title:  "J's Low-level Obfuscation Leads to Higher Levels of Clarity"
description: "It's argued that J is a \"write-only\" programming language because of its extreme terseness and complexity of syntax. I'm starting to warm up the the idea that it might be more readable than it first lets on."
author: "Pete Corey"
date:   2018-03-19
tags: ["J", "Programming Languages"]
related: []
---

After reading recent articles by [Hillel Wayne](https://www.hillelwayne.com/post/handwriting-j/) and [Jordan Scales](http://thatjdanisso.cool/j-fibonacci/), I've become fascinated with [the J programming language](http://www.jsoftware.com/). Trying to learn J has opened my mind to new ways of thinking about code.

One of the things I find most interesting about J is its ties to natural language, and its corresponding use of code constructs called "hooks" and "forks".

Many people argue that J is a "write-only" language because of its extreme terseness and complexity of syntax. As a beginner, I'd tend to agree, but I'm starting to warm up to the idea that it might be [more readable than it first lets on](https://www.youtube.com/watch?v=v7Mt0GYHU9A).

## What is J?

Other developers far more knowledgable than I have written fantastic introductions to the J programming language. I highly recommend you check out Hillel Wayne's posts on [hand writing programs in J](https://www.hillelwayne.com/post/handwriting-j/) and [calculating burn rates in J](https://www.hillelwayne.com/post/burn-rate-j/). Also check out Jordan Scales' posts on computing [the Fibonacci numbers](http://thatjdanisso.cool/j-fibonacci/) and [Pascal's triangle](http://thatjdanisso.cool/j-pascal/) in J.

If you're still not inspired, check out this motivating talk on [design patterns vs anti-patterns in APL](https://www.youtube.com/watch?v=v7Mt0GYHU9A) by Aaron Hsu, and watch Tracy Harms wax poetic about the mind-expanding power of [consistency and adjacency](https://www.youtube.com/watch?v=gLULrFY2-fI) in the J programming language.

Next be sure to check out the [J Primer](http://www.jsoftware.com/help/primer/contents.htm), [J for  C Programmers](http://www.jsoftware.com/help/jforc/contents.htm), and [Learning J](http://www.jsoftware.com/help/learning/contents.htm) if you're eager to dive into the nuts and bolts of the language.

If you're only interested in a simple "TL;DR" explanation of J, just know that [it's a high-level, array-oriented programming language](http://www.jsoftware.com/) that follows in the footsteps of [the APL programming language](https://en.wikipedia.org/wiki/APL_(programming_language)).

## Language and J

One of the most interesting aspects of J is that each component of a J expression is associated with a grammatical part of speech.

For example, plain expressions of data like the number five (`5`{:.language-*}), or the list of one through three (`1 2 3`{:.language-*}) are described as nouns. The ["plus" operator](http://www.jsoftware.com/help/dictionary/d100.htm) (`+`{:.language-*}) is a verb because it describes an action that can be applied to a noun. Similarly, the ["insert" or "table" modifier](http://www.jsoftware.com/help/dictionary/d420.htm) (`/`{:.language-*}) is an adverb because it modifies the behavior of a verb.

Unlike the human languages I'm used to, J expressions are evaluated from right to left. The following expression is evaulated as "the result of three plus two, multiplied by five":

<pre class='language-*'><code class='language-*'>   5 * 2 + 3
25
</code></pre>

We can modify our `+`{:.language-*} verb with our `/`{:.language-*} adverb to create a new verb that we'll call "add inserted between", or more easily, "sum":

<pre class='language-*'><code class='language-*'>   +/ 1 2 3
6
</code></pre>

Interestingly, all J verbs can easily operate over different dimensions (or ranks) of data. The `+`{:.language-*} verb will happily and intuitively (in most cases) work on everything from a single atom of data to a many-dimensioned behemoth of a matrix.

## Hooks and Forks

In J, any string of two concurrent verbs is called a "hook", and any string of three concurrent verbs is called a "fork". [Hooks and forks](http://www.jsoftware.com/help/jforc/forks_hooks_and_compound_adv.htm) are used to reduce repetition and improve the readability of our code.

Let's look at a fork:

<pre class='language-*'><code class='language-*'>   mean =: +/ % #
</code></pre>

Here we're defining `mean`{:.language-*} to be a verb composed of the "sum" (`+/`{:.language-*}), ["divided by"](http://www.jsoftware.com/help/dictionary/d130.htm) (`%`{:.language-*}), and ["tally"](http://www.jsoftware.com/help/dictionary/d400.htm) (`#`{:.language-*}) verbs. This grouping of three verbs creates a fork.

When you pass a single argument into a fork, the two outer verbs (`+/`{:.language-*} and `#`{:.language-*} in this case) both operate on that argument, and both results are passed as arguments to the middle verb. The resulting value of applying this middle verb is the final result of the fork expression.

<div style="width: 66%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/js-low-level-obfu+scation-leads-to-higher-levels-of-clarity/fork.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">A monadic fork applied to a noun.</p>
</div>

Let's use our `mean`{:.language-*} verb to average the numbers one through four:

<pre class='language-*'><code class='language-*'>   mean 1 2 3 4
2.5
</code></pre>

Just as we'd expect, the average of `1 2 3 4`{:.language-*} is `2.5`{:.language-*}.

----

Now let's try our hand at writing a hook. The routing of arguments within a monadic hook are slightly different than our mondaic fork. Let's consider this example:

<pre class='language-*'><code class='language-*'>   append_length =: , #
</code></pre>

Here we're defining an `append_length`{:.language-*} verb that first applies ["length"](http://www.jsoftware.com/help/dictionary/d400.htm) (`#`{:.language-*}) to `append_length`{:.language-*}'s argument, and then applies ["append"](http://www.jsoftware.com/help/dictionary/d320.htm) (`,`{:.language-*}) to `append_length`{:.language-*}'s original argument and the result of applying the "length" verb.

<div style="width: 50%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/js-low-level-obfu+scation-leads-to-higher-levels-of-clarity/hook.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">A monadic hook applied to a noun.</p>
</div>

All that is to say that `append_length`{:.language-*} is a hook that calculates that length of the provided argument and appends it to the end of that argument:

<pre class='language-*'><code class='language-*'>   append_length 0
0 1
   append_length append_length 0
0 1 2
</code></pre>

I highly recommend checking out the guide on [forks, hooks, and compound adverbs](http://www.jsoftware.com/help/jforc/forks_hooks_and_compound_adv.htm) for a more complete explaination and overview of all of the hook and fork forms available to you as a J programmer.

{% include newsletter.html %}

## Speaking with Forks

On first exposure, the application rules for hooks and forks struck me as confusing and disorienting. I found myself asking, "why can't they just stick to the right to left evaulation order?" My eyes were opened to the expressive power of forks when I stumbled across this gem of a quote in Jordan Scales' article on [computing the Fibonacci numbers in J](http://thatjdanisso.cool/j-fibonacci/):

> [Forks] help us read out our expressions like sentences. For instance, "the sum times the last" can be written as `+/`{:.language-*} `*`{:.language-*} `{:`{:.language-*}, and our argument is automatically passed to both sides as it needs to be.

Let that sink in. I'll be the first to admit that the argument routing built into J's fork and hook constructs isn't immediately obvious or intuitive, but that low level obfuscation leads to a higher level of clarity. __We can read our forks like english sentences.__

Let's try it out with our `mean`{:.language-*} verb:

<pre class='language-*'><code class='language-*'>   mean =: +/ % #
</code></pre>

Here we're saying that `mean`{:.language-*} ["is"](http://www.jsoftware.com/help/dictionary/d001.htm) (`=:`{:.language-*}) the "sum" (`+/`{:.language-*}) ["divided by"](http://www.jsoftware.com/help/dictionary/d130.htm) (`%`{:.language-*}) the ["tally"](http://www.jsoftware.com/help/dictionary/d400.htm) (`#`{:.language-*}).

We can even apply that idea to more complex J expressions, like this [tacit expression](https://en.wikipedia.org/wiki/Tacit_programming) from Hillel Wayne's article on [hand writing programs in J](https://www.hillelwayne.com/post/handwriting-j/):

<pre class='language-*'><code class='language-*'>   tacit =: (?@:$ #) { ]
</code></pre>

Without context, this expression would have initially overwhelmed me. But armed with our new tools about parsing and reading hooks and forks, let's see if we can tease some meaning out of it.

Let's look at the expression in parentheses first. It's actually a hook of two verbs, `?@:$`{:.language-*} and `#`{:.language-*}. Using a little J-foo, we can recognize the first verb as being "shape of random" (`?@:$`{:.language-*}), and the second verb is "tally" (`#`{:.language-*}) , or "indices" in this context. Put together, the expression in parentheses is a verb that creates a "shape of random indices."

All together, the `tacit`{:.language-*} expression is a fork that reads, `tacit`{:.language-*} ["is"](http://www.jsoftware.com/help/dictionary/d001.htm) (`=:`{:.language-*}) "shape of random indices" (`(?@:$ #)`{:.language-*}) ["from"](http://www.jsoftware.com/help/dictionary/d520.htm) (`{`{:.language-*}) ["the right argument"](http://www.jsoftware.com/help/dictionary/d500.htm) (`]`{:.language-*}).

With arguments, this becomes a little more concrete. We want "a `3 4`{:.language-*} shape of random indices from `'aaab'`{:.language-*}".

<pre class='language-*'><code class='language-*'>   (3 4) tacit 'aaab'
</code></pre>

And that's just what we get:

<pre class='language-*'><code class='language-*'>abaa
aaab
abbb
</code></pre>

Our `tacit`{:.language-*} expressions has constructed a `3 4`{:.language-*} matrix filled with random values from the `'aaab'`{:.language-*} string.

## Hooked on Hooks and Forks

I'm far from being an expert in J. To be honest, I'm not even sure I'd call myself a beginner. The truth is that J is a very hard language to learn. Despite its difficultly (or maybe because of it?), I'm enamored with the language.

That said, I'm not going to go out tomorrow and start writing all of my production projects in J. In fact, I don't imagine ever writing any production code in J. 

J may not give me any concrete tools that I can use in my day-to-day work as a software developer, but it's teaching me new ways of approaching old problems. In a field where constant growth is required and expected, this is an invaluable gift.
