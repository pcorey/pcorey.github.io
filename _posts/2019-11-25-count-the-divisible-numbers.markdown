---
layout: post
title:  "Count the Divisible Numbers"
excerpt: "Counting the numbers divisible by some number within a range is a fairly simple challenge, but I decided to use this code kata as an opportunity to practice property-based testing. The results were a constant time solution that I'm very happy with!"
author: "Pete Corey"
date:   2019-11-25
tags: ["Javascript", "Codewars", "Kata", "Testing"]
related: []
---

Let's try our hand at using a property test driven approach to solving a Codewars code kata. The kata we'll be solving today is ["Count the Divisible Numbers"](https://www.codewars.com/kata/count-the-divisible-numbers/train/javascript). We'll be solving this kata using Javascript, and using [`fast-check`{:.language-javascript}](https://github.com/dubzzz/fast-check/blob/master/README.md) alongside [Jest](https://jestjs.io/) as our property-based testing framework.

The kata's prompt is as follows:

> Complete the [`divisibleCount`{:.language-javascript}] function that takes 3 numbers `x`{:.language-javascript}, `y`{:.language-javascript} and `k`{:.language-javascript} (where `x ≤ y`{:.language-javascript}), and returns the number of integers within the range `[x..y]`{:.language-javascript} (both ends included) that are divisible by `k`{:.language-javascript}.

## Writing Our Property Test

We could try to translate this prompt directly into a property test by generating three integers, `x`{:.language-javascript}, `y`{:.language-javascript}, and `k`{:.language-javascript}, and verifying that the result of `divisibleCount(x, y, k)`{:.language-javascript} matches our expected result, but we'd have to duplicate our implementation of `divisibleCount`{:.language-javascript} to come up with that "expected result." Who's to say our test's implementation wouldn't be flawed?

We need a more obviously correct way of generating test cases.

Instead of generating three integers, `x`{:.language-javascript}, `y`{:.language-javascript}, and `k`{:.language-javascript}, we'll generate our starting point, `x`{:.language-javascript}, the number we're testing for divisibility, `k`{:.language-javascript}, and the number of divisible numbers we expect in our range, `n`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
test("it works", () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), fc.nat(), (x, k, n) => {
      // TODO ...
    })
  );
});
</code></pre>

Armed with `x`{:.language-javascript}, `k`{:.language-javascript}, and `n`{:.language-javascript}, we can compute the end of our range, `y`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
let y = x + n * k;
</code></pre>

Next, we'll pass `x`{:.language-javascript}, our newly commuted `y`{:.language-javascript}, and `k`{:.language-javascript} into `divisibleCount`{:.language-javascript} and assert that the result matches our expected value of `n`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
return n === divisibleCount(x, y, k);
</code></pre>

Our final property test looks like this:

<pre class='language-javascript'><code class='language-javascript'>
test("it works", () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), fc.nat(), (x, k, n) => {
      let y = x + n * k;
      return n === divisibleCount(x, y, k);
    })
  );
});
</code></pre>

Beautiful.

## Our First Solution

Coming up with a solution to this problem is fairly straight-forward:

<pre class='language-javascript'><code class='language-javascript'>
const divisibleCount = (x, y, k) => {
  return _.chain(y - x)
    .range()
    .map(n => x + n)
    .reject(n => n % k)
    .size()
    .value();
};
</code></pre>

We generate an array of integers from `x`{:.language-javascript} to `y`{:.language-javascript}, reject those that aren't divisible by `k`{:.language-javascript}, and return the size of the resulting array.

Unfortunately, this simple solution doesn't work as expected. Our property test reports a failing counterexample of `[0, 0, 1]`{:.language-javascript} values for `x`{:.language-javascript}, `k`{:.language-javascript}, and `n`{:.language-javascript}:

<pre class='language-*'><code class='language-*'>
$ jest
 FAIL  ./index.test.js
  ✕ it works (10ms)
  
  ● it works
  
    Property failed after 1 tests
    { seed: 1427202042, path: "0:0:0:1:0:0:0", endOnFailure: true }
    Counterexample: [0,0,1]
    Shrunk 6 time(s)
    Got error: Property failed by returning false
</code></pre>

Looking at our solution, this makes sense. The result of `n % 0`{:.language-javascript} is undefined. Unfortunately, the kata doesn't specify what the behavior of our solution should be when `k`{:.language-javascript} equals `0`{:.language-javascript}, so we're left to figure that out ourselves.

Let's just set up a precondition in our test that `k`{:.language-javascript} should never equal `0`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
test("it works", () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), fc.nat(), (x, k, n) => {
      fc.pre(k !== 0);
      let y = x + n * k;
      return n === divisibleCount(x, y, k);
    })
  );
});
</code></pre>

Great!

Unfortunately, there's another problem. Without putting an upper bound on the size of `n * k`{:.language-javascript}, our solution will generate potentially massive arrays. This will quickly eat through the memory allocated to our process and result in a crash.

Let's add some upper and lower bounds to our generated `k`{:.language-javascript} and `n`{:.language-javascript} values:

<pre class='language-javascript'><code class='language-javascript'>
test("it works", () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(-100, 100), fc.nat(100), (x, k, n) => {
      fc.pre(k !== 0);
      let y = x + n * k;
      return n === divisibleCount(x, y, k);
    })
  );
});
</code></pre>

Perfect. Our starting integer, `x`{:.language-javascript}, can be any positive or negative integer, but our generated values of `k`{:.language-javascript} are clamped between `-100`{:.language-javascript} and `100`{:.language-javascript}, and `n`{:.language-javascript} ranges from `0`{:.language-javascript} to `100`{:.language-javascript}. These values should be large enough to thoroughly test our solution, and small enough to prevent memory issues from arising.

## Our Second Solution

In hindsight, our solution seems to be making inefficient use of both time and memory. If we consider the fact that our property test is computing `y`{:.language-javascript} in terms of `x`{:.language-javascript}, `n`{:.language-javascript}, and `k`{:.language-javascript}, it stands to reason that we should be able to compute `n`{:.language-javascript}, our desired result, in terms of `x`{:.language-javascript}, `y`{:.language-javascript}, and `k`{:.language-javascript}. If we can manage this, our solution will run in both constant time and constant space.

Let's use some algebra and work our way backwards from calculating `y`{:.language-javascript} to calculating `n`{:.language-javascript}. If `y = x + n * k`{:.language-javascript}, that means that `y - x = n * k`{:.language-javascript}. Dividing by `k`{:.language-javascript} gives us our equation for computing `n`{:.language-javascript}: `n = (y - x) / k`{:.language-javascript}.

Let's replace our original `divisibleCount`{:.language-javascript} solution with this equation:

<pre class='language-javascript'><code class='language-javascript'>
const divisibleCount = (x, y, k) => (y - x) / k;
</code></pre>

And rerun our test suite:

<pre class='language-*'><code class='language-*'>
$ jest
 PASS  ./index.test.js
  ✓ it works (8ms)
  
  Test Suites: 1 passed, 1 total
  Tests:       1 passed, 1 total
</code></pre>

Wonderful!
