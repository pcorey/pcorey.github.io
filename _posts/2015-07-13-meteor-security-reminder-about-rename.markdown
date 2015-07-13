---
layout: post
title:  "Meteor Security - Reminder About Rename"
titleParts: ["Meteor Security", "Reminder About Rename"]
date:   2015-07-13
tags: ["security"]
---

The Mongo [$rename operator](http://docs.mongodb.org/manual/reference/operator/update/rename/#up._S_rename) is a lot like your cousin's kid at your last family reunion - easy to forget about, but without constant supervision it can wreak havoc. Many [Meteor](https://www.meteor.com/) security patterns rely on validating [modifier objects](http://docs.meteor.com/#/full/modifiers), and the <code class="language-javascript">$rename</code> operator often slips through the cracks.

Let's take a look at a couple of real-world examples of vulnerabilities exposed through mishandling the <code class="language-javascript">$rename</code> operator.

## Allow Update

Here's an example of an update validator that seems fairly complete. The goal is to allow a user to update their <code class="language-javascript">Post</code> object, but not be able to change the value of <code class="language-javascript">userId</code> away from their current user ID. Check it out:

<pre class="language-javascript"><code class="language-javascript">Posts.allow({
  update: function(userId, doc, fields, modifier) {
    ...
    for (var key in modifier) {
      else if (modifier[key].hasOwnProperty("userId")) {
        if (key === "$set") {
          if (modifier[key].userId !== userId) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }
});
</code></pre>

At first glance, this seems solid. We're checking if the user is running a modifier operation on <code class="language-javascript">userId</code>. If they are, we check if it's a <code class="language-javascript">$set</code>. If it's a <code class="language-javascript">$set</code>, we verify that the value they're setting <code class="language-javascript">userId</code> to matches the current user's ID. All other operations against userId are disallowed. Great!

But wait! What if we were to run an update like the following:

<pre class="language-javascript"><code class="language-javascript">Posts.update(post._id, {
  $rename: {
    title: 'userId'
  }
});
</code></pre>

Now our modifier isn't directly operating on <code class="language-javascript">userId</code>. It's operating on <code class="language-javascript">title</code>, which we're assuming we have permission to modify. In this update, <code class="language-javascript">title</code> will be renamed to <code class="language-javascript">userId</code>, effectively dumping the value of <code class="language-javascript">title</code> into the <code class="language-javascript">userId</code> field.

This means that we have the power to set <code class="language-javascript">userId</code> to any arbitrary value. If we were a malicious user, we could inject posts into user users' accounts. This is a bad thing!

## Method Security

While update validators make heavy use of modifiers, I've also seen Meteor methods rely on this type of validation. Check out this example of a method used to modify a user's profile:

<pre class="language-javascript"><code class="language-javascript">editUserProfile: function (modifier) {
  var user = Meteor.user(),
      schema = Users.simpleSchema()._schema;
  _.each(modifier, function (operation) {
    _.keys(operation).forEach(function (fieldName) {
      var field = schema[fieldName];
      if (!Users.can.edit(user, field, user)) {
        throw new Meteor.Error('Not allowed!');
      }
    });
  });
  ...
}
</code></pre>

This method loops over each field of the provided modifier and checks if it is an editable field according to the <code class="language-javascript">Users</code> schema. If it's not editable and it's trying to be modified, an exception is thrown.

For this example, let's assume that there is an <code class="language-javascript">admin</code> field in the <code class="language-javascript">Users</code> schema that is un-editable by users, and a <code class="language-javascript">profile.location</code> field that is editable but optional. Normally, a direct update to <code class="language-javascript">admin</code> would result in an exception, but what happens if we run the following method calls:

<pre class="language-javascript"><code class="language-javascript">Meteor.call('editUserProfile', {$set: {'profile.location': 'truthy'}});
Meteor.call('editUserProfile', {$rename: {'profile.location': 'admin'}});
</code></pre>

__Bam!__ We're an admin!

We're making two calls to <code class="language-javascript">editUserProfile</code>. The first is setting the optional <code class="language-javascript">location</code> field on our <code class="language-javascript">profile</code> to <code class="language-javascript">"truthy"</code>. The next is renaming the <code class="language-javascript">profile.location</code> to <code class="language-javascript">admin</code>, which dumps our <code class="language-javascript">"truthy"</code> value into <code class="language-javascript">admin</code>. Since this system makes loose checks against the truthiness of the <code class="language-javascript">admin</code> field, this was all we needed to escalate our privileges. This is a __very bad thing!__

## Whitelist Your Modifiers

You should approach your modifier validation with a [whitelist mindset](https://www.schneier.com/blog/archives/2011/01/whitelisting_vs.html). Don't try to block all of the bad modifiers you can think of because there's always a chance that a clever, but malicious, user will outthink your checks. Instead, only allow the exact modifiers you expect based on the actions your users can take.

Applying this mindset to the first example, we may know that users can only update the <code class="language-javascript">title</code> and <code class="language-javascript">body</code> of their posts when doing an update. We could change our allow validator to something like the following:

<pre class="language-javascript"><code class="language-javascript">Posts.allow({
  update: function(userId, doc, fields, modifier) {
    ...
    return Match.test(modifier, {
      $set: {
        userId: Match.Optional(Match.Where(function(setUserId){ 
          check(userId, String);
          return setUserId === userId;
        })),
        title: Match.Optional(String),
        body: Match.Optional(String)
      }
    });
  }
});
</code></pre>

## Mind Your Field Order

The issue with our second example wasn't a blacklist vs whitelist mindset. We were correctly allowing only updates on fields we expect. Unfortunately, we were allowing __any kind of update__.

A more in-depth, declarative solution may be to extend the <code class="language-javascript">Users</code> schema with an <code class="language-javascript">allowedOperators</code> field. The <code class="language-javascript">Users.can.edit</code> method would be passed the current operator along with the current field and determine if the schema allows the combination.

With this solution, the <code class="language-javascript">profile.location</code> field would have only had <code class="language-javascript">$set</code> in its <code class="language-javascript">allowedOperators</code>. An attempt to <code class="language-javascript">$rename</code> <code class="language-javascript">profile.location</code> into <code class="language-javascript">admin</code> would have failed. Success!

## Final Thoughts

From a security perspective, Mongo modifiers can be difficult to deal with. The <code class="language-javascript">$rename</code> operator can be especially hairy. When building out your collection validators and method security, be sure to keep this operator in mind!