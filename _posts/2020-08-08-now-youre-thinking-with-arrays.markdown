---
layout: post
title:  "Now You're Thinking with Arrays"
excerpt: ""
author: "Pete Corey"
date:   2020-08-08
tags: ["J", "Math"]
related: []
---

I've been using [the J programming language](https://www.jsoftware.com/) on and off (mostly off), for the past couple years, and I still find myself failing to grasp the "array-oriented" approach.

Recently I wanted to find the [discrete derivative](https://calculus.subwiki.org/wiki/Discrete_derivative), or the [forward difference](https://en.wikipedia.org/wiki/Finite_difference#Types) of a list of integers. This boils down to finding differences, or deltas, between each successive pair of list elements. So, for a list of integers, `1 2 4 7 11`{:.language-j}, the list of deltas would be `1 2 3 4`{:.language-j}.

My first stab at building a verb that does this looked like this:

<pre class='language-j'><code class='language-j'>
   (-/"1@:}.@:(],._1&|.)) 1 2 4 7 11
1 2 3 4
</code></pre>

The idea is that we take our list, rotate it once to the left, and stitch it onto itself. This gives us a list of tuples of each pair of subsequent numbers, except for the first tuple which holds our first and last list values. We drop that tuple and map minus over the remaining pairs.

This solution seems overly verbose and complicated for something as seemingly fundamental as calculating differences between subsequent list values.

[I asked for help on #JLang Twitter](https://twitter.com/petecorey/status/1289695289364733953), and [learned](https://twitter.com/digitalbeard/status/1289700859811520512) about the ["cut"](https://www.jsoftware.com/help/dictionary/d331.htm) verb, specifically the `:._3`{:.language-j} form of cut, which executes a verb over subarrays, or "regular tilings" of its input. Armed with this knowledge, we can map minus over all length two tilings of our list:

<pre class='language-j'><code class='language-j'>
   2(-~/;._3) 1 2 4 7 11
1 2 3 4
</code></pre>

Very nice!

I was happy with this solution, but #JLang Twitter pried my mind open even further and made me realize that I still haven't fully grasped what it means to work in an "array oriented" mindset.

[It was explained to me](https://twitter.com/FireyFly/status/1289968898008166401) that I should work with the entire array as a unit, rather than operate on each over the elements individually. What I'm really after is the "beheaded" ([`}.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d531.htm)) array minus the "curtailed" ([`}:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d532.htm)) array.

<pre class='language-j'><code class='language-j'>
   (}. - }:) 1 2 4 7 11
1 2 3 4
</code></pre>

This is the shortest, clearest, and, in hindsight, most obvious solution. It's clear to me that I still need to work on getting into the "array-oriented" mindset when working with J, but hopefully with enough exposure to solutions liks this, I'll get there.

Now we're thinking with arrays!
