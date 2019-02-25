---
layout: post
title:  "Mocha's Grep Flag"
description: "Today I learned about Mocha's grep flag; an insanely useful tool for quickly isolating individual tests of groups of tests."
author: "Pete Corey"
date:   2016-07-25
tags: ["Javascript", "Testing"]
---

Mocha’s [grep flag (`-g`{:.language-javascript}, or `--grep`{:.language-javascript})](https://mochajs.org/#g---grep-pattern) is amazing. I very recently learned about this helpful tool, and it’s significantly improved my testing workflow.

The grep flag gives you the ability to focus on specific tests with zero code changes, even if the set of tests you want to run are spread across separate `describe`{:.language-javascript} blocks!

I recently found myself in a situation where an ugly, manual process of zeroing in on tests was drastically simplified with the grep flag.

## The Situation

One of my client projects has a very large, very complicated [Mocha](https://mochajs.org/) test suite. Many of the tests in this suite are generated programmatically (whether or not this is a good idea is a topic for another day…).

One of the motivations for generating tests dynamically is that we have multiple “transports” ([Twilio SMS](https://www.twilio.com/), [Facebook Messenger](https://www.facebook.com/help/151024075021791/), web chat, etc…) for communicating with users. On each of these transports, we want to run through a set of test scenarios and ensure that they all behave as expected:

<pre class='language-javascript'><code class='language-javascript'>
[
    "twilio",
    "facebook",
    "web"
].forEach((transport) => {
    describe(`Scenarios for ${transport}:`, function() {
        it("sends a message", function() {
            ...
        });
        ...
    });
});
</code></pre>

Sometimes, it’s helpful to see just the output of these transport scenario tests instead of the output of the entire test suite.

My initial instinct for zeroing in on these transport scenario tests is to change `describe`{:.language-javascript} to `describe.only`{:.language-javascript}. Unfortunately, if Mocha finds multiple `describe.only`{:.language-javascript} calls, it will only run the tests in the last `describe.only`{:.language-javascript} block it encounters. This means that only my `"web"`{:.language-javascript} transport tests would run.

To see the results of all three transport tests, I’d have to run my tests in three passes, once for each transport:

<pre class='language-javascript'><code class='language-javascript'>
[
    "twilio",
    // "facebook",
    // "web"
].forEach((transport) => {
    describe.only(...
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
[
    // "twilio",
    "facebook",
    // "web"
].forEach((transport) => {
    describe.only(...
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
[
    // "twilio",
    // "facebook",
    "web"
].forEach((transport) => {
    describe.only(...
</code></pre>

This is not a good solution.

This kind of code juggling opens the doors for bugs to be introduced into my test suite and makes it impossible to watch all three transport tests at once.

## Mocha Grep

It turns out that Mocha already has a solution to my problem.

If you read through the [Mocha documentation](https://mochajs.org/#usage), you may notice a section on the “grep flag” (`-g`{:.language-javascript}, or `--grep`{:.language-javascript}):

> -g, --grep \<pattern\>    only run tests matching \<pattern\>

When using this flag, Mocha will search through your tests and only run tests whose descriptions match the provided pattern. This means we can run our whole test suite and grep for `"Scenarios"`{:.language-javascript} tests:

<pre class='language-javascript'><code class='language-javascript'>
mocha -g "Scenarios for"
</code></pre>

And just like that, our `"twilio"`{:.language-javascript}, `"facebook"`{:.language-javascript}, and `"web"`{:.language-javascript} transport scenarios are detected and run by Mocha.

We can get more complex with our search. Let’s run just the `"twilio"`{:.language-javascript} and `"web"`{:.language-javascript} scenarios:

<pre class='language-javascript'><code class='language-javascript'>
mocha -g "Scenarios for twilio|Scenarios for web"
</code></pre>

We can even use the [watch flag](https://mochajs.org/#w---watch) (`-w`{:.language-javascript}, or `--watch`{:.language-javascript}) to watch the results of our test search for changes:

<pre class='language-javascript'><code class='language-javascript'>
mocha -w -g "Scenarios for twilio|Scenarios for web"
</code></pre>

## Final Thoughts

It’s always a good idea to thoroughly read the documentation of all of the tools you use on a regular basis.

You may be surprised to find that they’re much more powerful than you first realized.

TL;DR: RTFM.
