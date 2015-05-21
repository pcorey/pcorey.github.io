---
layout: post
title:  "Aspect Ratio Media Queries"
titleParts: ["Aspect Ratio", "Media Queries"]
date:   2014-12-16
categories:
---

The other day I was playing with a fullscreen CSS layout using viewport units. I had content that was a fixed [aspect-ratio](http://en.wikipedia.org/wiki/Aspect_ratio_%28image%29), and I wanted it to fill as much of the screen as possible without overflowing. At first, I was setting the element's width to <code class="language-*">100vw</code>, but of course, if the aspect ratio of the window was greater than the aspect ratio of the content, the content would overflow off the screen. In those cases, I wanted to bind the height of the content to <code class="language-*">100vh</code>, instead of binding the width to <code class="language-*">100vw</code>.

My first naive attempt to do this was to use [Sass](http://sass-lang.com/)' [max function](http://sass-lang.com/documentation/Sass/Script/Functions.html#max-instance_method) to compare <code class="language-*">100vh</code> with <code class="language-*">100vw</code>:

<pre><code class="language-javascript">$size = max(100vh, 100vw);
</code></pre>

In hindsight, this is obviously not going to work. The result of this expression is going to change as the viewport aspect ratio changes. Fundamentally, this is something Sass can't deal with. Sass kindly explained that to me:

> Error: Incompatible units: 'vh' and 'vw'.

After some googling, I came across [aspect-ratio media queries](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Media_queries#aspect-ratio). This is exactly what I needed! To build my layout, I use an aspect-ratio media query to alternate between binding against <code class="language-*">vh</code> and <code class="language-*">vw</code> based on whether the screen is in a horizontal aspect ratio, or a vertical one.

I whipped up a quick [codepen](http://codepen.io/pcorey/pen/wBGLBv) to show this off. Resize the viewport to see it in action:

<p data-height="500" data-theme-id="0" data-slug-hash="wBGLBv" data-default-tab="result" data-user="pcorey" class='codepen'>See the Pen <a href='http://codepen.io/pcorey/pen/wBGLBv/'>aspect-ratio media queries</a> by Pete Corey (<a href='http://codepen.io/pcorey'>@pcorey</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>