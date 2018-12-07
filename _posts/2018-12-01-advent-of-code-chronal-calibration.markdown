---
layout: post
title:  "Advent of Code: Chronal Calibration"
description: "Day one of 2018's Advent of Code challenge. Let's use J to process a repeating sequence of changes."
author: "Pete Corey"
date:   2018-12-01
tags: ["J", "Advent of Code"]
related: []
---

I've been a huge fan of the [Advent of Code](https://adventofcode.com/) challenges since I first stumbled across them a few years ago. Last year, [I completed all of the 2017 challenges using Elixir](https://github.com/pcorey/advent_of_code_2017). This year, I decided to challenge myself and use a much more esoteric language that's [held my interest](/blog/2018/04/16/writing-mandelbrot-factals-with-hooks-and-forks/) for the past year or so. 

It's my goal to complete all of this year's Advent of Code challenges using [the J programming language](http://jsoftware.com/).

Before we get into this, I should make it clear that I'm no J expert. In fact, I wouldn't even say that I'm a J beginner. I've used J a handful of times, and repeatedly struggled under the strangeness of the language. That being said, there's something about it that keeps pulling me back. My hope is that after a month of daily exposure, I'll surmount the learning curve and get something valuable out of the experience and the language itself.

----

The first Advent of Code challenge of 2018 asks us to read in a series of "changes" as input, and apply those changes, in order, to a starting value of zero. The solution to the challenge is the value we land on after applying all of our changes. Put simply, we need to parse and add a list of numbers.

The first thing I wanted to do was read my input from a file. It turns out that I do know one or two things about J, and one of the things I know is that you can use foreigns to read files. In particular, the `1!:1`{:.language-j} foreign reads and returns the contents of a file.

Or does it?

<pre class='language-j'><code class='language-j'>    1!:1 'input'
file name error
</code></pre>

Apparently `1!:1`{:.language-j} doesn't read relative to the current script. I'm guessing it reads relative to the path of the `jconsole`{:.language-j} executable? Either way, using an absolute path fixes the issue.

<pre class='language-j'><code class='language-j'>    input =. 1!:1 < '/Users/pcorey/advent_of_code_2018/day_01/input'
</code></pre>

Now `input`{:.language-j} is a string with multiple lines. Each line represents one of our frequency changes. We could use `".`{:.language-j} to convert each of those lines into a number, but because `input`{:.language-j} is a single string, and not an array of lines, can't map `".`{:.language-j} over `input`{:.language-j}:

<pre class='language-j'><code class='language-j'>    0 "./ input
0
</code></pre>

After scrambling for ways of splitting a string into an array of lines, [I stumbled across `cutopen`{:.language-j}](http://www.jsoftware.com/help/primer/files.htm), which takes a string and puts each line into a box. That's helpful.

<pre class='language-j'><code class='language-j'>    boxed =. cutopen input
┌──┬──┬──┬──┐
│+1│-2│+3│+1│
└──┴──┴──┴──┘
</code></pre>

Now if we open `boxed`{:.language-j}, we'll have our array of lines:

<pre class='language-j'><code class='language-j'>    lines =. > boxed
+1
-2
+3
+1
</code></pre>

And now we can map `".`{:.language-j} over that array to get our array of numbers.

<pre class='language-j'><code class='language-j'>    numbers =. 0 "./ lines
1 _2 3 1
</code></pre>

And the answer to our problem is the sum of numbers.

<pre class='language-j'><code class='language-j'>    +/ numbers
3
</code></pre>

Here's my first working solution:

<pre class='language-j'><code class='language-j'>    input =. 1!:1 < '/Users/pcorey/advent_of_code_2018/day_01/input'
    boxed =. cutopen input
    lines =. > boxed
    numbers =. 0 "./ lines
    +/ numbers
</code></pre>

## Part Two

My first instinct for solving this problem is to do it recursively. I might be able to define a dyadic verb that accepts my current list of frequencies and a list of changes. If the last frequency in my array exists earlier in the array, I'll return that frequency. Otherwise, I'll append the last frequency plus the first change to my frequencies array, rotate my changes array, and recurse.

After many struggles, I finally landed on this solution:

<pre class='language-j'><code class='language-j'>    input =. 1!:1 < '/Users/pcorey/advent_of_code_2018/day_01/sample'
    boxed =. cutopen input
    lines =. > boxed
    numbers =. 0 "./ lines

    change_frequency =. 4 : 0
      frequency =. {: x
      change =. {. y
      frequency_repeated =. frequency e. (}: x)
      next_x =. x , (frequency + change)
      nexy_y =. 1 |. y
      next =. change_frequency ` ({:@}:@[) @. frequency_repeated
      next_x next next_y
    )

    0 change_frequency numbers
</code></pre>

This works great for example inputs, but blows the top off my stack for larger inputs. It looks like J's max stack size is relatively small. Recursion might not be the best approach for these problems.

Looking into other techniques for working without loops, I learned that you can use the `^:_`{:.language-j} verb to "converge" on a result. It will repeatedly apply the modified verb until the same result is returned.

I refactored my verb to take and return my frequencies array and my changes array as a boxed tuple, and converge on that verb until I get a repeated result. That repeated result holds my repeated frequency:

<pre class='language-j'><code class='language-j'>    input =. 1!:1 < '/Users/pcorey/advent_of_code_2018/day_01/sample'
    boxed =. cutopen input
    lines =. > boxed
    numbers =. 0 "./ lines

    package_next =. 4 : 0
      (x,({:x)+({.y));(1|.y)
    )

    package_result =. 4 : 0
      x;y
    )

    change =. 3 : 0
      frequencies =. >@{. y
      changes =. >@{: y
      frequency =. {: frequencies
      change =. {. changes
      repeated =. frequency e. (}: frequencies)
      next =. package_next ` package_result @. repeated
      frequencies next changes
    )

    result =. change^:_ (0;numbers)
    echo 'Repeated frequency:'
    {:@:{.@:> result
</code></pre>

## Notes

- `$:`{:.language-j} doesn't seem to refer to the outermost *named* verb. Recursion wasn't working as I expected with `$:`{:.language-j}. Replacing it with the named verb worked perfectly.
- J seems to have a short stack. Note to self: avoid deep recursion.
- [J doesn't support tail call optimization](http://jsoftware.2058.n7.nabble.com/tail-recursion-TCO-td22820.html).
- `^:_`{:.language-j} and variants can be used as an iterative alternative to recursion.
- Use boxes like tuples.
- Use `echo`{:.language-j} for debug printing.
