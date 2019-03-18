---
layout: post
title:  "A Better Mandelbrot Iterator in J"
description: "There are times you come back to a problem and realize that a much simpler solution exists. This is one of those times."
author: "Pete Corey"
date:   2019-03-18
tags: ["J", "Programming Languages", "Fractals"]
related: ["/blog/2018/04/16/writing-mandelbrot-factals-with-hooks-and-forks/"]
---

Nearly a year ago I wrote about [using the J programming language to write a Mandelbrot fractal renderer](/blog/2018/04/16/writing-mandelbrot-factals-with-hooks-and-forks/). I proudly exclaimed that J could be used to "write out expressions like we'd write English sentences," and immediately proceeded to write a nonsensical, overcomplicated solution.

My final solution bit off more than it needed to chew. The `next`{:.language-j} verb we wrote both calculated the next value of iterating on the Mandelbrot formula and also managed appending that value to a list of previously calculated values.

I nonchalantly explained:

> This expression is saying that `next`{:.language-j} "is" (`=:`{:.language-j}) the "first element of the array" (`{.`{:.language-j}) "plus" (`+`{:.language-j}) the "square of the last element of the array" (`*:@:{:`{:.language-j}). That last verb combines the "square" (`*:`{:.language-j}) and "last" (`{:`{:.language-j}) verbs together with the "at" (`@:`{:.language-j}) adverb.

Flows off the tongue, right?

My time spent [using J to solve last year's Advent of Code challenges](/blog/tags/#advent-of-code-2018) has shown me that a much simpler solution exists, and it can flow out of you in a fluent way if you just stop fighting the language and relax a little.

---- 

Let's refresh ourselves on [Mandelbrot fractals](https://en.wikipedia.org/wiki/Mandelbrot_set) before we dive in. The heart of the Mandelbrot fractal is this iterative equation:

<div style="width: 66%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/writing-mandelbrot-fractals-with-hooks-and-forks/mandelbrot-equation.svg" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">The Mandelbrot set equation.</p>
</div>

In English, the next value of `z`{:.language-j} is some constant, `c`{:.language-j}, plus the square of our previous value of `z`{:.language-j}. To render a picture of the Mandelbrot fractal, we map some section of the complex plane onto the screen, so that every pixel maps to some value of `c`{:.language-j}. We iterate on this equation until we decide that the values being calculated either remain small, or diverge to infinity. Every value of `c`{:.language-j} that doesn't diverge is part of the Mandelbrot set.

But let's back up. We just said that "the next value of `z`{:.language-j} is some constant, `c`{:.language-j}, plus the square of our previous value of `z`{:.language-j}".

We can write that in J:

<pre class='language-j'><code class='language-j'>   +*:
</code></pre>

And we can plug in example values for `c`{:.language-j} (`0.2j0.2`{:.language-j}) and `z`{:.language-j} (`0`{:.language-j}):

<pre class='language-j'><code class='language-j'>   0.2j0.2 (+*:) 0
0.2j0.2
</code></pre>

Our next value of `z`{:.language-j} is `c`{:.language-j} (`0.2j0.2`{:.language-j}) plus (`+`{:.language-j}) the square (`*:`{:.language-j}) of our previous value of `z`{:.language-j} (`0`{:.language-j}). Easy!

---- 

My previous solution built up an array of our iterated values of `z`{:.language-j} by manually pulling `c`{:.language-j} and previously iterated values off of the array and pushing new values onto the end. Is there a better way?

Absolutely. If I had read the documentation on [the "power" verb](http://www.jsoftware.com/help/dictionary/d202n.htm) (`^:`{:.language-j}), I would have noticed that ["boxing"](http://www.jsoftware.com/help/dictionary/d010.htm) (`<`{:.language-j}) the number of times we want to apply our verb will return an array filled with the results of every intermediate application.

Put simply, we can repeatedly apply our iterator like so:

<pre class='language-j'><code class='language-j'>   0.2j0.2 (+*:)^:(<5) 0
0 0.2j0.2 0.2j0.28 0.1616j0.312 0.128771j0.300838
</code></pre>

---- 

Lastly, it's conceivable that we might want to switch the order of our inputs. Currently, our value for `c`{:.language-j} is on the left and our initial value of `z`{:.language-j} is on the right. If we're applying this verb to an array of `c`{:.language-j} values, we'd probably want `c`{:.language-j} to be the right-hand argument and our initial `z`{:.language-j} value to be a bound left-hand argument.

That's a simple fix thanks to [the "passive" verb](http://www.jsoftware.com/help/dictionary/d220v.htm) (`~`{:.language-j}):

<pre class='language-j'><code class='language-j'>   0 (+*:)^:(<5)~ 0.2j0.2
0 0.2j0.2 0.2j0.28 0.1616j0.312 0.128771j0.300838
</code></pre>

We can even plot our iterations to make sure that everything looks as we'd expect.

<div style="margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/a-better-mandelbrot-iterator-in-j/plot.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our plotted iteration for a C value of 0.2 + 0.2i.</p>
</div>

---- 

I'm not going to lie and claim that J is an elegantly ergonomic language. In truth, it's a weird one. But as I use J more and more, I'm finding that it has a certain charm. I'll often be implementing some tedious solution for a problem in Javascript or Elixir and find myself fantasizing about how easily I could write an equivalent solution in J.

That said, I definitely haven't found a shortcut for learning the language. Tricks like ["reading and writing J like English"](/blog/2018/03/19/js-low-level-obfuscation-leads-to-higher-levels-of-clarity/) only really work at a hand-wavingly superficial level. I've found that learning J really just takes time, and as I spend more time with the language, I can feel myself "settling into it" and its unique ways of looking at computation.

If you're interested in learning J, [check out my previous articles on the subject](/blog/tags/#j) and be sure to visit [the JSoftware home page](http://jsoftware.com/) for books, guides, and documentation.
