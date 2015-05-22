---
layout: post
title:  "Keep It Secret, Keep It Safe"
titleParts: ["Keep It Secret", "Keep It Safe"]
date:   2015-05-25
categories: ["security"]
---

It's fairly well established that you shouldn't be storing your application's deployment-specific configuration options directly in your source code. Keeping secrets in your code [unnecessarily expands your application's circle of trust](http://joshowens.me/environment-settings-and-security-with-meteor-js/). But did you know that by keeping secrets in your code you may inadvertently be leaking them to your clients?

## The Setup

Let's pretend that we have a [Meteor](https://www.meteor.com/) method that's called whenever a user purchases something in our application. Knowing that we want to leverage [latency compensation](https://meteorhacks.com/introduction-to-latency-compensation), we define this method in a shared location so both the client and server have access to it. In a server block, the method adds a transaction to our payment processing system. In order to add this payment, we need to pass along a secret key associated with our application to verify that we authorize the transaction.

Take a look at the method:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
    purchase: function(item) {
        // checks and validation
        ...
        if (Meteor.isServer) {
            Payments.add(..., 'XYZ-SSECRET-KEY');
        }
    }
});
</code></pre>

It's __very important__ that we keep our secret key a secret! If anyone other than our server has access to our key, they would be able to add payments on our behalf.

## The Problem

Unfortunately, in this scenario, our secret key is __not__ being kept a secret. To grab our key, a malicious user would simply need to open their browser console anywhere in our application and grab the <code class="language-javascript">purchase</code> method's source:

<pre class="language-javascript"><code class="language-javascript">Meteor.connection._methodHandlers.purchase.toString();

"... 'XYZ-SSECRET-KEY' ..."
</code></pre>

Our fundamental error here is assuming that our <code class="language-javascript">Meteor.isServer</code> guard prevents code from being shipped to the client. This isn't always true! When a method is defined in a location that is visible to both the client and the server, it's entire handler function is passed to the client, server-only code and all.

Check out my post on [black box auditing Meteor methods](/2015/04/15/black-box-meteor-method-auditing/) to get a better understanding of what code is made visible to the client.

## The Solution

The quickest solution to this problem is to move our secret key out of our code and into our [settings file](http://docs.meteor.com/#/full/meteor_settings):

<pre class="language-javascript"><code class="language-javascript">{
    "payment_secret": "XYZ-SSECRET-KEY"
}
</code></pre>

Our updated <code class="language-javascript">purchase</code> method would look like this:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
    purchase: function(item) {
        // checks and validation
        if (Meteor.isServer) {
            Payments.add(Meteor.settings.payment_secret);
        }
    }
});
</code></pre>

From a client/server perspective, nothing has changed. Our <code class="language-javascript">Meteor.isServer</code> block is still being sent to the client. The fundamental difference with this approach is that <code class="language-javascript">Meteor.settings.payment_settings</code> is not available on the client. Even if a malicious user digs into the method's source on the client, they won't get to our secret key.