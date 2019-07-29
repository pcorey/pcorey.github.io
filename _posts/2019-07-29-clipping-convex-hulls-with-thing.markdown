---
layout: post
title:  "Clipping Convex Hulls with Thi.ng!"
description: "I recently discovered Thi.ng, a set of computational design tools created by the Clojure and Clojurescript community, and it helped me traverse my way through a sea of points and polygons. Check out how we can use the tools to generate convex hulls, clip polygons, and calculate polygon areas."
author: "Pete Corey"
date:   2019-07-29
tags: ["Javascript", "Geometry", "Thi.ng"]
related: []
image: "/img/2019-07-29-clipping-convex-hulls-with-thing/image.png"
---

<style>
canvas {
  width: 100%;
  height: 100%;
}
</style>


I recently found myself knee-deep in a sea of points and polygons. Specifically, I found myself with two polygons represented by two random sets of two dimensional points. I wanted to convert each set of points into a convex polygon, or a [convex hull](https://en.wikipedia.org/wiki/Convex_hull), and find the overlapping area between the two.

After doing some research, I learned about the existence of a few algorithms that would help me on my quest:

- [Graham's scan](https://en.wikipedia.org/wiki/Graham_scan) can be used to build a convex hull from a set of randomly arranged points in two dimensional space.
- The [Sutherland–Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm) can be used to construct a new "clip polygon" that represents the area of overlap between any two convex polygons.
- The [shoelace formula](https://en.wikipedia.org/wiki/Shoelace_formula) can be used to compute the area of any simple polygon given its clockwise or counterclockwise sorted points.

My plan of attack is to take my two random sets of two dimensional points, run them through Graham's scan to generate two convex hulls, computed a new "clip polygon" from those two polygons, and then use the shoelace formula to compute and compare the area of the clip polygon to the areas of the two original polygons.

Before diving in and building a poorly implemented, bug riddled implementation of each of these algorithms, I decided to see if the hard work had already been done for me. As it turns out, it had!

I discovered that [the `@thi.ng`{:.language-javascript} project](http://thi.ng/) a , which is a set of computational design tools for Clojure and Clojurescript and also includes a smorgasbord of incredibly useful [Javascript packages](https://github.com/thi-ng/umbrella), contains exactly what I was looking for.

- `@thi.ng/geom-hull`{:.language-javascript} implements Graham's scan.
- `@thi.ng/geom-clip`{:.language-javascript} implements the Sutherland–Hodgman clipping algorithm.
- `@thi.ng/geom-poly-util`{:.language-javascript} implements the shoelace formula.

Perfect!

Let's use these libraries, along with HTML5 canvas, to build a small proof of concept. We'll start by writing a function that generates a random set of two dimensional points:

<pre class="language-javascript"><code class="language-javascript">
const generatePoints = (points, width, height) =>
  _.chain(points)
    .range()
    .map(() => [
      width / 2 + (Math.random() * width - width / 2),
      height / 2 + (Math.random() * height - height / 2)
    ])
    .value();
</code></pre>

Next, let's use our new `generatePoints`{:.language-javascript} function to generate two sets of random points and render them to a canvas (we're glossing over the canvas creation process):


<pre class="language-javascript"><code class="language-javascript">
const drawPoints = (points, size, context) =>
  _.map(points, ([x, y]) => {
    context.beginPath();
    context.arc(x, y, size, 0, 2 * Math.PI);
    context.fill();
  });

let points1 = generatePoints(5, width * ratio, height * ratio);
let points2 = generatePoints(5, width * ratio, height * ratio);

context.fillStyle = "rgba(245, 93, 62, 1)";
drawPoints(points1, 10, context);

context.fillStyle = "rgba(118, 190, 208, 1)";
drawPoints(points2, 10, context);
</code></pre>

<div id="root1" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0;"></div>

The points on this page are generated randomly, once per page load. If you'd like to continue with a different set of points, refresh the page. Now we'll use Graham's scan to convert each set of points into a convex hull and render that onto our canvas:

<pre class="language-javascript"><code class="language-javascript">
import { grahamScan2 } from "@thi.ng/geom-hull";

const drawPolygon = (points, context) => {
  context.beginPath();
  context.moveTo(_.first(points)[0], _.first(points)[1]);
  _.map(points, ([x, y]) => {
    context.lineTo(x, y);
  });
  context.fill();
};

let hull1 = grahamScan2(points1);
let hull2 = grahamScan2(points2);

context.fillStyle = "rgba(245, 93, 62, 0.5)";
drawPolygon(hull1, context);

context.fillStyle = "rgba(118, 190, 208, 0.5)";
drawPolygon(hull2, context);
</code></pre>

<div id="root2" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0;"></div>

We can see that there's an area of overlap between our two polygons (if not, refresh the page). Let's use the Sutherland-Hodgman algorithm to construct a polygon that covers that area and render it's outline to our canvas:

<pre class="language-javascript"><code class="language-javascript">
import { sutherlandHodgeman } from "@thi.ng/geom-clip";

let clip = sutherlandHodgeman(hull1, hull2);

context.strokeStyle = "rgba(102, 102, 102, 1)";
context.beginPath();
context.moveTo(_.first(clip)[0], _.first(clip)[1]);
_.map(clip, ([x, y]) => {
  context.lineTo(x, y);
});
context.lineTo(_.first(clip)[0], _.first(clip)[1]);
context.stroke();
</code></pre>

<div id="root3" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0;"></div>

Lastly, let's calculate the area of our two initial convex hulls and the resulting area of overlap between then. We'll render the area of each at the "center" of each polygon:

<pre class="language-javascript"><code class="language-javascript">
import { polyArea2 } from "@thi.ng/geom-poly-utils";

const midpoint = points =>
  _.chain(points)
    .reduce(([sx, sy], [x, y]) => [sx + x, sy + y])
    .thru(([x, y]) => [x / _.size(points), y / _.size(points)])
    .value();

const drawArea = (points, context) => {
  let [x, y] = midpoint(points);
  let area = Math.round(polyArea2(points));
  context.fillText(area, x, y);
};

context.fillStyle = "rgba(245, 93, 62, 0.5)";
drawArea(hull1, context);
context.fillStyle = "rgba(118, 190, 208, 0.5)";
drawArea(hull2, context);
context.fillStyle = "rgba(102, 102, 102, 1)";
drawArea(clip, context);
</code></pre>

<div id="root4" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0;"></div>

As you can see, with the right tools at our disposal, this potentially difficult task is a breeze. I'm incredibly happy that I discovered the `@thi.ng`{:.language-javascript} set of libraries when I did, and I can see myself reaching for them in the future.

<script src="/js/2019-07-29-clipping-convex-hulls-with-thing/runtime.js"></script>
<script src="/js/2019-07-29-clipping-convex-hulls-with-thing/app.js"></script>
<script src="/js/2019-07-29-clipping-convex-hulls-with-thing/main.js"></script>
