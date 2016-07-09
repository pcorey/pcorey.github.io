---
layout: post
title:  "Literate Commits"
date:   2016-07-11
tags: []
---

I’ve always been fascinated with Donald Knuth’s idea of “[literate programming](https://en.wikipedia.org/wiki/Literate_programming)”. The concept of presenting a complete program as a story or narrative is a very powerful framework for expressing complex ideas.

However, literate programming doesn’t come [without its downsides](http://www.johndcook.com/blog/2016/07/06/literate-programming-presenting-code-in-human-order/#.V32uxZvDTmQ.hackernews). While John Cook does a fantastic job of outlining how literate programming can help tip the scales for the better in certain situations, commenter [Peter Norvig](http://norvig.com/) presents a compelling argument against literate programming in the comments:

> I think the problem with Literate Programming is that assumes there is a single best order of presentation of the explanation. I agree that the order imposed by the compiler is not always best, but different readers have different purposes.

A developer’s experiences, preferences, and goals will cause them to approach a codebase in very different ways. A new developer looking to take ownership over an existing codebase may be looking for a much more holistic view of the software than a developer looking to fix a single bug.

Peter goes on:

> You don’t read documentation like a novel, cover to cover. You read the parts that you need for the task(s) you want to do now. What would be ideal is a tool to help construct such paths for each reader, just-in-time; not a tool that makes the author choose a single path for all readers.

Peter’s idea of a “reading path” that can be constructed on the fly strikes a chord with me and resembles an experiment I’ve been working on lately.

In an attempt to better document, improve, and share my programming workflow, I’ve been setting aside time for deliberate practice.

During these practice sessions, I write short programs or solve code katas while following what I consider to be “best practices”. I’m very deliberate during these sessions and document the thought process and impetus behind every change with  highly detailed, literate commit messages.

The goal of this process is to turn the project’s revision history into an artifact, a set of ___literate commits___, that represent my thought process as I go through the steps of writing professional-level software.

## Benefits of Literate Commits

In the short amount of time I’ve been doing them, these practices sessions have been enlightening. Intentional observation of my process has already led to many insights.

Slowing down and ensuring that each and every commit serves a singular purpose and adds to the narrative history of the project has done wonders to reduce thrash and the introduction of “stupid mistakes”.

The knowledge that the project’s revision history will be on display, rather than buried in the annals of `git log`{:.language-javascript} is a powerful motivating factor for doings things right the first time. The goal is that this repeated act of “doing things right the first time” will eventually turn into habit.

## Learning From History

The portion of Peter’s comment that strikes my eye is his desire for a choose-your-own-adventure style tool for bringing yourself up to speed with a given piece of code.

Imagine finding a section of code that you don’t understand within a project. `git blame`{:.language-javascript} can already be used to find the most recent commit that affected those lines of code, but those commits are most likely unhelpful out of context.

Now imagine that those commit messages were highly detailed, through explanations of why that code was changed and what the original developer hoped to accomplish with their change. Go further back. Review all of the related commits that led up to the current state of this particular piece of code.

> Those who cannot learn from history are doomed to repeat it.

Read in chronological order, these commits should paint a clear picture of how and why this particular code came into existence ___and how it has changed over the course of its life___.

## Example Project

For a very simple, introductory example to this style of programming and writing, [take a look at how I solved a simple code kata in literary commit style](/blog/2016-07-11-delete-occurances-of-an-element):

[Delete Occurrences of an Element](/blog/2016-07-11-delete-occurances-of-an-element)

While this is a very basic example, I hope it serves as a solid introduction to the style. I plan on releasing more literal commit posts over the coming months. Hopefully this intentional style of programming can be as helpful to other as it has been to me.

While I’m not advocating using literary commits in real-world software, in my limited experience, it can be an incredibly useful tool for honing your craft.

