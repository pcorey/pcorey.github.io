---
layout: post
title:  "NoSQL Injection and GraphQL"
titleParts: ["NoSQL Injection and", "GraphQL"]
excerpt: "Are GraphQL applications vulnerable to NoSQL Injection attacks? Check out how a fully fleshed out schema can protect you and your data!"
author: "Pete Corey"
date:   2016-06-13
tags: ["Javascript", "Meteor", "NoSQL Injection", "Security", "GraphQL"]
related: ["/blog/2017/06/12/graphql-nosql-injection-through-json-types/"]
---

It’s no secret that [GraphQL](http://graphql.org/) has been making some serious waves in the developer community lately, and for good reason. It acts as an abstraction around your application’s data and seemingly gives any consumers of that data super powers. In my opinion, GraphQL is one of the most exciting pieces of technology to come out of the “Facebook stack”.

While the obvious benefits of GraphQL are exciting, in my mind the security repercussions of using GraphQL are even more amazing!

Because every query and mutation must correspond to a strictly typed schema (which is validated both on the client and server), GraphQL eradicates an entire class of injection vulnerabilities that I’ve spent so much time talking about.

## An Intro to NoSQL Injection

If you’re a reader of this blog, you’re probably very familiar with the dangers of [NoSQL injection](https://www.owasp.org/index.php/Testing_for_NoSQL_injection). For a very quick crash course, let’s check out an example.

Imagine you have a [Meteor](https://www.meteor.com/) publication that publishes a single item from the `Foo`{:.language-javascript} collection based on an ID (`_id`{:.language-javascript}). The ID of the desired `Foo`{:.language-javascript} document is provided by the client when they subscribe to the publication.

<pre class="language-javascript"><code class="language-javascript">Meteor.publish("foo", function(_id) {
  return Foo.find({ _id });
});
</code></pre>

In the context of a Meteor application, `_id`{:.language-javascript} is assumed to be a String. But because that assumption isn’t be codified or asserted, our application can run into some serious trouble.

What would happen if a malicious user were to pass something other than a String into the `"foo"`{:.language-javascript} publication’s `_id`{:.language-javascript} argument? What if they make the following subscription:

<pre class="language-javascript"><code class="language-javascript">Meteor.subscribe("foo", { $gte: "" });
</code></pre>

By passing in an object that houses a [MongoDB query operator](https://docs.mongodb.com/manual/reference/operator/query/#query-selectors), the malicious user could modify the intended behavior of the publication’s query. Because all the IDs are greater then an empty string, all documents in the `Foo`{:.language-javascript} collection would be published to the attacking user’s client.

<hr/>

Hopefully that quick primer shows you how serious NoSQL injection can be. For more information on this type of vulnerability, check out some of my previous posts:

[NoSQL Injection in Modern Web Applications](/blog/2016/03/21/nosql-injection-in-modern-web-applications/)<br/>
[Why You Should Always Check Your Arguments](/blog/2016/02/29/why-you-should-always-check-your-arguments/)<br/>
[Rename Your Way to Admin Rights](/blog/2015/10/19/rename-your-way-to-admin-permissions/)<br/>
[DOS Your Meteor Application With Where](/blog/2015/08/10/dos-your-meteor-application-with-where/)<br/>
[Meteor Security in the Wild](/blog/2015/05/05/meteor-security-in-the-wild/)<br/>
[NoSQL Injection - Or, Always Check Your Arguments](/blog/2015/04/06/nosql-injection-or-always-check-your-arguments/)

## Check to the Rescue - Kind of…

The recommended way of dealing with these types of vulnerabilities in a Meteor application is to use [the `check`{:.language-javascript} function](http://docs.meteor.com/api/check.html) to make assertions about user provided arguments to your Meteor methods and publications.

Going back to our original example, if we’re expecting `_id`{:.language-javascript} to be a String, we should turn that expectation into an assertion. Using `check`{:.language-javascript}, it’s as simple as  adding a line to our publication:

<pre class="language-javascript"><code class="language-javascript">Meteor.publish("foo", function(_id) {
  check(_id, String);
  return Foo.find({ _id });
});
</code></pre>

Now, whenever someone tries to subscribe to `"foo"`{:.language-javascript} and provides an `_id`{:.language-javascript} argument that is not a String, `check`{:.language-javascript} will throw an exception complaining about a type mismatch.

While using `check`{:.language-javascript} correctly can prevent all instances of NoSQL vulnerabilities, it doesn’t come without its downsides.

<hr/>

Unfortunately, ___using `check`{:.language-javascript} correctly___ can be a significant undertaking. Not only does it require that you explicitly check every argument passed into all of your methods and publications, but it requires that you remember to continue to do so for the lifetime of your application.

Additionally, you must remember to write exhaustive checks. Lax checks will only lead to pain down the road. For example, `check(_id, Match.Any)`{:.language-javascript} or `check(_id, Object)`{:.language-javascript} won’t prevent anyone from passing in a Mongo operator. [Incomplete argument checks](/blog/2015/08/31/incomplete-argument-checks/) can be just as dangerous as no checks at all.

There are tools ([`east5th:check-checker`{:.language-javascript}](https://github.com/East5th/check-checker), [`audit-argument-checks`{:.language-javascript}](https://atmospherejs.com/meteor/audit-argument-checks), [`aldeed:simple-schema`{:.language-javascript}](https://github.com/aldeed/meteor-simple-schema)) and patterns ([Validated Methods](http://guide.meteor.com/methods.html#validated-method)) designed to overcome these shortcomings, but the truth is that `check`{:.language-javascript} will always be a superfluous security layer that sits on top of your application.

## Security Built In

What if instead of having our argument assertions be a superfluous layer slapped on top of our data access methods, it were a core and integral part of the system? What if it simply weren’t possible to write a method without having to write a thorough, complete and correct argument schema?

We know that we would be protected from NoSQL injection attacks, and because the assertion system is an integral part of the system, we know that our checks would always be up-to-date and accurate.

Enter [GraphQL](https://facebook.github.io/react/blog/2015/05/01/graphql-introduction.html).

GraphQL allows you to define strongly-typed queries or mutations (similar to Meteor’s methods). The key word here is “strongly-typed”:

> Given a query, tooling can ensure that the query is both syntactically correct and valid within the GraphQL type system before execution, and the server can make certain guarantees about the shape and nature of the response.

This means that every defined query or mutation must have a fully defined schema associated with it. Similar to our previous example, we could write a query that returns a `Foo`{:.language-javascript} document associated with a user provided `_id`{:.language-javascript}:

<pre class="language-javascript"><code class="language-javascript">let FooQuery = {
  type: FooType,
  args: {
    _id: { type: new GraphQLNonNull(graphql.GraphQLString) }
  },
  resolve: function (_, { _id }) {
    return Foo.findOne(_id);
  }
};
</code></pre>

After wiring `FooQuery`{:.language-javascript} into our GraphQL root schema, we could invoke it with a query that looks something like this:

<pre class="language-javascript"><code class="language-javascript">{
  foo(_id: "12345”) {
    bar
  }
}
</code></pre>

If we try to pass anything other than a String into the `"foo"`{:.language-javascript} query, we’ll receive type errors and our query will not be executed:

<pre class="language-javascript"><code class="language-javascript">{
  "errors": [
    {
      "message": "Argument \"_id\" has invalid value 54321.\nExpected type \"String\", found 54321.",
      ...
</code></pre>

<hr/>

So we know that GraphQL requires us to write a schema for each of our queries and mutations, but can those schemas be incomplete, or so relaxed that they don’t provide any security benefits?

It is possible to provide objects as inputs to GraphQL queries and mutations through the use of the [`GraphQLInputObjectType`{:.language-javascript}](http://graphql.org/docs/api-reference-type-system/#graphqlinputobjecttype). However, the `fields`{:.language-javascript} defined within the input object must be fully fleshed out. Each field must either be a scalar, [or a more complex type that aggregates scalars](https://facebook.github.io/graphql/#sec-Type-System).

> _Scalars and Enums form the leaves in [request and] response trees;_ the intermediate levels are Object types, which define a set of fields, where each field is another type in the system, allowing the definition of arbitrary type hierarchies.

Put simply, this means that an input object will never have any room for wildcards, or potentially exploitable inputs. ___Partial checking of GraphQL arguments is impossible!___

## The King is Dead…

So what does all of this mean, especially from a Meteor developer’s perspective? Unfortunately, when writing vanilla Meteor methods or publications, we’ll still have to stick with using either `check`{:.language-javascript} or `aldeed:simple-schema`{:.language-javascript} for making assertions on our arguments.

However, GraphQL is becoming a very real possibility in the Meteor ecosystem. If you chose to forgo the traditional Meteor data stack, you can start using GraphQL with your Meteor application today.

Additionally, the Meteor team has been taking strides with the [Apollo stack](http://www.apollostack.com/). Apollo is “an incrementally-adoptable data stack that manages the flow of data between clients and backends.” Because Apollo is built on top of GraphQL, it inherently comes with all of the baked in security features we’ve discussed.

Another thing to remember is that everything we've talked about here relates to type-level checking in order to prevent a very specific type of NoSQL injection attack. It's still you're responsibility to ensure that all user provided input is properly sanitized before using it within your application.

No matter which data stack you land on, be sure to check all user provided inputs!
