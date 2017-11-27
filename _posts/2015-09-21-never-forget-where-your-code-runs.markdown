---
layout: post
title:  "Never Forget Where Your Code Runs"
titleParts: ["Never Forget", "Where Your Code Runs"]
description: "Part of designing a secure software solution is being aware of your client and server boundaries. This is especially important with working with isometric systems."
author: "Pete Corey"
date:   2015-09-21
tags: ["Javascript","Meteor", "Security"]
---

I often warn about the dangers of blindly trusting user provided data. There are times, though, when it’s easy to forget where your data comes from. [Sir Charles Watson](https://github.com/sircharleswatson) brought up a good example of this when he found a security issue revolving around an insecure <code class="language-javascript">onCreateUser</code> hook.

Imagine that somewhere in your application you’ve defined an <code class="language-javascript">onCreateUser</code> callback like the one below:

<pre class="language-javascript"><code class="language-javascript">Accounts.onCreateUser(function(options, user) {
  user.isAdmin = !!options.isAdmin;
  return user;
});
</code></pre>

The <code class="language-javascript">isAdmin</code> flag is set in a method used by administrators to create new admin users:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  createAdminUser: function(email) {
    check(username, String);

    var user = Meteor.users.findOne(this.userId);
    if (user && user.isAdmin) {

      var newUserId = Accounts.createUser({
        email: email,
        isAdmin: true
      });

      Accounts.sendEnrollmentEmail(newUserId);
    }
  }
});
</code></pre>

This looks secure enough. We’re asserting that the username is a <code class="language-javascript">String</code>, and that the currently logged in user has the appropriate authorization to create a new admin user. No one could tamper with this method and fraudulently create an admin account.

Unfortunately, we’re forgetting that <code class="language-javascript">createUser</code> can also be called from the client. Additionally, any client can provide their own <code class="language-javascript">options</code> argument. An in-the-know user could create an admin account by running this code in their browser console:

<pre class="language-javascript"><code class="language-javascript">Accounts.createUser({
  username: "loladmin",
  password: "loladmin",
  isAdmin: true
});
</code></pre>

After running the above line, the user would be logged in and granted full administrator permissions.

<hr/>

There are two obvious fixes to this security issue. The first, and by far the most straight-forward is to simply [disable user account creation on the client](http://docs.meteor.com/#/full/accounts_config) using <code class="language-javascript">forbidClientAccountCreation</code>. This may not be the best solution, though, as it would prevent users from signing up with your application. Only administrators would be able to create users through server-side methods.

A better solution may be to remove the <code class="language-javascript">onCreateUser</code> callback and move the admin creation functionality into an entirely separate method:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  createAdminUser: function(email) {
    check(email, String);

    var user = Meteor.users.findOne(this.userId);
    if (user && user.isAdmin) {

      var newUserId = Accounts.createUser({
        email: email
      });

      Meteor.call(“makeUserAdmin”, newUserId);
      Accounts.sendEnrollmentEmail(newUserId);
    }
  },
  makeUserAdmin: function(userId) {
    check(userId, String);
    var user = Meteor.users.findOne(this.userId);
    if (user && user.isAdmin) {
      Meteor.users.update(userId, {
        $set: {
          isAdmin: true
        }
      });
    }
  }
});
</code></pre>

Using this solution, users can still register for your application using <code class="language-javascript">createUser</code> on the client, and admins can still create new admin users using the <code class="language-javascript">createAdminUser</code> method.

<hr/>

This issue is indicative of a broader issue with developing Meteor. Developers often forget that most of the code they’re writing is isomorphic. Most of the code you write can (and will be) run on both the server and the client.

Sometimes it’s easy to lose track of where your code can be executed. Is the file you’re editing buried deep within a <code class="language-javascript">server</code> folder? Is the code you’re writing wrapped in a <code class="language-javascript">Meteor.isServer</code> guard? Is the code you’re writing in any way triggerable by a client-side action? These questions can be cognitive burdens, but they’re important to keep in mind at all times when developing secure Meteor applications.
