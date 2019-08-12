---
layout: post
title:  "Advent of Code: Inventory Management System"
excerpt: "Day two of 2018's Advent of Code challenge. Let's use J to count occurances of letters in a string."
author: "Pete Corey"
date:   2018-12-02
tags: ["J", "Advent of Code 2018"]
related: []
---

Today's [Advent of Code](http://jsoftware.com/) challenge asks us to scan through a list of IDs, looking for IDs that two and three repeated letters. Once we have the total number of words with two repeated characters and three repeated characters, we're asked to multiple them together to get a pseudo-checksum of our list of IDs.

At first I had no idea about how I would tackle this problem in [J](http://jsoftware.com/). After digging through the [vocabulary sheet](http://www.jsoftware.com/help/dictionary/vocabul.htm), I stumbled upon the monadic form of `e.`{:.language-j} and I was shown the light.

The `e.y`{:.language-j} verb iterates over every element of `y`{:.language-j}, building a boolean map of where that element exists in `y`{:.language-j}. We can use that result to group together each element from `y`{:.language-j}. Once we've grouped each element, we can count the length of each group. Because J pads extra `0`{:.language-j}/`' '`{:.language-j} values at the end of arrays to guarantee filled matricies, we'll measure the length of each group by finding the index of this padding character in every group. Finally, we can see if `2`{:.language-j} and `3`{:.language-j} exists in each set of character counts, and sum and multiply the results.

<pre class='language-j'><code class='language-j'>    read_lines =. >@:cutopen@:(1!:1) <
    lines =. read_lines '/Users/pcorey/advent_of_code_2018/day_02/input'

    group =. ([: ~. e.) # ]
    count =. [: i."1&' ' group"1
    twos_and_threes =. [: (2 3)&e."1 count

    */ +/ twos_and_threes lines
</code></pre>

I've been trying to make more use of forks, hooks, and verb trains after reading through [Forks, Hooks, and Compound Adverbs](http://www.jsoftware.com/help/jforc/forks_hooks_and_compound_adv.htm) and [Trains](http://www.jsoftware.com/help/dictionary/dictf.htm) on the J website.

## Part Two


Part two asks us the find two IDs that differ by only a single letter. Once we've found those two IDs, we're to return the set of letters they have in common.

My basic idea here was to compare every possible word combination and pack up the two compared words with the number of differences between them:

<pre class='language-j'><code class='language-j'>    compare =. 4 : 0
      differences =. x ([: +/ [: -. =) y
      differences;x;y
    )

    comparisons =. ,/ input compare"1/ input
</code></pre>

Using that, we could pick out the set of word pairs that have one difference between them:

<pre class='language-j'><code class='language-j'>    ones =. 1&= 0&{::"1 comparisons
</code></pre>

Unbox the word pairs from that set:

<pre class='language-j'><code class='language-j'>    words =. > }."1 ones # comparisons
</code></pre>

And then use an inverted nub sieve to find the letters those words share in common, using another nub to filter out the duplicate caused by the inverse comparison:

<pre class='language-j'><code class='language-j'>    ([: . (-.@:: # ])"1/) words
</code></pre>

I'll admit, I found myself getting lost in what felt like a sea of boxes and arrays while working on this solution. I found it difficult to keep track of where I was in my data, and found myself building intermediate solutions in the REPL before moving them over to my project. I need to get better at inspecting my data and getting a feel for how to manipulate these structures in J.

I also found myself heavily relying on the REPL for building my verb chains. I constantly found myself building chains by trail and error.

> Does this work? No? Maybe if I add a cap at the end? Yes!

I can handle single hooks and forks, but when things expand beyond that I find myself getting lost. I'm hoping I get better with that over time.

## Notes

- Trying to open a box that holds numbers and string will throw a `domain error`{:.language-j}, because the two types can't live together in an array.
