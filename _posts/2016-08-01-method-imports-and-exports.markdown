---
layout: post
title:  "Method Imports and Exports"
date:   2016-08-01
tags: []
---

Organizing our [Meteor](https://www.meteor.com/) code into [modules](http://www.2ality.com/2014/09/es6-modules-final.html) can be a powerful improvement over the old globals-everywhere approach that many of us are used to.

Modules emphasize isolation. Everything within a module is scoped locally within that module, unless its explicitly exported to the outside world. This kind of isolation can lead to better readability and testability.

Unfortunately, many of the core features of the Meteor framework still rely on modifying global state. Defining things like [methods](http://docs.meteor.com/api/methods.html#Meteor-methods), [publications](http://docs.meteor.com/api/pubsub.html#Meteor-publish) and [template helpers](http://docs.meteor.com/api/templates.html#template_myTemplate) all update the global state of the application.

This dichotomy can be confusing to Meteor developers new to the module system. How do we define methods in modules? Should we be exporting methods from modules? How do we import those methods into our application?

# Importing Methods

When you call `Meteor.methods(...)`{:.language-javascript}, you’re modifying your application’s global state. The methods you pass into `Meteor.methods`{:.language-javascript} are pushed onto the global list of callable methods within your application.

Because it affects global state in this way, `Meteor.methods`{:.language-javascript} is said to have [side effects](http://programmers.stackexchange.com/questions/40297/what-is-a-side-effect).

Imagine that we have a module called `paymentMethods.js`{:.language-javascript}. The purpose of this module is to define several Meteor methods related to payment processing.

Inside of that module, we have a `createPayment`{:.language-javascript} method that lets logged in users create new payments based on some provided options. It looks something like this:

<pre class='language-javascript'><code class='language-javascript'>
import { Meteor } from "meteor/meteor";

Meteor.methods({
    createPayment(options) {
        if (this.userId) {
            ...
        }
        else {
            throw new Meteor.Error("unauthenticated");
        }
    }
});
</code></pre>

You’ll notice that nothing is being exported from this module. This is because the call to `Meteor.methods`{:.language-javascript} is modifying the global state for us. We don’t need to export our methods to make them accessible outside of the module.

We could even define our methods locally and make them accessible globally using `Meteor.methods`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
import { Meteor } from "meteor/meteor";

const methods = {
    createPayment(options) {
        ...
    }
};

Meteor.methods(methods);
</code></pre>

We’ve moved our method definitions into a constant called `methods`{:.language-javascript} which is only accessible within our `paymentMethods.js`{:.language-javascript} module. However, our call to `Meteor.methods`{:.language-javascript} still pulls our methods into our global method map, making them accessible anywhere in our application.

---- 

While we don’t need to export our methods from our modules, we still need some piece of our application to import our `paymentMethods.js`{:.language-javascript} module. If our code never runs, our methods will never be defined and added to our list of global methods.

In our `/server/main.js`{:.language-javascript} file, we can import our `paymentMethods.js`{:.language-javascript} module. This will run our module’s code, defining the methods and passing them into `Meteor.methods`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
import "/imports/paymentMethods.js";
</code></pre>

Notice that we’re not importing anything from `paymentMethods.js`{:.language-javascript}. That’s because there is nothing to import. We just want this module to be executed.

# Testing Methods

What if we wanted to unit test our `paymentMethods.js`{:.language-javascript} module?

<pre class='language-javascript'><code class='language-javascript'>
it("creates a payment", function() {
    let options = { type: "cc", ... };
    // TODO: call createPayment?
    expect(paymentId).to.be.ok;
});
</code></pre>

How would we call `createPayment`{:.language-javascript}? The obvious answer would be to use `Meteor.call`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
it("creates a payment", function() {
    let options = { type: "cc", ... };
    let paymentId = Meteor.call("createPayment", options);
    expect(paymentId).to.be.ok;
});
</code></pre>

But, our method is expecting a logged in user. This leads to all kinds of difficulties.

To successfully `Meteor.call`{:.language-javascript} our `"createPayment"`{:.language-javascript} method, we’ll have to either override `Meteor.call`{:.language-javascript} with a version that passes in a custom `this`{:.language-javascript} context that we can control, or go through the process of creating and logging in as an actual user before calling `"createPayment"`{:.language-javascript}.

Following these approaches, this kind of test arguably isn’t a unit test. It relies on the entire Meteor method and accounts infrastructures to execute.

A possible way around these problems is to try to access and call our method functions directly. On the server, `Meteor.call`{:.language-javascript} moves your method definitions into an internal object accessible through `Meteor.server.method_handlers`{:.language-javascript}.

In theory, we could call `"createPayment"`{:.language-javascript} directly through this object, and pass in a custom `userId`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
it("creates a payment", function() {
    let options = { type: "cc", ... };
    let createPayment = Meteor.server.method_handlers.createPayment;
    let paymentId = createPayment.bind({
        userId: "1234567890"
    })(options);
    expect(paymentId).to.be.ok;
});
</code></pre>

While this works, it’s a very fragile solution. `Meteor.server.method_handlers`{:.language-javascript} is an undocumented API and is subject to change. It’s dangerous to rely on this internal structure when there is no guarantee that it will be around in future versions of Meteor.

There has to be an better way to test our methods!

# Exporting Methods

To solve this problem, let’s go back and revisit our `paymentMethods.js`{:.language-javascript} module:

<pre class='language-javascript'><code class='language-javascript'>
import { Meteor } from "meteor/meteor";

const methods = {
    createPayment(options) {
        ...
    }
};

Meteor.methods(methods);
</code></pre>

We can make the testing of this module vastly easier with one simple change:

<pre class='language-javascript'><code class='language-javascript'>
import { Meteor } from "meteor/meteor";

export const methods = {
    createPayment(options) {
        ...
    }
};

Meteor.methods(methods);
</code></pre>

By exporting the `methods`{:.language-javascript} object, we can now get a direct handle on our `"createPayment"`{:.language-javascript} method without having to dig through the Meteor internals. This makes our test much more straightforward:

<pre class='language-javascript'><code class='language-javascript'>
import { methods } from "./paymentMethods.js";

it("creates a payment", function() {
    let options = { type: "cc", ... };
    let paymentId = methods.createPayment.bind({
        userId: "1234567890"
    })(options);
    expect(paymentId).to.be.ok;
});
</code></pre>

This is a clean test.

We’re directly calling our `"createPayment"`{:.language-javascript} method with a controllable `this`{:.language-javascript} context and input `options`{:.language-javascript}. This makes it very easy to test a variety of situations and scenarios that this method might encounter.

We’re not relying on any Meteor infrastructure or internal structures to run our tests; they’re completely independent of the platform.

# Beyond Methods

What’s beautiful about this module-based approach is that it’s not limited to just Meteor methods. We could apply this same technique to creating and testing our publications and our [template helpers](http://docs.meteor.com/api/templates.html#Template-helpers), [lifecycle callbacks](http://docs.meteor.com/api/templates.html#Template-onCreated) and [event handlers](http://docs.meteor.com/api/templates.html#Template-events).

As a quick example, imagine defining a template in a module like this:

<pre class='language-javascript'><code class='language-javascript'>
import { Template } from "meteor/templating";

export function onCreated() {
    this.subscribe("foo");
    ...
};

export const helpers = {
    foo: () => "bar",
    ....
};

export const events = {
    "click .foo": function(e, t) {
        ...
    }
};

Template.foo.onCreated(onCreated);
Template.foo.helpers(helpers);
Template.foo.events(event);
</code></pre>

Because we’re defining our template’s `helpers`{:.language-javascript}, `events`{:.language-javascript}, and `onCreated`{:.language-javascript} callback as simple functions and objects, we can easily import them into a test module and test them directly:

<pre class='language-javascript'><code class='language-javascript'>
import { events, helpers, onCreated} from "./foo.js";

describe("foo", function() {

    it("sets things up when it's created", function() {
        let subscriptions = [];

        onCreated.bind({
            subscribe(name) => subscriptions.push(name);
        })();
        
        expect(subscriptions).to.contain("foo");
    });

    it("returns bar from foo", function() {
        let foo = helpers.foo();
        expect(foo).to.equal("bar");
    });

    ...
});
</code></pre>

Our `onCreated`{:.language-javascript} test creates a custom version of `this.subscribe`{:.language-javascript} that pushes the subscription name onto an array, and after calling the `onCreated`{:.language-javascript} callback, asserts that `"foo"`{:.language-javascript} has been subscribed to.

The `helpers.foo`{:.language-javascript} test is less complex. It simply asserts that `helpers.foo()`{:.language-javascript} equals `"bar"`{:.language-javascript}.

# Final Thoughts

Hopefully I’ve given you a clear picture of how I approach defining and testing my methods, publications, and template helpers in a [post-1.3 world](http://info.meteor.com/blog/announcing-meteor-1.3).

Modules are a very powerful tool that can make our lives as developers much easier if we take the time to explore and understand their full potential. Modularity makes code readability, testability, and re-usability significantly easier.

Happy modularizing!
