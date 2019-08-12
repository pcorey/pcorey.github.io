---
layout: post
title:  "Clone Meteor Collection References"
excerpt: "Ever wanted to have two different sets of helpers attached to a single Meteor collection? It's more complicated than you may think."
author: "Pete Corey"
date:   2016-09-19
tags: ["Javascript", "Meteor"]
---

We recently ran into an interesting situation in a Meteor application we were building for a client.

The application had several types of users. We wanted each type of users to have a distinct set of helpers (defined with the [Collection Helpers](https://github.com/dburles/meteor-collection-helpers) package).

Unfortunately, Meteor’s heavy use of global variables and the inability to define multiple collection references for a single MongoDB collection made this a more complicated task than we hoped.

## Buyers and Sellers

To get a better idea of what we’re talking about, imagine we have “buyers” and “sellers”. Both of these are normal users, so they’ll reference the `Meteor.users`{:.language-javascript} collection:

<pre class='language-javascript'><code class='language-javascript'>
Buyers = Meteor.users;
Sellers = Meteor.users;
</code></pre>

Now let’s define a few helpers:

<pre class='language-javascript'><code class='language-javascript'>
Buyers.helpers({
  buy() { ... },
  history() { ... }
});

Sellers.helpers({
  sell() { ... },
  history() { ... }
});
</code></pre>

Let’s imagine that `buy`{:.language-javascript} on `Buyers`{:.language-javascript} carries out a purchase, and `history`{:.language-javascript} returns a list of all purchases that buyer has made. Similarly, `sell`{:.language-javascript} on `Sellers`{:.language-javascript} carries out a sale, and `history`{:.language-javascript} returns a list of sales that seller has made.

## A Buyer’s Seller History

We can call `sell`{:.language-javascript} on a `Seller`{:.language-javascript}, as expected:

<pre class='language-javascript'><code class='language-javascript'>
let seller = Sellers.findOne({ ... });
seller.sell();
</code></pre>

Similarly, we can call `buy`{:.language-javascript} on a `Buyer`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
let buyer = Buyers.findOne({ ... });
buyer.buy();
</code></pre>

We can also call `history`{:.language-javascript} on both `buyer`{:.language-javascript} and `seller`{:.language-javascript}. However, when we call `history`{:.language-javascript} on our seller, we don’t get a list of their sales. Instead, we get a list of their purchases.

If we dig a little more, we’ll also notice that we can call `sell`{:.language-javascript} on our `buyer`{:.language-javascript}, and `buy`{:.language-javascript} on our seller.

This is definitely not what we want. These two distinct types of users should have totally separate sets of helpers.

## Supersets of Helpers

These issues are happening because we’re defining two sets of helpers on the same `Meteor.users`{:.language-javascript} collection. After the second call to `helpers`{:.language-javascript}, `Meteor.users`{:.language-javascript} has a `buy`{:.language-javascript} helper, a `sell`{:.language-javascript} helper, and the seller’s version of the `history`{:.language-javascript} helper (the buyer’s `history`{:.language-javascript} was overridden).

Even though we’re using different variables to point to our “different” collections, both variables are pointing to the same collection reference.

Our `Meteor.users`{:.language-javascript} collection now has a superset of helper functions made up of the union of the `Buyers`{:.language-javascript} and `Sellers`{:.language-javascript} helpers.

## Cloned Collection References

After considering a few more architecturally complicated solutions to this problem, we realized that an easy solution was sitting right under our noses.

Instead of having `Buyers`{:.language-javascript} and `Sellers`{:.language-javascript} reference the `Meteor.users`{:.language-javascript} collection directly, we could have `Buyers`{:.language-javascript} and `Sellers`{:.language-javascript} reference shallow clones of the `Meteor.users`{:.language-javascript} collection:

<pre class='language-javascript'><code class='language-javascript'>
Buyers = _.clone(Meteor.users);
Sellers = _.clone(Meteor.users);
</code></pre>

This way, each clone would have it’s own internal `_helpers`{:.language-javascript} function which is [used to transform the database document](https://github.com/dburles/meteor-collection-helpers/blob/master/collection-helpers.js#L9-L12) into an object usable by our Meteor application.

Calling `Buyers.helpers`{:.language-javascript} will define helper functions on the `Buyers`{:.language-javascript} collection reference, not the `Sellers`{:.language-javascript} or `Meteor.users`{:.language-javascript} collection references. Similarly, `Sellers.helpers`{:.language-javascript} will set up a set of helper functions unique to the `Sellers`{:.language-javascript} collection reference.

Now calling `buyer.history()`{:.language-javascript} returns a list of purchases, and `seller.history()`{:.language-javascript} returns a list of sales. The `sell`{:.language-javascript} helper doesn’t exist on our `buyer`{:.language-javascript} user, and `buy`{:.language-javascript} doesn’t exist on our `seller`{:.language-javascript}.

Perfect!

## Final Thoughts

While this solution worked great for our application, it might not be the best solution to your problem.

Cloning collection references is a delicate thing that may not play nicely with all collection functionality, or all collection-centric Meteor packages.

Also note that [deep cloning](https://lodash.com/docs/4.15.0#cloneDeep) of collection references does not work at all. While we haven’t looked under the hood to find out what’s going on, we assume that it has to do with breaking callback references or something along those lines.

If you’re facing a problem like this, try to work out a solution that operates within the design principles of Meteor before hacking your way around them. But if all else fails, remember that you have options.
