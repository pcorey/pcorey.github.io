---
layout: post
title:  "Fly Straight, Dammit!"
description: "Let's use the J programming language to implement and plot an interesting function that was featured on a recent Numberphile video. Memoization and agenda-based conditionals abound!"
author: "Pete Corey"
date:   2019-08-12
tags: ["J", "Numberphile", "Math"]
related: []
image: "/img/2019-08-12-fly-straight-dammit/plot.png"
---

[Numberphile](https://www.numberphile.com/) recently posted a video about [an interesting recursive function](https://www.youtube.com/watch?v=pAMgUB51XZA) called "Fly Straight, Dammit!" which, when plotted, initially seems chaotic, but after six hundred thirty eight iterations, instantly stabilizes. 

This sounds like a perfect opportunity to flex our J muscles and plot this function ourselves!

## An Imperative Solution

The simplest approach to plotting our "Fly Straight, Dammit!" graph using [the J programming language](https://www.jsoftware.com/#/) is to approach things imperatively:

<pre class='language-j'><code class='language-j'>a =: monad define
  if. y < 2 do.
    1
  else.
    py =. a y - 1
    gcd =. y +. py
    if. 1 = gcd do.
      1 + y + py
    else.
      py % gcd
    end.
  end.
)
</code></pre>

We've defined our `a`{:.language-j} monadic verb to return `1`{:.language-j} if we pass in a "base case" value of `0`{:.language-j} or `1`{:.language-j}. Otherwise, we recursively execute `a`{:.language-j} on `y - 1`{:.language-j} to get our `py`{:.language-j}, or "previous `y`{:.language-j}". Next, we check if the `gcd`{:.language-j} of `y`{:.language-j} and `py`{:.language-j} equals `1`{:.language-j}. If it does, we return `1 + y + py`{:.language-j}. Otherwise, we return `py`{:.language-j} divided by `gcd`{:.language-j}.

This kind of solution shouldn't look too foreign to anyone.

Let's plot values of `a`{:.language-j} to verify our solution:

<pre class='language-j'><code class='language-j'>require 'plot'
'type dot' plot a"0 i. 1000
</code></pre>

<div style="width: 66%; margin: 2em auto;">
  <img src="/img/2019-08-12-fly-straight-dammit/plot.png" style=" width: 100%;"/>
</div>

This works, but it's very slow. We know that our recursive calls are doing a lot of duplicated work. If we could memoize the results of our calls to `a`{:.language-j}, we could save quite a bit of time. Thankfully, memoizing a verb in J is as simple as adding `M.`{:.language-j} to the verb's declaration:

<pre class='language-j'><code class='language-j'>a =: monad define M.
  ...
)
</code></pre>

Now our imperative solution is much faster.

## Using Forks and Hooks

While our initial solution works and is fast, it's not taking advantage of what makes J a unique and interesting language. Let's try to change that.

The meat of our solution is computing values in two cases. In the case when `y`{:.language-j} and `py`{:.language-j} have a greatest common divisor equal to `1`{:.language-j}, we're computing `1`{:.language-j} plus `y`{:.language-j} plus `py`{:.language-j}. Our imperative, right to left implementation of this computation looks like this:

<pre class='language-j'><code class='language-j'>1 + y + py
</code></pre>

We could also write this as a ["monadic noun fork"](https://www.jsoftware.com/help/jforc/forks_hooks_and_compound_adv.htm) that basically reads as "`1`{:.language-j} plus the result of `x`{:.language-j} plus `y`{:.language-j}:

<pre class='language-j'><code class='language-j'>a_a =: 1 + +
</code></pre>

Similarly, when we encounter the case where the greatest common divisor between `y`{:.language-j} and `py`{:.language-j} is greater than `1`{:.language-j}, we want to compute `py`{:.language-j} divided by that `gcd`{:.language-j}. This can be written as a ["dyadic fork"](https://www.jsoftware.com/help/jforc/forks_hooks_and_compound_adv.htm):

<pre class='language-j'><code class='language-j'>a_b =: [ % +.
</code></pre>

We can read this fork as "`x`{:.language-j} divided by the greatest common divisor of `x`{:.language-j} and `y`{:.language-j}."

Now that we've written our two computations as tacit verbs, we can use the ["agenda" verb](https://www.jsoftware.com/help/dictionary/d621.htm) (`@.`{:.language-j}) to decide which one to use based on the current situation:

<pre class='language-j'><code class='language-j'>a_a =: 1 + +
a_b =: [ % +.

a =: monad define M.
  if. y < 2 do.
    1
  else.
    py =. a y - 1
    has_gcd =. 1 = y +. py
    py (a_b ` a_a @. has_gcd) y
  end.
)
</code></pre>

If `has_gcd`{:.language-j} is `0`{:.language-j}, or "false", we'll return the result of `py a_b y`{:.language-j}. Otherwise, if `has_gcd`{:.language-j} is `1`{:.language-j}, we'll return the result of `py a_a y`{:.language-j}.

## More Agenda

We can elaborate on the idea of [using agenda to conditionally pick the verb](https://www.jsoftware.com/help/learning/10.htm) we want to apply to help simplify out base case check.

{% include newsletter.html %}

First, let's define our base case and recursive case as verbs that we can combine into a gerund. Our base case is simple. We just want to return `1`{:.language-j}:

<pre class='language-j'><code class='language-j'>base_case =: 1:
</code></pre>

Our recursive case is just the (memoized) `else`{:.language-j} block from our previous example:

<pre class='language-j'><code class='language-j'>recursive_case =: monad define M.
  py =. a y - 1
  has_gcd =. 1 = y +. py
  py (a_b ` a_a @. has_gcd) y
)
</code></pre>

Our function, `a`{:.language-j} wants to conditionally apply either `base_case`{:.language-j} or `recursive_case`{:.language-j}, depending on whether `y`{:.language-j} is greater or less than one. We can write that using agenda like so:

<pre class='language-j'><code class='language-j'>a =: base_case ` recursive_case @. (1&<)
</code></pre>

And because our `base_case`{:.language-j} verb is so simple, we can just inline it to clean things up:

<pre class='language-j'><code class='language-j'>a_a =: 1 + +
a_b =: [ % +.

recursive_case =: monad define M.
  py =. a y - 1
  has_gcd =. 1 = y +. py
  py (a_b ` a_a @. has_gcd) y
)

a =: 1: ` recursive_case @. (1&<)
</code></pre>

Using agenda to build conditionals and pseudo-"case statements" can be a powerful tool for incorporating conditionals into J programs.

## Going Further

It's conceivable that you might want to implement a tacit version of our `recursive_case`{:.language-j}. Unfortunately, my J-fu isn't strong enough to tackle that and come up with a sane solution.

That said, Raul Miller came up with a one-line solution (on his phone) and [posted it on Twitter](https://twitter.com/raudelmil/status/1159575084757135361). Raul's J-fu is strong.

<div style="width: 66%; margin: 2em auto;">
  <img src="/img/2019-08-12-fly-straight-dammit/tweet.png" style=" width: 100%;"/>
</div>


