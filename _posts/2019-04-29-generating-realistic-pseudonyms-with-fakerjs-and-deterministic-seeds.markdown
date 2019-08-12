---
layout: post
title:  "Generating Realistic Pseudonyms with Faker.js and Deterministic Seeds"
excerpt: "Let's build on the \"demo mode\" we added to our application in the last article and breath some life into the pseudonyms generated for our application's users."
author: "Pete Corey"
date:   2019-04-29
tags: ["Javascript", "Node.js", "Mongoose"]
related: ["/blog/2019/04/22/anonymizing-graphql-resolvers-with-decorators/"]
---

Last week we talked about [using decorators to conditionally anonymize users](/blog/2019/04/22/anonymizing-graphql-resolvers-with-decorators/) of our application to build a togglable "demo mode". In our example, we anonymized every user by giving them the name `"Jane Doe"`{:.language-javascript} and the phone number `"555-867-5309"`{:.language-javascript}. While this works, it doesn't make for the most exciting demo experience. Ideally, we could incorporate more variety into our anonymized user base.

It turns out that with a little help from Faker.js and deterministic seeds, we can do just that!

## Faker.js

[Faker.js](https://github.com/Marak/faker.js) is a library that "generate[s] massive amounts of realistic fake data in Node.js and the browser." This sounds like it's exactly what we need.

As a first pass at incorporating Faker.js into our anonymization scheme, we might try generating a random name and phone number in the `anonymize`{:.language-javascript} function attached to our `User`{:.language-javascript} model:

<pre class='language-javascript'><code class='language-javascript'>
const faker = require('faker');

userSchema.methods.anonymize = function() {
  return _.extend({}, this, {
    name: faker.name.findName(),
    phone: faker.phone.phoneNumber()
  });
};
</code></pre>

We're on the right path, but this approach has problems. Every call to `anonymize`{:.language-javascript} will generate a new name and phone number for a given user. This means that the same user might be given multiple randomly generated identities if they're returned from multiple resolvers.

## Consistent Random Identities

Thankfully, Faker.js once again comes to the rescue. [Faker.js lets us specify a seed](https://github.com/marak/Faker.js/#setting-a-randomness-seed) which it uses to configure it's internal pseudo-random number generator. This generator is what's used to generate fake names, phone numbers, and other data. By seeding Faker.js with a consistent value, we'll be given a consistent stream of randomly generated data in return.

Unfortunately, it looks like Faker.js' `faker.seed`{:.language-javascript} function accepts a number as its only argument. Ideally, we could pass the `_id`{:.language-javascript} of our model being anonymized.

However, a little digging shows us that [the `faker.seed`{:.language-javascript} function](https://github.com/Marak/faker.js/blob/d3ce6f1a2a9359574e7f31f14d4901648047c45a/lib/index.js#L150-L154) calls out to a local `Random`{:.language-javascript} module:

<pre class='language-javascript'><code class='language-javascript'>
Faker.prototype.seed = function(value) {
  var Random = require('./random');
  this.seedValue = value;
  this.random = new Random(this, this.seedValue);
}
</code></pre>

And the `Random`{:.language-javascript} module [calls out to the `mersenne`{:.language-javascript} library](https://github.com/Marak/faker.js/blob/d3ce6f1a2a9359574e7f31f14d4901648047c45a/lib/random.js#L10-L12), which supports seeds in the form of an array of numbers:

<pre class='language-javascript'><code class='language-javascript'>
if (Array.isArray(seed) && seed.length) {
  mersenne.seed_array(seed);
}
</code></pre>

Armed with this knowledge, let's update our `anonymize`{:.language-javascript} function to set a random seed based on the user's `_id`{:.language-javascript}. We'll first need to turn our `_id`{:.language-javascript} into an array of numbers:

<pre class='language-javascript'><code class='language-javascript'>
this._id.split("").map(c => c.charCodeAt(0));
</code></pre>

And then pass that array into `faker.seed`{:.language-javascript} before returning our anonymized data:

<pre class='language-javascript'><code class='language-javascript'>
userSchema.methods.anonymize = function() {
  faker.seed(this._id.split("").map(c => c.charCodeAt(0)));
  return _.extend({}, this, {
    name: faker.name.findName(),
    phone: faker.phone.phoneNumber()
  });
};
</code></pre>

And that's all there is to it.

Now every user will be given a consistent anonymous identity every time their user document is anonymized. For example, a user with an `_id`{:.language-javascript} of `"5cb0b6fd8f6a9f00b8666dcb"`{:.language-javascript} will _always_ be given a name of `"Arturo Friesen"`{:.language-javascript}, and a phone number of `"614-157-9046"`{:.language-javascript}.

## Final Thoughts

My client ultimately decided not to go this route, and decided to stick with obviously fake "demo mode" identities. That said, I think this is an interesting technique that I can see myself using in the future.

Seeding random number generators with deterministic values is a powerful technique for generating pseudo-random, but repeatable data.

That said, it's worth considering if this is really enough to anonymize our users' data. By consistently replacing a user's name, we're just masking one aspect of their identity in our application. Is that enough to truly anonymize them, or will other attributes or patterns in their behavior reveal their identity? Is it worth risking the privacy of our users just to build a more exciting demo mode? These are all questions worth asking.
