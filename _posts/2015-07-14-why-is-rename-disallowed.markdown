---
layout: post
title:  "Why Is Rename Disallowed?"
titleParts: ["Why Is Rename", "Disallowed"]
description: "The MongoDB 'rename' operator is disallowed in Meteor client-side queries. Let's explore why that may be."
author: "Pete Corey"
date:   2015-07-14
tags: ["Javascript", "Meteor", "Security"]
---

Have you ever tried to use <code class="language-javascript">$rename</code> in a collection update from the client? If so, you've probably noticed this error:

> Access denied. Operator $rename not allowed in a restricted collection.

If we dig into [Meteor's source](https://github.com/meteor/meteor/blob/85ca501b7cf53df31e634fe70f5ce542c75298c7/packages/mongo/collection.js#L1082-L1091), we can see that <code class="language-javascript">$rename</code> is (currently) the only disallowed modifier. Why is that? To put it bluntly, the Mongo [$rename operator](http://docs.mongodb.org/manual/reference/operator/update/rename/#up._S_rename) is a lot like your cousin's kid at your last family reunion - easy to forget about, but without constant supervision it can wreak havoc.

It can be especially easy to forget about <code class="language-javascript">$rename</code> operators when building collection validators that depend on validating [modifier objects](http://docs.meteor.com/#/full/modifiers).

## A Validator Example

Take a look at the following update validator. It's intended to allow a user to <code class="language-javascript">$set</code> the <code class="language-javascript">userId</code> on a <code class="language-javascript">Posts</code> object, but only if the value you're assigning it matches their current user's ID:

<pre class="language-javascript"><code class="language-javascript">Posts.allow({
  update: function(userId, doc, fields, modifier) {
    ...
    for (var key in modifier) {
      if (modifier[key].hasOwnProperty("userId")) {
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

In its current form, this is a solid validator. We're checking if the user is running a modifier operation on <code class="language-javascript">userId</code>. If they are, we check if it's a <code class="language-javascript">$set</code>. If it's a <code class="language-javascript">$set</code>, we verify that the value they're setting <code class="language-javascript">userId</code> to matches the current user's ID. All other operations against <code class="language-javascript">userId</code> are disallowed. Great!

Would this still be secure if <code class="language-javascript">$rename</code> were an allowed operator? Consider if it were and we ran the following update:

<pre class="language-javascript"><code class="language-javascript">Posts.update(post._id, {
  $rename: {
    title: 'userId'
  }
});
</code></pre>

Now our modifier isn't directly operating on <code class="language-javascript">userId</code>. It's operating on <code class="language-javascript">title</code>, which we're assuming we have permission to modify. In this update, <code class="language-javascript">title</code> will be renamed to <code class="language-javascript">userId</code>, effectively dumping the value of <code class="language-javascript">title</code> into the <code class="language-javascript">userId</code> field.

This means that if <code class="language-javascript">$rename</code> were an allowed operator and we were using this validator, users would have the power to set <code class="language-javascript">userId</code> to any arbitrary value. Malicious users could inject posts into user users' accounts. This would be a bad thing!

## No Place On The Client

The <code class="language-javascript">$rename</code> operator has valid uses. It can be great for updating schemas during migrations, and doing wholesale data transformations. However, these use cases are almost never carried out through the client layer. Instead, they're done entirely on the backend.

As we've seen, it can be difficult to reason about the <code class="language-javascript">$rename</code> operator when writing collection validators. By effectively reversing its field list when compared to all other [Mongo operators](http://docs.mongodb.org/manual/reference/operator/update/), it can easily slip through the cracks in your validation and expose potentially dangerous vulnerabilities.

Rather than expose that potential risk to all Meteor applications in exchange for functionality that arguably shouldn't exist on the client, it seems the Meteor team decided to disallow the <code class="language-javascript">$rename</code> operation on client-side updates.

## The Threat Persists

However, <code class="language-javascript">$rename</code> operators can be used on the server. This means that vulnerabilities exposed through incomplete validation can still exist in the wild. Take a look at this method from a __real-world project__ I was digging into recently:

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

## Sealing The Cracks

It is rarely a good idea to pass a user-provided modifier object directly into a collection query running on the server. If your system is doing this, be sure that you're [whitelisting valid modifiers](https://www.schneier.com/blog/archives/2011/01/whitelisting_vs.html), rather than blacklisting bad operators.

A declarative solution to the last example's flaw may be to extend the <code class="language-javascript">Users</code> schema with an <code class="language-javascript">allowedOperators</code> field. The <code class="language-javascript">Users.can.edit</code> method would be passed the current operator along with the current field and determine if the schema allows the combination.

With this solution, the <code class="language-javascript">profile.location</code> field would have only had <code class="language-javascript">$set</code> in its <code class="language-javascript">allowedOperators</code>. An attempt to <code class="language-javascript">$rename</code> <code class="language-javascript">profile.location</code> into <code class="language-javascript">admin</code> would have failed. Success!
