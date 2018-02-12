---
layout: post
title:  "Hacking Prototypal Inheritance for Fun and Profit"
description: "Abuse of prototypal inheritance can allow attackers to exploit your application in various ways. Learn what to watch out for, and how to prevent vulnerabilities."
author: "Pete Corey"
date:   2018-01-29
tags: ["Javascript", "Meteor", "Security"]
related: []
---

Every object in Javascript is built on top of a “prototype”. A prototype can either be either another object, or `null`{:.language-javascript}. When an object’s prototype is another object, the first object can inherit fields from the second.

This type of [prototypal inheritance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain) is well-accepted and relatively well understood by most Javascript developers, but there are dangerous implications behind this kind of inheritance model.

Let’s dive into how we can hack prototypal inheritance for fun and profit!

## How are Prototypes Created?

A Javascript object’s prototype is referenced through [the hidden `__proto__`{:.language-javascript} field](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto). This field can be found on _every object in an application_. The `__proto__`{:.language-javascript} field can either point to another object, or `null`{:.language-javascript} if the current object has no prototype.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/hacking-prototypal-inheritance-for-fun-and-profit/1.png" style="display: block; margin:1em auto; width: 50%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">The two options for an object's prototype.</p>
</div>

The prototype of an object can explicitly be set using [`Object.create`{:.language-javascript}](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create), and passing in your desired prototype.

<pre class='language-javascript'><code class='language-javascript'>
let p = { foo: 123 };
let a = Object.create(p);
let b = Object.create(null);
</code></pre>

In this example, our new `a`{:.language-javascript} object inherits the `foo`{:.language-javascript} field from the `p`{:.language-javascript} object being used as its prototype. Our new `b`{:.language-javascript} object has no prototype, and inherits no fields.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/hacking-prototypal-inheritance-for-fun-and-profit/2.png" style="display: block; margin:1em auto; width: 50%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our two new objects and their prototype chains.</p>
</div>

The prototype of an object can also be manually set through the `__proto__`{:.language-javascript} field:

<pre class='language-javascript'><code class='language-javascript'>
let c = {};
c.__proto__ = { bar: 234 };
</code></pre>

In this case, we replace the reference to `c`{:.language-javascript}’s original prototype with a reference to a new object. We can now access the inherited `bar`{:.language-javascript} field through `c`{:.language-javascript}.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/hacking-prototypal-inheritance-for-fun-and-profit/3.png" style="display: block; margin:1em auto; width: 68%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">It's objects all the way down.</p>
</div>

By default, all Javascript objects created through the literal notion [point to `Object.prototype`{:.language-javascript} as their prototype](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/prototype). `Object.prototype`{:.language-javascript} is an object that holds helper functions like `constructor`{:.language-javascript}, `hasOwnProperty`{:.language-javascript}, and `toString`{:.language-javascript}. Additionally, `Object.prototype`{:.language-javascript} has a prototype of `null`{:.language-javascript}.

This means that in addition to the `bar`{:.language-javascript} field, our `c`{:.language-javascript} object also has access to everything living in `Object.prototype`{:.language-javascript} via its prototype’s prototype!

## Setting the Scene

Armed with this information, let’s think about how we can exploit a simple (read: contrived) Node.js application.

Let’s assume that we’re building an application using an [Express](http://expressjs.com/)-like framework. We’ve created one endpoint to update values in an in-memory key-value store:

<pre class='language-javascript'><code class='language-javascript'>
const store = {
    cats: "rule",
    dogs: "drool"
};

app.post('/update/:key/:value', function(req, res) {
    let { key, value } = req.params;
    res.send(_.set(store, key, value));
});
</code></pre>

The `/update`{:.language-javascript} route is used to update our `store`{:.language-javascript} with various facts. This route is unauthorized as its intended to be used by unauthenticated clients.

----

We have another route, `/restricted`{:.language-javascript}, that’s only intended to be used by authenticated, authorized users:

<pre class='language-javascript'><code class='language-javascript'>
app.post('/restricted', function(req, res) {
    let user = getUser(req);
    if (!user || !user.isAdmin) {
        throw new Error("Not authorized!");
    }
    res.send("Permission granted!");
});
</code></pre>

Let’s assume that the `getUser`{:.language-javascript} function returns a user object based on a session token provided through `req`{:.language-javascript}. Let’s also assume that the `isAdmin`{:.language-javascript} field is set to `true`{:.language-javascript} on administrator user objects, and unset on non-administrator user objects.

{% include newsletter.html %}

## Hacking the Prototype

Now that the scene is set, imagine that we’re a normal, non-administrator, user of this application, and we want access to the `/restricted`{:.language-javascript} endpoint.

Our calls to `/restricted`{:.language-javascript} return a `"Not authorized!"`{:.language-javascript} exception because our user object returned by `getUser`{:.language-javascript} doesn’t have an `isAdmin`{:.language-javascript} field. With no way of updating our admin flag, it seems we’re stuck.

Or are we?

Thankfully, our recent reading on prototypal inheritance has given us a flash of  malevolent insight!

The `/update`{:.language-javascript} endpoint is using [Lodash’s `_.set`{:.language-javascript}](https://lodash.com/docs/4.17.4#set) function to update the value of any field in our `store`{:.language-javascript}, including nested fields. We can use this to our advantage. We quickly make a call to `/update`{:.language-javascript} with a `key`{:.language-javascript} of `"__proto__.isAdmin"`{:.language-javascript}, and a `value`{:.language-javascript} of `"true"`{:.language-javascript} (or any other truthy value), and try our restricted endpoint again:

<pre class='language-javascript'><code class='language-javascript'>
Permission granted!
</code></pre>

Victory! We’ve given ourself access to a restricted endpoint by modifying an arbitrary object within our Javascript application!

But how did we do it?

## Explaining the Magic

As we mentioned earlier, unless specifically created with a different prototype, all objects reference `Object.prototype`{:.language-javascript} as their prototype. More specifically, all objects in an application share the same reference to the same instance of `Object.prototype`{:.language-javascript} in memory.

If we can modify `Object.prototype`{:.language-javascript}, we can effectively modify the fields inherited by all of the objects in our application.

Our request to the `/update`{:.language-javascript} endpoint, with a `key`{:.language-javascript} of `"__proto__.isAdmin"`{:.language-javascript}, and a `value`{:.language-javascript} of `"true"`{:.language-javascript} effectively turned into this expression on our server:

<pre class='language-javascript'><code class='language-javascript'>
_.set(store, "__proto__.isAdmin", "true")
</code></pre>

This expression reaches into `Object.prototype`{:.language-javascript} through the `__proto__`{:.language-javascript} field of our `store`{:.language-javascript} and creates a new `isAdmin`{:.language-javascript} field on that object with a value of `"true"`{:.language-javascript}. This change has far reaching consequences.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/hacking-prototypal-inheritance-for-fun-and-profit/4.png" style="display: block; margin:1em auto; width: 68%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Everything is an admin!</p>
</div>

After we update our “store”, every object that exists in our application now inherits an `isAdmin`{:.language-javascript} field with a value of `"true"`{:.language-javascript}. This means that on retrieving our user object from `getUser`{:.language-javascript}, it looks something like this:

<pre class='language-javascript'><code class='language-javascript'>
{
  _id: 123,
  name: 'Pete',
  __proto__: {
    isAdmin: 'true',
    constructor: ...,
    hasOwnProperty: ...,
    toString: ...,
    ...
    __proto__: null
  }
}
</code></pre>

Because our base user object has no `isAdmin`{:.language-javascript} field, trying to access `isAdmin`{:.language-javascript} on this object results in the `isAdmin`{:.language-javascript} field from our underlying `Object.prototype`{:.language-javascript} object to be returned. `Object.prototype`{:.language-javascript} returns a value of `"true"`{:.language-javascript}, causing our server’s permission check to pass, and giving us access to juicy, restricted functionality.

## In Reality

Obviously, this a fairly contrived example. In the real world, this type of vulnerability wouldn’t present itself in such a simple way. That said, this vulnerability does exist in the real world. When it rears its head, it’s often incredibly ugly. Adding unexpected fields to every object in your system can lead to disastrous results.

For example, imagine a vulnerability like this existing in a Meteor application. Once the underlying `Object.prototype`{:.language-javascript} is updated with superfluous fields, our entire applications falls to pieces. Any queries made against our MongoDB collections fail catastrophically:

<pre class='language-text'><code class='language-text'>Exception while invoking method 'restricted' MongoError: 
  Failed to parse: { 
    find: "users", 
    filter: { 
      _id: "NktioYhaJMuKhbWQw", 
      isAdmin: "true" 
    }, 
    limit: 1, 
    isAdmin: "true" 
  }. Unrecognized field 'isAdmin'.
</code></pre>

MongoDB fails to parse our query object with the added `isAdmin`{:.language-javascript} fields, and throws an exception. Without being able to query our database, [our application is dead in the water](https://blog.meteor.com/denial-of-service-disclosure-for-meteor-apm-kadira-agent-c6c86abc0035).

## Fixing the Vulnerability & Final Thoughts

The fundamental fix for this issue is incredibly simple. Don’t trust user-provided data.

If a user is allowed to update a field on an object (or especially a nested field in an object), always whitelist the specific fields they’re allowed to touch. Never use user-provided data in a way that can deeply modify an object (_any object_) on the server.

If you’re interested in this kind of thing, I encourage you to check out my latest project, [Secure Meteor](http://www.securemeteor.com/)! It’s an in-the-works guide designed to help you secure your past, present, and future Meteor applications. As a token of thanks for signing up, I’ll also send you [a free Meteor security checklist](http://www.securemeteor.com/#sign-up)!
