---
layout: post
title:  "The Collatz Sequence in J"
excerpt: "Let's use the J programming langauge to implement the Collatz sequence! Ties and agenda abound."
author: "Pete Corey"
date:   2019-11-06
tags: ["J", "Coding Train"]
related: []
image: "/img/2019-11-06-the-collatz-sequence-in-j/plot.png"
---

I've been playing around quite a bit with the [Collatz Conjecture](https://en.wikipedia.org/wiki/Collatz_conjecture) after watching [the latest Coding Train video](https://www.youtube.com/watch?v=EYLWxwo1Ed8) on the subject. In an effort to keep my J muscles from atrophying, I decided to use [the language](https://www.jsoftware.com/#/) to implement a Collatz sequence generator.

At its heart, the Collatz sequence is a conditional expression. If the current number is even, the next number in the sequence is the current number divided by two. If the current number is odd, the next number in the sequence is one plus the current number multiplied by three:

<div style="max-width: 300px; margin: 2em auto;">
  <img src="/img/2019-11-06-the-collatz-sequence-in-j/formula.svg" style=" width: 100%;"/>
</div>

We can write each of these branches with some straight-forward J code. Our even case is simply the divide ([`%`{:.language-j}](https://www.jsoftware.com/help/dictionary/d130.htm)) verb bonded ([`&`{:.language-j}](https://www.jsoftware.com/help/dictionary/d630n.htm)) to `2`{:.language-j}:

<pre class='language-j'><code class='language-j'>
   even =: %&2
</code></pre>

And our odd case is a ["monadic noun fork"](https://www.jsoftware.com/help/jforc/forks_hooks_and_compound_adv.htm) of `1`{:.language-j} plus ([`+`{:.language-j}](https://www.jsoftware.com/help/dictionary/d100.htm)) `3`{:.language-j} bonded ([`&`{:.language-j}](https://www.jsoftware.com/help/dictionary/d630n.htm)) to multiply ([`*`{:.language-j}](https://www.jsoftware.com/help/dictionary/d110.htm)):

<pre class='language-j'><code class='language-j'>
   odd =: 1 + 3&*
</code></pre>

We can tie together ([`` ` ``](https://www.jsoftware.com/help/dictionary/d610.htm)) those two verbs and use agenda ([`@.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d621.htm)) to pick which one to call based on whether the argument is even:

<pre class='language-j'><code class='language-j'>
   next =: even`odd@.pick
</code></pre>

Our `pick`{:.language-j} verb is testing for even numbers by checking if [`1:`{:.language-j}](https://www.jsoftware.com/help/dictionary/dconsf.htm) equals ([`=`{:.language-j}](https://www.jsoftware.com/help/dictionary/d000.htm)) `2`{:.language-j} bonded to the residue verb ([`|`{:.language-j}](https://www.jsoftware.com/help/dictionary/d230.htm)).

<pre class='language-j'><code class='language-j'>
   pick =: 1:=2&|
</code></pre>

We can test our `next`{:.language-j} verb by running it against numbers with known next values. After `3`{:.language-j}, we'd expect `10`{:.language-j}, and after `10`{:.language-j}, we'd expect `5`{:.language-j}:

<pre class='language-j'><code class='language-j'>
   next 3
10
   next 10
5
</code></pre>

Fantastic!

J has an amazing verb, power ([`^:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d202n.htm)), that can be used to find the "limit" of a provided verb by continuously reapplying that verb to its result until a repeated result is encountered. If we pass power boxed infinity (`<_`{:.language-j}) as an argument, it'll build up a list of all the intermediate results.

This is exactly what we want. To construct our Collatz sequence, we'll find the limit of `next`{:.language-j} for a given input, like `12`{:.language-j}:

<pre class='language-j'><code class='language-j'>
   next^:(<_) 12
</code></pre>

__But wait, there's a problem!__ A loop exists in the Collatz sequences between `4`{:.language-j}, `2`{:.language-j}, and `1`{:.language-j}. When we call `next`{:.language-j} on `1`{:.language-j}, we'll receive `4`{:.language-j}. Calling `next`{:.language-j} on `4`{:.language-j} returns `2`{:.language-j}, and calling `next`{:.language-j} on `2`{:.language-j} returns `1`{:.language-j}. Our `next`{:.language-j} verb never converges to a single value.

To get over this hurdle, we'll write one last verb, `collatz`{:.language-j}, that checks if the argument is `1`{:.language-j} before applying `next`{:.language-j}:

<pre class='language-j'><code class='language-j'>
   collatz =: next`]@.(1&=)
</code></pre>

Armed with this new, converging `collatz`{:.language-j} verb, we can try finding our limit again:

<pre class='language-j'><code class='language-j'>
   collatz^:(<_) 12
12 6 3 10 5 16 8 4 2 1
</code></pre>

Success! We've successfully implemented a Collatz sequence generator using the J programming langauge. Just for fun, let's plot the sequence starting with `1000`{:.language-j}:

<pre class='language-j'><code class='language-j'>
   require 'plot'
   plot collatz^:(<_) 1000
</code></pre>

<div style="max-width: 592px; margin: 2em auto;">
  <img src="/img/2019-11-06-the-collatz-sequence-in-j/plot.png" style=" width: 100%;"/>
</div>
