---
layout: post
title:  "Why I Can't Wait For ES6 Proxies"
titleParts: ["Why I Can't Wait For", "ES6 Proxies"]
excerpt: "Proxies will open the door for new advances in Javascript security. To say I'm excited is an understatement."
author: "Pete Corey"
date:   2015-11-09
tags: ["Javascript", "Meteor", "Security", "NoSQL Injection"]
---

Full [ES6](https://nodejs.org/en/docs/es6/) support is just around the corner. In fact, _nearly all_ of ES6 is available to us through [compilers like Babel](http://babeljs.io/docs/learn-es2015/#proxies) that [transpile ES6 syntax into ES5 code](http://babeljs.io/repl/). Unfortunately, one of the ES6 features I'm most excited about can't be implemented in ES5. What feature is that? [Proxies, of course](http://babeljs.io/docs/learn-es2015/#proxies)!

Proxies make some incredibly exciting things possible. Imagine a [Meteor method](http://docs.meteor.com/#/full/meteor_methods) like the one below:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  foo: function(bar) {
    return Bars.remove(bar._id);
  }
});
</code></pre>

As [I've talked about in the past](http://blog.east5th.co/2015/08/31/incomplete-argument-checks/), this method exposes our application to a serious security vulnerability. A user can pass in an arbitrary [MongoDB query object](http://docs.meteor.com/#/full/selectors) in the `_id`{:.language-javascript} field of `bar`{:.language-javascript} like this:

<pre class="language-javascript"><code class="language-javascript">Meteor.call("foo", {_id: {$gte: ""}});
</code></pre>

This would delete all of the documents from our `Bars`{:.language-javascript} collection. Uh oh! Imagine if we could automatically detect and prevent that from happening, and instead throw an exception that tells the client:

<pre class="language-bash"><code class="language-bash">Meteor.Error: Tried to access unsafe field: _id
</code></pre>

Our `_id`{:.language-javascript} field would be accessible ___only after we check it___:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  foo: function(bar) {
    check(bar, {
      _id: String
    });
    return Bars.remove(bar._id);
  }
});
</code></pre>

Any attempts to access a field on a user-provided object will throw an exception unless it's been explicitly checked for safety. If this were possible, it could be used to prevent entire categories of security vulnerabilities!

With proxies, we can make this happen.

## What is a Proxy?

An [ES6 Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) is basically a middleman between an object, and the code trying to access that object. When we wrap an object with a proxy, we can oversee (and interfere with) every action taken on that object.

Proxies do this overseeing through "traps". A trap is just a callback that's called whenever a certain action is taken on the proxy object. For example, a `get`{:.language-javascript} trap is triggered any time a piece of code tries to get the value of a field on the proxy. Likewise, a `set`{:.language-javascript} trap is triggered any time you try to set the value of a field.

In the above example, our proxy sees that we're trying to access `_id`{:.language-javascript} on the `bar`{:.language-javascript} object, but because it knows that `check`{:.language-javascript} hasn't been called on that field yet, it throws an exception. If we had checked the field, the proxy would have let `_id`{:.language-javascript}'s value pass through.

A rough sketch of this kind of proxy would look something like this:

<pre class="language-javascript"><code class="language-javascript">CheckProxy = {
  get: function(target, field) {
    if (!target ||
        !target.__checked ||
        !target.__checked[field]) {
      throw new Error("Tried to access unsafe field: " + field);
    }
    return target[field];
  }
};
</code></pre>

But how does the proxy know when a field has been checked? We have to explicitly tell the proxy that each field has been checked after we've determined that it's safe to use. One way to do this is through a custom `set`{:.language-javascript} trap:

<pre class="language-javascript"><code class="language-javascript">CheckProxy = {
  ...
  set: function(target, field, value) {
    if (field == "__checked") {
      if (!target.__checked) {
        target.__checked = {};
      }
      target.__checked[value] = true;
    }
    else {
      target[field] = value;
    }
    return true;
  }
};
</code></pre>

If we wanted to use our proxy as-is, there would be a good amount of manual work involved. We'd have to instantiate a new proxy object for each one of our object arguments, and then explicitly notify the proxy after each check:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  foo: function(bar) {
    bar = new Proxy(bar, CheckProxy);
    check(bar, {
      _id: String
    });
    bar.__checked = "_id";
    return Bars.remove(bar._id);
  }
});
</code></pre>

This is too much work! It wouldn't take long to lose diligence and fall back to not checking arguments at all.

Thankfully, we can hide all of this manual work through the magic of monkey patching.

The first thing we'll do is patch our `check`{:.language-javascript} method to tell our proxy whenever we check a field on an object:

<pre class="language-javascript"><code class="language-javascript">_check = check;
check = function(object, fields) {
  if (object instanceof Object) {
    Object.keys(fields).forEach(function(field) {
      object.__checked = field;
    });
  }
  _check.apply(this, arguments);
};
</code></pre>

Next, we just have to patch `Meteor.methods`{:.language-javascript} to automatically wrap each `Object`{:.language-javascript} argument in a proxy:

<pre class="language-javascript"><code class="language-javascript">_methods = Meteor.methods;
Meteor.methods = function(methods) {
  _.each(methods, function(method, name, obj) {
    obj[name] = function() {
      _.each(arguments, function(value, key, obj) {
        if (value instanceof Object) {
          obj[key] = new Proxy(value, CheckProxy);
        }
        else {
          obj[key] = value;
        }
      });
      method.apply(this, arguments);
    };
  });
  _methods.apply(this, arguments);
};
</code></pre>

Whew, this is getting dense!

Thankfully, that's all the patching we have to do. Now, we can revert back to our original method and still reap all of the benefits of automatic `check`{:.language-javascript} enforcement for all object fields throughout all of our Meteor methods.

## Shortcomings

ES6 Proxies are [currently only supported in Firefox](http://kangax.github.io/compat-table/es6/#Proxy), which means that what I described above currently isn't possible. Until proxy support comes to V8, Node.js, and finally Meteor, all we can do is wait and dream.

The implementation I described here is fairly unsophisticated. It only works when accessing fields within the first layer of an object. It also pollutes the provided object with a `__checked`{:.language-javascript} field, which may wreak inadvertent havoc. In future versions of this idea, both of these issues could easily be solved.

I hope this post has given you a taste of the awesome power of proxies. Fire up your Firefox console and start experimenting!
