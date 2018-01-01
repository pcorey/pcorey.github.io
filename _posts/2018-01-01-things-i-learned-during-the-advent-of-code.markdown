---
layout: post
title:  "Things I Learned During the Advent of Code"
description: "This year's Advent of Code has come and gone. I had a lot of fun solving each of this year's challenges with Elixir."
author: "Pete Corey"
date:   2018-01-01
tags: ["Elixir", "Advent of Code"]
related: []
---

If you know me, you know that I’m a huge fan of programming challenges and code katas. Sometimes I think I missed my calling as a [competitive programmer](https://en.wikipedia.org/wiki/Competitive_programming).

This past month I was able to satisfy my cravings for programming challenges with Eric Wastl’s [Advent of Code](https://adventofcode.com/).

Solving a programming challenge every day for nearly a month taught me interesting lessons about myself and my current programming language of choice: Elixir.

Here’s a quick rundown.

- __You’ll have good days.__ - There will be days where your mind is running on all cylinders. Solutions to problems will appear fully formed in your mind’s eye, and completing challenges is simply a matter of dictating your envisioned solution. <br/><br/>
- __You’ll have bad days.__ - There will be other days where your mind feels like a tangle of rusty nails stuck together in a bucket of dried cement. Solutions will come slowly, if they come at all. <br/><br/>
- __Most days will land somewhere in-between.__ - It’s important to try to avoid letting your perceived state of mind influence your decisions and determination. When I felt like I was having trouble, falling back to first principles always seemed to help devise a path forward. <br/><br/>
- __Elixir’s `Stream`{:.language-elixir} library is awesome.__ - Sasa Juric’s solutions to the [first few days](https://gist.github.com/sasa1977/028a13921489f16a41f8c346578c4b5f) of Advent of Code inspired me to look into [Elixir’s `Stream`{:.language-elixir} module](https://hexdocs.pm/elixir/Stream.html). I was so impressed with the module that I wrote an article on [generating sequences with streams](http://www.petecorey.com/blog/2017/12/11/generating-sequences-with-elixir-streams/), and I went on to solve a good number of advent challenges with `Stream`{:.language-elixir}-based generators. <br/><br/>
- __Stick to the basics.__ - I found that my first instinct when sketching out a solution to a problem was to reach for functions shipped in standard modules like `Enum`{:.language-elixir}, `List`{:.language-elixir}, and `Map`{:.language-elixir}. However, studying other people’s solutions made me realize that sticking to the basics of recursion and pattern matching can lead to more elegant, readable, and performant solutions. <br/><br/>
- __Erlang ships with everything and the kitchen sink.__ - A few of this year’s challenges led me to standard modules shipped with Erlang and accessible from Elixir. Modules like [`:digraph`{:.language-elixir}](http://erlang.org/doc/man/digraph.html), [`:digraph_utils`{:.language-elixir}](http://erlang.org/doc/man/digraph_utils.html), [`:gb_trees`{:.language-elixir}](http://erlang.org/doc/man/gb_trees.html), and [`:binary`{:.language-elixir}](http://erlang.org/doc/man/binary.html) are incredibly useful and overlook utilities. <br/><br/>
- __You don’t want to split on empty strings. You want a list of graphemes.__ - Use `String.graphemes/1`{:.language-elixir} instead of `String.codepoints/1`{:.language-elixir} or `String.split(&1, "")`{:.language-elixir} to split a string into its component characters. Read all about [codepoints and grapheme clusters](https://hexdocs.pm/elixir/String.html#module-codepoints-and-grapheme-cluster) for more information. <br/><br/>
- __Elixir’s “extended” regex modifier helps explain away the black magic.__ - Regexes are often cesspools of black magic. It often takes just as long, if not longer, to understand a written regex than to write it from scratch. Thankfully, [Elixir’s “extended” modifier](https://hexdocs.pm/elixir/Regex.html#module-modifiers) lets you explain away some of the black magic in your regexes by splitting them across multiple lines and interleaving comments. <br/><br/>
- __Studying other people’s solutions can teach powerful lessons.__ - Nearly every language-specific tip or technique I learned during this year’s Advent of Code challenge came from studying other people’s solutions after I implemented my own. Reading other people’s code is, hands down, the most powerful tool for improving your own code. <br/><br/>

I had a lot of fun with this year’s Advent of Code challenges. I learned quite a bit about Elixir and about myself. I even made some good friends in the `#adventofcode`{:.language-elixir} channel of the Elixir Slack group.

I’ll definitely be doing this again next year.

If you didn’t do this year’s Advent of Code, it’s not too late! Go [check out the problems](https://adventofcode.com/), and if you’re curious, [check out my solutions on Github](https://github.com/pcorey/advent_of_code_2017/).
