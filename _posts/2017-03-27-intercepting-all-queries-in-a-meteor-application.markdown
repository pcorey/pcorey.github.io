---
layout: post
title:  "Intercepting All Queries in a Meteor Application"
date:   2017-03-27
tags: []
---

It’s probably no secret to you that I’m working on a new project called [Inject Detect](http://www.injectdetect.com/). As I mentioned [last week](http://www.east5th.co/blog/2017/03/20/how-am-i-building-inject-detect/), as a part of that project I need a way to intercept all MongoDB queries made by a Meteor application.

To figure out how to do this, we’ll need to spend a little time diving into the internals of Meteor to discover how it manages its MongoDB collections and drivers.

From there, we can create a Meteor package that intercepts all queries made against all MongoDB collections in an application.

Hold on tight, things are about to get heavy.

## Exploring MongoInternals

One way of accomplishing our query interception goal is to [monkey patch](http://stackoverflow.com/questions/5626193/what-is-a-monkey-patch) all of the query functions we care about, like `find`{:.language-javascript}, `findOne`{:.language-javascript}, `remove`{:.language-javascript}, `udpate`{:.language-javascript}, and `upsert`{:.language-javascript}.

To do that, we first need to find out where those functions are defined.

It turns out that the functions we're looking for are [defined on the `prototype`{:.language-javascript} of the `MongoConnection`{:.language-javascript} object](https://github.com/meteor/meteor/blob/d93c021c896029d774ccecc7241ff20ec4045568/packages/mongo/mongo_driver.js#L771-L815) which is declared in the `mongo`{:.language-javascript} Meteor package:

<pre class='language-javascript'><code class='language-javascript'>
MongoConnection.prototype.find = function (collectionName, selector, options) {
  ...
};
</code></pre>

When we instantiate a `new Mongo.Collection`{:.language-javascript} in our application, [we’re actually invoking the `MongoConnection`{:.language-javascript} constructor](https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/mongo/remote_collection_driver.js#L4).

So we want to monkey patch functions on `MongoConnection`{:.language-javascript}. Unfortunately, the `MongoConnection`{:.language-javascript} object isn’t exported by the `mongo`{:.language-javascript} package, so we can’t access it directly from our own code.

How do we get to it?

Thankfully, [`MongoConnection`{:.language-javascript} is eventually assigned to `MongoInternals.Connection`{:.language-javascript}](https://github.com/meteor/meteor/blob/d93c021c896029d774ccecc7241ff20ec4045568/packages/mongo/mongo_driver.js#L1377), and the `MongoInternals`{:.language-javascript} object is [globally exported by the `mongo`{:.language-javascript} package](https://github.com/meteor/meteor/blob/d93c021c896029d774ccecc7241ff20ec4045568/packages/mongo/package.js#L65).

This `MongoInternals`{:.language-javascript} object will be our entry-point for hooking into MongoDB queries at a very low level.

## Monkey Patching MongoInternals

Since we know where to look, let’s get to work monkey patching our query functions.

Assuming we have a package already set up, the first thing we’ll do is import `MongoInternals`{:.language-javascript} from the `mongo`{:.language-javascript} Meteor package:

<pre class='language-javascript'><code class='language-javascript'>
import { MongoInternals } from "meteor/mongo";
</code></pre>

Let’s apply our first patch to `find`{:.language-javascript}. First, we’ll save the original reference to `find`{:.language-javascript} in a variable called `_find`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const _find = MongoInternals.Connection.prototype.find;
</code></pre>

Now that we’ve saved off a reference to the original `find`{:.language-javascript} function, let’s override `find`{:.language-javascript} on the `MongoInternals.Connection`{:.language-javascript} prototype:

<pre class='language-javascript'><code class='language-javascript'>
MongoInternals.Connection.prototype.find = function(collection, selector) {
    console.log(`Querying "${collection}" with ${JSON.stringify(selector)}.`);
    return _find.apply(this, arguments);
};
</code></pre>

<img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/monkeypatch.png" style="float: right; width: 50%; margin: 0 0 0 1em;" alt="A diagram of a monkey patch.">

We’ve successfully monkey patched the `find`{:.language-javascript} function to print the collection and selector being queried before passing off the function call to the original `find`{:.language-javascript} function (`_find`{:.language-javascript}).

Let’s try it out in the shell:

<pre class='language-javascript'><code class='language-javascript'>
> import "/imports/queryMonkeyPatcher"; // This is our monkey patching module
> Foo = new Mongo.Collection("foos");
> Foo.find({bar: "123"}).fetch();
Querying "foos" with {"bar": "123"}.
[{_id: "...", bar: "123"}]
</code></pre>

As long as we import our code before we instantiate our collections, all calls to `find`{:.language-javascript} in those collections will be routed through our new `find`{:.language-javascript} function!

Now that we know our `find`{:.language-javascript} monkey patch works, we can go ahead and repeat the procedure for the rest of the query functions we’re interested in.

## How is This Useful?

This kind of low-level query interception can be thought of as [collection hooks](https://github.com/matb33/meteor-collection-hooks) on steroids.

Josh Owens uses this kind of low-level hooking to explain every query made by an application with his [Mongo Explainer](https://github.com/queso/mongo-explainer/) Meteor package.

Similarly, [Inject Detect](http://www.injectdetect.com/) will make use of this query-hooking-foo by collecting information on all queries made by your application and sending it off to be inspected for potential NoSQL Injection attacks.

This kind of low level hooking is an incredibly powerful tool that can accomplish some amazing things if used correctly.
