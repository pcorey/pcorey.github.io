---
layout: post
title:  "Advent of Code: Memory Maneuver"
excerpt: "Day eight of 2018's Advent of Code challenge. We can plant a house, and we can build a tree."
author: "Pete Corey"
date:   2018-12-08
tags: ["J", "Advent of Code 2018"]
related: []
---

Today's [Advent of Code](https://adventofcode.com/2018/day/8) challenge asks us to parse a sequence of numbers that describe a tree. Each node of the tree consists of metadata, a list of numbers, and zero or more children. We're asked to find the sum of all metadata entries throughout the tree. Let's use [the J programming language](http://jsoftware.com/) to solve this problem!

My gut reaction when I hear the word "tree" is to reach for recursion. Let's write a recursive verb in J that processes each node described by our input and builds up our tree as we go:

<pre class='language-j'><code class='language-j'>    process =. 3 : 0
      siblings =. 0 {:: y
      childrens =. 0 { 1 {:: y
      metadatas =. 1 { 1 {:: y
      rest =. 2 }. 1 {:: y
      if. childrens = 0 do.
        children =. 0 1 $ 0
      else.
        next =. process^:childrens (0 1 $ 0);rest
        children =. 0 {:: next
        rest =. 1 {:: next
      end.
      metadata =. (i. metadatas) { rest
      rest =. metadatas }. rest
      (siblings,children,metadata);rest
    )
</code></pre>

The recursion here is fairly straight forward. If the current node has children, I'm using the `^:`{:.language-j} adverb to repeatedly, recursively apply the `process`{:.language-j} verb to each of its sibling nodes.

I return any passed in siblings appended to the children we just processed, along with the set of metadata on each node.

We can find our final answer by raveling together all of the collected metadata and summing them together:

<pre class='language-j'><code class='language-j'>    echo +/,0{::process (0 1 $ 0);input
</code></pre>

## Part Two

Part two revealed that the metadata in each node actually refers to the (1-based) indexes of that node's children. Calculating the cost of nodes with children is done by adding up the cost of each node specified in the metadata list. The cost of a leaf node is the sum of its metadata.

I figured that the best way to tackle this was to rework my `process`{:.language-j} verb to return the entire, correctly structured tree:

<pre class='language-j'><code class='language-j'>    process =. 3 : 0
      siblings =. 0 {:: y
      childrens =. 0 { 1 {:: y
      metadatas =. 1 { 1 {:: y
      rest =. 2 }. 1 {:: y
      if. childrens = 0 do.
        children =. 0 1 $ 0
      else.
        next =. process^:childrens (0 1 $ 0);rest
        children =. 0 {:: next
        rest =. 1 {:: next
      end.
      metadata =. (i. metadatas) { rest
      node =. metadata;<children
      rest =. metadatas }. rest
      (siblings,node);rest
    )
</code></pre>

The final structure of the sample input looks like this:

<pre class='language-j'><code class='language-j'>┌─────┬─────────────────┐
│1 1 2│┌────────┬──────┐│
│     ││10 11 12│      ││
│     │├────────┼──────┤│
│     ││2       │┌──┬─┐││
│     ││        ││99│ │││
│     ││        │└──┴─┘││
│     │└────────┴──────┘│
└─────┴─────────────────┘
</code></pre>

For each node, the metadata is on the left, and the boxed list of children is on the right.

I wrote a `count`{:.language-j} verb that recursively counts the cost of a given node. If the node has no children, I return the sum of its metadata. Otherwise, I return the sum of `count`{:.language-j} applied to its children:

<pre class='language-j'><code class='language-j'>    count =. 3 : 0
      metadata =. 0{::y
      children =. 1{::y
      if. 0 = # children do.
        +/ metadata
      else.
        indexes =. 1 -~ metadata
        indexes =. indexes #~ _1 < indexes
        indexes =. indexes #~ -. (1 -~ # children) < indexes
        +/ count"_1 indexes { children
      end.
    )
</code></pre>

I can use these two together to get my final answer:

<pre class='language-j'><code class='language-j'>    tree =. 0{0{::process(0 1 $ 0);input
    echo count tree
</code></pre>

## Notes

- This page on [working with trees in J](http://www.jsoftware.com/help/learning/32.htm) was incredibly helpful.
- I've been using `#~`{:.language-j} quite a bit to build a mask and remove items from an array based on that mask.
- I made heavy use of the `if`{:.language-j} control structure when solving these problems. No need to be a hero.
