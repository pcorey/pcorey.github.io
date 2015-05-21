---
layout: post
title:  "Responsive SVG Height Issue"
titleParts: ["Responsive SVG", "Height Issue"]
date:   2014-09-09
categories:
---

You may have noticed, but I've been having some issues with the svg logo I'm using for this blog. I'm not specifiying explicit <code class="language-*">height</code> or <code class="language-*">width</code> attributes on the svg element, but I am setting a <code class="language-*">viewBox</code> attribute. This lets me specify the height and/or width of the element through my css. If only the <code class="language-*">width</code> or <code class="language-*">height</code> is specified, the other attribute will scale accordingly, preserving the aspect ratio of the svg. After some feedback and testing with [browserstack](http://www.browserstack.com/), I found out that this wasn't behaving as I thought it would on some browsers.

<svg viewbox="0 0 100 25" style="float: right; display: block; width: 200px; height: 100%;">
    <text style="font-family: 'Josefin Sans', sans-serif; fill: #444444;" transform="matrix(1,0,0,1,0,20)">1pxsolid<tspan style="fill: tomato;">tomato</tspan></text>
</svg>

When the logo is displayed in the navbar, I indirectly set the <code class="language-*">width</code> to 150px (by setting the wrapping container's width to 150px). Because the <code class="language-*">viewBox</code> is set to <code class="language-*">"0 0 100 25"</code>, I would expect the <code class="language-*">height</code> of the rendered svg to be 38px (0.25 * 150px). This worked as expected in Chrome 37 and Firefox 31 on my windows machine. But strangely, in IE 11 the height of the svg element was set to 150px. Even more strangely, in Chrome 37 and Safari 7 on OSX the height of the svg seemed to be stretching to over 1000px.

The fix was very simple. Setting a <code class="language-*">max-height</code> of 100% on the svg element will correctly set the height of the svg on all browsers.

<pre class="language-css"><code class="language-css">svg {
    width: 150px;
    max-height: 100%;
}
</code></pre>

Honestly, I'm not entirely sure why this was happening. If I had to guess, I would assume it had something to do with [this WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=82489).