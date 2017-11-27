---
layout: post
title:  "The Dangers of Debouncing Meteor Subscriptions"
titleParts: ["The Dangers", "of Debouncing", "Meteor Subscriptions"]
description: "Debouncing Meteor subscriptions can lead to subtle bugs. Let's explore those bugs and find out how to prevent them in your application."
author: "Pete Corey"
date:   2015-01-19
tags: ["Javascript", "Meteor"]
---

I've been working on a [Meteor](https://www.meteor.com/) app with [instant search](http://www.google.com/insidesearch/features/instant/about.html) functionality. When users to type data into an input box, the system updates a session value which kicks off a <code class="language-*">Meteor.subscribe</code>.

<pre class="language-javascript"><code class="language-javascript">Template.controls.events({
    'keyup #search': function(e) {
        Session.set('search', e.target.value);
    }
});

Meteor.autorun(function() {
    Meteor.subscribe('my-collection', Session.get('search'));
});
</code></pre>

While this worked, triggering a new subscribe for every keypress put too much of an unneeded strain on the system. Typing the word "test" triggered 4 different subscriptions, and the first 3 sets of subscription results were thrown out in a fraction of a second. I needed to limit the rate at which I was triggering my new subscriptions and subsequent database queries. A great way to do that is with [Lo-Dash's](https://lodash.com/) [debounce](https://lodash.com/docs#debounce) method.

## Debounce Meteor.subscribe

My initial idea was to debounce the <code class="language-*">Meteor.subscribe</code> function used within the <code class="language-*">Meteor.autorun</code> callback. Since the session variables being tracked by the [Tracker](https://www.meteor.com/tracker) [computation](https://github.com/meteor/meteor/wiki/Tracker-Manual#how-tracker-works) could be updated in other places in the app as well, I figured this would be a clean way to limit excessive subscriptions being made to the server.

I changed my code to look like this:

<pre class="language-javascript"><code class="language-javascript">var debouncedSubscribe = _.debounce(Meteor.subscribe, 300);
Meteor.autorun(function() {
    debouncedSubscribe('my-collection', Session.get('search'));
});
</code></pre>

This had a very interesting affect on my application. While changing the session variable did trigger a new subscription, and the call was being debounced as expected, I noticed that old subscription results were being kept around on the client. The collection was starting to balloon in size.

## Down to Debugging

I fired up my trusty [Chrome Dev Tools](https://developer.chrome.com/devtools) and started debugging within the [subscribe method itself](https://github.com/meteor/meteor/blob/e22702be4557df2539c646bd010484bdac747db7/packages/ddp/livedata_connection.js#L471-L591) in <code class="language-*">livedata_connection.js</code>. After comparing behavior with a normal subscription invocation and a debounced invocation, the problem made itself known on [line 571](https://github.com/meteor/meteor/blob/e22702be4557df2539c646bd010484bdac747db7/packages/ddp/livedata_connection.js#L571).

When it was executed as a debounce callback, the <code class="language-*">Meteor.subscribe</code> call was no longer part of a computation because it is [executed asynchronously](https://github.com/lodash/lodash/blob/master/lodash.src.js#L7117). <code class="language-*">Tracker.active</code> was returning <code class="language-*">false</code> within the context of the debounce callback. This means that the <code class="language-*">Tracker.onInvalidate</code> and <code class="language-*">Tracker.afterFlush</code> callbacks were never initiated within the <code class="language-*">subscribe</code> call as they would have been if <code class="language-*">subscribe</code> were called from directly within a computation. That caused the subscription to never "stop" and its subscription data stayed around forever. Effectively, I was piling up new subscriptions every time the search string changed.

<pre class="language-javascript"><code class="language-javascript">Meteor.subscribe('my-collection', 't');
Meteor.subscribe('my-collection', 'te');
Meteor.subscribe('my-collection', 'tes');
Meteor.subscribe('my-collection', 'test');
...
</code></pre>

## The Solution

I spent some time trying to find a way to run an asynchronous callback under an existing computation, but I wasn't able to find a good way to do this. Ultimately, my solution was to not debounce the <code class="language-*">Meteor.subscribe</code> call, but to debounce the keyup event handler:

<pre class="language-javascript"><code class="language-javascript">Template.controls.events({
    'keyup #search': _.debounce(function(e) {
        Session.set('search', e.target.value);
    }, 300)
});

Meteor.autorun(function() {
    Meteor.subscribe('my-collection', Session.get('search'));
});
</code></pre>
