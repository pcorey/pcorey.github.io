---
layout: post
title:  "Advent of Code: Marble Mania"
description: "Day ten of 2018's Advent of Code challenge. Let's build a circular, doubly linked list using the J programming language."
author: "Pete Corey"
date:   2018-12-14
tags: ["J", "Advent of Code 2018"]
related: []
---

Advent of Code day nine [asks us to play a game](https://adventofcode.com/2018/day/9). The game is played by placing marbles, or numbers, around a circle, or a circular list. If you play a marble that's a multiple of `23`{:.language-j}, you keep that marble, and the marble seven marbles behind your current position. We're to figure out the winning player's score after thousands of rounds of this game.

As usual, we start things off by pulling in our input and massaging it into a workable form. Let's kick things off by defining some replacements:

<pre class='language-j'><code class='language-j'>    replacements =. 'players; last marble is worth';''
    replacements =. replacements;'points';''
</code></pre>

Next let's load our puzzle input, execute our replacements, and parse the resulting numbers:

<pre class='language-j'><code class='language-j'>    path =.  '/Users/pcorey/advent_of_code_2018/day_09/input'
    NB. Load the file, remove everything that's not a number, and assign.
    'players highest_marble' =. ". replacements rplc~ (1!:1) &lt; path
</code></pre>

Some destructing helps us pull out the number of players and the number of turns we should play out, or the highest marble to be played.

Now let's write a `turn`{:.language-j} verb that takes the current state of the board, the current player, the current marble being played, and all players' scores. We'll place our marble in the correct position in the circular board, potentially update the current player's score, and return our modified state:

<pre class='language-j'><code class='language-j'>    turn =. 3 : 0
      NB. Destructure my arguments.
      circle =. 0 {:: y
      player =. players | 1 {:: y
      marble =. 2 {:: y
      scores =. 3 {:: y

      if. 0 = 23 | marble do.
        NB. Grab the current player's current score.
        score =. player { scores
        NB. Add the marble they would have placed to their score.
        score =. score + marble
        NB. Rotate circle 7 counter-clockwise
        circle =. _7 |. circle
        NB. Add the marble we landed on to the player's score.
        score =. score + {. circle
        NB. Update the scores list with the player's new score.
        scores =. score (player}) scores
        NB. Remove the marble we landed on.
        circle =. }. circle
      else.
        NB. 
        circle =. marble , 2 |. circle
      end.

      NB. Return our updates arguments.
      circle;(player + 1);(1 + marble);scores
    )
</code></pre>

It turns out modeling a circular repeating list is easy using J's "rotate" (`|.`{:.language-j}) verb.

Because we're returning the same data from `turn`{:.language-j} as we're passing in, we can use the "power" verb (`^:`{:.language-j}) to repeatedly apply `turn`{:.language-j} to an initial set of inputs:

<pre class='language-j'><code class='language-j'>    scores =. 3 {:: (turn^:highest_marble) 0;0;1;(players $ 0)
</code></pre>

Applying `turn`{:.language-j} `highest_marble`{:.language-j} times to our initial state (`0;0;1;(players $ 0)`{:.language-j}) gives us a final list of player scores.

We find out final answer by returning the maximum score:

<pre class='language-j'><code class='language-j'>    >./scores
</code></pre>

## Part Two

Part two asks for the highest player's score if we continue playing for `highest_marble*100`{:.language-j} turns. This turned out to be an _incredibly difficult_ problem for me to solve using J.

The problem here is performance. Playing two orders of magnitude more turns increases the runtime of our first solution from a few seconds to significantly longer than I'm willing or capable of waiting. We need a better solution. The obvious solution is to use a data structure that's better suited to rotations, insertions, and removals than a plain array. A doubly linked, circular linked list would be perfect here.

I started researching how to implement a doubly linked list in J. It turns out that this type of low-level data manipulation [goes against the grain of J's intended use](https://rosettacode.org/wiki/Doubly-linked_list/Definition#J). Apparently J code is intended to be descriptive, while the interpreter does the heavy lifting of optimization. Unfortunately, it wasn't doing a great job with my part one solution.

I was hell bent on building a doubly linked list. My first implementation was modeled after [this (seemingly hacky) exploitation of J "locatives", or namespaces](https://code.jsoftware.com/wiki/Vocabulary/Locales#An_example_using_explicit_and_object_locatives):

<pre class='language-j'><code class='language-j'>    init =. 3 : 0
      l =. &lt;": y
      v__l =. y
      n__l =. 0
      p__l =. 0
    )

    insert =. 4 : 0
      head =. x
      l =. &lt;": y
      nl =. &lt;": head
      pl =. &lt;": p__nl
      v__l =. y
      n__l =. n__pl
      p__l =. p__nl
      n__pl =. y
      p__nl =. y
      v__l
    )

    remove =. 3 : 0
      l =. &lt;": y
      nl =. &lt;": n__l
      pl =. &lt;": p__l
      n__pl =. n__l
      p__nl =. p__l
      v__nl
    )

    rotate_cw =. 3 : 0
      l =. &lt;": y
      n__l
    )

    rotate_ccw =. 3 : 0
      l =. &lt;": y
      p__l
    )
</code></pre>

Unfortunately, while this was faster than my original solution, it was still too slow to give me my answer in a reasonable amount of time.

My next attempt led me directly allocating, reading, and writing my own data structures directly into memory using [J's `mema`{:.language-j}, `memr`{:.language-j}, and `memw`{:.language-j} utility verbs](https://code.jsoftware.com/wiki/Guides/DLLs/Memory_Management). At this point I was basically justing writing C code with weird syntax:

<pre class='language-j'><code class='language-j'>    init =. 3 : 0
      NB. Allocate space for a new node.
      addr =. mema 8*type
      NB. Write the value, prev ptr, and next ptr.
      res =. (0,addr,addr) memw (addr,0,3,type)
      addr
    )

    insert =. 4 : 0
      'v pp pn'    =. memr x, 0,3,type
      'pv ppp ppn' =. memr pp,0,3,type
      'nv npp npn' =. memr pn,0,3,type

      NB. Allocate and write new node.
      addr =. mema 8*type

      if. *./ x = pp , pn do.
        NB. Only 1 element in the list.
        (y,x,x) memw addr,0,3,type
        (v,addr,addr) memw x,0,3,type
      else.
        if. pp = pn do.
          NB. Only 2 elements in the list.
          (y,pn,x) memw addr,0,3,type
          (v,addr,pn) memw x,0,3,type
          (nv,x,addr) memw pn,0,3,type
        else.
          NB. Normal insertion case.
          (y,pp,x) memw addr,0,3,type
          (v,addr,pn) memw x,0,3,type
          (nv,x,npn) memw pn,0,3,type
          (pv,ppp,addr) memw pp,0,3,type
        end.
      end.

      addr
    )

    remove =. 3 : 0
      'v pp pn' =. memr y,0,3,type
      'pv ppp ppn' =. memr pp,0,3,type
      'nv npp npn' =. memr pn,0,3,type

      NB. Free the current node.
      memf y

      NB. Update neighbor nodes
      (pv,ppp,pn) memw pp,0,3,type
      (nv,pp,npn) memw pn,0,3,type

      pn
    )

    rotate_cw =. 3 : 0
      'v pp pn' =. memr y,0,3,type
      pn
    )

    rotate_ccw =. 3 : 0
      'v pp pn' =. memr y,0,3,type
      pp
    )
</code></pre>

Mercifully, this solution was much faster than my previous two. I was able to find my answer in roughly two minutes.

Check out [the full source for all three solutions on Github](https://github.com/pcorey/advent_of_code_2018/tree/master/day_09), if you're curious.

## Notes

- Rotate (`|.`{:.language-j}) is awesome.
- J is meant to be descriptive?
- I needed to allocate more than `12`{:.language-j} bytes to comfortably fit three integers.  But only sometimes. Why?
- You can time things using [the `6!:2`{:.language-j} foreign](http://www.jsoftware.com/help/learning/31.htm).
