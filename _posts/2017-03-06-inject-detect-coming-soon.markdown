---
layout: post
title:  "Inject Detect - Coming Soon!"
description: "I've decided to put my knowledge into practice and build an application called Inject Detect to detect NoSQL Injection attacks as they happen."
author: "Pete Corey"
date:   2017-03-06
tags: ["Inject Detect", "Security", "NoSQL Injection"]
---

To make a long story short, I’ve decided to start working on a new project called [Inject Detect](http://www.injectdetect.com/).

[Inject Detect](http://www.injectdetect.com/) is a SaaS application designed to detect NoSQL Injection attacks against your MongoDB-backed application as they happen.

Check out the [Inject Detect landing page](http://www.injectdetect.com/) for more details, and sign up for the [Inject Detect newsletter](http://www.injectdetect.com/#sign-up) to stay in the loop. I’ll also send you an introduction to NoSQL Injection for signing up!

## Why NoSQL Injection?

It turns out that [my most popular post from last year](http://www.east5th.co/blog/2016/03/21/nosql-injection-in-modern-web-applications/) was about the NoSQL Injection talk I gave at the 2016 Crater Remote Conference.

This couldn’t make me happier! NoSQL Injection has been, and continues to be one of the most serious security issues I see pop up time and time again in Meteor applications (and any application using MongoDB).

In fact, of all the serious security issues I’ve found while [conducting Meteor security assessments](http://www.east5th.co/services/), ___nearly half are directly caused by NoSQL Injection vulnerabilities!___

## An Idea is Born

Wanting to piggyback off of the success of last year’s NoSQL Injection talk, I began considering writing an ebook or an online course diving into the topic of NoSQL Injection.

During my brainstorming, I asked myself many questions. What is NoSQL Injection? What causes it? How do I prevent it? What does it look like in different stacks and technologies? All of these questions had fairly well-accepted answered within the software development community.

Finally, I landed on the question of “How do I detect NoSQL Injection?” This question struck a chord with me.

When we write applications, we do our best to make them secure. In terms to preventing NoSQL Injection, we try to make sure that every possible piece of user-provided data is thoroughly checked and validated.

But what if we miss something? How do we know we don’t have vulnerable code sitting in production right now? How would we know if we were being hit with NoSQL Injection attacks as we speak? Server-side errors wouldn’t be raised, and the malicious user certainly wouldn’t file a bug report.

It seems like we’re operating blindly here, and that seems like a very dangerous gamble.

## Enter Inject Detect

<img src="https://s3.amazonaws.com/www.injectdetect.com/app.png" style="float: right; width: 45%; margin: 0 0 1em 1em;" title="Rough mockup of an Inject Detect warning.">

[Inject Detect](http://www.injectdetect.com/) is my answer to this problem.

By analyzing the structure of the queries made against your MongoDB database and comparing them to a set of expected queries, [Inject Detect](http://www.injectdetect.com/) will be able to identify and quickly notify you about suspicious queries that may be the result of a NoSQL injection attack.

Put simply, [Inject Detect](http://www.injectdetect.com/) is a fully automated and easily configurable `check`{:.language-javascript} as a service.

[Inject Detect](http://www.injectdetect.com/) is still in very early development. My goal is to be transparent about its development. If you want to follow along, [sign up for the Inject Detect newsletter](http://www.injectdetect.com/#sign-up) and check back here for development updates as they happen!

Does [Inject Detect](http://www.injectdetect.com/) sound like a useful service for you or your team? What features would you expect from it? Let me know - I’d love to hear your feedback!
