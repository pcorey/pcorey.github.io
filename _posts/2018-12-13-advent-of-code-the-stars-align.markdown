---
layout: post
title:  "Advent of Code: The Stars Align"
description: "Day ten of 2018's Advent of Code challenge. Converging on hidden messages using the J programming language."
author: "Pete Corey"
date:   2018-12-13
tags: ["J", "Advent of Code 2018"]
related: []
image: "https://s3-us-west-1.amazonaws.com/www.east5th.co/img/advent-of-code-the-stars-align/the-stars-align.png"
---

The [day ten Advent of Code challenge](https://adventofcode.com/2018/day/10) gives us a list of points and velocity pairs. Each point is updated by its corresponding velocity every second. At some point in time, these points will converge and spell out a message. Our task is to find that message using [the J programming language](http://jsoftware.com/)!

As usual, we'll start by loading our input and massaging it into a form we can work with:

<pre class='language-j'><code class='language-j'>    replacements =. 'position=<';'';',';'';'> velocity=<';' ';'>';'';'-';'_'
    path =.  '/Users/pcorey/advent_of_code_2018/day_10/input'
    input =. ". > cutopen replacements rplc~ (1!:1) < path
</code></pre>

I'm using a trick [I learned from `zxw`{:.language-j} on Twitter](https://twitter.com/zxw/status/1069684484499496961) to easily replace and reformat the data before passing it into the "numbers" verb (`".`{:.language-j}).

Next let's write a `tick`{:.language-j} verb that updates each point with its corresponding velocity. We'll also keep track of the maximum spread between Y coordinate values and return that as the second value in a boxed tuple along with our next set of points and velocities:

<pre class='language-j'><code class='language-j'>    tick =. 3 : 0
      input =. 0 {:: y
      prev =. 1 {:: y
      next =. +/"1 |:"2 (2 2 $ ])"1 input
      max =. >./ 1 {"1 next
      min =. <./ 1 {"1 next
      diff =. | max - min
      if. diff < prev do.
        (next (0 1})"1 input);diff
      else.
        y
      end.
    )
</code></pre>

Notice that if applying the next `tick`{:.language-j} results in a lower spread, we return the new values. Otherwise, we return the old values. This means we can "converge" (`^:_`{:.language-j}) on a result for this verb. The result we converge on will be the set of points with the lowest spread in the vertical dimension.

It turns out that this is our answer!

We can use J's `viewmat`{:.language-j} library to quickly visualize our answer (after some more rotating and massaging):

<pre class='language-j'><code class='language-j'>    load 'viewmat'

    to_mat =. 3 : 0
      min_x =. <./ 0 {"1 y
      min_y =. <./ 1 {"1 y
      max_x =. >./ 0 {"1 y
      max_y =. >./ 1 {"1 y
      coords =. 0 1 {"1 y
      coords =. (min_x,min_y) -~"1 coords
      mat =. ((1 + | max_y - min_y),(1 + | max_x - min_x)) $ 0
      updates =. (<@:;/@:|.)"1 coords
      1 updates} mat
    )

    viewmat to_mat 0 {:: tick^:_ input;_
</code></pre>

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/advent-of-code-the-stars-align/the-stars-align.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">The stars align.</p>
</div>

## Part Two

Part two turned out to be a simple modification of our part one solution. The challenge asked us to return how many ticks we went through before we found our message.

All we need to do to figure this out is to add a third element to the tuple we pass in and out of `tick`{:.language-j} that holds an incrementing count:

<pre class='language-j'><code class='language-j'>    tick =. 3 : 0
      input =. 0 {:: y
      prev =. 1 {:: y
      count =. 2 {:: y
      next =. +/"1 |:"2 (2 2 $ ])"1 input
      max =. >./ 1 {"1 next
      min =. <./ 1 {"1 next
      diff =. | max - min
      if. diff < prev do.
        (next (0 1})"1 input);diff;(count + 1)
      else.
        y
      end.
    )

    2 {:: tick^:_ input;_;0
</code></pre>

The answer to our challenge is the value of this final count.
