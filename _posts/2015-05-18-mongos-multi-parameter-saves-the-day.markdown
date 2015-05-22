---
layout: post
title:  "Mongo's Multi Parameter Saves the Day"
titleParts: ["Mongo's Multi Parameter", "Saves the Day"]
date:   2015-05-18
categories: ["security"]
---

In the past, I've seen the [multi parameter](http://docs.mongodb.org/manual/reference/method/db.collection.update/#multi-parameter) on [MongoDB](http://www.mongodb.com/) [updates](http://docs.mongodb.org/manual/reference/method/db.collection.update/) as an annoying inconvenience. Without fail, I'll forget to [add the flag](http://docs.meteor.com/#/full/update) when it's needed, and waste a frustrating amount of time trying to deduce why my update isn't behaving as expected. But, a recent trek through [Telescope's](https://github.com/TelescopeJS/Telescope) codebase revealed to me just how valuable it can be to default to updating a single item at a time. Come with me on a journey...

<p style="border: 1px dashed tomato; padding: 1em; background-color: rgba(255, 99, 71, 0.125);">
On a side note, <a href="https://github.com/TelescopeJS/Telescope">Telescope</a> is one of the highest quality open source <a href="https://www.meteor.com/">Meteor</a> projects I've seen to date. I highly recommend it as a platform!
</p>

## Digging Into Telescope

The code that opened my proverbial eyes is the <code class="language-javascript">changeEmail</code> method found in <code class="language-*">/server/users.js</code> in Telescope. [Take a look](https://github.com/TelescopeJS/Telescope/blob/master/server/users.js#L60-L75):

<pre class="language-javascript"><code class="language-javascript">changeEmail: function (userId, newEmail) {
  var user = Meteor.users.findOne(userId);
  if (can.edit(Meteor.user(), user) !== true) {
    throw new Meteor.Error("Permission denied");
  }
  Meteor.users.update(
    userId,
    {$set: {
        emails: [{address: newEmail, verified: false}],
        email_hash: Gravatar.hash(newEmail),
        "profile.email": newEmail
      }
    }
  );
}
</code></pre>

If you've read my [previous](http://www.1pxsolidtomato.com/2015/04/06/nosql-injection-or-always-check-your-arguments/) [posts](http://www.1pxsolidtomato.com/2015/05/05/meteor-security-in-the-wild/), I hope you'll immediately notice that <code class="language-javascript">userId</code> and <code class="language-javascript">newEmail</code> are not being [checked](http://docs.meteor.com/#/full/check). Can that be exploited? What happens if a malicious user, Mallory, decides to pass in a carefully crafted object as the <code class="language-javascript">userId</code>?

<pre class="language-javascript"><code class="language-javascript">Meteor.call(‘changeEmail', {_id: {$gte: Meteor.userId()}}, ‘mallory@is.evil');
</code></pre>

This <code class="language-javascript">userId</code> object, when used in a Mongo query, will return all users with IDs [ordinally greater than or equal to](http://docs.mongodb.org/manual/reference/operator/query/gte/) the current user's ID. We can roughly assume that this is about half of the users in the system. The list of returned users will always return the current user first, due to the index on the <code class="language-javascript">_id</code> field.

In our <code class="language-javascript">changeEmail</code> method, <code class="language-javascript">Meteor.users.findOne</code> will happily accept our <code class="language-javascript">userId</code> object and treat it as a query object. It will grab the first result of this query, which happens to be the current user (Mallory).

Next, the method checks if the current user has permission to edit the user found. Because the first user found __is the current user__, permission is granted. Proceed with the update!

## You Get a New Email Address! And You Get a New Email Address!

If Mongo didn't require explicitly setting the multi parameter, calling <code class="language-javascript">Meteor.users.update</code> with our malicious <code class="language-javascript">userId</code> object would result in a huge chunk of users having their emails changed to Mallory's email address. This would be a Very Bad Thing&trade;. He could easily reset their passwords through normal channels and take over their accounts!

## But Not Really...

Thankfully, Mongo defaults to updating only a single object unless the multi flag is explicitly set to <code class="language-javascript">true</code>. In this example, only the first result of the query, the current user, will be updated with the new email address. This means that the method functions as intended, and there is no vulnerability! Three cheers for the multi flag!

## Final Thoughts

While I'm sure I'll still continue to forget to add the multi flag when writing updates, I now have a newfound respect for this aspect of Mongo. This conservative default, which was [initially built in with performance in mind](https://www.youtube.com/watch?feature=player_embedded&v=pgu3nta2iLM#t=124), also acts as a protective mechanism to prevent us from inadvertently modifying more data than we intended.

Lastly, remember to always check your method and publication arguments! While it ended up not being a problem in this example, we nearly had a serious vulnerability on our hands. It's always better to be safe than sorry.
