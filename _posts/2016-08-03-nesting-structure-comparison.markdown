---
layout: post
title:  "Nesting Structure Comparison"
description: "How do we determine if two array share the same nested structure? This Literate Commits code kata dives deep into the solution."
author: "Pete Corey"
date:   2016-08-03
repo: "https://github.com/pcorey/nesting-structure-comparison"
literate: true
tags: ["Javascript", "Codewars", "Literate Commits"]
---



# [Project Setup]({{page.repo}}/commit/bb7751fd28cc3127bc312422e4f98d55850dd80c)

The goal of [this code kata]({{page.repo}}) is to implement a method on
the `Array`{:.language-javascript} prototype that determines when the current array and another
array provided as input have the same nested structure.

To get a better idea of what we mean by "nested structure", these calls to `sameStructureAs`{:.language-javascript}
would return true:

<pre class='language-javascript'><code class='language-javascript'>
[ 1, 1, 1 ].sameStructureAs( [ 2, 2, 2 ] );
[ 1, [ 1, 1 ] ].sameStructureAs( [ 2, [ 2, 2 ] ] );
</code></pre>

And these would return false:

<pre class='language-javascript'><code class='language-javascript'>
[ 1, [ 1, 1 ] ].sameStructureAs( [ [ 2, 2 ], 2 ] );
[ 1, [ 1, 1 ] ].sameStructureAs( [ [ 2 ], 2 ] );
</code></pre>

We'll start by initializing our project with a basic
[Babel](http://babeljs.io/) and [Mocha](http://mochajs.org/) setup.


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



# [Extending Array]({{page.repo}}/commit/11b0d862c0386f9f147b2dd89e36d29a4fbf3447)

The simplest test we can write to get going is to compare the structure
of an empty array to another empty array:

<pre class='language-javascript'><code class='language-javascript'>
expect([].sameStructureAs([])).to.be.true;
</code></pre>

After writing this test, our test suite fails. A naively simple way to
get our suite back into the green is to define a very simple
`sameStructureAs`{:.language-javascript} function on the `Array`{:.language-javascript} prototype that always returns
`true`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+Array.prototype.sameStructureAs = function(other) {
+    return true;
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
+import "../";
 import { expect } from "chai";
 
-describe("index", function() {
+describe("sameStructureAs", function() {
 
-    it("works");
+    it("works", () => {
+        expect([].sameStructureAs([])).to.be.true;
+    });
 
</code></pre>



# [Comparing Types]({{page.repo}}/commit/9fc38c25ce8020430a26ea8acef2227a8f738b65)

Next, we'll add our first real test.  We expect an array who's first
element is a `Number`{:.language-javascript} to have a different structure than an array who's
first element is an `Array`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
expect([1].sameStructureAs([[]])).to.be.false;
</code></pre>

The most obvious way to make this test pass is to check the types of the
first element of each array. If both first elements are arrays, or both
are not arrays, we'll return `true`{:.language-javascript}. Otherwise, we'll return `false`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+import _ from "lodash";
+
 Array.prototype.sameStructureAs = function(other) {
-    return true;
+    if (_.isArray(this[0]) && _.isArray(other[0])) {
+        return true;
+    }
+    else if (!_.isArray(this[0]) && !_.isArray(other[0])) {
+        return true;
+    }
+    return false;
 }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect([].sameStructureAs([])).to.be.true;
+        expect([1].sameStructureAs([[]])).to.be.false;
     });
</code></pre>



# [Generalizing]({{page.repo}}/commit/af0f5df73713b5e57ccc325e98fd6e44f12cb251)

Now that we have our base case figured out, it's time to generalize and
check the structure of arrays of any length.

To guide us on this process, we added two new tests:

<pre class='language-javascript'><code class='language-javascript'>
expect([[], []].sameStructureAs([[], []])).to.be.true;
expect([[], 1].sameStructureAs([[], []])).to.be.false;
</code></pre>

The general idea is that we'll want to compare each element of `this`{:.language-javascript}
and `other`{:.language-javascript} using the same kind of structural comparison we previously
wrote. [Lodash's](https://lodash.com/) `_.zipWith`{:.language-javascript} function is a great
way of comparing array elements like this:

<pre class='language-javascript'><code class='language-javascript'>
let comparisons = _.zipWith(this, other, (a, b) => {
    ...
});
</code></pre>

Now, `comparisons`{:.language-javascript} will hold a list of `true`{:.language-javascript}/`false`{:.language-javascript} values
representing whether the values at that position shared the same
structure.

We can use `_.every`{:.language-javascript} to return `true`{:.language-javascript} if all `comparisons`{:.language-javascript} are true, or
`false`{:.language-javascript} otherwise.

During this process, we also did some refactoring of our comparison
code, just to clean things up a bit:

<pre class='language-javascript'><code class='language-javascript'>
let bothArrays = _.isArray(a) && _.isArray(b);
let bothNot = !_.isArray(a) && !_.isArray(b);
return bothArrays || bothNot;
</code></pre>


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
 Array.prototype.sameStructureAs = function(other) {
-    if (_.isArray(this[0]) && _.isArray(other[0])) {
-        return true;
-    }
-    else if (!_.isArray(this[0]) && !_.isArray(other[0])) {
-        return true;
-    }
-    return false;
+    let comparisons = _.zipWith(this, other, (a, b) => {
+        let bothArrays = _.isArray(a) && _.isArray(b);
+        let bothNot = !_.isArray(a) && !_.isArray(b);
+        return bothArrays || bothNot;
+    });
+    return _.every(comparisons);
 }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect([1].sameStructureAs([[]])).to.be.false;
+        expect([[], []].sameStructureAs([[], []])).to.be.true;
+        expect([[], 1].sameStructureAs([[], []])).to.be.false;
     });
</code></pre>



# [Getting Recursive]({{page.repo}}/commit/4046fc790c577614a273e6a851fca5651c507633)

So far we've only handled a single layer of structure. However, the goal
of `sameStructureAs`{:.language-javascript} is to compare the nested structures of our inputs.
Consider these examples:

<pre class='language-javascript'><code class='language-javascript'>
expect([[], [1]].sameStructureAs([[], [1]])).to.be.true;
expect([[], [1]].sameStructureAs([[], [[]]])).to.be.false;
</code></pre>

While at first glance this seems to add a lot of complexity, there's
actually a very elegant solution to this problem. When we find two
matching arrays in our inputs, all we need to do is ensure that the contents of
those arrays have the same structure:

<pre class='language-javascript'><code class='language-javascript'>
return (bothArrays && a.sameStructureAs(b)) || bothNot;
</code></pre>

This recursive call into `sameStructureAs`{:.language-javascript} will handle any nested depths
that we can throw at it (as long as we don't blow our stack).


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
         let bothNot = !_.isArray(a) && !_.isArray(b);
-        return bothArrays || bothNot;
+        return (bothArrays && a.sameStructureAs(b)) || bothNot;
     });
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect([[], 1].sameStructureAs([[], []])).to.be.false;
+        expect([[], [1]].sameStructureAs([[], [1]])).to.be.true;
+        expect([[], [1]].sameStructureAs([[], [[]]])).to.be.false;
     });
</code></pre>



# [Bug Fixes]({{page.repo}}/commit/6a37908c8384df08bdd426396d0090a4b8b0e7a7)

Submitting our solution revealed a few bugs in our solution. The first
bug can be pointed out with this failing test:

<pre class='language-javascript'><code class='language-javascript'>
expect([].sameStructureAs(1)).to.be.false;
</code></pre>

We were assuming that `other`{:.language-javascript} would be an array. Unfortunately in this
case, `other`{:.language-javascript} is `1`{:.language-javascript}, which causes `_.zipWith`{:.language-javascript} to return an empty array.

We can fix this bug by adding an upfront check asserting that `other`{:.language-javascript} is
an `Array`{:.language-javascript}.

After fixing that issue, another bug reared its ugly head:

<pre class='language-javascript'><code class='language-javascript'>
expect([1].sameStructureAs([1, 2])).to.be.false;
</code></pre>

In the last iteration of `_.zipWith`{:.language-javascript}, `a`{:.language-javascript} was `undefined`{:.language-javascript} and `b`{:.language-javascript} was
`2`{:.language-javascript}. While checking if both of these values were not arrays returned
`true`{:.language-javascript}, we didn't check if both values actually existed.

The fix for this bug is to check that both `a`{:.language-javascript} and `b`{:.language-javascript} are not
`undefined`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
let bothDefined = !_.isUndefined(a) && !_.isUndefined(b);
let bothNot = bothDefined && !_.isArray(a) && !_.isArray(b);
</code></pre>

With those fixes, out suite flips back to green!


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
 Array.prototype.sameStructureAs = function(other) {
+    if (!_.isArray(other)) {
+        return false;
+    }
     let comparisons = _.zipWith(this, other, (a, b) => {
     let bothArrays = _.isArray(a) && _.isArray(b);
-        let bothNot = !_.isArray(a) && !_.isArray(b);
+        let bothDefined = !_.isUndefined(a) && !_.isUndefined(b);
+        let bothNot = bothDefined && !_.isArray(a) && !_.isArray(b);
         return (bothArrays && a.sameStructureAs(b)) || bothNot;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect([[], [1]].sameStructureAs([[], [[]]])).to.be.false;
+        expect([].sameStructureAs(1)).to.be.false;
+        expect([1].sameStructureAs([1, 2])).to.be.false;
     });
</code></pre>



# [Final Refactor]({{page.repo}}/commit/61704b61787a658bc0f8330a09eb03dba7c16585)

To make things a little more readable, I decided to move the `undefined`{:.language-javascript}
check into a guard, rather than including it withing the comparison
logic of our `zipWith`{:.language-javascript} function.

After implementing this refactor, our tests still pass.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
     let comparisons = _.zipWith(this, other, (a, b) => {
+        if (_.isUndefined(a) || _.isUndefined(b)) {
+            return false;
+        }
         let bothArrays = _.isArray(a) && _.isArray(b);
-        let bothDefined = !_.isUndefined(a) && !_.isUndefined(b);
-        let bothNot = bothDefined && !_.isArray(a) && !_.isArray(b);
+        let bothNot = !_.isArray(a) && !_.isArray(b);
         return (bothArrays && a.sameStructureAs(b)) || bothNot;
</code></pre>


# Final Thoughts

Looking at the [other submitted solutions](http://www.codewars.com/kata/nesting-structure-comparison/solutions/javascript) to this kata, I realize that it’s a fairly interesting problem with lots of possible solutions. There are shorter solutions out there, but I like ours for its readability.

Brevity doesn’t always lead to better code. This is an important lesson that has taken me many years to fully appreciate.

Be sure to check out [the final solution on GitHub]({{page.repo}}). If you spot a bug or see a place ripe for improvement, be sure to submit a pull request!
