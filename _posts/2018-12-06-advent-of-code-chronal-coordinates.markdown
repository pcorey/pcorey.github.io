---
layout: post
title:  "Advent of Code: Chronal Coordinates"
description: "Day six of 2018's Advent of Code challenge. Let's use J to build a Manhattan distance-based Voronoi diagram!"
author: "Pete Corey"
date:   2018-12-06
tags: ["J", "Advent of Code 2018"]
related: []
image: "https://s3-us-west-1.amazonaws.com/www.east5th.co/img/advent-of-code-chronal-coordinates/Screen+Shot+2018-12-06+at+7.53.45+PM.png"
---

Today's [Advent of Code challenge](https://adventofcode.com/2018/day/6) asked us to plot a [Manhattan distance](https://en.wikipedia.org/wiki/Taxicab_geometry) [Voronoi diagram](https://en.wikipedia.org/wiki/Voronoi_diagram) of a collection of points, and to find the area of the largest, but finite, cell within our diagram.

I'll be honest. This was a difficult problem for me to solve with my current level of [J-fu](http://www.jsoftware.com/).

My high level plan of attack was to build up a "distance matrix" for each of the points in our diagram. The location of a point would have a value of `0`{:.language-j}, neighbors would have a value of `1`{:.language-j}, and so on. In theory, I'd be able to write a verb that combines two matrices and returns a new matrix, with tied distances represented as `_1`{:.language-j}. I could insert (`/`{:.language-j}) this verb between each of my matrices, reducing them down to a final matrix representing our Voronoi diagram.

I wrote some quick helper verbs to find the distance between two points:

<pre class='language-j'><code class='language-j'>    d =. [: +/ |@-
</code></pre>

Find the width and height of the bounding rectangle of my input:

<pre class='language-j'><code class='language-j'>    wh =. 1 + >./ - <./
</code></pre>

Generate the set of coordinates for my matrices (this one took some serious trial and error):

<pre class='language-j'><code class='language-j'>    coords =. 3 : 0
      'w h' =. (1 + >./ - <./) y
      (<./y) +"1  (i. h) ,"0~ ((h,w) $ i. w)
    )
</code></pre>

And to fill that matrix with the distances to a given point:

<pre class='language-j'><code class='language-j'>    grid =. 4 : 0
      (x d ])"1 coords > y
    )
</code></pre>

The process of adding together two matrices was more complicated. I went through many horribly broken iterations of this process, but I finally landed on this code:

<pre class='language-j'><code class='language-j'>    compare =. 4 : 0
      'vx ix' =. x
      'vy iy' =. y
      vx = vy
    )

    tie =. 4 : 0
      (0 {:: x);_1
    )

    pick =. 4 : 0
      'vx ix' =. x
      'vy iy' =. y
      v =. vx ((y"_) ` (x"_) @. <) vy
    )

    add =. 4 : 0
      x (pick ` tie @. compare) y
    )
</code></pre>

With that, I could compute my final grid:

<pre class='language-j'><code class='language-j'>    numbers =. ". input
    grids =. ([ ;"0 i.@#) numbers grid"1 <numbers
    sum =. add"1/ grids
</code></pre>

Our `sum`{:.language-j} keeps track of closest input point at each position on our grid, and also the actual distance value to that point. The closest input point is what we're trying to count, so it's probably the more interesting of the two values:

<pre class='language-j'><code class='language-j'>    groups =. (1&{::)"1 sum
 0  0  0 0 _1 2 2  2
 0  0  3 3  4 2 2  2
 0  3  3 3  4 2 2  2
_1  3  3 3  4 4 2  2
 1 _1  3 4  4 4 4  2
 1  1 _1 4  4 4 4 _1
 1  1 _1 4  4 4 5  5
 1  1 _1 4  4 5 5  5
 1  1 _1 5  5 5 5  5
</code></pre>

We could even render the grid using J's `viewmat`{:.language-j} utility. Awesome!

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/advent-of-code-chronal-coordinates/Screen+Shot+2018-12-06+at+7.53.45+PM.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our sample inputs, visualized with viewmat.</p>
</div>

Using `viewmat`{:.language-j} to visualize my matricies like this actually helped my find and fix a bug in my solution _incredibly quickly_. I'm a big fan and plan on using it more in the future.

Because of how Manhattan distance works, cells with infinite volume are the cells that live on the border of our final matrix.

To find those infinite groups that live along the edges of my final matrix, I appended the edge of each edge of my matrix together and returned the nub of those values. I found the idea for this matrix rotation helper from [this video on J I watched many months ago](https://www.youtube.com/watch?v=dBC5vnwf6Zw). I'm glad I remembered it!

<pre class='language-j'><code class='language-j'>    rot =. [: |. |:

    edges =. 3 : 0
      top =. 0 { y
      right =. 0 { rot^:1 y
      bottom =. 0 { rot^:2 y
      left =. 0 { rot^:3 y
      ~. top , right , bottom , left
    )
</code></pre>

To find my final answer, I raveled my matrix, removed the infinite groups, used the "key" (`/.`{:.language-j}) adverb to count the size of each group, and returned the size of the largest group.

<pre class='language-j'><code class='language-j'>    without =. _1 , edges groups
    raveled =. ,groups
    0 0 {:: \:~ ({. ;~ #)/.~ raveled #~ -. raveled e. without
</code></pre>

This definitely isn't the most efficient solution, but it works. At this point, I'm happy with that.

## Part Two

Part two turned out to be much easier than part one. We simply needed to iterate over each point in our grid, counting the total distance to each of our input points. The set of points that was less than a fixed number from all input points defined a circular "landing area". We were asked to find the size of that area.

I gutted most of my part one solution and replaced the values returned by my `grid`{:.language-j} verb with the total distance to each input point:

<pre class='language-j'><code class='language-j'>    distances =. 4 : 0
      +/ ((>x) d"1~ ])"1 y
    )

    grid =. 3 : 0
      (<y) distances"1 coords y
    )
</code></pre>

Finding my final answer was as easy as calculating my grid, checking which points were less than `10000`{:.language-j}, removing all of the `0`{:.language-j} values, and counting the result.

<pre class='language-j'><code class='language-j'>    numbers =. ". input
    # #~ , 10000 > grid numbers
</code></pre>

## Notes
- Rotating a matrix (`|. |:`{:.language-j}) is a great trick.
- `viewmat`{:.language-j} is awesome. It _very quickly_ helped me find and fix a bug in my solution.
- Boxes can be treated like arrays in most cases. I was under the wrong impression that a box was a single unit in terms of rank.
