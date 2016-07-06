---
layout: post
title:  "Point In Polyon"
date:   2016-06-31
tags: ["literate-commits"]
---

# Project Setup

The goal of [today’s
kata](https://www.codewars.com/kata/530265044b7e23379d00076a/train/javascript)
is to implement a function called `pointInPoly`{:.language-javascript}.  `pointInPoly`{:.language-javascript} is
called with a polygon represented as a series of points as the first
argument, and a single point at the second argument. Each point is
represented as a set of `[x, y]`{:.language-javascript} coordinates, where both `x`{:.language-javascript} and `y`{:.language-javascript} are
numbers. `pointInPoly`{:.language-javascript} should return `true`{:.language-javascript} if the point is within the
defined polygon, and `false`{:.language-javascript} if it is not.

The kata description points out several assumptions we can make about
the inputs: 1) The polygon will be a valid simple polygon. That is, it
will have at least three points, none of its edges will cross each
other, and exactly two edges will meet at each vertex.  2) In the tests,
the point will never fall exactly on an edge of the polygon.

And lastly, although the description never explicitly says so, we’re
assuming that the points in the polygon are given in order; each point
shares an edge with the next.

This initial commit sets up our initial project.


<pre class='language-javascriptDiff'><p class='information'>.babelrc</p><code class='language-javascriptDiff'>
+{
+  "presets": ["es2015"]
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>.gitignore</p><code class='language-javascriptDiff'>
+node_modules/
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>package.json</p><code class='language-javascriptDiff'>
+{
+  "main": "index.js",
+  "scripts": {
+    "test": "mocha ./test --compilers js:babel-register"
+  },
+  "dependencies": {
+    "babel-preset-es2015": "^6.9.0",
+    "babel-register": "^6.9.0",
+    "chai": "^3.5.0",
+    "lodash": "^4.12.0",
+    "mocha": "^2.4.5"
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
+import { expect } from "chai";
+
+describe("index", function() {
+
+    it("works", function() {
+        expect(2+2).to.equal(4);
+    });
+
+});
</code></pre>

# The Simplest Test

The first thing we do when we're solving a problem like this is to write
a test. Because we're implementing a function given to us, we already
know what our final interface will look like (`pointInPoly`{:.language-javascript}), so we can
immediately write a test for it.

Our first test asserts that a point at the origin (`[0, 0]`{:.language-javascript}) is within a
simple triangle with points at `[-1, -1]`{:.language-javascript}, `[1, -1]`{:.language-javascript}, and `[0, 1]`{:.language-javascript}.

After writing this test, our test suite complains that `pointInPoly is
not defined`{:.language-javascript}. This is quickly fixed by importing `pointInPoly`{:.language-javascript} into
our test file and then exporting it from `index.js`{:.language-javascript}.

After exporting the empty `pointInPoly`{:.language-javascript} function, the test suite shouts
that it `expected undefined to be true`{:.language-javascript}. To bring us back to green we
change our new `pointInPoly`{:.language-javascript} function to return `true`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+export function pointInPoly(poly, point) {
+    return true;
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
+import { pointInPoly } from "../";
 ...
-describe("index", function() {
+describe("pointInPoly", function() {
 ...
-    it("works", function() {
-        expect(2+2).to.equal(4);
+    it("detects a point in a triangle", function() {
+        let poly = [[-1, -1], [1, -1], [0, 1]];
+        expect(pointInPoly(poly, [0, 0])).to.be.true;
</code></pre>

# Fleshing Out a Strategy

We knew that our initial `pointInPoly`{:.language-javascript} solution was incomplete.
Returning `true`{:.language-javascript} for all cases obviously wasn't going to work.
But what do we do instead? How do we even begin to tackle this
problem?

Thankfully, from my days of video game programming I know that a [simple
test](https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm)
for checking if a point lies within a polygon is to send a ray outward
from that point. If the ray intersects with the lines of the polygon an
odd number of times, the point lies within the polygon. Otherwise, it's
outside.

Since we're in a green state, we can do a little refactoring and
implement a high level version of this solution. We want to count the
number of intersections between our imaginary ray and our polygon:

<pre class='language-javascript'><code class='language-javascript'>
let intersections = countIntersections(poly, point);
</code></pre>

And then return `true`{:.language-javascript} if that count is odd, or `false`{:.language-javascript} if it's even:

<pre class='language-javascript'><code class='language-javascript'>
return !!(intersections % 2);
</code></pre>

After making these changes, our test suite complains that
`countIntersections`{:.language-javascript} does not exist, so let's quickly define it and have
it return `1`{:.language-javascript} to bring us back to green.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+function countIntersections(poly, point) {
+    return 1;
+}
+
 ...
-    return true;
+    let intersections = countIntersections(poly, point);
+    return !!(intersections % 2);
</code></pre>

# Rethinking Our Interfaces

After some soul-searching, I decided I wasn't happy with where we were
going with our previous solution. `countIntersections`{:.language-javascript} was really an
“internal method”. Outside of the context of our point-in-polygon
problem, a function called `countIntersections`{:.language-javascript} that takes in a `poly`{:.language-javascript}
and a `point`{:.language-javascript} really just doesn't make any sense.

Because it was an internal method, I was hesitant to write tests for it.
These tests would be too closely coupled with our implementation, and
would make refactoring difficult. Additionally, `countIntersections`{:.language-javascript}
would most likely call other methods would be even more contextually
dependant and awkward to test.

We needed a cleaner solution.

After reconsidering the problem, it’s clear that we're dealing with a
few really solid abstractions. The most apparent is a `polygon`{:.language-javascript}. If we
implement a generic `polygon`{:.language-javascript}, we'd be able to cleanly specify what we
want from our `pointInPoly`{:.language-javascript} method:

<pre class='language-javascript'><code class='language-javascript'>
function pointInPoly(poly, point) {
    return polygon(poly).surrounds(point);
}
</code></pre>

Additionally, by breaking `polygon`{:.language-javascript} out into a new abstraction, we can
freely build and test its interface to our heart's content.

With this in mind, we wrote a new set of tests that describe `polygon`{:.language-javascript}.
The first tests looks nearly identical to our `pointInPoly`{:.language-javascript} tests and
checks if a polygon surrounds a point.

Our dummy implementation of `polygon.surrounds`{:.language-javascript} simply returns `true`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>polygon.js</p><code class='language-javascriptDiff'>
+export function polygon(_points) {
+
+    let surrounds = (point) => true;
+
+    return {
+        surrounds
+    };
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/polygon.js</p><code class='language-javascriptDiff'>
+import { expect } from "chai";
+import { polygon } from "../polygon";
+
+describe("polygon", function() {
+
+    it("checks if a polygon surrounds a point", function() {
+        let poly = polygon([[-1, -1], [1, -1], [0, 1]]);
+        expect(poly.surrounds([0, 0])).to.be.true;
+    });
+
+});
</code></pre>

# Restating Point-in-Polygon

Now that we've defined our `polygon`{:.language-javascript}, we can restate our
implementation of `surrounds`{:.language-javascript}. We want to `translate`{:.language-javascript} our polygon so
that the `point`{:.language-javascript} we've been given can be treated as the origin. Next
we want to count the number of intersections that an arbitrary ray
(`[0, 1]`{:.language-javascript}) makes with the newly translated polygon:

<pre class='language-javascript'><code class='language-javascript'>
let intersections = translate([-x, -y]).intersections([0, 1]);
</code></pre>

Lastly we want to return `true`{:.language-javascript} from `surrounds`{:.language-javascript} if `intersections`{:.language-javascript} is
odd:

<pre class='language-javascript'><code class='language-javascript'>
return !!(intersections % 2);
</code></pre>

After making these changes, our test suite complains about `translate`{:.language-javascript}
and `intersections`{:.language-javascript} not being defined.

The fastest way to get us back to green is to have `translate`{:.language-javascript} return a
new `polygon`{:.language-javascript}, and have `intersections`{:.language-javascript} return `1`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>polygon.js</p><code class='language-javascriptDiff'>
 ...
-    let surrounds = (point) => true;
+    let surrounds = ([x, y]) => {
+        let intersections = translate([-x, -y]).intersections([0, 1]);
+        return !!(intersections % 2);
+    };
+
+    let translate = ([x, y]) => {
+        return polygon(_points);
+    };
+
+    let intersections = (ray) => 1;
 ...
-        surrounds
+        surrounds,
+        translate,
+        intersections
</code></pre>

# Translate Base Case

Now we can start testing the component pieces of our `surrounds`{:.language-javascript}
function.

First up, let's write a test for `translate`{:.language-javascript}. A straight-forward base
case for `translate`{:.language-javascript} asserts that calling `translate`{:.language-javascript} on an empty
polygon (`[[]]`{:.language-javascript}) should return an empty polygon.

After writing this test, I realized that I needed a function to return
the points from a polygon. Thus, `points`{:.language-javascript} was born.

<pre class='language-javascript'><code class='language-javascript'>
let points = () => _points;
</code></pre>

Suprisingly, our naive solution also works for all calls to translate
where `x`{:.language-javascript} and `y`{:.language-javascript} are zero.


<pre class='language-javascriptDiff'><p class='information'>polygon.js</p><code class='language-javascriptDiff'>
 ...
+    let points = () => _points;
+
 ...
-        intersections
+        intersections,
+        points
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/polygon.js</p><code class='language-javascriptDiff'>
 ...
+    it("translates a polygon", function() {
+        expect(polygon([]).translate([0, 0]).points()).to.deep.equal([]);
+    });
+
</code></pre>

# Finishing Translate

Adding a more complicated test of `translate`{:.language-javascript} shows that we need a
better solution. Thankfully, it isn’t a huge leap to come up with the
final form of the function.

The `translate`{:.language-javascript} function returns a new `polygon`{:.language-javascript} where every point in
the polygon has been incremented by the provided `x`{:.language-javascript} and `y`{:.language-javascript} values.


<pre class='language-javascriptDiff'><p class='information'>polygon.js</p><code class='language-javascriptDiff'>
 ...
-        return polygon(_points);
+        return polygon(_points.map(p => [p[0] + x, p[1] + y]));
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/polygon.js</p><code class='language-javascriptDiff'>
 ...
+        expect(polygon([
+            [0, 0], [5, -5]
+        ]).translate([1, 1]).points()).to.deep.equal([
+            [1, 1], [6, -4]
+        ]);
</code></pre>

# Line Abstraction

Now we turn out attention to the `intersections`{:.language-javascript} function. This still
seems like a daunting piece of functionality, and we should break it
down into simpler pieces, if possible.

If we're not afraid of making use of another abstraction (`line`{:.language-javascript}), a
simple implementation of `intersections`{:.language-javascript} could be written like this:

<pre class='language-javascript'><code class='language-javascript'>
return lines().filter(line => line.intersects(ray)).length;
</code></pre>

In plain english, this reads as "return the number of lines in this
polygon that intersect the given ray".

This is a nice solution. To make it a reality, let’s create a new set
of tests for our new `line`{:.language-javascript} abstraction and a dummy implementation of
`line`{:.language-javascript} and `line.intersects`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>line.js</p><code class='language-javascriptDiff'>
+export function line(a, b) {
+
+    let intersects = (ray) => true;
+
+    return {
+        intersects
+    };
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/line.js</p><code class='language-javascriptDiff'>
+import { expect } from "chai";
+import { line } from "../line";
+
+describe("line", function() {
+
+    it("checks if the line intersects a ray", function() {
+        expect(line([0, 1], [1, 0]).intersects([1, 1])).to.be.true;
+    });
+
+});
</code></pre>

# Finishing Line

Adding another test against `line.intersects`{:.language-javascript} shows that we need a
better solution.

Determining if a line intersects with a ray is a well-documented
problem.  I used [this blog
post](https://rootllama.wordpress.com/2014/06/20/ray-line-segment-intersection-test-in-2d/)
as a guide for implementing my solution. Be sure to check it out for
details on the math being used here.


<pre class='language-javascriptDiff'><p class='information'>line.js</p><code class='language-javascriptDiff'>
 ...
-    let intersects = (ray) => true;
+    function cross(v1, v2) {
+        return (v1[0] * v2[1]) - (v1[1]*v2[0]);
+    }
+
+    function dot(v1, v2) {
+        return v1[0] * v2[0] + v1[1] + v2[1];
+    }
+
+    let intersects = (ray) => {
+        let v1 = [-a[0], -a[1]];
+        let v2 = [b[0] - a[0], b[1] - a[1]];
+        let v3 = [-ray[1], ray[0]];
+
+        let t1 = cross(v2, v1) / (dot(v2, v3));
+        let t2 = (dot(v1, v3)) / (dot(v2, v3));
+
+        return t1 >= 0 && (t2 >= 0 && t2 <= 1);
+    };
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/line.js</p><code class='language-javascriptDiff'>
 ...
+        expect(line([0, 1], [1, 0]).intersects([-1, -1])).to.be.false;
</code></pre>

# Finishing Intersections

Now that `line`{:.language-javascript} and `line.intersects`{:.language-javascript} exist, we can implement our
`polygon.intersections`{:.language-javascript} method.

As usual, we start by adding a test for `intersections`{:.language-javascript}, and then
we make our test suite happy by importing `line`{:.language-javascript}, and creating the
`polygon.lines`{:.language-javascript} function.


<pre class='language-javascriptDiff'><p class='information'>polygon.js</p><code class='language-javascriptDiff'>
+import { line } from "./line";
+
 ...
-    let intersections = (ray) => 1;
+    let intersections = (ray) => {
+        return lines().filter(line => line.intersects(ray)).length;
+    };
 ...
+    let lines = () => {
+        return [line([-1, 1], [1, 1])];
+    }
+
 ...
-        points
+        points,
+        lines
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/polygon.js</p><code class='language-javascriptDiff'>
 ...
+    it("counts intersections with a ray", function() {
+        let poly = polygon([[-1, -1], [1, -1], [0, 1]]);
+        expect(polygon([
+            [-1, -1], [1, -1], [0, 1]
+        ]).intersections([0, 1])).to.equal(1);
+    });
+
</code></pre>

# Constructing Lines

Finally, all we need to do to complete our solution is to build our
`polygon.lines`{:.language-javascript} function. This function should transform the set of
`_points`{:.language-javascript} that were used to define our `polygon`{:.language-javascript} into a set of `line`{:.language-javascript}
objects.

We implement a test for `polygon.lines`{:.language-javascript} and use it to drive the
creation of our solution. Don't forget that the last point in the
polygon must connect back to the first!


<pre class='language-javascriptDiff'><p class='information'>line.js</p><code class='language-javascriptDiff'>
 ...
+    let points = () => [a, b];
+
 ...
-        intersects
+        intersects,
+        points
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>polygon.js</p><code class='language-javascriptDiff'>
 ...
-        return [line([-1, 1], [1, 1])];
+        if ((!_points) || !_points.length) {
+            return [];
+        }
+
+        let last = _points[0];
+        let pairs = _points.slice(1).map((point) => {
+            let segment = line(last, point);
+            last = point;
+            return segment;
+        });
+        pairs.push(line(_points[_points.length - 1], _points[0]));
+
+        return pairs;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/polygon.js</p><code class='language-javascriptDiff'>
 ...
+    it("creates lines for a polygon", function() {
+        let lines = polygon([
+            [-1, -1], [1, -1], [0, 1]
+        ]).lines();
+        expect(lines.map((line) => line.points())).to.deep.equal([
+            [[-1, -1], [1, -1]],
+            [[1, -1], [0, 1]],
+            [[0, 1], [-1, -1]]
+        ]);
+    });
+
</code></pre>

# Pull it all Together

Now that all of our building blocks are finalized, we can come back to
our original `pointInPoly`{:.language-javascript} method and rewrite it exactly how we had
imagined:

<pre class='language-javascript'><code class='language-javascript'>
return polygon(poly).surrounds(point);
</code></pre>

After making this change, our test suite is still green. Everything is
working as expected.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
-function countIntersections(poly, point) {
-    return 1;
-}
+import { polygon } from "./polygon";
 ...
-    let intersections = countIntersections(poly, point);
-    return !!(intersections % 2);
+    return polygon(poly).surrounds(point);
</code></pre>

# Final Test & Bug Fix

At this point, our solution should be finished. However, when we feed in
the tests provided by the kata, we notice a failure.

After digging into what’s happening, we notice that the system was
claiming that a line, `line([4, -6], [4, 4])`{:.language-javascript}, was intersecting with a
ray, `[0, 1]`{:.language-javascript}. Clearly, this is incorrect.

To find out what was causing this, we write a new test against the
`line.intersects`{:.language-javascript} function:

<pre class='language-javascript'><code class='language-javascript'>
expect(line([4, -6], [4, 4]).intersects([0, 1])).to.be.false;
</code></pre>

As expected, this test fails.

After some poking, prodding, and comparing against reference equations,
we notice a typo in the `dot`{:.language-javascript} function. After fixing the dot production
calculation, our entire test suite shifts back to a passing state.

Success!


<pre class='language-javascriptDiff'><p class='information'>line.js</p><code class='language-javascriptDiff'>
 ...
-        return v1[0] * v2[0] + v1[1] + v2[1];
+        return v1[0] * v2[0] + v1[1] * v2[1];
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
+    it("detects a point in a square", function() {
+        var poly = [
+            [-5, -5], [5, -5],
+            [5, 5], [-5, 5]
+        ];
+
+        expect(pointInPoly(poly, [-6, 0])).to.be.false;
+        expect(pointInPoly(poly, [1, 1])).to.be.true;
+    });
+
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/line.js</p><code class='language-javascriptDiff'>
 ...
+        expect(line([4, -6], [4, 4]).intersects([0, 1])).to.be.false;
</code></pre>

# Wrap-up

When you compare [our solution](https://github.com/pcorey/point-in-polygon) with [other submitted solutions](https://www.codewars.com/kata/point-in-polygon-1/solutions), you’ll notice that ours is longer. Our solution probably took much longer to write as well. However, our solution was a fantastic exercise in deliberate practice.

By consciously focusing on writing robust and maintainable code, we had a few introspective moments about our process and our technique.

The first major insight that we had came when we realized we were going down a bad road with the `countIntersections`{:.language-javascript} method. We realized that by leveraging additional abstractions, we could create more testable, maintainable and re-usable code.

At the very end of the process we found a bug in the solution. Thanks to our test suite we were able to almost immediately find the source of the bug and fix it.

Be sure to check out the full project, complete with detail commit messages [on GitHub](https://github.com/pcorey/point-in-polygon).
