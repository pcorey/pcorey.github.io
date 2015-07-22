---
layout: post
title:  "Vulnerabilities in an eCommerce Application"
titleParts: ["Vulnerabilities", "in an eCommerce Application"]
date:   2015-07-21
tags: ["security"]
---

Last week, [Rob Conery](http://rob.conery.io/) put out an awesome [series of screencasts](http://www.pluralsight.com/courses/discussion/meteorjs-web-application) detailing how to build an eCommerce site using Meteor. After watching the series, I dove into the final code on [Github](https://github.com/robconery/meteor-shop). After some digging, I noticed that the application was vulnerable to a variety of attacks.

Most of the issues I found are fairly low hanging fruit, but their implications are serious. The majority of the vulnerabilities can be fixed by correctly [checking](http://docs.meteor.com/#/full/check) user provided arguments.

Below is an excerpt of the list of vulnerabilities I sent to Rob. After some discussion, I ended up sending a [pull request](https://github.com/robconery/meteor-shop/pull/1) that fixed a majority of the issues.

<hr/>

## Item Prices Are Changeable (Severity: <span style="color:#cc0000;">High</span>)

The saveCart method is trusting that the items array on the provided cart object is accurate. This means that a client can modify the prices of each item on the client, and call saveCart which will loop through each of these modified items and calculate the total price of the cart ([shopping_cart.js:99-111](https://github.com/robconery/meteor-shop/blob/d667a93ba3a116f1d65534b384099bc9e8230e80/lib/shopping_cart.js#L99-L111)).

A malicious user can grab their cart during checkout, update the price of an item, and call saveCart to modify the total price of their cart:

<pre class="language-javascript"><code class="language-javascript">var cart = Carts.find().fetch()[0];
cart.items[0].price = 1337;
Meteor.call('saveCart', cart);
// Profit...
</code></pre>

### Impact:

This means that any malicious user can effectively set the price of any item to whatever they want. This can result in serious losses for your space tourism business.

### Remediation:

Rather than storing entire item objects in each cart, I recommend storing a list of Product IDs. During your saveCart method, grab the Products and iterate them as you would the items.

<hr/>

## Users' Carts Can Be Modified By Other Users (Severity: <span style="color:#cc0000;">High</span>)

The updateCart, addToCart, removeFromCart, and saveCart methods make no attempt to verify that the cart being modified belongs to the current user. ([shopping_cart.js](https://github.com/robconery/meteor-shop/blob/d667a93ba3a116f1d65534b384099bc9e8230e80/lib/shopping_cart.js)).

A malicious user can grab the userKey of any user in the system (using a technique shown below), and add or remove any items from that users cart as they please.

<pre class="language-javascript"><code class="language-javascript">Meteor.call('addToCart', 'userKeyOfVictim', 'skuOfReallyExpensiveItem');
</code></pre>

### Impact:

Because all carts are fetchable (see below), a malicious user can find the userKey of any user in the system and arbitrarily add or remove items from their cart. If a very expensive item is added to a user's cart just before they finalize their purchase, they'll likely lose trust in your business. This will likely affect the relationship with your vendors as well.

### Remediation:

Your system allows for anonymous purchases by design, which means that your userKey is your only form of authentication and authorization. Because of this, it's vital that this is kept secret. Fixing the vulnerabilities that expose userKeys and checking the arguments of your updateCart, addToCart, removeFromCart, and saveCart methods will fix this issue.

A potentially more secure solution would be to require a user to log in before adding an item to their cart. You could completely replace to use of userKey and instead attach a userId to each cart object. This could then be checked against the current user's ID to ensure that they're modifying their own cart:

<pre class="language-javascript"><code class="language-javascript">addToCart : function(sku){
  check(sku, String);

  var cart = Carts.findOne({
    userId: this.userId
  });

  if (!cart) {
    throw new Meteor.Error('We wan\'t find your cart.');
  }
  ...
}
</code></pre>

<hr/>

## All Carts Can Be Removed (Severity: <span style="color:#e69138;">Medium</span>)

The emptyCart method isn't asserting that userKey is a String ([shopping_cart.js:113-116](https://github.com/robconery/meteor-shop/blob/d667a93ba3a116f1d65534b384099bc9e8230e80/lib/shopping_cart.js#L113-L115)).

This means that a malicious user can pass in a Mongo query object to remove all Carts in the system, directly from their browser console:

<pre class="language-javascript"><code class="language-javascript">Meteor.call('emptyCart', {$gte: ''});
</code></pre>

### Impact:

This call can easily be automated by a malicious user to remove all carts in the system every few seconds. This would essentially prevent any users from making purchases on your site.

### Remediation:

Fixing this issue is as simple as checking that userKey is a string:

<pre class="language-javascript"><code class="language-javascript">emptyCart : function(userKey){
  check(userKey, String);
  Carts.remove({userKey : userKey});
}
</code></pre>

<hr/>

## All Carts Are Fetchable (Severity: <span style="color:#e69138;">Medium</span>)

The cart publication isn't asserting that key is a String ([publications.js:17-19](https://github.com/robconery/meteor-shop/blob/d667a93ba3a116f1d65534b384099bc9e8230e80/server/publications.js#L17-L19)).

This means that a malicious user can pass in a Mongo query object to grab all Carts in the system, directly from their browser console:

<pre class="language-javascript"><code class="language-javascript">Meteor.subscribe('cart', {$gte: ''});
Carts.find().fetch();
</code></pre>

### Impact:

This means that malicious users can see the stored carts of every user in the system, including sensitive information like items ordered, name, email, IP, total spent and their userKey.

### Remediation:

Fixing this issue is as simple as checking that key is a string:

<pre class="language-javascript"><code class="language-javascript">Meteor.publish("cart", function(key){
  check(key, String);
  return Carts.find({userKey : key});
});
</code></pre>

<hr/>

## All Carts Are Fetchable - Method II (Severity: <span style="color:#e69138;">Medium</span>)

The getCart method isn't asserting that userKey is a String ([shopping_cart.js:30-32](https://github.com/robconery/meteor-shop/blob/d667a93ba3a116f1d65534b384099bc9e8230e80/lib/shopping_cart.js#L30-L32)).

Carts.getCart is doing a findOne, which means that we can't grab all carts in one pass, but we can do it incrementally by using an $nin query operators and tracking our progress:

<pre class="language-javascript"><code class="language-javascript">var carts = [];
function getCartAndSave(userKeys) {
    Meteor.call('getCart', {$nin: userKeys}, function(e, r) {
        if (e || !r || !r._id) {
            return;
        }
        carts.push(r);
        userKeys.push(r.userKey);
        getCartAndSave(userKeys);
    });
}
getCartAndSave(['']);
</code></pre>

### Impact:

This means that malicious users can see the stored carts of every user in the system, including sensitive information like items ordered, name, email, IP, total spent and their userKey.

### Remediation:

Fixing this issue is as simple as checking that userKey is a string:

<pre class="language-javascript"><code class="language-javascript">getCart : function(userKey){
  check(userKey, String);
  return Carts.getCart(userKey);
}
</code></pre>

<hr/>

## All Products Are Fetchable (Severity: <span style="color:#6aa84f;">Low</span>)

Both the products-by-vendor and products-by-sku publications aren't making assertions about what the slug and sku arguments must be ([publications.js:9-15](https://github.com/robconery/meteor-shop/blob/d667a93ba3a116f1d65534b384099bc9e8230e80/server/publications.js#L9-L15)).

This means that a malicious can pass in a Mongo query object to grab all Products in the system, directly from their browser console:

<pre class="language-javascript"><code class="language-javascript">Meteor.subscribe('products-by-vendor', {$gte: ''});
Meteor.subscribe('products-by-sky', {$gte: ''});
Products.find().fetch();
</code></pre>

### Impact:

The impact of this issue is probably fairly low. These products are intended to be viewed by the client, but not in this way. In the future, if “protected” products are added, this may be an overlooked attack vector that produces an issue.

### Remediation:

Fixing this issue is as simple as checking that slug and sku are strings:

<pre class="language-javascript"><code class="language-javascript">Meteor.publish("products-by-vendor", function(slug){
  check(slug, String);
  return Products.find({"vendor.slug" : slug})
});
</code></pre>

<pre class="language-javascript"><code class="language-javascript">Meteor.publish("products-by-sku", function(sku){
  check(sku, String);
  return Products.find({sku : sku});
});
</code></pre>
