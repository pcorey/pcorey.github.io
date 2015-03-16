---
layout: post
title:  "User Fields and Universal Publications"
date:   2015-03-16
categories:
---

How do you specify which fields are published to the client's <code class="language-*">Meteor.users</code> collection? Using universal publications, obviously<span class="super reference">(1)</span>! Let's take a look at Meteor's universal, or unnamed, publications and see how they're used to accomplish this.

Put simply, a universal, or unnamed, publication is a publication [without a name](https://github.com/meteor/meteor/blob/master/packages/ddp/livedata_server.js#L1412). That may not seem very special at first, but it raises some interesting questions in terms of functionality within the framework.

## If a publication has no name, how do I subscribe to it?
You don't! Universal publications are immediately and unconditionally [started by the server](https://github.com/meteor/meteor/blob/master/packages/ddp/livedata_server.js#L1420) and every connected client receives their data. Don't take my word for it, it's in [the docs](http://docs.meteor.com/#/full/meteor_publish):

> Name of the record set. If null, the set has no name, and the record set is automatically sent to all connected clients.

## If I don't subscribe to it, how do I know when the subscription is ready?
You don't! The server [never sends ready messages](http://stackoverflow.com/a/19895939/96048) for universal publications. Universal publications just march to the beat of a different drummer.

## What if I want to universally publish multiple collections?
Go for it! You can define as many universal publications as you'd like. Meteor does not [check for duplicates](https://github.com/meteor/meteor/blob/master/packages/ddp/livedata_server.js#L1380-L1383) like it does with named publications.

This does lead to an interesting point about multiple universal publications for a single collection. Imagine that a package, like [accounts-base](https://github.com/meteor/meteor/tree/master/packages/accounts-base), sets up a [universal publication](https://github.com/meteor/meteor/blob/master/packages/accounts-base/accounts_server.js#L1199-L1208) for the <code class="language-*">Meteor.users</code> collection. Let's pretend that this publication only returns the <code class="language-*">profile</code>, <code class="language-*">username</code> and <code class="language-*">emails</code> [fields](https://github.com/meteor/meteor/blob/master/packages/accounts-base/accounts_server.js#L1204) for each user.

What if we create another universal publication for the <code class="language-*">Meteor.users</code> collection that returns some other set of user fields like <code class="language-*">username</code> and <code class="language-*">roles</code>?

<pre class="language-javascript"><code class="language-javascript">Meteor.publish(null, function() {
    if (this.userId) {
        return Meteor.users.find(
            {_id: this.userId},
            {fields: {username: 1, roles: 1}});
    } else {
        return null;
    }
});</code></pre>

Interestingly enough, Meteor will run both of these publish handlers and publish the union of the fields returned by each. In our case, <code class="language-*">profile</code>, <code class="language-*">username</code>, <code class="language-*">emails</code> and <code class="language-*">roles</code> would all be published to the client!

So there's the answer to our question. How do we publish more fields to the <code class="language-*">Meteor.users</code> collection? By creating a universal publication that publishes only the fields that we depend on.

## Why don't we just use named publications?

A named publication that publishes additional fields from the <code class="language-*">Meteor.users</code> collection will work, but you run the risk of accidentally dropping your subscription to that publication. I recently spend some time tracking down a fairly complicated [bug](https://github.com/orionjs/core/issues/19) in the [Orion](http://orion.meteor.com/) framework that dealt with this exact issue.

The Orion admin panel defined an <code class="language-*">adminUsers</code> publication that published additional fields on the <code class="language-*">Meteor.users</code> collection. It used these additional fields to determine if the current user had permission to view or modify content. The subscription to <code class="language-*">adminUsers</code> was maintained by [SubsManager](https://github.com/meteorhacks/subs-manager).

SubsManager only keeps around a certain number of subscriptions before dropping older subscriptions to make room for new ones. After navigating through the Orion admin panel for a few minutes, the old <code class="language-*">adminUsers</code> subscription was dropped to make room for a new subscription, which caused the <code class="language-*">Meteor.users</code> collection to fall back to universal publication defined by accounts-base.

This universal publication wasn't publishing fields required by Orion (<code class="language-*">isAdmin</code>, <code class="language-*">permission</code>), so the Orion client was forced to assume that the client wasn't authorized to view the current page.

The issue was fixed by creating a new universal publication in the Orion core package that returned the <code class="language-*">isAdmin</code> and <code class="language-*">permission</code> fields that the client depended on.

<p class="reference"><span class="super">(1)</span> This is not an obvious answer.</p>
