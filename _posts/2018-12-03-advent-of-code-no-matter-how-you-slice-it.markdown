---
layout: post
title:  "Advent of Code: No Matter How You Slice It"
excerpt: "Day three of 2018's Advent of Code challenge. Let's use J matricies to model rectangular intersections."
author: "Pete Corey"
date:   2018-12-03
tags: ["J", "Advent of Code 2018"]
related: []
---

Today's [Advent of Code](https://adventofcode.com/2018/day/3) challenge wants us to model many rectangular intersections. Given a large number of rectangles laid out on a grid, we're asked to find the total number of square inches of overlap between all of these rectangles.

Using [J](http://jsoftware.com/) to parse the input for this challenge string turned out to be incredibly difficult. Frustratingly difficult. It seems there's no nice, easy, built-in way to do this kind of string processing in J. At least none that I could find.

I could have used [this example from the Strings phrase page](https://code.jsoftware.com/wiki/Phrases/Strings#Slicing_with_Regex), but I didn't want to pull in a helper function I didn't fully understand, and I didn't want to rely on a package, if I could avoid it.

At the end of the day, I used the "words" verb (`;:`{:.language-g}) to build a finite state machine that pulls sequences of digits out of my input string. [This guide](http://www.jsoftware.com/help/jforc/loopless_code_vii_sequential.htm) was a huge help in understanding and building out this code.

<pre class='language-g'><code class='language-j'>    parse =. 3 : 0
      m =. a. e. '1234567890'
      s =. 1   2 2 $ 0 0  1 1
      s =. s , 2 2 $ 0 3  1 0
      ". > (0;s;m;0 _1 0 0) ;:"1 y
    )
    parse '#1 @ 1,3: 4x4'
1 1 3 4 4
</code></pre>

Once I was able to parse out the offsets and dimensions of each rectangle, solving the problem was relatively straight forward. I first created a `width`{:.language-g} by `height`{:.language-j} matrix of `1`{:.language-j}s to represent each rectangle. I shifted the matrix down by appending (`,`{:.language-j}) rows of zeros, and right by appending zeros to the beginning of each row. J is nice enough to fill in the gaps.

<pre class='language-g'><code class='language-j'>    cut_cloth =. 1 $~ |.

    cut_and_shift =. 3 : 0
      left  =. 1 {:: y
      top   =. 2 {:: y
      cloth =. cut_cloth (0 0 0 1 1 # y)
      cloth =. 0 ,^:top cloth
      cloth =. 0 ,"1^:left cloth
      cloth
    )
    
    cut_and_shift 0 1 1 2 2
0 0 0
0 1 1
0 1 1
</code></pre>

Once each of the rectangles were sized and positioned, we can add them together:

<pre class='language-g'><code class='language-j'>    +/ cut_and_shift"1 parse input
0 0 0 0 0 0 0
0 0 0 1 1 1 1
0 0 0 1 1 1 1
0 1 1 2 2 1 1
0 1 1 2 2 1 1
0 1 1 1 1 1 1
0 1 1 1 1 1 1
</code></pre>

This gives us a visual depiction of where our rectangles overlaps where each positive number represents the number of intersections at that location. To find the answer to our problem, we ravel this grid (`,`{:.language-g}), filter out all elements that aren't greater than `1`{:.language-j}, and count the remaining:

<pre class='language-g'><code class='language-j'>    # (>&1 # ]) , +/ cut_and_shift"1 parse input
4
</code></pre>

## Part Two

[This tweet reply from Raul Miller](https://twitter.com/raudelmil/status/1069659834977521664) sent me down a rabbit hole related to improving my string-parsing-fu. After coming out the other side I had learned that the `inv`{:.language-g} adverb, or `^:_1`{:.language-j}, when paired with `#`{:.language-j} can be used to preserve the gaps on a filtered list, or string:

<pre class='language-g'><code class='language-j'>    ((1 0 1 0 1 1 0)&#^:_1) 'abcd'
a b cd
</code></pre>

This led me to a much better `parse`{:.language-g} function:

<pre class='language-g'><code class='language-j'>    parse =. ".@:(]#^:_1]#[) (e.&' 123456789')
</code></pre>

Part two of today's challenge asks us for the ID of the only rectangle in the set of inputs that doesn't intersect with any other rectangle.

My strategy for this part was different than the first part. Instead of building a matrix representation of each rectangle, I decided to transform each description into a set of left, right, top, and bottom coordinates ([with a little destructuring help](https://twitter.com/petecorey/status/1069697328003444736)):

<pre class='language-g'><code class='language-j'>    repackage =. 3 : 0
      'i l t w h' =. y
      i,l,t,(l + w),(t + h)
    )
    repackage 0 1 1 2 2
0 1 1 3 3
</code></pre>

Once I had the bounds of each rectangle described, I could determine [if any two rectangles intersect](https://gamedev.stackexchange.com/a/913):

<pre class='language-g'><code class='language-j'>    intersect =. 4 : 0
      'i_1 l_1 t_1 r_1 b_1' =. x
      'i_2 l_2 t_2 r_2 b_2' =. y
      -.+./(l_2>:r_1),(r_2<:l_1),(t_2>:b_1),(b_2<:t_1)
    )
    0 1 1 3 3 intersect 0 2 2 4 4
1
</code></pre>

Using my new `intersect`{:.language-g} verb, I could build an "intersection table", and find the rectangle that has only one intersection: the intersection with itself!

<pre class='language-g'><code class='language-j'>    parsed =. parse"1 input
    ({."1 parsed) #~ -. 1 i. +/ intersect"1/~ repackage"1 parsed
3
</code></pre>

## Notes

- I had trouble with the subtle differences between `intersect"1/~`{:.language-g} and `intersect/~"1`{:.language-j}. I need to dig deeper here.
- The inversion (`^:_1`{:.language-g}) of `#`{:.language-j} [is a special case](http://www.jsoftware.com/help/dictionary/d202n.htm).
