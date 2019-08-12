---
layout: post
title:  "Black Box Meteor - Method Auditing"
titleParts:  ["Black Box Meteor", "Method Auditing"]
excerpt: "Malicious users can view the entire contents of every Meteor method defined in a shared location. Be sure your methods are secure!"
author: "Pete Corey"
date:   2015-04-15
tags: ["Javascript", "Meteor", "Security", "Black Box Meteor"]
---

When using [Meteor](https://www.meteor.com/) methods, a surprising amount of information can be passed down to the client. Let’s considering the following method definitions:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
    sharedMethod: function() {
        console.log('This is a shared method.');
        if (Meteor.isServer) {
            console.log('This is behind a server guard.');
            Meteor.call('serverMethod');
        }
    }
});

if (Meteor.isServer) {
    Meteor.methods({
        serverMethod: function() {
            console.log('This is a server method.');
        }
    });
    Meteor.methods({
        hiddenMethod: function() {
            console.log('This is a hidden method.');
        }
    });
}
</code></pre>

With these methods set up, open your browser’s console and take a look at the method handlers exposed to the client:

<pre class="language-javascript"><code class="language-javascript">Meteor.connection._methodHandlers
</code></pre>

Along with a few others, you’ll see the handler for <code class="language-javascript">sharedMethod</code>. You won’t see <code class="language-javascript">serverMethod</code> or <code class="language-javascript">hiddenMethod</code> because both of these methods were defined entirely behind a server guard.

Take a look at the source of <code class="language-javascript">sharedMethod</code>:

<pre class="language-javascript"><code class="language-javascript">Meteor.connection._methodHandlers.sharedMethod.toString();
</code></pre>

You’ll notice that you can see all of the method’s contents, including any permission checks and validation that may or may not be taking place. You can see the call to <code class="language-javascript">serverMethod</code>! It’s important to realize that unless you’re being careful, even server guarded blocks will be passed down to the client within client visible method handlers.

All methods can be called from the client, even methods that the client should have no knowledge of:

<pre class="language-javascript"><code class="language-javascript">Meteor.call(‘sharedMethod’, ...);
Meteor.call(‘serverMethod’, ...);
Meteor.call(‘hiddenMethod’, ...);
</code></pre>

It’s not enough to try to hide your methods on your server. Always be sure to do proper validation, sanitation and authentication before taking any action in a method.

I highly recommend taking a look at Sacha Greif’s three part latency compensation series ([An Introduction to Latency Compensation](https://www.discovermeteor.com/blog/latency-compensation/), [Advanced Latency Compensation](https://www.discovermeteor.com/blog/advanced-latency-compensation/), and [Two-Tiered Methods](https://www.discovermeteor.com/blog/meteor-pattern-two-tiered-methods/)) over at [Discover Meteor](https://www.discovermeteor.com/) to better understand how to use and protect your Meteor methods.
