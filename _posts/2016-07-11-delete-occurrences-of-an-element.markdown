---
layout: post
title:  "Delete Occurrences of an Element"
date:   2016-07-11
repo: "https://github.com/pcorey/delete-occurrences-of-an-element-if-it-occurs-more-than-n-times"
tags: ["literate-commits"]
---

# [Commit 93e7085: Laying the Groundwork]({{page.repo}}/commit/93e70856fc1a14685ea86f215cf20218f4466daa)

Today we'll be tackling a [code kata](https://www.codewars.com/) called
[“Delete occurrences of an element if it occurs more than n
times”](https://www.codewars.com/kata/delete-occurrences-of-an-element-if-it-occurs-more-than-n-times)
(what a catchy name!). The goal of this kata is to implement a function
called `deleteNth`{:.language-javascript}. The function accepts a list of numbers as its first
parameter and another number, `N`{:.language-javascript}, as its second parameter. `deleteNth`{:.language-javascript}
should iterate over each number in the provided list, and remove and
numbers that have appeared more than `N`{:.language-javascript} times before returning the
resulting list.

While this is a fairly simple problem, we're going to solve it in a very
deliberate way in order to practice building better software.

This first commit lays the groundwork for our future work. We've set up
a simple [Node.js](https://nodejs.org/en/) project that uses
[Babel](http://babeljs.io/) for ES6 support and
[Mocha](https://mochajs.org/)/[Chai](http://chaijs.com/) for testing.


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
+  it("works");
+
+});
</code></pre>



# [Take What We're Given]({{page.repo}}/commit/7b3878a114b097b9a93ece1384a62b7c8a0081a9)

One of the challenges of real-world problems is teasing out the best
interface for a given task. Code katas are different from real-world
problems in that we're usually given the interface we're supposed to
implement upfront.

In this case, we know that we need to implement a function called
`deleteNth`{:.language-javascript} which accepts an array of numbers as its first argument
(`arr`{:.language-javascript}), and a number, `N`{:.language-javascript}, as its second parameter (`x`{:.language-javascript}).

Eventually, `deleteNth`{:.language-javascript} will return an array of numbers, but we need to
take this one step at a time.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+function deleteNth(arr,x){
+    // ...
+}
</code></pre>



# [Our First Test]({{page.repo}}/commit/167e5cff5477e092eb4262fbe70f2ebaad10039f)

Writing [self-testing
code](http://www.martinfowler.com/bliki/SelfTestingCode.html) is a
powerful tool for building robust and maintainable software. While there
are many ways of writing test code, I enjoy using [Test Driven
Development](#) for solving problems like this.

Following the ideas of TDD, we'll write the simplest test we can that
results in failure. We expect `deleteNth([], 0)`{:.language-javascript} to return an empty
array. After writing this test and running our test suite, the test
fails:

<pre class='language-javascript'><code class='language-javascript'>
deleteNth is not defined
</code></pre>

We need to export `deleteNth`{:.language-javascript} from our module under test and import it
into our test file. After making those changes, the test suite is still
failing:

<pre class='language-javascript'><code class='language-javascript'>
expected undefined to deeply equal []
</code></pre>

Because our `deleteNth`{:.language-javascript} method isn't returning anything our assertion
that it should return `[]`{:.language-javascript} is failing. A quick way to bring our test
suite into a passing state is to have `deleteNth`{:.language-javascript} return `[]`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
-function deleteNth(arr,x){
-    // ...
+export function deleteNth(arr,x){
+    return [];
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
+import { deleteNth } from "../";
 ...
-describe("index", function() {
+describe("deleteNth", function() {
 ...
-  it("works");
+    it("deletes occurrences of an element if it occurs more than n times", function () {
+        expect(deleteNth([], 0)).to.deep.equal([]);
+    });
</code></pre>



# [Keep it Simple]({{page.repo}}/commit/63443b1805687b5f10b15e16bf2291b141e030d3)

Interestingly, our incredibly simple and incredibly incorrect initial
solution for `deleteNth`{:.language-javascript} holds up under additional base case tests. Any
calls to `deleteNth`{:.language-javascript} with a zero value for `N`{:.language-javascript} will result in an empty
array.


<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
+        expect(deleteNth([1, 2], 0)).to.deep.equal([]);
</code></pre>



# [Forging Ahead]({{page.repo}}/commit/e39386a4c71d61da387b5c3abd4824482ee3c4a8)

As we add more test cases, things begin to get more complicated. In our
next test we assert that `deleteNth([1, 2], 1)`{:.language-javascript} should equal `[1, 2]`{:.language-javascript}.
Unfortunately, our initial solution of always returning an empty array
failed in this case.

<pre class='language-javascript'><code class='language-javascript'>
expected [] to deeply equal [ 1, 2 ]
</code></pre>

We know that all calls to `deleteNth`{:.language-javascript} where `x`{:.language-javascript} is zero should result in
an empty array, so lets add a guard that checks for that case.

If `x`{:.language-javascript} is not zero, we know that our test expects us to return `[1, 2]`{:.language-javascript}
which is being passed in through `arr`{:.language-javascript}. Knowing that, we can bring our
tests back into a green state by just returning `arr`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
-    return [];
+    if (x == 0) {
+        return [];
+    }
+    return arr;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
+
+        expect(deleteNth([1, 2], 1)).to.deep.equal([1, 2]);
</code></pre>



# [Getting Real]({{page.repo}}/commit/7655928ec63634ba7ccec63713f4ac57d63130f7)

We added a new test case, and things suddenly became very real. Our new
test expects `deleteNth([1, 1, 2], 1)`{:.language-javascript} to return `[1, 2]`{:.language-javascript}. This means
that the second `1`{:.language-javascript} in the input array should be removed in the result.
After adding this test, our test suite groans and slips into a red
state.

It seems that we have to finally begin implementing a "real" solution
for this problem.

Because we want to conditionally remove elements from an array, my mind
initially gravitates to using
[`filter`{:.language-javascript}](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
We replace our final `return`{:.language-javascript} statement with a block that looks like
this:

<pre class='language-javascript'><code class='language-javascript'>
return arr.filter((num) => {
  return seenNum <= x;
});
</code></pre>

Our filter function will only pass through values of `arr`{:.language-javascript} that we’ve
seen (`seenNum`{:.language-javascript}) no more than `x`{:.language-javascript} times. After making this change our
test suite expectedly complains about `seenNum`{:.language-javascript} not being defined. Let's
fix that.

To know how many times we've seen a number, we need to keep track of
each number we see as we move through `arr`{:.language-javascript}. My first instinct is to do
this with a simple object acting as a map from the number we seen to the
number of times we’ve seen it:

<pre class='language-javascript'><code class='language-javascript'>
let seen = {};
</code></pre>

Because `seen[num]`{:.language-javascript} will initially be `undefined`{:.language-javascript} we need to give it a
default value of `0`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
seen[num] = (seen[num] || 0) + 1;
</code></pre>

Our test suite seems happy with this solution and flips back into a
green state.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
-    return arr;
+    let seen = {};
+    return arr.filter((num) => {
+        seen[num] = (seen[num] || 0) + 1;
+        let seenNum = seen[num];
+        return seenNum <= x;
+    });
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
+        expect(deleteNth([1, 1, 2], 1)).to.deep.equal([1, 2]);
</code></pre>



# [Simplifying the Filter]({{page.repo}}/commit/487e45741805ebe3a2df05eaa80220efe8162f18)

After getting to a green state, we notice that we can refactor our
filter and remove some duplication.

The `seenNum`{:.language-javascript} variable is unnecessary at this point. Its short existence
helped us think through our filter solution, but it can easily be
replaced with `seen[num]`{:.language-javascript}.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
-        let seenNum = seen[num];
-        return seenNum <= x;
+        return seen[num] <= x;
</code></pre>



# [Removing the Base Case]({{page.repo}}/commit/3c23b0f42a3b09b6282d30ca37dd392543873545)

While we're on a refactoring kick, we also notice that the entire zero
base case is no longer necessary. If `N`{:.language-javascript} (`x`{:.language-javascript}) is zero, our filter
function will happily drop every number in `arr`{:.language-javascript}, resulting in an empty
array.

We can remove the entire `if`{:.language-javascript} block at the head of our `deleteNth`{:.language-javascript}
function.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
-    if (x == 0) {
-        return [];
-    }
</code></pre>



# [Final Tests]({{page.repo}}/commit/775ef33bee719579eb68d9b9333d7f7e3f38aa60)

At this point, I think this solution solves the problem at hand for any
given inputs. As a final test, I add the two test cases provided in the
kata description.

Both of these tests pass. Victory!


<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
+
+        expect(deleteNth([20, 37, 20, 21], 1)).to.deep.equal([20, 37, 21]);
+        expect(deleteNth([1, 1, 3, 3, 7, 2, 2, 2, 2], 3)).to.deep.equal([1, 1, 3, 3, 7, 2, 2, 2]);
</code></pre>



# [Final Refactoring]({{page.repo}}/commit/0a86271899af3b808f4116455aa37da8c40cd7b0)

Now that our tests are green and we're satisfied with the overall shape
of our final solution, we can do some final refactoring.

Using the underrated [tilde
operator](http://stackoverflow.com/a/5971668), we can simplify our
`seen`{:.language-javascript} increment step and merge it onto the same line as the comparison
against `x`{:.language-javascript}. Next, we can leverage some ES6 syntax sugar to consolidate
our `filter`{:.language-javascript} lambda onto a single line.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
-    return arr.filter((num) => {
-        seen[num] = (seen[num] || 0) + 1;
-        return seen[num] <= x;
-    });
+    return arr.filter((num) => (seen[num] = ~~seen[num] + 1) <= x);
</code></pre>



# Wrap-up

This was an excellent demonstration of how following test-driven development ideas can give you supreme confidence when refactoring your code. We were able to gut entire sections out of our solution and then completely transform it with zero trepidation.

Overall, our solution looks very similar to [the other submitted solutions](https://www.codewars.com/kata/delete-occurrences-of-an-element-if-it-occurs-more-than-n-times/solutions/javascript) for this kata.

My one regret with this solution is using the double tilde operator (`~~`{:.language-javascript}). While it does make our final solution quite a bit shorter, it adds confusion to the solution if you’re not familiar with how `~~`{:.language-javascript} works.

Be sure to check out the [final project on Github](https://github.com/pcorey/delete-occurrences-of-an-element-if-it-occurs-more-than-n-times)!
