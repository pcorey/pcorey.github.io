---
layout: post
title:  "Modeling Formulas with Recursive Discriminators"
excerpt: "I ran into an interesting problem recently where I needed to model a nested set of either/or sub-schemas. With some creative thinking and a healthy dose of recursion, Mongoose's discriminator feature turned out to be just the tool for the job."
author: "Pete Corey"
date:   2018-05-28
tags: ["Javascript", "MongoDB"]
related: []
---

I recently ran into an issue while trying to represent a nested, discriminator-based schema using [Mongoose](http://mongoosejs.com/) in a [Node.js](https://nodejs.org/en/) client project. The goal was to represent a logical formula by creating a hierarchy of "reducers" (`&&`{:.language-javascript}, `||`{:.language-javascript}, etc...) that would reduce a series of nested "checks" down into a single value.

Let's make that a little more relatable with an example. Imagine what we're trying to represent the following formula:

<pre class='language-javascript'><code class='language-javascript'>
x == 100 || (x <= 10 && x >= 0)
</code></pre>

If we wanted to store this in [MongoDB](https://www.mongodb.com/), we'd have to represent that somehow as a JSON object. Let's take a stab at that:

<pre class='language-javascript'><code class='language-javascript'>
{
  type: "reducer",
  reducer: "||",
  checks: [
    {
      type: "check",
      field: "x",
      comparator: "==",
      value: 100
    },
    {
      type: "reducer",
      reducer: "&&",
      checks: [
        {
          type: "check",
          field: "x",
          comparator: "<=",
          value: 10
        },
        {
          type: "check",
          field: "x",
          comparator: ">=",
          value: 0
        }
      ]
    }
  ]
}
</code></pre>

What a behemoth!

While the JSON representation is ridiculously more verbose than our mathematical representation, it gives us everything we need to recreate our formula, and lets us store that formula in our database. This is exactly what we want.

---- 

The trouble comes when we try to represent this schema with Mongoose.

We can break our entire JSON representation into two distinct "types". We have a "check" type that has `field`{:.language-javascript}, `comparator`{:.language-javascript}, and `value`{:.language-javascript} fields, and a "reducer" type that has a `reducer`{:.language-javascript} field, and a `checks`{:.language-javascript} field that contains a list of either "check" or "reducer" objects.

Historically, Mongoose had trouble with a field in a document adhering to either one schema or another. That all changed with the introduction of ["discriminators"](http://mongoosejs.com/docs/discriminators.html), and later, ["embedded discriminators"](http://thecodebarbarian.com/mongoose-4.8-embedded-discriminators). Embedded discriminators let us say that an element of an array adheres to one of multiple schemas defined with different discriminators.

Again, let's make that more clear with an example. If we wanted to store our formula within a document, we'd start by defining the schema for that wrapping "base" document:

<pre class='language-javascript'><code class='language-javascript'>
const baseSchema = new Schema({
  name: String,
  formula: checkSchema
});
</code></pre>

The `formula`{:.language-javascript} field will hold our formula. We can define the shell of our `checkSchema`{:.language-javascript} like so:

<pre class='language-javascript'><code class='language-javascript'>
const checkSchema = new Schema(
  {},
  {
    discriminatorKey: "type",
    _id: false
  }
);
</code></pre>

Here's we're setting the `discriminatorKey`{:.language-javascript} to `"type"`{:.language-javascript}, which means that Mongoose will look at the value of `"type"`{:.language-javascript} to determine what kind of schema the rest of this subdocument should adhere to.

Next, we have to define each `type`{:.language-javascript} of our formula. Our `"reducer"`{:.language-javascript} has a `reducer`{:.language-javascript} field and a `formula`{:.language-javascript} field:

<pre class='language-javascript'><code class='language-javascript'>
baseSchema.path("formula").discriminator("reducer", new Schema(
  {
    reducer: {
      type: String,
      enum: ['&&', '||']
    },
    checks: [checkSchema]
  },
  { _id: false }
));
</code></pre>

Similarly, our `"check"`{:.language-javascript} type has its own unique set of fields:

<pre class='language-javascript'><code class='language-javascript'>
baseSchema.path("formula").discriminator("check", new Schema(
  {
    field: String,
    comparator: {
      type: String,
      enum: ['&&', '||']
    },
    value: Number
  },
  { _id: false }
));
</code></pre>

Unfortunately, this only works for the first level of our `formula`{:.language-javascript}. Trying to define a top-level `"reducer"`{:.language-javascript} or `"check"`{:.language-javascript} works great, but trying to put a `"reducer"`{:.language-javascript} or a `"check"`{:.language-javascript} within a `"reducer"`{:.language-javascript} fails. Those nested objects are stripped from our final object.

---- 

The problem is that we're defining our discriminators based off of a path originating from the `baseSchema`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
baseSchema.path("formula").discriminator(...);
</code></pre>

Our nested `"reducer"`{:.language-javascript} subdocuments don't have any discriminators attached to their `checks`{:.language-javascript}. To fix this, we'd need to create two new functions that recursively builds each layer of our discriminator stack.

We'll start with a `buildCheckSchema`{:.language-javascript} function that simply returns a new schema for our `"check"`{:.language-javascript}-type subdocuments. This schema doesn't have any children, so it doesn't need to define any new discriminators:

<pre class='language-javascript'><code class='language-javascript'>
const buildCheckSchema = () =>
  new Schema({
    field: String,
    comparator: {
      type: String,
      enum: ['&&', '||']
    },
    value: Number
  }, { _id: false });
</code></pre>

Our `buildReducerSchema`{:.language-javascript} function needs to be a little more sophisticated. First, it needs to create the `"reducer"`{:.language-javascript}-type sub-schema. Next, it needs to attach `"reducer"`{:.language-javascript} and `"check"`{:.language-javascript} discriminators to the `checks`{:.language-javascript} field of that new schema with recursive calls to `buildCheckSchema`{:.language-javascript} and `buildReducerSchema`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const buildReducerSchema = () => {
    let reducerSchema = new Schema(
        {
            reducer: {
                type: String,
                enum: ['&&', '||']
            },
            checks: [checkSchema]
        },
        { _id: false }
    );
    reducerSchema.path('checks').discriminator('reducer', buildReducerSchema());
    reducerSchema.path('checks').discriminator('check', buildCheckSchema());
    return reducerSchema;
};
</code></pre>

While this works in concept, it blows up in practice. Mongoose's `discriminator`{:.language-javascript} function greedily consumes the schemas passed into it, which creates an infinite recursive loop that blows the top off of our stack.

---- 

The solution I landed on with this problem is to limit the number of recursive calls we can make to `buildReducerSchema`{:.language-javascript} to some maximum value. We can add this limit by passing an optional `n`{:.language-javascript} argument to `buildReducerSchema`{:.language-javascript} that defaults to `0`{:.language-javascript}. Every time we call `buildReducerSchema`{:.language-javascript} from within `buildReducerSchema`{:.language-javascript}, we'll pass it an incremented value of `n`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
reducerSchema.path('checks').discriminator('reducer', buildReducerSchema(n + 1));
</code></pre>

Next, we'll use the value of `n`{:.language-javascript} to enforce our maximum recursion limit:

<pre class='language-javascript'><code class='language-javascript'>
const buildReducerSchema = (n = 0) => {
  if (n > 100) {
    return buildCheckSchema();
  }
  ...
};
</code></pre>

If we reach one hundred recursions, we simply force the next layer to be a `"check"`{:.language-javascript}-type schema, gracefully terminating the schema stack.

To finish things off, we need to pass our `baseSchema`{:.language-javascript} these recursively constructed discriminators (without an initial value of `n`{:.language-javascript}):

<pre class='language-javascript'><code class='language-javascript'>
baseSchema.path("checks").discriminator("reducer", buildReducerSchema());
baseSchema.path("checks").discriminator("check", buildCheckSchema());
</code></pre>

And that's it!

Against all odds we managed to build a nested, discriminator-based schema that can fully represent any formula we throw at it, up to a depth of one hundred reducers deep. At the end of the day, I'm happy with that solution.
