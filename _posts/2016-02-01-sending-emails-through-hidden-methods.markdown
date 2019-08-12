---
layout: post
title:  "Sending Emails Through Hidden Methods"
titleParts: ["Sending Emails Through", "Hidden Methods"]
excerpt: "Even if your methods aren't published to the client, they can still be called by malicious users to send emails or do other nefarious things."
author: "Pete Corey"
date:   2016-02-01
tags: ["Meteor", "Security"]
---

I was recently asked to take a look at a friend's Meteor application. I was particularly interested in the security of the system, so I started snooping.

One of the first things I do when sleuthing my way through a new application is to dig into the client-side `Meteor.connection._methodHandlers`{:.language-javascript} object, looking for interesting methods to play with. In this application, there was nothing interesting to be found; just the standard `insert`{:.language-javascript}, `update`{:.language-javascript}, and `remove`{:.language-javascript} methods generated for every MongoDB collection.

<img src="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/methodHandlers.png" style="max-width: 100%">

When no methods appear in the `Meteor.connection._methodHandlers`{:.language-javascript} object, it means that the developer either didn't write any Meteor methods, or they wrote their methods in a server-only location which prevents them from being shipped and made visible to the client.

## Finding Hidden Methods

If you've read my post on [auditing Meteor methods](http://blog.east5th.co/2015/04/15/black-box-meteor-method-auditing/), you'll remember that even though a method may be hidden from the client, the client is still able to invoke that method. This means that while we may not see any interesting methods defined in the `Meteor.connection._methodHandlers`{:.langauge-javascript} object, we might be able to find interesting method calls being done by the client.

To find these method calls, I opened up the minified Javascript source of the application, and started searching through the code for `/\.call("/`{:.language-javascript}. Very quickly, I started seeing calls to hidden Meteor methods.

## Sending Emails

While scanning through these calls to hidden methods, one method call in particular caught my eye:

<pre class="language-javascript"><code class="language-javascript">...
Meteor.call("sendEmail", this.getEmail(), "Welcome...");
...
</code></pre>

It looked as if this method took an email address and a message as arguments, and sent that message to the provided email address. Without access to the source of the method, I didn't know if the method was doing some kind of validation on the provided email address. The only way to find out was to test it out. In my browser console, I tried the following:

<pre class="language-javascript"><code class="language-javascript">Meteor.call("sendEmail", "hello@petecorey.com", "Hi Pete!");
</code></pre>

Sure enough, a few seconds later I received an email ___from the application owner___ with a message of `"Hi Pete!"`{:.language-javascript}. Uh oh.

With a little devious thinking, it's not hard to imagine how this functionality could easily be abused by a potential hacker. Imagine someone leveraging your server and your SMTP account to send hundreds or thousands of spam emails. Or even worse, imagine an attacker impersonating the application or application owner and convincing users to click malicious links. This is a bad thing.

## Locking It Down

The fix for this issue is fairly straightforward. Because any Meteor method can be called by any Meteor client, we simply shouldn't have a method that sends arbitrary emails to arbitrary email addresses. Instead, we should take a step back and look at what we're trying to do.

For example, if we're attempting to send a welcome email to a user after they sign up for our application. A better way to handle this situation may be to [hook into the user creation process](http://docs.meteor.com/#/full/accounts_oncreateuser) and send the email there.

Or maybe an admin user may want the ability to send emails to users through some kind of admin panel. This could be implemented through a method that looks very similar to the `sendEmail`{:.language-javascript} method we saw earlier, but with a few key differences. First, we would verify that the current user has the expected permissions to send the email. We would also verify that we're sending the email to a user of the system, not an arbitrary email address:

<pre class="language-javascript"><code class="language-javascript">sendEmail: function(userId) {
  var user = Meteor.users.findOne(userId);
  if (Roles.userIsInRole(this.userId, "admin") &&
      user && user.emails && user.emails[0].address) {
    Email.send(...);
  }
}
</code></pre>

## Final Thoughts

Isomorphism, or "universal code" is still a relatively new concept for many web developers. It can be difficult to cleanly divide server and client code in our minds when the distinction is anything but clear in the real world.

When writing Meteor applications, and Meteor methods in particular, it is incredibly important to always remember where your code can be run, and who can run it.

