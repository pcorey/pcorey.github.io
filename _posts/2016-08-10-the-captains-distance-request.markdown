---
layout: post
title:  "The Captain's Distance Request"
description: "This Literate Commits post solves a code kata related to finding the distance between two points on earth using the heversine formula. Here be dragons!"
author: "Pete Corey"
date:   2016-08-10
repo: "https://github.com/pcorey/the-captains-distance-request"
literate: true
tags: ["Javascript", "Codewars", "Literate Commits"]
---


# [Project Setup]({{page.repo}}/commit/ea60bcf00bdabf4bbf1ec6e34a46af3b83ce069e)

Under [the captain's
orders](https://www.codewars.com/kata/the-captains-distance-request),
we'll be implementing a method that calculates the distance between two
points on Earth given in degree/minute/second format.

As always, we'll get started by creating a new project that uses
[Babel](http://babeljs.io/) for ES6 transpilation and
[Mocha](http://mochajs.org/) for all of our testing needs.


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
+    it("works");
+
+});
</code></pre>



# [The Simplest Test]({{page.repo}}/commit/6dc19a21f6c97668f73821e4201edf1293306be6)

To get started, we'll write the simplest test we can think of. We would
expect the distance between two identical coordinates to be zero
kilometers:

<pre class='language-javascript'><code class='language-javascript'>
expect(distance(
    "48° 12′ 30″ N, 16° 22′ 23″ E",
    "48° 12′ 30″ N, 16° 22′ 23″ E"
)).to.equal(0);
</code></pre>

At first, our test suite does not run. `distance`{:.language-javascript} is undefined. We can
easily fix that by exporting `distance`{:.language-javascript} from our main module and
importing it into our test module.

Now the suite runs, but does not pass. It's expecting `undefined`{:.language-javascript} to
equal `0`{:.language-javascript}. We can fix this by having our new `distance`{:.language-javascript} function return
`0`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+export function distance(coord1, coord2) {
+    return 0;
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 import { expect } from "chai";
+import { distance } from "../";
 
-describe("index", function() {
+describe("The captain's distance", function() {
 
-    it("works");
+    it("calculates the distance between two points", () => {
+        let coord1 = "48° 12′ 30″ N, 16° 22′ 23″ E";
+        let coord2 = "48° 12′ 30″ N, 16° 22′ 23″ E";
+
+        expect(distance(coord1, coord2)).to.equal(0);
+    });
 
</code></pre>



# [Splitting on Lat/Lon]({{page.repo}}/commit/0348c230b3a34f469eb1bd171af42b4956f1cc11)

We can think of our solution as a series of transformations. The first
transformation we need to do is splitting our comma separated lat/lon
string into two separate strings. One that holds the latitude of our
coordinate, and the other that holds the longitude.

<pre class='language-javascript'><code class='language-javascript'>
expect(splitOnLatLon("48° 12′ 30″ N, 16° 22′ 23″ E")).to.deep.equal([
    "48° 12′ 30″ N",
    "16° 22′ 23″ E"
]);
</code></pre>

We can test that a function called `splitOnLatLon`{:.language-javascript} does just this.

Implementing `splitOnLatLon`{:.language-javascript} is just a matter of stringing together a
few [Lodash](https://lodash.com/) function calls.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+import _ from "lodash";
+
+export function splitOnLatLon(coord) {
+    return _.chain(coord)
+        .split(",")
+        .map(_.trim)
+        .value();
+}
+
 export function distance(coord1, coord2) {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 import { expect } from "chai";
-import { distance } from "../";
+import {
+    distance,
+    splitOnLatLon
+} from "../";
 
 ...
 it("calculates the distance between two points", () => {
-        let coord1 = "48° 12′ 30″ N, 16° 22′ 23″ E";
-        let coord2 = "48° 12′ 30″ N, 16° 22′ 23″ E";
+        expect(distance(
+            "48° 12′ 30″ N, 16° 22′ 23″ E",
+            "48° 12′ 30″ N, 16° 22′ 23″ E"
+        )).to.equal(0);
+    });
 
-        expect(distance(coord1, coord2)).to.equal(0);
+    it("splits on lat/lon", () => {
+        expect(splitOnLatLon("48° 12′ 30″ N, 16° 22′ 23″ E")).to.deep.equal([
+            "48° 12′ 30″ N",
+            "16° 22′ 23″ E"
+        ]);
 });
</code></pre>



# [DMS To Decimal]({{page.repo}}/commit/f96a2dbade6cf16c5941c7e02d655eb2b6b493e7)

The next step in our transformation is converting our coordinates from
their given degree, minute, second format into a decimal format that we
can use to calculate distance.

We would expect our new `toDecimal`{:.language-javascript} function to take in a DMS string and
return a decimal interpretation of that lat/lon value.

<pre class='language-javascript'><code class='language-javascript'>
expect(toDecimal("48° 12′ 30″ N")).to.be.closeTo(48.2083, 0.001);
</code></pre>

We can represent each DMS string as a regular expression and use ES6
destructuring to easily extract the values we care about:

<pre class='language-javascript'><code class='language-javascript'>
let regex = /(\d+)° (\d+)′ (\d+)″ ((N)|(S)|(E)|(W))/;
let [_, degrees, minutes, seconds, __, N, S, E, W] = regex.exec(dms);
</code></pre>

From there, we do some basic conversions and math to transform the DMS
values into their decimal equivilants.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
 
+export function toDecimal(dms) {
+    let regex = /(\d+)° (\d+)′ (\d+)″ ((N)|(S)|(E)|(W))/;
+    let [_, degrees, minutes, seconds, __, N, S, E, W] = regex.exec(dms);
+    let decimal = parseInt(degrees) +
+                 (parseInt(minutes) / 60) +
+                 (parseInt(seconds) / (60 * 60));
+    return decimal * (N || E ? 1 : -1);
+}
+
 export function distance(coord1, coord2) {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
 distance,
-    splitOnLatLon
+    splitOnLatLon,
+    toDecimal
 } from "../";
 ...
 
+    it("converts dms to decimal format", () => {
+        expect(toDecimal("48° 12′ 30″ N")).to.be.closeTo(48.2083, 0.001);
+        expect(toDecimal("48° 12′ 30″ S")).to.be.closeTo(-48.2083, 0.001);
+        expect(toDecimal("16° 22′ 23″ E")).to.be.closeTo(16.3730, 0.001);
+        expect(toDecimal("16° 22′ 23″ W")).to.be.closeTo(-16.3730, 0.001);
+    });
+
 });
</code></pre>



# [The Haversine Formula]({{page.repo}}/commit/3ae294cc21d6871206aca495b827c80ceddcf328)

The next step in our transformation is using the two sets of latidudes
and longitudes we've constructured to calculate the distance between
our two points.

We would expect the same two points to have zero distance between them:

<pre class='language-javascript'><code class='language-javascript'>
expect(haversine(
    48.2083, 16.3730,
    48.2083, 16.3730,
    6371
)).to.be.closeTo(0, 0.001);
</code></pre>

And we would expect another set of points to have a resonable amount of
distance between them:

<pre class='language-javascript'><code class='language-javascript'>
expect(haversine(
    48.2083, 16.3730,
    16.3730, 48.2083,
    6371
)).to.be.closeTo(3133.445, 0.001);
</code></pre>

The `haversize`{:.language-javascript} function is a fairly uninteresting implementation of the
[Haversine Formula](http://andrew.hedges.name/experiments/haversine/).
After implementing this formula, our tests pass!


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
 
+export function haversine(lat1, lon1, lat2, lon2, R) {
+    let dlon = lon2 - lon1;
+    let dlat = lat2 - lat1;
+    let a = Math.pow(Math.sin(dlat/2), 2) +
+            Math.cos(lat1) *
+            Math.cos(lat2) *
+            Math.pow(Math.sin(dlon/2), 2);
+    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
+    return R * c;
+}
+
 export function distance(coord1, coord2) {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
 splitOnLatLon,
-    toDecimal
+    toDecimal,
+    haversine
 } from "../";
 ...
 it("converts dms to decimal format", () => {
-        expect(toDecimal("48° 12′ 30″ N")).to.be.closeTo(48.2083, 0.001);
-        expect(toDecimal("48° 12′ 30″ S")).to.be.closeTo(-48.2083, 0.001);
-        expect(toDecimal("16° 22′ 23″ E")).to.be.closeTo(16.3730, 0.001);
-        expect(toDecimal("16° 22′ 23″ W")).to.be.closeTo(-16.3730, 0.001);
+        expect(toDecimal("48° 12′ 30″ N")).to.be.closeTo(48.208, 0.001);
+        expect(toDecimal("48° 12′ 30″ S")).to.be.closeTo(-48.208, 0.001);
+        expect(toDecimal("16° 22′ 23″ E")).to.be.closeTo(16.373, 0.001);
+        expect(toDecimal("16° 22′ 23″ W")).to.be.closeTo(-16.373, 0.001);
+    });
+
+    it("calculates distance using the haversine formula", () => {
+        expect(haversine(
+            48.2083, 16.3730,
+            48.2083, 16.3730,
+            6371
+        )).to.be.closeTo(0, 0.001);
+
+        expect(haversine(
+            48.2083, 16.3730,
+            16.3730, 48.2083,
+            6371
+        )).to.be.closeTo(3133.445, 0.001);
 });
</code></pre>



# [Finishing the Transformation]({{page.repo}}/commit/004b05fd507fffb2cd6ccf7d35b47aeb28965da7)

Now that we have all of the finished pieces of our transformation we can refactor
our `distance`{:.language-javascript} function.

The basic idea is that we want to split out the lat/lon of each
coordinate, convert the DMS coordinates into decimal format, pass the
resulting coordinates into `haversine`{:.language-javascript} and finally round the result.

After doing this refactoring, our tests still pass!


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
 export function distance(coord1, coord2) {
-    return 0;
+    return _.chain([coord1, coord2])
+        .map(splitOnLatLon)
+        .flatten()
+        .map(toDecimal)
+        .thru(([lat1, lon1, lat2, lon2]) => haversine(lat1, lon1, lat2, lon2, 6371))
+        .divide(10)
+        .floor()
+        .multiply(10)
+        .value();
 }
</code></pre>



# [Final Tests and Bug Fixes]({{page.repo}}/commit/c2694b32c0ef4715eac5e90b1345e1a5c640ad0a)

After adding in the remaining given tests in the code kata, I noticed I
was getting incorrect results form my `distance`{:.language-javascript} function. After looking
at my code, I noticed an obvious error.

My `toDecimal`{:.language-javascript} function was returning coordinates in degrees, but the
`haversine`{:.language-javascript} function was expecting the coordinates to be in radians.

The fix to our `toDecimal`{:.language-javascript} function was simply to convert the result to
radians by multipling by `Math.PI / 180`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
return decimal * (N || E ? 1 : -1) * (Math.PI / 180);
</code></pre>

After making this change and refactoring our `toDecimal`{:.language-javascript} tests, all of
our tests passed.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
              (parseInt(seconds) / (60 * 60));
-    return decimal * (N || E ? 1 : -1);
+    return decimal * (N || E ? 1 : -1) * (Math.PI / 180);
 }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
     )).to.equal(0);
+
+        expect(distance(
+            "48° 12′ 30″ N, 16° 22′ 23″ E",
+            "23° 33′ 0″ S, 46° 38′ 0″ W"
+        )).to.equal(10130);
+
+        expect(distance(
+            "48° 12′ 30″ N, 16° 22′ 23″ E",
+            "58° 18′ 0″ N, 134° 25′ 0″ W"
+        )).to.equal(7870);
 });
 ...
 it("converts dms to decimal format", () => {
-        expect(toDecimal("48° 12′ 30″ N")).to.be.closeTo(48.208, 0.001);
-        expect(toDecimal("48° 12′ 30″ S")).to.be.closeTo(-48.208, 0.001);
-        expect(toDecimal("16° 22′ 23″ E")).to.be.closeTo(16.373, 0.001);
-        expect(toDecimal("16° 22′ 23″ W")).to.be.closeTo(-16.373, 0.001);
+        expect(toDecimal("48° 12′ 30″ N")).to.be.closeTo(0.841, 0.001);
+        expect(toDecimal("48° 12′ 30″ S")).to.be.closeTo(-0.841, 0.001);
+        expect(toDecimal("16° 22′ 23″ E")).to.be.closeTo(0.285, 0.001);
+        expect(toDecimal("16° 22′ 23″ W")).to.be.closeTo(-0.285, 0.001);
 });
</code></pre>


# Final Thoughts

Lately, we’ve been playing around with functional programming and languages like [Elixir](http://elixir-lang.org/). Functional languages encourage you to express your programs as a series of pure transformations of your data.

This practice problem definitely shows some influences from that style of thinking. We leaned heavily on [Lodash](https://lodash.com/) and wrote most of our functions as neatly chained transformations of their arguments.

While Javascript may not be the best language for writing code in this style, I’m a big fan of these kind of functional transformation pipelines. I feel like they produce very clear, very easily to follow functions and programs.

Be sure to check out the [Github repo](https://github.com/pcorey/the-captains-distance-request) if you want to see the final source for this project!
