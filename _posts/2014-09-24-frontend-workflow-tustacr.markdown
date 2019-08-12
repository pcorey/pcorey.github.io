---
layout: post
title:  "Frontend Workflow - T.U.S.T.A.C.R. Part 1"
titleParts: ["Frontend Workflow", "T.U.S.T.A.C.R.", "Part 1"]
excerpt: "Follow along as I build out the front-end of a URL shortener built using Firebase!"
author: "Pete Corey"
date:   2014-09-24
tags: ["Javascript", "Firebase", "CSS", "Video"]
---

I recently discovered [Firebase](https://www.firebase.com/), and I’m pumped about it. I wanted to make a small project to try it out, so I figured I’d make a URL shortener. Now, I’m pretty confident that this URL shortener is going to totally and completely rock, so I decided to name it [thisurlshortenertotallyandcompletely.rocks](http://www.thisurlshortenertotallyandcompletely.rocks/). So, with a new small project in the works, I figured that this would be a great time to document my usual front-end workflow. You can see an overdubbed timelapse of the process and read through some of my thoughts about it below.

<div style="position: relative; padding-bottom: 56.25%; padding-top: 25px; height: 0;">
    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="//www.youtube.com/embed/b_9rGR1U4V0" frameborder="0" allowfullscreen></iframe>
</div>

## Sketch In the Browser

I’m a big fan of “sketching” in the browser. My usual workflow involves laying out my base DOM elements and applying some rough styles to get them behaving how I want.  After that’s done, I like to open the page in Chrome and start playing with the styles using the [Chrome Dev Tools](https://developer.chrome.com/devtools). The immediate feedback is invaluable. Once I land on styles that I like, I’ll clean them up and organize them into my CSS/[LESS](http://lesscss.org/)/[SASS](http://sass-lang.com/) files.

## CSS Generators

When I'm in a hurry, or want to mock something up quickly, I tend to use online CSS generators ([css3factory](http://www.css3factory.com/), [css3gen](http://css3gen.com/)). The visual feedback they give me is pretty useful when I’m designing-as-I-go. I used a few during the couple hours I spent on this project.

## Responsiveness

On this project, I built the desktop version of the site first and added smaller viewport style changes at the end of the build. After the desktop layout was finished, I simply resized the browser until I found points where the content no longer worked.  By "no longer worked", I mean things like the header looked too large in proportion to the rest of the page, or where text was wrapping or overflowing, or where an element was pushed off of the screen, etc... When I found these places, I added media queries targeting that resolution to fix the issue.

## Cross Browser Testing

I’m a huge fan of [BrowserStack](http://www.browserstack.com/) and I use it for all of my browser and device testing. Unless I am working on a potentially hairy feature, this is usually the last step in my process. I’ll run the site through each of the browsers I’m building for, look for issues, fix, rinse and repeat.

## How to Improve

Looking back, there are lots of places where I can improve this workflow. First thing’s first, I should really ditch sketching in the browser in favor of some kind of [LiveReload](http://livereload.com/) setup. This would eliminate the need to copy styles out of the browser and back into my codebase, and it would totally eliminate the mental context switching I have to do jumping from my browser to my editor.

I should also take more advantage of LESS [mixin libraries](http://lesshat.madebysource.com/). I tend to use online generators because of the visual interaction, but a LiveReload setup combined with a nice mixin library might make up for the lack of visual feedback. At the very least, I should transform the CSS I get from generators back into a LESS mixin for readability and maintainability.

Check out the final UI [here](http://www.thisurlshortenertotallyandcompletely.rocks/). I’m planning on building out the Firebase/AngularJS/[AngularFire](https://www.firebase.com/docs/web/libraries/angular/index.html) “backend” next week. Stay tuned for another video and a blog post.
