---
layout: post
title:  "Rename Your Way To Admin Rights"
titleParts: ["Rename Your Way To", "Admin Rights"]
description: "MongoDB's rename operator can be used for great evil is left unchecked. Dive into this vulnerability exploration for a detailed example and remediation."
author: "Pete Corey"
date:   2015-10-19
tags: ["Javascript", "Meteor", "Security", "NoSQL Injection"]
---

MongoDB [modifier objects](http://docs.meteor.com/#/full/modifiers) are hard. ___Incredibly hard.___ When you're dealing with almost two dozen different [update operators](https://docs.mongodb.org/manual/reference/operator/update/), it's difficult to imagine all the ways in which a piece of data can be changed.

A few months ago I found an interesting issue in [Telescope](http://www.telescopeapp.org/) that perfectly highlights this problem. Telescope's method to complete a user's profile wasn't correctly validating the MongoDB modifier being passed in. Exploiting that, I was able to pass in an underhanded modifier and give myself instant admin access.

<p style="border: 1px dashed tomato; padding: 1em; background-color: rgba(255, 99, 71, 0.125);">Don't mistake this post as a warning against using Telescope; <b><i>the vulnerability I discuss here was immediately patched after it was reported</i></b>. The Telescope project continuously impresses me with its architectural choices and its obvious focus on code quality and understandability!</p>

## Security In Telescope

Telescope is an interesting project. While I constantly talk about how you should rigorously [`check`{:.language-*}](http://docs.meteor.com/#/full/check_package) all of your method and publication arguments, Telescope <strike>does</strike> did very little of this - at least at the time I discovered this vulnerability. Contrary to what I might have you believe, this didn't cause the world to end. In fact, I had trouble finding ___any security issues at all___ in the project.

How is this possible? Surely without checking arguments, vulnerabilities abound!

Telescope achieved security through its heavy use of what [Sacha Greif](http://sachagreif.com/), Telescope's creator, calls [Query Constructors](https://www.discovermeteor.com/blog/query-constructors/). Instead of directly passing user input into query and modifier objects, Telescope uses that user data to guide the construction of ___new query objects___. User input is only injected into these new objects when absolutely necessary, and in those cases it's thoroughly and explicitly sanitized.

## Digging Into Validation

Despite this hardened architectural approach, there was one piece of code that caught my eye while digging through Telescope's source. The [`completeUserProfile`{:language-javascript}](https://github.com/TelescopeJS/Telescope/blob/af655c95711840df61f3c9df3020259f2098be77/packages/telescope-users/lib/methods.js#L12-L53) method was taking in a modifier object from the client and, after validation, passing it directly into a call to `Users.update`{:.language-javascript}.

The validation process seemed straight-forward. Each field in the `users`{:.language-javascript} schema maintained a list of roles allowed to modify that field. The `completeUserProfile`{:language-javascript} method looped over each field being modified and checked that the user had the required role:

<pre class="language-javascript"><code class="language-javascript">// go over each field and throw an error if it's not editable
// loop over each operation ($set, $unset, etc.)
_.each(modifier, function (operation) {
  // loop over each property being operated on
  _.keys(operation).forEach(function (fieldName) {
    var field = schema[fieldName];
    if (!Users.can.editField(user, field, user)) {
      throw new Meteor.Error("disallowed_property", ...);
    }
  });
});
</code></pre>

So, users with `"member"`{:.language-javascript} or `"admin"`{:.language-javascript} roles could modify `telescope.displayName`{:.language-javascript}, but only users with the `"admin"`{:.language-javascript} role could modify `isAdmin`{:.language-javascript}:

<pre class="language-javascript"><code class="language-javascript">displayName: {
  ...
  editableBy: ["member", "admin"]
}
</code></pre>

<pre class="language-javascript"><code class="language-javascript">isAdmin: {
  ...
  editableBy: ["admin"]
}
</code></pre>

## $Renaming For Fun And Profit

But `$set`{:.language-*} and `$unset`{:.language-javascript} aren't the only [update operators](https://docs.mongodb.org/manual/reference/operator/update/) at our disposal. The validation rules described above mean that users with the `"member"`{:.language-javascript} role could run ___any update operator___ on `displayName`{:.language-javascript}.

What would happen if I [`$rename`{:.language-*}](https://docs.mongodb.org/manual/reference/operator/update/rename/) `displayName`{:.language-javascript} to `isAdmin`{:.language-javascript}? Let's try it!

<pre class="language-javascript"><code class="language-javascript">Meteor.call("completeUserProfile", {
  $rename: {
    "telescope.displayName": "isAdmin"
  }
}, Meteor.userId());
</code></pre>

Instantly, various admin controls appear in our browser ([isn't reactivity cool?](http://blog.east5th.co/2014/12/02/meteor-first-impressions/))! And just like that, we gave ourself admin permissions.

So, what's going on here?

Let's assume we had a value in `displayName`{:.language-javascript}; let's say it was `"YouBetcha"`{:.language-javascript}. In that case, our user document would look something like this:

<pre class="language-javascript"><code class="language-javascript">{
  ...
  isAdmin: false,
  telescope: {
    ...
    displayName: "YouBetcha"
  }
}
</code></pre>

By running an update on our user document that renames `telescope.displayName`{:.language-javascript} to `isAdmin`{:.language-javascript}, I'm effectively dumping the value of `"YouBetcha"`{:.language-javascript} into `isAdmin`{:.language-javascript}. My user document would now look something like this:

<pre class="language-javascript"><code class="language-javascript">{
  ...
  isAdmin: "YouBetcha",
  telescope: {
    ...
  }
}
</code></pre>

Interestingly, [SimpleSchema](https://github.com/aldeed/meteor-simple-schema) does not enforce type constraints during `$rename`{:.language-javascript}, so we can happily dump our `String`{:.language-javascript} into the `Boolean`{:.language-javascript} `isAdmin`{:.language-javascript} field.

Most of the admin checks throughout Telescope were checks against the truthiness of `isAdmin`{:.language-javascript}, rather than strict checks (`user.isAdmin === true`{:.language-javascript}), or checks against the users' roles, so our `isAdmin`{:.language-value} value of `"YouBetcha"`{:.language-javascript} gives us admin access throughout the system!

## The Fix & Final Thoughts

After reporting this fix, Sacha immediately fixed this issue in the [v0.21.1](https://github.com/TelescopeJS/Telescope/blob/master/History.md#v0211-slugscope) release of Telescope.

His first fix was to [disallow `$rename` across the board](https://github.com/TelescopeJS/Telescope/commit/7e518007f1bf8b09f88977554abe11f489a2caf1), just like Meteor does [in updates originating from the client](http://blog.east5th.co/2015/07/14/why-is-rename-disallowed/). Later, he went on to `check`{:.language-javascript} that the modifiers being used are either [`$set`{:language-*} or `$unset`{:language-javascript}](https://github.com/TelescopeJS/Telescope/blob/v0.22.1/packages/telescope-users/lib/methods.js#L14).

<hr/>

MongoDB modifier objects can be very difficult to work with, especially in the context of security. You may be preventing `$set`{:.language-*} updates against certain fields, but are you also preventing `$inc`{:.language-*} updates, or even `$bin`{:.language-*} updates? Are you disallowing `$push`{:.language-*}, but forgetting `$addToSet`{:.language-*}? Are you appropriately handling `$rename`{:.language-javascript} when dealing with raw modifier objects?

All of these things need to be taken into consideration when [writing collection validators](http://blog.east5th.co/2015/06/15/allow-and-deny-challenge-check-yourself/), or accepting modifier object from clients in your Meteor methods. It's often a better solution to whitelist the modifiers you expect, and disallow the rest.

<hr/>

Are you using a vulnerable version of Telescope? Use my [Package Scan](http://scan.east5th.co/) tool to find out. You can also include Package Scan as part of your build process by adding [`east5th:package-scan`](https://github.com/East5th/package-scan) to your Meteor project:

<pre class="language-bash"><code class="language-bash">meteor add east5th:package-scan
</code></pre>
