---
layout: post
title:  "Meteor Security in the Wild"
titleParts: ["Meteor Security", "in the Wild"]
description: "Read along with this deep hands-on dive into a vulnerability I found in a client's production Meteor application."
author: "Pete Corey"
date:   2015-05-05
tags: ["Javascript", "Meteor", "Security"]
---

I was recently poking through the [Meteor](https://www.meteor.com/) publications being used in a client project and I found an interesting vulnerability. Imagine an admin panel that shows a list of all users in the system. That page/route needs to subscribe to a publication that publishes all of the users, but only if the current user is an admin. We don't want non-administrators having access to all of the user data in the system! Are you imagining? Good! Here's the publication, as seen in the wild:

<pre class="language-javascript"><code class="language-javascript">Meteor.publish('users', function(userId){
    if(Roles.userIsInRole(userId, 'admin')){
        return Meteor.users.find({}, {fields: {...});
    }
});
</code></pre>

This publication takes an argument that is intended to be the current user's ID. It would be subscribed to on the client like this:

<pre class="language-javascript"><code class="language-javascript">Meteor.subscribe('users', Meteor.userId());
</code></pre>

If you're an astute observer, you may notice a few potential problems here. Let's dig into them!

## Guess the Admin ID

Since the <code class="language-javascript">userId</code> is a user provided argument, and we're not actually validating that the currently logged in user is the user associated with the provided ID, a malicious user could potentially just guess an administrator's ID. Or, instead of guessing the ID, they may find it in other public data (posts, comments, profiles, etc...). They could easily subscribe to the publication right from their browser console:

<pre class="language-javascript"><code class="language-javascript">Meteor.subscribe('users', '[spoofed admin ID]');
</code></pre>

But that's assuming that they know the publication exists, right? If the malicious user can never get to the admin route, they'll never see the subscribe happen, and they'll have no way of knowing that they can subscribe to it. Right? Wrong!

A quick search through the minified and concatenated JavaScript served to each client will show each subscription being made (search for <code class="language-javascript">".subscribe("</code>), even if it is happening behind some kind of protection mechanism. __If any client can get to it, all clients can get to it.__

## BYO User Object

Take a look at lines [307](https://github.com/alanning/meteor-roles/blob/66ff74ab320649a73a50e06f46b57785dbff7fa6/roles/roles_common.js#L307) and [330](https://github.com/alanning/meteor-roles/blob/66ff74ab320649a73a50e06f46b57785dbff7fa6/roles/roles_common.js#L330) of this file in the [alanning:meteor-roles](https://github.com/alanning/meteor-roles) package. You'll notice that <code class="language-javascript">isUserInRole</code> accepts either a user ID as a string, or the entire user object. [Looking deeper](https://github.com/alanning/meteor-roles/blob/66ff74ab320649a73a50e06f46b57785dbff7fa6/roles/roles_common.js#L309-L312), we can see that if a user object is passed in, it will return <code class="language-javascript">true</code> if the passed in role exists in the <code class="language-javascript">roles</code> field on the user object.

So what if a malicious user subscribes to the users publication with the following <code class="language-javascript">userId</code> parameter:

<pre class="language-javascript"><code class="language-javascript">Meteor.subscribe('users', {roles: ['admin']});
</code></pre>

Uh oh. We're passing an object to our subscription, which we're passing directly into <code class="language-javascript">Roles.userIsInRole</code>. <code class="language-javascript">userIsInRole</code> happily accepts this object, assuming that it's a user object pulled from the database, and confirms for us that <code class="language-javascript">'admin'</code> is indeed in the <code class="language-javascript">roles</code> field of the object. Great!

## Fixing It

The correct fix for this issue is to not pass in the ID of the user, but instead use <code class="language-javascript">this.userId</code> within the server method. This ensures that the user can't "spoof" the system into thinking they're someone else.

There are other lessons to be learned here, too.

Always check your arguments! When accepting user provided arguments in methods or publication, always use Meteor's [check](http://docs.meteor.com/#/full/check_package) method to ensure that the argument you're getting is of the type you expect.

Lastly, it's very important to always be aware of what's going on in any third party code you're using. Without thoroughly reading the docs, it might not be immediately obvious that the <code class="language-javascript">userIsInRole</code> method accepts either a <code class="language-javascript">String</code> or an <code class="language-javascript">Object</code>. Or, maybe it's assumed that the package itself is checking its arguments. Never assume! Always check!

Finishing up, the correct publication looks like this:

<pre class="language-javascript"><code class="language-javascript">Meteor.publish('users', function(){
    if(Roles.userIsInRole(this.userId, 'admin')){
        return Meteor.users.find({}, {fields: {...});
    }
});
</code></pre>
