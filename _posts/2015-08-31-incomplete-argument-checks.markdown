---
layout: post
title:  "Incomplete Argument Checks"
titleParts: ["Incomplete", "Argument Checks"]
excerpt: "Incomplete argument checks are one of the primary causes of NoSQL Injection attacks in Meteor applications."
author: "Pete Corey"
date:   2015-08-31
tags: ["Javascript", "Meteor", "Security", "NoSQL Injection"]
---

I’ve been [shouting](/blog/2015/08/10/dos-your-meteor-application-with-where/) for [months](/blog/2015/07/14/why-is-rename-disallowed/) about [the importance](/blog/2015/07/21/exploiting-findone-to-aggregate-collection-data/) of [checking your method](/blog/2015/06/15/allow-and-deny-challenge-check-yourself/) and [publication arguments](/blog/2015/05/05/meteor-security-in-the-wild/). But what do I mean when I say that? Is checking your arguments as simple as throwing in a <code class="language-javascript">check(argument, Match.Any);</code> statement and moving on with your life? Absolutely not!

## Incomplete Checks

I frequently see people running incomplete [checks](http://docs.meteor.com/#/full/check) against their method and publication arguments. Check out this quick example:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  processEvent: function(event) {
    check(event, Object);

    // Do processing...
    
    Events.remove(event._id);
  }
});
</code></pre>

The <code class="language-javascript">processEvent</code> takes in an <code class="language-javascript">event</code> object, does some processing on it, and then removes the event object from the <code class="language-javascript">Events</code> collection. This is all fine and good. We’re even checking the <code class="language-javascript">event</code> argument!

Unfortunately, we’re not checking <code class="language-javascript">event</code> thoroughly enough. What would happen if a user were to run this code in their browser console?

<pre class="language-javascript"><code class="language-javascript">Meteor.call("processEvent", {_id: {$ne: ""}});
</code></pre>

<code class="language-javascript">{_id: {$ne: ""}}</code> is, in fact, an object, so it slips past the <code class="language-javascript">check</code> statement. Unexpectedly though, the <code class="language-javascript">_id</code> within <code class="language-javascript">event</code> is an object as well. After processing the event object, the <code class="language-javascript">processEvent</code> method would go on to remove _all events in the <code class="language-javascript">Events</code> collection_. Behold the dangers of incomplete checks!

## A More Thorough Check

The solution to this issue is to more thoroughly check the <code class="language-javascript">event</code> argument. If we’re expecting <code class="language-javascript">event</code> to be an object, we want to make a type assertion (and sometimes even a value assertion) over each field in that object. Take a look:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  processEvent: function(event) {
    check(event, {
      _id: String,
      // Check more fields here...
      // name: String,
      // data: {
      //   value: Number
      // }
    });

    // Do processing...
    
    Events.remove(event._id);
  }
});
</code></pre>

By checking that the <code class="language-javascript">_id</code> of the <code class="language-javascript">event</code> object is a string, we can avoid potential NoSQL injections that could wreak havoc within our application.

## Final Thoughts

Incomplete checks can take many forms, be it <code class="language-javascript">check(..., Object);</code>, <code class="language-javascript">check(..., Match.Any);</code>, <code class="language-javascript">check(..., Match.Where(...));</code>, etc... Regardless of the form they come in, incomplete checks are all little flaws stitched together with good intentions.

Checking your arguments is vitally important for a huge number of reasons, but it’s important that you follow through completely with your good intentions. Stopping with incomplete checks can leave you with a false sense of security and a vulnerable application.

Always (thoroughly) check your arguments!
