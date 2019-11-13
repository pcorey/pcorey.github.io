---
layout: post
title:  "Setting Apollo Context from HTTP Headers in a Meteor Application"
excerpt: "Meteor's Apollo integration exists in a strange, undocumented state. I recently found myself digging into the package's code to accomplish a seemingly simple task."
author: "Pete Corey"
date:   2019-11-13
tags: ["Javascript", "Meteor", "Apollo", "GraphQL"]
related: []
---

I was recently tasked with modifying an [Apollo](https://www.apollographql.com/)-based GraphQL endpoint served by a [Meteor](https://www.meteor.com/) application to set a field in the resolvers' context based on a HTTP header pulled out of the incoming GraphQL request.

This should be an easy, well-documented ask.

Unfortunately, Meteor's Apollo integration seems to exist in an awkward, undocumented state. The `createApolloServer`{:.language-javascript} function exposed by [the `meteor/apollo`{:.language-javascript} package](https://atmospherejs.com/meteor/apollo) doesn't seem to have any real documentation anywhere I could find, and [the Github repository](https://github.com/apollographql/meteor-integration) linked to by the package doesn't seem to relate to the code in question.

How can I access the current HTTP request when building my resolvers' context?

With no documentation to guide me, I dove into the package's source code on my machine to find answers. The source for the package in question lives in `~/.meteor/packages/apollo/<version>/os/src/main-server.js`{:.language-javascript} on my machine. The `createApolloServer`{:.language-javascript} function accepts a `customOptions`{:.language-javascript} object as its first argument. I quickly learned after digging through the source that if `customOptions`{:.language-javascript} is a function, `createApolloServer`{:.language-javascript} will call that function with the current request (`req`{:.language-javascript}) as its only argument, and use the function call's result as the value of `customOptions`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const customOptionsObject =
  typeof customOptions === 'function'
    ? customOptions(req) 
	: customOptions;
</code></pre>

This means we need to change our current call to `createApolloServer`{:.language-javascript} from something like this:

<pre class='language-javascript'><code class='language-javascript'>
import { createApolloServer } from "meteor/apollo";

createApolloServer({ schema }, { path });
</code></pre>

To something like this:

<pre class='language-javascript'><code class='language-javascript'>
createApolloServer(
  req => ({
    context: {
      someValue: req.headers['some-value']
    },
    schema
  }),
  { path }
);
</code></pre>

This information is probably only pertinent to myself and an ever-shrinking number of people, but if you're one of those people, I hope this helps.
