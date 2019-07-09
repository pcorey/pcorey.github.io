---
layout: post
title:  "The Many Ways to Define Verbs in J"
description: "Let's explore the various ways of defining verbs in the J programming language while implementing Euler's Gradus Suavitatis function."
author: "Pete Corey"
date:   2019-07-09
tags: ["J"]
related: []
image: "/img/2019-07-09-the-many-ways-to-define-verbs-in-j/plot.png"
---

I recently watched [an interesting 12tone video on the "Euler Gradus Suavitatis"](https://www.youtube.com/watch?v=B6Dvfv_ASVg) which is a formula devised by Leonhard Euler to analytically compute the consonance, or translated literally, the "degree of pleasure" of a given musical interval.

<div style="width: 50%; margin: 2em auto;">
  <img src="/img/2019-07-09-the-many-ways-to-define-verbs-in-j/gradus.svg" style=" width: 100%;"/>
</div>

In this formula, `n`{:.language-j} can be any positive integer who's prime factorization is notated as:

<div style="width: 25%; margin: 2em auto;">
  <img src="/img/2019-07-09-the-many-ways-to-define-verbs-in-j/factors.svg" style=" width: 100%;"/>
</div>

In reality, `n`{:.language-j} can be any ratio of two or more positive integers. Simple intervalic ratios, like an octave, are represented as `1:2`{:.language-j}, where `n`{:.language-j} would be `2`{:.language-j}. For more complicated intervals, like a perfect fifth (`3:2`{:.language-j}), we need to find the least common multiple of both components (`6`{:.language-j}) before passing it into our Gradus Suavitatis function. We can even do the same for entire chords, like a major triad (`4:5:6`{:.language-j}), who's least common multiple would be `60`{:.language-j}.

## The Gradus Suavitatis in J

Intrigued, I decided to implement a version of the Gradus Suavitatis function using the J programming language.

Let's start by representing our interval as a list of integers. Here we'll start with a major triad:

<pre class='language-j'><code class='language-j'>   4 5 6
4 5 6
</code></pre>

Next, we'll find the least common multiple of our input:

<pre class='language-j'><code class='language-j'>   *./ 4 5 6
60
</code></pre>

From there, we want to find the prime factors of our least common multiple:

<pre class='language-j'><code class='language-j'>   q: *./ 4 5 6
2 2 3 5
</code></pre>

Since our primes are duplicated in our factorization, we can assume that their exponent is always `1`{:.language-j}. So we'll subtract one from each prime, and multiply by one (which is a no-op):

<pre class='language-j'><code class='language-j'>   _1&+ q: *./ 4 5 6
1 1 2 4
</code></pre>

Or even better:

<pre class='language-j'><code class='language-j'>   <: q: *./ 4 5 6
1 1 2 4
</code></pre>

Finally, we sum the result and add one:

<pre class='language-j'><code class='language-j'>   1 + +/ <: q: *./ 4 5 6
9
</code></pre>

And we get a Gradus Suavitatis, or "degree of pleasure" of `9`{:.language-j} for our major triad. Interestingly, a minor triad (`10:12:15`{:.language-j}) gives us the same value:

<pre class='language-j'><code class='language-j'>   1 + +/ <: q: *./ 10 12 15
9
</code></pre>

## Gradus Suavitatis as a Verb

To make playing with our new Gradus Suavitatis function easier, we should wrap it up into a verb.

One way of building a verb in J is to use the `3 : 0`{:.language-j} or `verb define`{:.language-j} construct, which lets us write a multi-line verb that accepts `y`{:.language-j} and optionally `x`{:.language-j} as arguments. We could write our Gradus Suavitatis using `verb define`{:.language-j}:

<pre class='language-j'><code class='language-j'>   egs =. verb define
   1 + +/ <: q: *./ y
   )
</code></pre>

While this is all well and good, I wasn't happy that we needed three lines to represent our simple function as a verb.

Another option is to use [caps (`[:`{:.language-j})](https://www.jsoftware.com/help/dictionary/d502.htm) to construct a verb train that effectively does the same thing as our simple chained computation:

<pre class='language-j'><code class='language-j'>   egs =. [: 1&+ [: +/ [: <: [: q: *./
   egs 4 5 6
9
</code></pre>

However the use of so many caps makes this solution feel like we're using the wrong tool for the job.

[Raul on Twitter showed me the light](https://twitter.com/raudelmil/status/1144665724993986560) and made me aware of the single-line verb definition syntax, which I somehow managed to skip over while reading the [J Primer](https://www.jsoftware.com/help/primer/monad_dyad_def.htm) and [J for C Programmers](https://www.jsoftware.com/help/jforc/preliminaries.htm#_Toc191734306). Using the `verb def`{:.language-j} construct, we can write our `egs`{:.language-j} verb on a single line using our simple right to left calculation structure:

<pre class='language-j'><code class='language-j'>   egs =. verb def '1 + +/ <: q: *./ y'
   egs 4 5 6
9
</code></pre>

It turns out that [there's over two dozen forms of "entity" construction](https://code.jsoftware.com/wiki/Vocabulary/cor) in the J language. I wish I'd known about these sooner.

Regardless of how we define our verb, the Gradus Suavitatis is an interesting function to play with. Using the `plot`{:.language-j} utility, we can plot the "degree of pleasure" of each of the interval ratios from `1:1`{:.language-j} to `1:100`{:.language-j} and beyond:

<div style="width: 70%; margin: 2em auto;">
  <img src="/img/2019-07-09-the-many-ways-to-define-verbs-in-j/plot.png" style=" width: 100%;"/>
</div>
