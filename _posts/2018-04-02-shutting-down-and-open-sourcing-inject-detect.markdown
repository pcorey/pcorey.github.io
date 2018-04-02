---
layout: post
title:  "Shutting Down and Open Sourcing Inject Detect"
description: "It's with a heavy heart that I'm announcing that my security-focused SaaS application, Inject Detect, is shutting down."
author: "Pete Corey"
date:   2018-04-02
tags: ["Elixir", "Meteor", "Security", "Announcement", "Inject Detect"]
related: []
---

It's with a heavy heart that I'm announcing that my security-focused SaaS application, Inject Detect, [is shutting down](http://www.injectdetect.com/goodbye/).

The goal of Inject Detect was to fight against NoSQL Injection vulnerabilities in Meteor applications. I still believe that this is a worthy cause, but I don't think the approach taken by Inject Detect was the right one.

I talked with many customers and their primary concern with Inject Detect was the idea of sending their applications' queries to a third-party service. No amount of explaining that only the _structure_ of these queries, not the queries themselves were being transmitted could assuage their worries.

It makes me happy to think that my customers' focus on security dissuaded them from using an application focused on security, and it's obvious, in hindsight, that this would be an issue.

---- 

Inject Detect was the largest Elixir-based project I'd ever worked on at the time it was released, and it was my first real foray into the world Event Sourced systems. I invested nearly six months of my free time and time between client engagements working on Inject Detect, and I don't want that work to go to waste.

With that in mind, I've decided to open source [the Inject Detect project on Github](https://github.com/pcorey/inject_detect/). While you're digging through the code, be sure to check out [the `InjectDetect.CommandHandler`{:.language-javascript}](https://github.com/pcorey/inject_detect/blob/master/lib/inject_detect/command_handler.ex) module and [the `InjectDetect.State`{:.language-javascript}](https://github.com/pcorey/inject_detect/blob/master/lib/inject_detect/state.ex) module. These two modules are the heart of the system and the driving force behind my implementation of Event Sourcing.

Truth be told, I'm still in love with the concept of Event Sourcing, and I believe that it's the future of web development. I plan on spending more time in the future diving into that topic.

---- 

While I'm shutting down Inject Detect, I'm not giving up the war against NoSQL Injection. Instead, I'm doubling down and focusing my efforts on my newest project, [Secure Meteor](http://www.securemeteor.com/).

Secure Meteor is an upcoming guide designed to help you secure your Meteor application by teaching you the ins and outs of Meteor security.

If you're a Meteor application owner, a Meteor developer, or are just interested in Meteor security and NoSQL Injection, I highly recommend you head over to [www.securemeteor.com](http://www.securemeteor.com/) and grab a copy of [my Meteor security checklist](http://www.securemeteor.com/#sign-up).

RIP Inject Detect. Long live Secure Meteor!
