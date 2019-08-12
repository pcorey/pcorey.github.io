---
layout: post
title:  "Allow Yourself to do Things Poorly"
excerpt: "Giving yourself permission to do things poorly can be liberating. Forgiving yourself for hacking together code is sometimes a prerequisite for productivity."
author: "Pete Corey"
date:   2018-12-03
tags: ["Meta", "Music"]
related: []
image: "https://s3-us-west-1.amazonaws.com/www.east5th.co/img/allow-yourself-to-do-things-poorly/Current.png"
---

I often find myself stuck at the beginning of things. Haunted by past mistakes, I vow to myself that “I’ll do things right this time.” Unfortunately, insisting on doing everything “right” is crippling. Largely because doing everything “right” is impossible.

Lately I’ve stopped beating myself over the head for doing things that I know aren’t “best practice”, and instead I’ve given myself the freedom to start doing things poorly.

It’s been liberating.

## Analysis Paralysis

My Elixir-based Chord project is coming along nicely. While [my ASCII-based chord chart renderer](http://www.petecorey.com/blog/2018/07/30/voice-leading-with-elixir/) is incredibly helpful for visualizing chords in the terminal, it’s still difficult to sift through several thousand chords at a time.

Reluctantly, I realized that my Chord project needed a web-based front-end.

These days, my go-to tool for building a front-end is React. However, I’ve built enough React applications for clients and in my personal work to know that if you’re not vigilant and strict, the complexity of a React project can quickly spiral out of control. I was determined not to allow that to happen this time around.

Not only that, but I wasn’t sure how best to build the user interface. Chord offers users a huge number of potential knobs to tweak, and the resulting sets of data can be massive and hard to sift through. How do we best present everything to the user?

I was paralyzed.

## Get Going

After several days of hemming, hawing, and wringing my hands over architectural decisions and uncertainties over how I wanted the user experience to go, I decided that I was wasting my time.

It’s better, I convinced myself, to just get something built. Even if it’s built poorly and even if it isn’t an ideal interface for the tool, something is better than nothing. I essentially decided to start building a rough draft of the application.

The first thing I needed was a way to render chord charts in the browser. After an hour or so of [writing some absolutely awful React code](https://twitter.com/petecorey/status/1035657245457928192), I was there.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/allow-yourself-to-do-things-poorly/Random+Chords.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Randomly generated chords.</p>
</div>

Next, I needed a way to pull chords from the back-end Elixir server and render them using our new chord chart component. After another couple hours of hacking together a (poorly designed and roughly implemented) GraphQL data layer, I was greeted with several hundred Cmaj7 chords:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/allow-yourself-to-do-things-poorly/All+Cmaj7.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">All Cmaj7 chords.</p>
</div>

At this point, I was stuck on how to proceed. How could I easily let users build chord progressions from the possibilities presented? I started iterating on a few ideas, mostly involving nested trees, but nothing seemed to click.

## Awash in Inspiration

Several days later, I was browsing Reddit and I stumbled across this screenshot from [/r/unixporn](https://www.reddit.com/r/unixporn). I was completely inspired. This is what I wanted my project to look like!

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/allow-yourself-to-do-things-poorly/Desktop.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">My inspiration.</p>
</div>

I fired up CodePen and started hashing out some mockups of how the application might look.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/allow-yourself-to-do-things-poorly/Mockup.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Codepen mockup.</p>
</div>

Happy with the direction I was heading, I quickly translated the hard-coded, mocked-up HTML into my already existing React components. The results were promising.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/allow-yourself-to-do-things-poorly/With+Data.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">With data.</p>
</div>

Seeing real data on the screen gave me even more ideas on how to interact with the application.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/allow-yourself-to-do-things-poorly/With+Data+and+Note+Controls.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">With data.</p>
</div>

I was awash in inspiration.

## Riding the Wave

This cycle of building and playing with what I’d built kept up for days. Every few hours I’d pester my wife and show her what I’d added, because _I was so excited._ I didn’t take the time during this process to focus on best practices or code quality. Instead, I focused on getting results.

Eventually, that wave rolled back, and I was left with a mostly functional and mostly ugly codebase. It became more difficult to make changes to the codebase, and with my inspiration fading, I wasn’t motivated to push through the pain.

At this point, I turned my attention towards refactoring my original code. Now was the time to focus on best practices and doing things “right”.

While I’m still not fully happy with the codebase or the user interface, I’m very happy with how far I’ve come in such a short time. I never would have made this progress if I didn’t allow myself to do things poorly, just for the sake of getting things done. If I was still at the beginning, fixated on engineering a “correct” solution, I wouldn’t have had the raw materials required to turn my inspiration into a tangible product.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/allow-yourself-to-do-things-poorly/Current.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">The current state of things.</p>
</div>
