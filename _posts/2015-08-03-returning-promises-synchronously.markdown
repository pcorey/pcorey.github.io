---
layout: post
title:  "Returning Promises Synchronously"
titleParts: ["Returning Promises", "Synchronously"]
excerpt: "I often find myself tasked with returning promises synchronously from Meteor fibers. I've written a Meteor package that helps with the task."
author: "Pete Corey"
date:   2015-08-03
tags: ["Javascript", "Meteor"]
---

This past week I was working on a [Meteor](https://www.meteor.com/) project that made use of a Node.js package that used promises; specifically [es6-promises](https://www.npmjs.com/package/es6-promise). I often found myself wanting to return results from this package in my Meteor method calls. This meant I had to use some form of Fibers/Futures to transform my asynchronous promises into "synchronous" code.

The usual method of transforming asynchronous code into a synchronous style is to use Meteor's <code class="language-javascript">wrapAsync</code> utility method. <code class="language-javascript">wrapAsync</code> works by [wrapping your provided function in a future](https://github.com/meteor/meteor/blob/fcd5cc2d65d351772fc21cace82c47b2f96ce5c9/packages/meteor/helpers.js#L90-L120) that returns when the callback to your provided asynchronous function is called. Unfortunately, <code class="language-javascript">wrapAsync</code> only works with traditional asynchronous methods that take an error-first callback as their last parameter. This means we won't be able to use it to transform our promises into a synchronous style.

Without being able to use <code class="language-javascript">wrapAsync</code>, I found myself writing a lot of code that looked like this:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  lolpromises: function(a) {
    Future = Npm.require('fibers/future');
    var future = new Future();
    returnsPromise().then(function(res) {
      future.return(res);
    }, function(err) {
      future.throw(err);
    });
    return future.wait();
  }
});
</code></pre>

Basically, I'm creating a [Future](https://www.npmjs.com/package/future), and returning what the value of that future _will be_ from the method. My promise <code class="language-javascript">resolve</code> method returns the value to the future, and the <code class="language-javascript">reject</code> method throws the rejected value as an exception.

<hr/>

I decided to wrap this functionality into a package: [east5th:wrap-promise](https://github.com/East5th/wrap-promise). Using that package, you can return a promise in a synchronous styling like this:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
    lolpromises: function(a) {
        return wrapPromise(returnsPromise());
    }
});
</code></pre>

The package is duck-typing the promise's <code class="language-javascript">then</code> interface, so it should work with any promise library that supports that interface. Check out the [code if you're interested](https://github.com/East5th/wrap-promise/blob/master/lib/wrap-promise.js).

<hr/>

After talking about this with [Dean Radcliffe](https://twitter.com/chicagogrooves), I realized that there's a better, officially supported way to accomplish my goal: [Promise.await](https://github.com/meteor/promise/blob/master/promise_server.js#L37-L74) in the [promise](https://github.com/meteor/promise) Meteor package.

Using the core promise package, our <code class="language-javascript">lolpromises</code> method would look like this:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
    lolpromises: function(a) {
        return Promise.await(returnsPromise());
    }
});
</code></pre>
