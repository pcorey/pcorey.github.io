---
layout: post
title:  "Advent of Code: Subterranean Sustainability"
excerpt: "Day twelve of 2018's Advent of Code challenge. Pots, plants, and cellular autamata, oh my!"
author: "Pete Corey"
date:   2018-12-20
tags: ["J", "Advent of Code 2018"]
related: []
---

[Day twelve of this year's Advent of Code](https://adventofcode.com/2018/day/12) essentially asks us to implement a basic one dimensional [cellular automata](https://en.wikipedia.org/wiki/Cellular_automaton) that can look two spaces to the left and right of itself. We're given an infinite row of "pots", and an initial configuration of pots that contain living plants. We're asked, after twenty generations, the sum of the pot numbers that contain living plants.

Let's take a stab at this using [the J programming language](http://jsoftware.com/).

Our sample starting state already looks a lot like a bit mask, so let's do a little massaging and get it into a form we can work with:

<pre class='language-j'><code class='language-j'>    replacements =. 'initial state: ';'';'=> ';'';'.';'0 ';'#';'1 '
    path =.  '/Users/pcorey/advent_of_code_2018/day_12/input'
    replaced =. cutopen replacements rplc~ (1!:1) < path

    NB. Parse out initial state as boolean array
    initial =. ". > {. replaced
1 0 0 1 0 1 0 0 1 1 0 0 0 0 0 0 1 1 1 0 0 0 1 1 1
</code></pre>

Great. Now let's work with the patterns, or cellular automata rules, we were given and work them into a structure we can deal with:

<pre class='language-j'><code class='language-j'>    NB. Build matrix of replacement patterns
    patterns =. }:"1 ". > }. replaced
1 1 1 1 0
1 1 1 0 1
1 1 1 0 0
...
</code></pre>

Similarly, we'll build up our list of resulting pot values, or replacements, if we find any of those matching patterns:

<pre class='language-j'><code class='language-j'>    NB. Build array of replacement values
    replacements =. {:"1 ". > }. replaced
0 1 1 1 1 1 0 0 1 0 1 0 0 0 0 0 1 0 0 1 1 1 0 1 0 0 0 1 1 0 0 0
</code></pre>

Great. Now let's write a monadic verb that takes a 5-length array of bits, or booleans, and returns the corresponding replacement value:

<pre class='language-j'><code class='language-j'>    NB. Replace a length-5 y with a replacement value
    replace =. replacements"_ {~ patterns&i.

    replace 0 1 0 1 0
1
</code></pre>

And now we can tie everything together with an `iterate`{:.language-j} verb that takes our initial configuration, breaks it into overlapping chunks of 5-length arrays, and repeatedly applies `replace`{:.language-j} to each chunk (with some extra padding thrown in to catch edge cases):

<pre class='language-j'><code class='language-j'>    iterate =. 3 : 0
      (1 ,: 5) replace;._3 (0,0,0,0,y,0,0,0,0)
    )
</code></pre>

We can iterate twenty times over our initial starting configuration:

<pre class='language-j'><code class='language-j'>    iterated =. iterate^:20 initial
</code></pre>

At this point we could iterate `<20`{:.language-j} times to build up an array of each iteration, and visualize the growth of our plants using `viewmat`{:.language-j}:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/advent-of-code-subterranean-sustainability/pots-with-plants.png" style="display: block; margin:1em auto; width: 300px;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our plants' growth over time.</p>
</div>

Finally we can convert our bit mask of pots with living plants into a list of coordinates, and print the sum:

<pre class='language-j'><code class='language-j'>    echo +/ iterated # (iterations * 2) -~ i. # iterated
325
</code></pre>

## Part Two

Part two asks us for the sum of the pot numbers with living plants after fifty billion (50,000,000,000) generations. Obviously, we can't run our simulation for that long! We need to find some kind of pattern in our iterations.

To help, I decided to refactor my part one solution to simply keep track of an array of pot numbers with living plants, instead of a bit mask of all possible pots:

<pre class='language-j'><code class='language-j'>    NB. Build matrix of replacement patterns
    patterns_and_output =. ". > }. replaced
    patterns_to_keep =. {:"1 patterns_and_output
    patterns =. patterns_to_keep # ([: < 2 -~ I.)"1 }:"1 patterns_and_output
    NB. patterns =. patterns #~ 1 {:: patterns

    check_pattern =. 4 : 0
      pot_to_check =. 0 {:: x
      pots_with_plants =. 1 {:: x
      pattern_to_check =. > y

      pots_above_cutoff =. pots_with_plants >: pot_to_check - 2
      pots_below_cutoff =. pots_with_plants <: pot_to_check + 2
      pots_to_check =. pots_above_cutoff *. pots_below_cutoff
      pots_to_check =. pots_to_check # pots_with_plants

      (pot_to_check + pattern_to_check) -: pots_to_check
    )

    check_pot =. 4 : 0
      pot_to_check =. y
      pots_with_plants =. x
      +./ (pot_to_check;pots_with_plants)&check_pattern"0 patterns
    )

    iterate =. 3 : 0
      pots_with_plants =. > y
      pots_to_check =. (2 -~ <./ pots_with_plants) + i. 4 + (>./ - <./) pots_with_plants
      next_pots_with_plants =. < pots_to_check #~ pots_with_plants&check_pot"0 pots_to_check
      next_pots_with_plants
    )
</code></pre>

As you can see, I tried to be extra clear and verbose with my naming to keep myself from getting confused. I think the result is some fairly readable code.

As an example, I can grab the twentieth generation of pots with living plants like so:

<pre class='language-j'><code class='language-j'>    iterate^:20 <initial
┌─────────────────────────────────────────────────────┐
│_2 3 4 9 10 11 12 13 17 18 19 20 21 22 23 28 30 33 34│
└─────────────────────────────────────────────────────┘
</code></pre>

My plan of attack for finding the repeating pattern was to look for a cycle. If a generation, offset to zero, or normalized, ever matches a normalized generation we've seen previously, we've found a cycle.

I wrote two verbs to help me find this cycle and return some information about it:

<pre class='language-j'><code class='language-j'>    normalize =. <@:(<./ -~ ])@:>

    find_cycle =. 3 : 0
      previous =. 0 {:: y
      previous_normalized =. 1 {:: y
      next =. iterate {: previous
      next_normalized =. normalize next
      if. (next_normalized e. previous_normalized) do.
        next_min =. <./ > next
        previous_min =. <./ > {: previous
        (# previous);(previous_normalized i. next_normalized);(next_min - previous_min);({: previous)
      else.
        if. 1000 < # previous do.
          return.
        end.
        find_cycle (previous,next);<(previous_normalized,next_normalized)
      end.
    )
</code></pre>

The `find_cycle`{:.language-j} is a recursive verb that maintains a list of previous generations, and their normalized form. Every call it calculates the next generation and its normalized form. If it finds a cycle, it returns the number of previous generations we've seen, the index the repeated generation loops back to, the number of pots we've moved, and the last non-cyclical generation we processed, all boxed together.

<pre class='language-j'><code class='language-j'>    find_cycle (<initial);(<normalize<initial)                                
┌──┬──┬─┬───────────────────────────────────────────────────────────┐
│87│86│1│12 14 20 22 28 30 40 42 48 50 61 63 69 71 76 78 87 89 96 98│
└──┴──┴─┴───────────────────────────────────────────────────────────┘
</code></pre>

So it looks like our cycle starts at pot eighty six, and has a cycle length of one. This actually simplifies things quite a bit. This basically means that after reaching generation eighty six, our plants just move to the right each generation.

Let's change our `find_cycle`{:.language-j} function to return just the generation the cycle starts, and the set of pots with living plants at that generation. We can use that to find out how many position we need to add to that set of pots before we sum them for our final answer:

<pre class='language-j'><code class='language-j'>    result =. find_cycle (<initial);(<normalize<initial)
    to_add =. 50000000000 - (0 {:: result)
    final_pots_with_plants =. to_add + (1 {:: result)
    +/ final_pots_with_plants
</code></pre>

## Notes

- Pass a boxed number into `^:`{:.language-j} to return an array of applications of the verb, not just the last result.
- Use the cut verb (`;.`{:.language-j}) to chunk an array into overlapping sub-arrays.
