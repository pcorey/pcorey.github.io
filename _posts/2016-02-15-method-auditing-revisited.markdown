---
layout: post
title:  "Method Auditing Revisited"
titleParts: ["Method Auditing", "Revisited"]
date:   2016-02-15
tags: ["security"]
---

In the past I've written about how a potentially malicious user can [view all of the isometrically defined methods](http://blog.east5th.co/2015/04/15/black-box-meteor-method-auditing/) in your [Meteor](https://www.meteor.com/) application. By inspecting the `Meteor.connection._methodHandlers`{:.language-javascript} object on the client, they can see all client-side executable instances of your methods, which in most cases are identical to your server-side executable methods. This lets an attacker identify weaknesses in your application security that may lead to an attack.

`Meteor.connection._methodHandlers`{:.language-javascript} only poses a potential problem for methods defined in a shared location. Methods defined in a `server.js`{:.language-bash} file, or within a `server/`{:.language-bash} folder will never be shipped to the client, and won't appear in the `_methodHandlers`{:.language-javascript} object.

However, defining methods in server-only locations doesn't mean your methods are free from prying eyes! Depending on how your application is structured, it may still be possible for an attacker to [find and exploit these methods](http://blog.east5th.co/2016/02/01/sending-emails-through-hidden-methods/).

## Source Snooping

Even if a method is defined in a server-only location, it's still accessible from the client. For example, if you have a method defined in a `server.js`{:.language-bash} file:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  hiddenMethod: function(argument) {
    // Do secret things...
  }
});
</code></pre>

That method ___can still be called from the client___:

<pre class="language-javascript"><code class="language-javascript">Meteor.call("hiddenMethod", argument);
</code></pre>

This means that one way of discovering hidden methods within a Meteor application is to simple search the bundled application source for Meteor method calls.

When the Meteor application is minified, the `Meteor`{:.language-javascript} object is often transformed into some other variable name, so rather than searching for `/Meteor\.call("/`{:.language-javascript}, it's better to search for `/\.call("/`{:.language-javascript}:

<img src="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/call.png" style="max-width: 100%">

For example, in the above screenshot we can see a call to a Meteor method called `"increasePostViews"`{:.language-javascript}. This method is taking two arguments. I wonder if both of those arguments [are being checked](http://blog.east5th.co/2015/07/27/check-checker-checks-your-checks/)?

## Watching the Wire

An alternative to searching through the source for method calls is to simple watch all of the DDP requests that are sent over the websocket connection. Any calls to Meteor methods will be clearly marked, along with a list of arguments being sent to this method.

As you go about using the application, you can build up a list of Meteor methods, some of which may not have a corresponding handler in the `Meteor.connection._methodHandlers`{:.language-javascript} object.

<img src="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/upvote.png" style="max-width: 100%">

In the above screenshot, we can see a call being made to the `"upvotePost"`{:.language-javascript} method with a single arguments.

## Well Kept Secrets

These techniques will only reveal hidden methods that are being called by client-side or shared code. It's still possible that the Meteor application may have other, completely hidden methods. These methods may be defined on the server, and only called by other server-only code.

In that case, the only way for a curious client to discover those truly hidden methods is make a call to every possible Meteor method to determine if it exists on the server. Thankfully, this kind of brute forcing is totally unfeasible, and would most likely never be worth an attacker's time.

At the end of the day, it shouldn't matter whether attackers know methods exist. Even your most secret of methods should be made secure. Always assume that all of your methods will be called by all users, ___because they can be!___
