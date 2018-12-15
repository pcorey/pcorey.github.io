---
layout: post
title:  "Advent of Code: Repose Record"
description: "Day four of 2018's Advent of Code challenge. Warning: string processing be here."
author: "Pete Corey"
date:   2018-12-04
tags: ["J", "Advent of Code 2018"]
related: []
---

Today's [Advent of Code challenge](https://adventofcode.com/2018/day/4) asks us to parse and process a set of time-series data that describes when guards start their shift, when they fall alseep, and when they wake up. Our task is to find the guard that sleeps the most. We need to multiple their ID together with the minute they're asleep the most.

This was an incredibly difficult problem for me to solve using [J](http://jsoftware.com/). My plan of attack was to build a "sleep matrix" for each guard. Each matrix would have a row for each day the guard was on duty, and each row would be sixty columns wide, with each row/column representing whether the guard was asleep during that minute of the twelfth hour of that day.

I was immediately stumped by how to parse each string and organize all of the data into useful, easily manipulatable structures.

After sorting my lines (`/:~ input`{:.language-j}), I checked if each line had a `'G'`{:.language-j} character at index nineteen. If it did, I raised a boolean and used `+/\`{:.language-j} `e.`{:.language-j} and `#`{:.language-j} to build a set of groups for each guard's shift. Once I'd grouped each shift, I could build my sleep matrix and box it together with the guard's ID:

<pre class='language-j'><code class='language-j'>    sleep_map =. 3 : 0
      1 y } 60 $ 0
    )

    filter =. (' ' -.@:= 0&{)"1 # ]

    parse_log =. 3 : 0
      head =. {. y
      rest =. filter }. y
      'Y M D h m id' =. numbers head
      sleep =. sleep_map"0 ({:"1 numbers"1 rest #~ (# rest) $ 1 0)
      wake =. _1 * sleep_map"0 ({:"1 numbers"1 rest #~ (# rest) $ 0 1)
      id&;"2 +/\"1 sleep + wake
    )

    parse =. 3 : 0
      groups =. +/\ ('G' = 19&{::)"1 y
      masks =. groups&e."0 ~. groups
      parse_log"_1 masks # y
    )
</code></pre>

Next I needed to consolidate each guard's set of shifts and sleep matrices into a single sleep matrix:

<pre class='language-j'><code class='language-j'>    group_days =. 3 : 0
      id =. 0 {:: {. y
      days =. ,/ 1 {::"_1 y
      id;days
    )

    group =. 3 : 0
      ids =. 0 {::"1 y
      ids group_days/. y
    )
</code></pre>

Finally I could box up the needed statistics for each guard and sleep matrix, sort the results, and return the desired calculation:

<pre class='language-j'><code class='language-j'>    stats =. 3 : 0
      id =. 0 {:: y
      days =. 1 {:: y
      overlap =. +/ days
      most =. overlap i. >./ overlap
      slept =. +/ overlap
      slept; most; id; days
    )

    result =. (2&{:: * 1&{::) {. \:~ stats"1 group parse log
</code></pre>

## Part Two

Part two just wants us to find the guard that is asleep most frequently on the same minute of the night. We're to return that guard's ID multiplied by the minute they're usually asleep.

Thankfully, I was able to recycle all of the hard work I put into part one when it came time to solve part two. All I really needed to do was make a change to the set of statistics I boxed up in my final step:

<pre class='language-j'><code class='language-j'>    stats =. 3 : 0
      id =. 0 {:: y
      days =. 1 {:: y
      overlap =. +/ days
      most =. >./ overlap
      minute =. overlap i. most
      most; minute; id; days
    )
</code></pre>

The rest of my code was left unchanged.

## Notes

- [The "key" verb (`/.`{:.language-j})](http://www.jsoftware.com/help/dictionary/d421.htm) can be incredibly useful for grouping data and performing actions on those subsets.
- [Sorting](http://www.jsoftware.com/help/phrases/sorting.htm) is interesting in J.
- Any type of data can be sorted. Sorting arrays of boxes behaves like sorting lists of tuples in [Elixir](https://elixir-lang.org/), which is a very handy trick.
- `(9!:3) 4`{:.language-j} [renders verb trains](http://www.jsoftware.com/help/learning/27.htm) in "tree view" which I find very helpful.
