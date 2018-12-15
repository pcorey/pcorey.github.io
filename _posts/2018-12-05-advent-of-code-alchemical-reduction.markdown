---
layout: post
title:  "Advent of Code: Alchemical Reduction"
description: "Day five of 2018's Advent of Code challenge. Let's use J to reduce polymer strings!"
author: "Pete Corey"
date:   2018-12-05
tags: ["J", "Advent of Code 2018"]
related: []
---

Today's [Advent of Code problem](https://adventofcode.com/2018/day/5) is to repeatedly remove corresponding "units" from a "polymer" until we're left with an unreducable polymer string. Unit pairs that can be removed are neighboring, matching characters, with differing cases, like `C`{:.language-j} and `c`{:.language-j}. The answer to the problem is the length of the resulting string.

I'm really happy with my [J-based](http://jsoftware.com/) solution to this problem, which is a relief after yesterday's disaster. I started by writing a function that compares two units and returns a boolean that says whether they react:

<pre class='language-j'><code class='language-j'>    test =. ([ -.@:= ]) * tolower@:[ = tolower@:]
    'C' test 'c'
1
</code></pre>

Next, I wrote a dyadic verb that takes a single unit as its `x`{:.language-j} argument, and a string of units as its `y`{:.language-j} argument. If `x`{:.language-j} and the head of `y`{:.language-j} react, it returns the beheaded (`}.`{:.language-j}) `y`{:.language-j}. Otherwise it returns `x`{:.language-j} appended to `y`{:.language-j}:

<pre class='language-j'><code class='language-j'>    pass =. ([,]) ` (}.@:]) @. ([ test {.@:])
    'C' pass 'cab'
ab
</code></pre>

This `pass`{:.language-j} verb can be placed between each element of our polymer string using the insert (`/`{:.language-j}) adverb. This gives us a reduced polymer string.

<pre class='language-j'><code class='language-j'>    pass/ 'dabAcCaCBAcCcaDA'
dabCBAcaDA
</code></pre>

Finally, we can repeatedly apply `pass`{:.language-j} until the result is stable, essentially converging on a solution. Once we've got our fully reduced polymer string, we count its length and print the result:

<pre class='language-j'><code class='language-j'>    echo # pass/^:_ 'dabAcCaCBAcCcaDA'
10
</code></pre>

And that's it!

## Part Two

Part two tells us that one of the unit pairs is causing trouble with our polymer reduction. It wants us to remove each possible unit pair from the input string, count the length of the resulting reduction, and return the lowest final polymer string length.

My solution to part two builds nicely off of part one.

We'll keep `test`{:.language-j} and `pass`{:.language-j} as they are. We'll start by writing a `remove`{:.language-j} verb that takes a character to remove as `x`{:.language-j}, and a string to remove it from as `y`{:.language-j}. I use `i.`{:.language-j} to build a map that shows me where `x`{:.language-j} _isn't_ in `y`{:.language-j}, and then use `#`{:.language-j} to omit those matching characters.

<pre class='language-j'><code class='language-j'>    remove =. ] #~ [ i. [: tolower ]
    'y' remove 'xyz'
xz
</code></pre>

Next I wrote a `remove_nubs`{:.language-j} verb that calculates the nub of our polymer string, and uses `remove`{:.language-j} to remove each nub from our original string. I box up the results to avoid J appending spaces to end of my strings to fill the matrix.

<pre class='language-j'><code class='language-j'>    remove_nubs =. [ <@:remove"1 (1 , #@:nub) $ nub =. [: ~. tolower
    remove_nubs 'aabc'
┌──┬───┬───┐
│bc│aac│aab│
└──┴───┴───┘
</code></pre>

Finally, I apply `remove_nubs`{:.language-j} from my input, and converge on a solution for each new polymer string, count their resulting lengths, and return the minimum length:

<pre class='language-j'><code class='language-j'>    echo <./ ([: # [: pass/^:_"1 >)"0 remove_nubs 'dabAcCaCBAcCcaDA'
4
</code></pre>

## Notes

- The application of `/`{:.language-j} modified verbs is from right to left. I would have expected left to right, for some reason. This makes sense though, considering J's execution model.
- Visualizing verb trains makes it _so much easier_ to write them. I actually found myself getting them right the first time, thanks to "tree view" (`(9!:3) 4`{:.language-j}.
- Boxing can be helpful when I don't want J to pad the value to fit the dimensions of the array it lives in.
