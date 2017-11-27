---
layout: post
title:  "CrossView Fun With CSS"
titleParts: ["CrossView Fun", "With CSS"]
description: "CrossView illusions are an interesting way of hiding information in plain sight."
author: "Pete Corey"
date:   2014-11-02
tags: ["CSS", "Experiments"]
---

I while ago I stumbled across the [CrossView subreddit](http://www.reddit.com/r/crossview). I thought the text CrossView images that contained hidden messages were especially cool. So, I decided to try to create one using simple HTML/CSS.  The process was really simple. Check out the codepen below, or view it in fullscreen to better see the effect:

<p data-height="500" data-theme-id="0" data-slug-hash="ngira" data-default-tab="result" data-user="pcorey" class='codepen'>See the Pen <a href='http://codepen.io/pcorey/pen/ngira/'>Cross View Text Test</a> by Pete Corey (<a href='http://codepen.io/pcorey'>@pcorey</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

The effect is created by moving specific words on the left text up a couple pixels, and words on the right side down. The greater the offset, the greater emphasis they're given when crossviewed. For this font and text size, I found that a 4px span worked well.

This could easily be built into a web-based tool to generate text crossview images. I may work on that in the future if there is any interest in that kind of thing.
