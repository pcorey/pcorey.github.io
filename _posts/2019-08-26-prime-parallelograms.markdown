---
layout: post
title:  "Prime Parallelograms"
excerpt: "In this follow-up to our previous post on plotting a number series from a Numberphile video, we use J to plot an interesting series involving primes, base two representations, and parallelograms."
author: "Pete Corey"
date:   2019-08-26
tags: ["J", "Numberphile", "Math"]
related: ["/blog/2019/08/12/fly-straight-dammit/"]
image: "/img/2019-08-26-prime-parallelograms/plot.png"
---

A few weeks ago I wrote about an interesting graph of numbers recently investigated by the [Numberphile](https://www.numberphile.com/) crew. We used it as an opportunity to [journey into the world of agendas and gerunds by implementing the graph using the J programming language](/blog/2019/08/12/fly-straight-dammit/).

The second half of that same video [outlines another interesting number series](https://www.youtube.com/watch?v=pAMgUB51XZA&feature=youtu.be&t=471) which has a similarly interesting implementing in [J](https://www.jsoftware.com/). Let's try our hand at plotting it.

---- 

The basic idea behind calculating the series of numbers in question is to take any positive prime, represent it in base two, reverse the resulting sequence of bits, and subtract the reversed number from the original number in terms of base ten.

Implemented as a tacit, monadic verb in J, this would look something like:

<pre class='language-j'><code class='language-j'>
f =: ] - [: #. [: |. #:
</code></pre>

Our verb, `f`{:.language-j}, is ([`=:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d001.htm)) the given number ([`]`{:.language-j}](https://www.jsoftware.com/help/dictionary/d500.htm)) minus ([`-`{:.language-j}](https://www.jsoftware.com/help/dictionary/d120.htm)) the base two ([`#.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d401.htm)) of the reverse ([`|.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d231.htm)) of the antibase two ([`#:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d402.htm)) of the given number.

We can plot the result of applying `f`{:.language-j} to the first ten thousand primes (`p: i. 10000`{:.language-j}) like so:

<pre class='language-j'><code class='language-j'>
require 'plot'
'type dot' plot f"0 p: i. 10000
</code></pre>

If we're feeling especially terse, we could write this as an almost-one-liner by substituting `f`{:.language-j} for our implementation of `f`{:.language-j}:

<pre class='language-j'><code class='language-j'>
require 'plot'
'type dot' plot (] - [: #. [: |. #:)"0 p: i. 10000
</code></pre>

<div style="width: 75%; margin: 2em auto;">
  <img src="/img/2019-08-26-prime-parallelograms/plot.png" style=" width: 100%;"/>
</div>

---- 

Our implementation of `f`{:.language-j} is a ["train of verbs"](https://www.jsoftware.com/help/learning/09.htm), which is to say, a collection of verbs that compose together into [hooks and forks](https://www.jsoftware.com/help/jforc/forks_hooks_and_compound_adv.htm). We can visualize this composition by looking at the "boxed" representation of our train:

<pre class='language-j'><code class='language-j'>
┌─┬─┬──────────────────┐
│]│-│┌──┬──┬──────────┐│
│ │ ││[:│#.│┌──┬──┬──┐││
│ │ ││  │  ││[:│|.│#:│││
│ │ ││  │  │└──┴──┴──┘││
│ │ │└──┴──┴──────────┘│
└─┴─┴──────────────────┘
</code></pre>

From right to left, J greedily groups verbs into three verb forks potentially followed by a final two verb hook if the total number of verbs in the train is even.

We can see that the first fork, `[: |. #:`{:.language-j}, is a capped fork, which means it's roughly equivalent to `|. @: #:`{:.language-j}. In the monadic case, this fork takes its argument, converts it to a base two list of ones and zeroes, and reverses that list. Let's refer to this newly composed verb as `a`{:.language-j} moving forward.

The next fork in our train, `[: #. a`{:.language-j}, is another capped fork building off of our previous fork. Again, this could be expressed using the [`@:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d622.htm) verb to compose `#.`{:.language-j} and `a`{:.language-j} together: `#. @: a`{:.language-j}. In the monadic case, this fork takes its argument, converts it to a reversed binary representation with `a`{:.language-j}, and then converts that reversed list of ones and zero back to base ten with `#.`{:.language-j}. Let's call this newly composed verb `b`{:.language-j}.

Our final fork, `] - b`{:.language-j}, runs our monadic input through `b`{:.language-j} to get the base ten representation of our reversed binary, and subtracts it from the original argument.

---- 

If we wanted to make J's implicit verb training explicit, we could define `a`{:.language-j}, `b`{:.language-j}, and our final `f`{:.language-j} ourselves:

<pre class='language-j'><code class='language-j'>
a =: [: |. #:
b =: [: #. a
f =: ] - b
</code></pre>

But why go through all that trouble? Going the explicit route feels like a natural tendency to me, coming from a background of more traditional programming languages, but [J's implicit composition opens up a world of interesting readability properties](/blog/2018/03/19/js-low-level-obfuscation-leads-to-higher-levels-of-clarity/).

I'm really fascinated by this kind of composition, and I feel like it's what makes J really unique. I'll never pass up an opportunity to try implementing something as a train of verbs.
