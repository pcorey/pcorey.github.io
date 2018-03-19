---
layout: post
title:  "The Headache and Heartache of Unhandled Rejections"
description: "Out of the box, Node.js doesn't do much to deal with unhandled promise rejections. This can lead to a world of hurt when trying to debug these rejections in your application. Thankfully, we have the tools to fix the problem!"
author: "Pete Corey"
date:   2018-03-12
tags: ["Javascript", "Node.js"]
related: []
---

This simple snippet of Javascript has saved me untold amounts of headache and heartache since I first started adding it to my Node.js projects:

<pre class='language-javascript'><code class='language-javascript'>
process.on('unhandledRejection', err => {
    console.log('Unhandled rejection:', err);
});
</code></pre>

Let's dig into the sorry state of unhandled promise rejections in Node.js and find out why this simple piece of code can be such a life-saver in sufficiently large projects.

## An Unresolved Promise

Imagine we have the following code buried deep within our Node.js application:

<pre class='language-javascript'><code class='language-javascript'>
const foo = () => get('foo').then(res => res.body);
const bar = () => get('bar').then(res => res.body);
</code></pre>

Our `foo`{:.language-javascript} function makes a call to the asynchronous `get`{:.language-javascript} function, which returns [a `Promise`{:.language-javascript}](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). After the promise resolves, we return the result's `body`{:.language-javascript}. Our `bar`{:.language-javascript} function makes a similar call to `get`{:.language-javascript} and also returns the result's `body`{:.language-javascript}.

Running our application results in the following incredibly unhelpful error message:

<pre class='language-javascript'><code class='language-javascript'>
(node:5175) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): TypeError: Cannot read property 'body' of undefined
(node:5175) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
</code></pre>

So _somewhere in my codebase_, the `body`{:.language-javascript} field is trying to be accessed on `undefined`{:.language-javascript}. Where? Who knows. What's the context? No telling! How do we track it down? I don't know, maybe [a Ouija board](https://en.wikipedia.org/wiki/Ouija)?

{% include newsletter.html %}

## Tools for Handling Rejection

Thankfully, Node.js ships with the tools required to remedy this situation. Much like the more well-known [`"uncaughtException"`{:.language-javascript} process event](https://nodejs.org/api/process.html#process_event_uncaughtexception), Node.js applications can listen for [`"unhandledRejection"`{:.language-javascript} events](https://nodejs.org/api/process.html#process_event_unhandledrejection) at the process level. These events are fired any time a rejection bubbles to the top of a promise chain without encountering [a `catch`{:.language-javascript} callback](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch).

Let's add an `"unhandledRejection"`{:.language-javascript} listener to our application. We'll keep things simple and log the error reported by the process:

<pre class='language-javascript'><code class='language-javascript'>
process.on('unhandledRejection', err => {
    console.log('Unhandled rejection:', err);
});
</code></pre>

Let's try running our application again:

<pre class='language-javascript'><code class='language-javascript'>
Unhandled rejection: TypeError: Cannot read property 'body' of undefined
    at get.then.res (/Users/pcorey/test/promise.js:11:46)
    at &lt;anonymous>
    at process._tickCallback (internal/process/next_tick.js:188:7)
    at Function.Module.runMain (module.js:678:11)
    at startup (bootstrap_node.js:187:16)
    at bootstrap_node.js:608:3
</code></pre>

Sweet clarity!

Our `"unhandledRejection "`{:.language-javascript} event listener is report on our unhandled rejection, and now we're given a stack trace that pinpoints the source of the error. We can clearly see that the unhandled rejection is occurring on line `11`{:.language-javascript} of our example application:

<pre class='language-javascript'><code class='language-javascript'>
const bar = () => get('bar').then(res => res.body);
</code></pre>

It looks like our asynchronous call to `get('bar')`{:.language-javascript} is returning `undefined`{:.language-javascript}, and our `res.body`{:.language-javascript} expression is throwing an exception. Given this information, we can easily debug the situation and come up with a solution.

## The Future Can't Come Soon Enough

As mentioned in our earlier error:

> In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.

As far as I'm concerned, this is the expected and preferred behavior. Keeping an application alive after an unhandled exception has bubbled up to the event loop, even within the context of a promise, should result in the process being killed and a proper stack trace being logged.

The future can't come soon enough.
