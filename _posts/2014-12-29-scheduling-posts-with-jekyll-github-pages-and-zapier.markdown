---
layout: post
title:  "Scheduling Posts with Jekyll, Github Pages & Zapier"
titleParts: ["Scheduling Posts with", "Jekyll, Github", "Pages & Zapier"]
description: "Find out how I'm using Zapier to schedule posts to my Jekyll-powered blog hosted on Github Pages!"
author: "Pete Corey"
date:   2014-12-29
tags: ["Jekyll", "Zapier"]
---

I’ve written a [few](http://1pxsolidtomato.com/2014/08/27/prismjs-on-github-pages/) [times](http://1pxsolidtomato.com/2014/08/28/jekyll-less-gruntfile/) about using [Jekyll](http://jekyllrb.com/) and [Github Pages](https://pages.github.com/) as my blogging stack. So far, I’ve been very satisfied with this setup except for one pain point. I’m unable to easily write posts and schedule them to go live at a later date… Until now! While I could have written and hosted a script or two to accomplish what I was after, I wanted to take a different approach. I ended up using [Zapier](https://zapier.com/app/dashboard) to automate the publishing of posts at future dates.

## The Game Plan

The basic idea behind using Zapier to schedule future Jekyll posts with Github Pages is two part. First, create a [git](http://git-scm.com/) branch that holds commits for posts you want scheduled for release. A zap listens for commits pushed to this branch and [creates a Google Calendar event](https://zapier.com/help/advanced-tips/#delaying-zaps-with-google-calendar) at the date and time you want to schedule the post to go live. A second zap listens for these calendar events to start and creates an instant-merging pull request into master from the post’s commit.

## Scheduling Posts

The first zap will listen for commits to a specific branch (I called mine <code class="language-*">scheduled</code>) on a Github repository.

<img style="max-width: 100%" src="http://i.imgur.com/dqZWD8e.png">

When a commit is pushed, Zapier will create a Google Calendar event at the date and time specified in the git commit message. It will also store the SHA identifying the commit in the location attribute of the calendar event.

<img style="max-width: 100%" src="http://i.imgur.com/zRaXWkT.png">

It’s important to note that scheduling posts in this way means that the only text you can put into your git commit message is the date and time the date will go live. Actual commit messages may give unexpected results.

I’ve shared a [zap template](http://zpr.io/qdZv) for this step.

## Merging to Master

The next step of the process happens when the Google Calendar event starts (when your post is scheduled to go live). A second zap is triggered when this event starts. The zap pulls the post’s SHA from the location attribute of the event and create a Github merge request into master. By making the merge an “instant merge”, the commit will immediately be pulled into master, which in turn causes Github to rebuild your Jekyll site.

<img style="max-width: 100%" src="http://i.imgur.com/xno7K7h.png">

I’ve shared a [zap template](http://zpr.io/qdj6) for this step as well.

## On Zapier & Final Thoughts

Sure, I could have implemented this as a shell script or simple program in a variety of ways, but I think that Zapier is a really elegant solution to this problem. The way Zapier composes webapps together is very interesting, vastly useful and can come with some unforeseen benefits. For example, using Google Calendar as the driver of my scheduling system has an added benefit of giving me a nice user interface to modify release dates of posts before they go live. I could also easily trigger things like tweets, emails, etc. to be send when a post goes live.

<span style="text-decoration: line-through; color: #aaa">I did find myself wishing that Zapier came with a few string manipulation features. Instead of dumping the entire git commit into the calendar’s schedule date, I was hoping to slice out only a portion of the commit message, or use the last line or something. Maybe this kind of functionality will come in the future, or maybe it already exists and I just couldn’t find it.</span> See my [followup post](/blog/2015/01/05/zapier-named-variables-scheduling-posts-part-2/) on using [named variables](https://zapier.com/help/named-variables/) to extract a schedule date from the git commit message.

As a proof of concept, I’ll be scheduling this post to go live on December 29th, 2014. See you then!
