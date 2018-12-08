---
layout: post
title:  "Advent of Code: The Sum of Its Parts"
description: "Day seven of 2018's Advent of Code challenge. In which we use J to navigate a directed graph."
author: "Pete Corey"
date:   2018-12-07
tags: ["J", "Advent of Code"]
related: []
---

Day seven of this year's [Advent of Code](https://adventofcode.com/2018/day/7) asks us to find the order in which we must complete a set of steps in a directed graph. Let's see how well we can do with this task using [the J programming language](http://jsoftware.com/)!

My high level plan of attack for this task is to keep each pair of dependencies in their current structure. I'll build a verb that takes a list of "completed" steps, and the list of pairs relating to uncompleted steps. My verb will find the first (alphabetically) step that doesn't have an unmet dependency in our list, append that step to our list of completed steps, and remove all pairs that are waiting for that step being completed.

Thankfully, parsing our input is easy today:

<pre class='language-j'><code class='language-j'>    parse =. (5 36)&{"1
    pairs =. |."1 parse input
AC
FC
BA
DA
EB
ED
EF
</code></pre>

We can write a helper that takes our list of pairs and returns all of the steps referenced in them in a raveled list:

<pre class='language-j'><code class='language-j'>    steps =. [: /: [: . ,
    steps pairs
ABCDEF
</code></pre>

Now we can write our verb that completes each step of our instructions:

<pre class='language-j'><code class='language-j'>    next =. 3 : 0
      done =. 0 {:: y
      pairs =. 1 {:: y
      steps =. steps pairs
      left =. {."1 pairs
      right =. {:"1 pairs
      next_step =. {. steps #~ -. steps e. ~. left
      next_pairs =. pairs #~ -. right e. next_step
      remaining_pairs =. pairs #~ right e. next_step

      append =. (done,next_step)"_
      return =. (done)"_
      next_step =. (append ` return @. (0 = # remaining_pairs)"_) _

      next_step;next_pairs
    )
</code></pre>

I'm trying to be more explicit here, and rely less on tacit verbs. Last time I found myself getting lost and hacking together solutions that I didn't fully understand. I'm trying to pull back and bit and do things more intentionally.

We can converge on the result of repeatedly applying `next`{:.language-j} to our list of `pairs`{:.language-j} and an empty starting set of completed steps:

<pre class='language-j'><code class='language-j'>    0{:: next^:_ '' ; pairs
CABDF
</code></pre>

An unfortunate side effect of our algorithm is that our last step in our graph is never appended to our list. We need to find this step and append it ourselves:

<pre class='language-j'><code class='language-j'>    append_last =. 4 : 0
      steps =. steps x
      missing =. steps #~ -. steps e. ~. y
      y,missing
    )
    echo pairs append_last 0{:: next^:_ '' ; pairs
CABDFE
</code></pre>

And that's all there is to it!

## Part Two

Part two was much more complicated than part one. Each step takes a specified amount of time to complete, and we're allowed to work on each step with up to four workers, concurrently.

This was the hardest problem I've solved so far throughout this year's Advent of Code. My general strategy was to modify my `next`{:.language-j} verb (now called `tick`{:.language-j}) to additionally keep track of steps that were actively being worked on by concurrent workers.

Every `tick`{:.language-j}, I check if there are any available steps and any space in the worker queue. If there are, I move the step over. Next, I go through each step being worked on by each worker and subtract `1`{:.language-j}. If a step being worked on reaches `0`{:.language-j} seconds of work remaining, I add it to the `done`{:.language-j} list.

Eventually, this solution converges on my answer.

I'm not at all happy with my code. I found myself getting deeply lost in the shape of my data. After much struggling, I started to make heavy use of `$`{:.language-j} to inspect the shape of nearly everything, and I peppered my code with `echo`{:.language-j} debug statements. The final solution is a nasty blob of code that I only just barely understand.

[Enjoy.](https://github.com/pcorey/advent_of_code_2018/blob/master/day_07/part_02.ijs)

## Notes

- Always know the shape of the data you're working with.
- Sometimes we need to [deal with empty data](http://www.jsoftware.com/help/jforc/empty_operands.htm), like [empty arrays](http://www.jsoftware.com/help/primer/empty_array.htm).
- I need to brush up on my [append variations](http://www.jsoftware.com/help/learning/05.htm).
- When all else fails, there are [control structures](http://www.jsoftware.com/help/jforc/control_structures.htm).
- `-:`{:.language-j} should be used to [compare nouns](https://code.jsoftware.com/wiki/Vocabulary/minusco).
