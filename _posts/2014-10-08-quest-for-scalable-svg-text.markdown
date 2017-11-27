---
layout: post
title:  "The Quest for Scalable SVG Text"
titleParts:  ["The Quest for", "Scalable", "SVG Text"]
description: "Creating an SVG with scalable text presents more challenges than you would expect. Especially when you're trying to shoot for full browser compatibility."
author: "Pete Corey"
date:   2014-10-08
tags: ["SVG"]
---

In a [previous post](http://1pxsolidtomato.com/2014/09/09/responsive-svg-height-issue/), I mentioned using SVG to create a scalable text logo. This got me thinking about using SVG text tags to create text blocks that would scale to fit in their parent container. I’ve seen lots of examples of this kind of thing in print media, but I haven’t seen it on the web. A great example of this style can be found on this [seanwes blog post](http://seanwes.com/2013/on-saying-no/). I attempted to recreate the lettering piece from #3 in the code pens below.

## ViewBox Magic

My first attempt was based around the idea of setting an SVG’s <code class="language-*">viewBox</code> attribute equal to the bounding box of its child text element. This sets up the SVG's coordinate system such that the text we want to render will perfectly fill 100% of the SVG's canvas space. Because we're not setting explicit widths and heights on the SVG element, it can be resized through our CSS. Setting its width to 100% causes it to grow to the width of its parent wrapper, and its height will scale in order to maintain the aspect ratio set up by the viewBox. In Chrome and Firefox this worked amazingly well! Check out the pen below:

<p data-height="480" data-theme-id="0" data-slug-hash="ijvAq" data-default-tab="result" data-user="pcorey" class='codepen'>See the Pen <a href='http://codepen.io/pcorey/pen/ijvAq/'>SVG Scalable Text - Chrome & Firefox</a> by Pete Corey (<a href='http://codepen.io/pcorey'>@pcorey</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

## And Then There's IE

Unfortunately, this approach had some issues in IE. While the SVG element correctly expanded to <code class="language-*">400px</code>, the height did not scale correctly. All of the SVG elements had a height of <code class="language-*">150px</code>. Strangely, the aspect ratios of the SVGs were maintained. The extra space above and below the SVGs seemed to be empty whitespace.

Thierry Koblentz’s [intrinsic aspect ratio trick](http://alistapart.com/article/creating-intrinsic-ratios-for-video/) can be used to fix this IE problem, but the fix opens up another set of issues. This fix requires an extra wrapping div around each SVG element, and totally destroys the responsive aspect of using a bare SVG element. Any time the parent wrapper is resized, the top padding on the div wrapping the SVG must be recalculated **. Check out the pen below to see it in action:

<p data-height="482" data-theme-id="0" data-slug-hash="wdGcq" data-default-tab="result" data-user="pcorey" class='codepen'>See the Pen <a href='http://codepen.io/pcorey/pen/wdGcq/'>SVG Scalable Text - IE</a> by Pete Corey (<a href='http://codepen.io/pcorey'>@pcorey</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

## Padding Problems

I’ve also been trying to figure out how to remove the padding above and below the text element returned by the bounding box. I tried to use [getExtentOfChar](http://www.w3.org/TR/SVG/text.html#__svg__SVGTextContentElement__getExtentOfChar) to get a tighter height, but this seemed to return the same height as getBBox. Ideally, I would be able to have the SVG element tightly wrap the text and be able to specify my own padding/margin in the CSS.

If these issues can be solved (or even just the IE issue), I feel like this would be an awesome technique for creating some really amazing layouts and designs. If you've found solutions to either of these problems, please let me know!

## Update - 10/9/2014

** For the IE intrinsic aspect ratio fix, I mentioned that I would need to recalculate the padding-top every time the outer wrapper was resized. That's not true! In the code pen above, I was setting the padding-top to a pixel value, but I can just as easily set it to a percentage, which solves this problem. Check out the updated pen above!
