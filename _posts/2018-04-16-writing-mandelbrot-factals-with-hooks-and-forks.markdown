---
layout: post
title:  "Writing Mandelbrot Fractals with Hooks and Forks"
description: "J's hooks and forks allow us to write solutions to problems exactly as we'd express them using the English language. Let's demonstrate by rendering a Mandelbrot fractal!"
author: "Pete Corey"
date:   2018-04-16
tags: ["J", "Programming Languages"]
related: ["/blog/2018/03/19/js-low-level-obfuscation-leads-to-higher-levels-of-clarity/"]
---

We recently saw that through the power of hooks and forks, we could read J expressions just like we'd read an English sentence. But the expressive power of hooks and forks doesn't end there. We can also write J expressions just like we'd speak them!

Let's take a minute to refresh ourselves on how J's hooks and forks work, and then see how we can use them to write some truly grammatical code.

## Forks and Hooks

If you think back to [our last conversation about J](/blog/2018/03/19/js-low-level-obfuscation-leads-to-higher-levels-of-clarity/), you'll remember that we defined the `mean`{:.language-*} verb to be a fork composed of three separate verbs: "sum" (`+/`{:.language-*}), "divided by" (`%`{:.language-*}), and "tally" (`#`{:.language-*}).

All together, these three verbs form a fork that calculates the average of any list passed into it:

<pre class='language-*'><code class='language-*'>   mean =: +/ % #
   mean 1 2 3 4
2.5
</code></pre>

When passed a single argument, the fork will apply that argument to each of the outer verbs monadically (passing them a single argument), and dyadically apply (passing two arguments) those results to the middle verb.

If you squint your eyes enough, this might start looking like a fork.

Similarly, we can create a hook by composing any two verbs together. For example, we can write an `append_mean`{:.language-*} verb that forms a hook out of the ["append"](http://www.jsoftware.com/help/dictionary/d320.htm) (`,`{:.language-*}) verb and our new `mean`{:.language-*} verb:

<pre class='language-*'><code class='language-*'>   append_mean =: , mean
</code></pre>

When passed a single argument, the fork monadically applies that argument to the right-hand verb, and dyadically applies the original argument and the result of the first verb to the left-hand argument.

Unfortunately no amount of squinting will make this look like a real-life hook.

The inner workings of J's hooks and forks may seem a little complicated, but [that low-level obfuscation leads to higher levels of clarity](/blog/2018/03/19/js-low-level-obfuscation-leads-to-higher-levels-of-clarity/). Namely, _we can read our hooks and forks like English sentences!_

## Writing with Hooks and Forks

Not only do hooks and forks allow us to read our J expressions like English sentences, they also let us write our expressions like we'd write English sentences!

Let's consider an example.

Imagine we want to construct the [Mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set) using J. To test whether a complex number belongs to the set, we repeatedly apply an iterative function to it. If the result of that function ever diverges to infinity (or exceeds a magnitude of two), the point does not belong to the set. If the number hasn't diverged after some number of iterations, we can assume that it belongs to the set.

<div style="width: 66%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/writing-mandelbrot-fractals-with-hooks-and-forks/mandelbrot-equation.svg" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">The Mandelbrot set equation.</p>
</div>

In terms of implementing this in J, it sounds like our best bet will be to store the result of each iteration in an array of complex numbers. The first element in the array will be the point under test (skipping `z₀`{:.language-*} for convenience), and the last element will be the result of the last application of our iteration function.
With that in mind, we can write a verb that computes our next iteration, given our list of `z`{:.language-*} values.

<pre class='language-*'><code class='language-*'>   next =: {. + *:@:{:
</code></pre>

This expression is saying that `next`{:.language-*} ["is"](http://www.jsoftware.com/help/dictionary/d001.htm) (`=:`{:.language-*}) the ["first element of the array"](http://www.jsoftware.com/help/dictionary/d521.htm) (`{.`{:.language-*}) ["plus"](http://www.jsoftware.com/help/dictionary/d100.htm) (`+`{:.language-*}) the "square of the last element of the array" (`*:@:{:`{:.language-*}). That last verb combines the ["square"](http://www.jsoftware.com/help/dictionary/d112.htm) (`*:`{:.language-*}) and ["last"](http://www.jsoftware.com/help/dictionary/d522.htm) (`{:`{:.language-*}) verbs together with the ["at"](http://www.jsoftware.com/help/dictionary/d622.htm) (`@:`{:.language-*}) adverb.

You'll notice that `next`{:.language-*} is a fork. The argument application rules follow the structure we discussed above, but we're able to read and write the expression linearly from left to write.

{% include newsletter.html %}

While we're able to compute the next iteration of our Mandelbrot set equation, we still need to append the result back onto our list of `z`{:.language-*} values. In plain English, we want to "append" (`,`{:.language-*}) the "next" (`next`{:.language-*}) value:

<pre class='language-*'><code class='language-*'>   append_next =: , next
</code></pre>

Just like our earlier example, `append_next`{:.language-*} is a hook.

We can repeatedly apply our `append_next`{:.language-*} verb to some initial value:

<pre class='language-*'><code class='language-*'>   append_next append_next append_next 0.2j0.2
0.2j0.2 0.2j0.28 0.1616j0.312 0.128771j0.300838
</code></pre>

Or we can do that more concisely with the ["power"](http://www.jsoftware.com/help/dictionary/d202n.htm) (`^:`{:.language-*}) verb:

<pre class='language-*'><code class='language-*'>   (append_next^:3) 0.2j0.2
0.2j0.2 0.2j0.28 0.1616j0.312 0.128771j0.300838
</code></pre>

Perfect!

## Final Touches

As a final piece of magic to top off this exploration into J, let's apply our `apply_next`{:.language-*} verb repeatedly over a grid of complex numbers:

<pre class='language-*'><code class='language-*'>   axis =: 0.005 * 250 - (i.501)
   grid =: (*&0j1 +/ |.) axis
   mbrot =: (append_next^:40)"0 (grid - 0.6)
</code></pre>

We're left with a three dimensional array of complex numbers in our `mbrot`{:.language-*} noun, representing the values of `z`{:.language-*} resulting from repeatedly applying our `append_next`{:.language-*} function to each point in our grid of complex numbers.

As we mentioned earlier, if any of these values of `z`{:.language-*} exceed a magnitude of `2`{:.language-*}, we can assume they diverge and aren't a part of the Mandelbrot set.

We can compute that divergence test and render the resulting using `viewmat`{:.language-*}:

<pre class='language-*'><code class='language-*'>   viewmat <&2 | ({:"1 mbrot)
</code></pre>

And we're left with a pretty picture of the Mandelbrot set!

<div style="width: 50%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/writing-mandelbrot-fractals-with-hooks-and-forks/mandelbrot.png" style=" width: 100%;"/>
</div>

## Final Thoughts

It's no joke that J can be an intimidating language to work with. I'm still trying to lift myself over the initial learning curve, and some of the expressions written above still take some concentration on my part to grok their meaning (even though I wrote them).

That said, there are some incredibly unique and interesting ideas baked into this language, and I'm getting a lot out of the learning experience.
