---
layout: post
title:  "GraphQL NoSQL Injection Through JSON Types"
excerpt: "GraphQL servers are not safe from the threat of NoSQL Injection attacks. This article explores how unchecked JSON types can be exploited by malicious users."
author: "Pete Corey"
date:   2017-06-12
tags: ["Inject Detect", "NoSQL Injection", "GraphQL", "Meteor", "Security", "MongoDB"]
---

One year ago today, I wrote [an article discussing NoSQL Injection and GraphQL](http://www.east5th.co/blog/2016/06/13/nosql-injection-and-graphql/). I praised [GraphQL](http://graphql.org/) for eradicating the entire possibility of [NoSQL Injection](http://www.east5th.co/blog/2016/10/24/a-five-minute-introduction-to-nosql-injection/).

I claimed that because GraphQL forces you to flesh out the entirety of your schema before you ever write a query, it’s effectively impossible to succumb to the [incomplete argument checking](http://www.east5th.co/blog/2015/08/31/incomplete-argument-checks/) that leads to a NoSQL Injection vulnerability.

<blockquote style="padding-left: 0;">
  <p>Put simply, this means that an input object will never have any room for wildcards, or potentially exploitable inputs. <strong><em>Partial checking of GraphQL arguments is impossible!</em></strong></p>
</blockquote>

I was wrong.

NoSQL Injection is entirely possible when using GraphQL, and can creep into your application through the use of [“custom scalar types”](http://dev.apollodata.com/tools/graphql-tools/scalars.html).

In this article, we’ll walk through how the relatively popular [`GraphQLJSON`{:.language-javascript} scalar type](https://github.com/taion/graphql-type-json) can open the door to NoSQL Injection in applications using [MongoDB](https://www.mongodb.com/).

## Custom Scalars

In my [previous article](http://www.east5th.co/blog/2016/06/13/nosql-injection-and-graphql/), I explained that GraphQL requires that you define your entire application’s schema all the way down to its scalar leaves.

These scalars can be [grouped and nested within objects](https://facebook.github.io/graphql/#sec-Type-System), but ultimately every field sent down to the client, or passed in by the user is a field of a known type:

> Scalars and Enums form the leaves in request and response trees; the intermediate levels are Object types, which define a set of fields, where each field is another type in the system, allowing the definition of arbitrary type hierarchies.

Normally, these scalars are simple primitives: `String`{:.language-javascript}, `Int`{:.language-javascript}, `Float`{:.language-javascript}, or `Boolean`{:.language-javascript}. However, sometimes these four primitive types aren’t enough to fully flesh out the input and output schema of a complex web application.

[Custom scalar types](https://github.com/mugli/learning-graphql/blob/master/7.%20Deep%20Dive%20into%20GraphQL%20Type%20System.md#bonus-creating-custom-scalar-types) to the rescue!

Your application can define a custom scalar type, along with the set of functionality required to serialize and deserialize that type into and out of a GraphQL request.

A common example of a custom type is the [`Date`{:.language-javascript} type](https://www.npmjs.com/package/graphql-iso-date), which can [serialize Javascript `Date`{:.language-javascript} objects](https://github.com/excitement-engineer/graphql-iso-date/blob/master/src/date/index.js#L33-L52) into strings to be returned as part of a GraphQL query, and [parse date strings into Javascript `Date`{:.language-javascript} objects](https://github.com/excitement-engineer/graphql-iso-date/blob/master/src/date/index.js#L53-L66) when provided as GraphQL inputs.

## Searching with JSON Scalars

This is all well and good. Custom scalars obviously are a powerful tool for building out more advanced GraphQL schemas. Unfortunately, this tool can be abused.

Imagine we’re building a user search page. In our contrived example, the page lets users search for other users based on a variety of fields: username, full name, email address, etc…

Being able to search over multiple fields creates ambiguity, and ambiguity is hard to work with in GraphQL.

To make our lives easier, let’s accept the search criteria as a JSON object using the [`GraphQLJSON`{:.language-javascript} custom scalar](https://github.com/taion/graphql-type-json) type:

<pre class='language-javascript'><code class='language-javascript'>
type Query {
    users(search: JSON!): [User]
}
</code></pre>

Using [Apollo](http://www.apollodata.com/) and a [Meteor](https://www.meteor.com/)-style MongoDB driver, we could write our `users`{:.language-javascript} resolver like this:

<pre class='language-javascript'><code class='language-javascript'>
{
    Query: {
        users: (_root, { search }, _context) => {
            return Users.find(search, {
                fields: {
                    username: 1, 
                    fullname: 1, 
                    email: 1
                }
            });
        }
    }
}
</code></pre>

Great!

But now we want to paginate the results and allow the user to specify the number of results per page.

We could add `skip`{:.language-javascript} and `limit`{:.language-javascript} fields separately to our `users`{:.language-javascript} query, but that would be too much work. We’ve already seen how well using the `JSON`{:.language-javascript} type worked, so let’s use that again!

<pre class='language-javascript'><code class='language-javascript'>
type Query {
    users(search: JSON!, options: JSON!): [User]
}
</code></pre>

We’ve extended our `users`{:.language-javascript} query to accept an `options`{:.language-javascript} JSON object.

<pre class='language-javascript'><code class='language-javascript'>
{
    Query: {
        users: (_root, { search, options }, _context) => {
            return Users.find(search, _.extend({
                fields: {
                    _id: 1,
                    username: 1, 
                    fullname: 1, 
                    email: 1
                }
            }, options));
        }
    }
}
</code></pre>

And we’ve extended our `users`{:.language-javascript} resolver to extend the list of fields we return with the `skip`{:.language-javascript} and `limit`{:.language-javascript} fields passed up from the client.

{% include newsletter.html %}

## Exploiting the Search

Now, for example, our client can make a query to search for users based on their username or their email address:

<pre class='language-javascript'><code class='language-javascript'>
{
    users(search: "{\"username\": {\"$regex\": \"sue\"}, \"email\": {\"$regex\": \"sue\"}}",
          options: "{\"skip\": 0, \"limit\": 10}") {
        _id
        username
        fullname
        email
    }
}
</code></pre>

This might return a few users with users with `"sue"`{:.language-javascript} as a part of their username or email address.

But there are problems here.

Imagine a curious or potentially malicious user making the following GraphQL query:

<pre class='language-javascript'><code class='language-javascript'>
{
    users(search: "{\"email\": {\"$gte\": \"\"}}",
          options: "{\"skip\": 0, \"limit\": 10}") {
        _id
        username
        fullname
        email
    }
}
</code></pre>

The entire `search`{:.language-javascript} JSON object is passed directly into the `Users.find`{:.language-javascript} query. This query will return all users in the collection.

Thankfully, a malicious user would only receive our users’ usernames, full names, and email addresses. Or would they?

The `options`{:.language-javascript} JSON input could also be maliciously modified:

<pre class='language-javascript'><code class='language-javascript'>
{
    users(search: "{\"email\": {\"$gte\": \"\"}}",
          options: "{\"fields\": {}}") {
        _id
        username
        fullname
        email
    }
}
</code></pre>

By passing in their own `fields`{:.language-javascript} object, an attacker could overwrite the `fields`{:.language-javascript} specified by the server. This combination of `search`{:.language-javascript} and `options`{:.language-javascript} would return all fields (specified in the GraphQL schema) for all users in the system.

These fields might include sensitive information like their hashed passwords, session tokens, purchase history, etc…

## Fixing the Vulnerability

In this case, and in most cases, the solution here is to be explicit about what we expect to receive from the client. Instead of receiving our flexible `search`{:.language-javascript} and `options`{:.language-javascript} objects from the client, we’ll instead ask for each field individually:

<pre class='language-javascript'><code class='language-javascript'>
type Query {
    users(fullname: String,
          username: String,
          email: String,
          skip: Number!,
          limit: Number!): [User]
}
</code></pre>

By making the search fields (`fullname`{:.language-javascript}, `username`{:.language-javascript}, and `email`{:.language-javascript}) optional, the querying user can omit and of the fields they don’t wish to search on.

Now we can update our resolver to account for this explicitness:

<pre class='language-javascript'><code class='language-javascript'>
{
    Query: {
        users: (_root, args, _context) => {
            let search = _.extend({}, args.fullname ? { fullname } : {},
                                      args.username ? { username } : {},
                                      args.email ? { email } : {});
            return Users.find(search, {
                fields: {
                    _id: 1,
                    username: 1, 
                    fullname: 1, 
                    email: 1
                },
                skip: args.skip,
                limit: args.limit
            });
        }
    }
}
</code></pre>

If either `fullname`{:.language-javascript}, `username`{:.language-javascript}, or `email`{:.language-javascript} are passed into the query, we’ll add them to our query. We can safely dump this user-provided data into our query because we know it’s a `String`{:.language-javascript} at this point thanks to GraphQL.

Lastly, we’ll set `skip`{:.language-javascript} and `limit`{:.language-javascript} on our MongoDB query to whatever was passed in from the client. We can be confident that our `fields`{:.language-javascript} can’t possibly be overridden.

## Final Thoughts

Custom scalar types, and the JSON scalar type specifically, aren’t all bad. As we discussed, they’re a powerful and important tool for building out your GraphQL schema.

However, when using JSON types, or any other sufficiently expressive custom scalar types, it’s important to remember to make assertions about the type and shape of user-provided data. If you’re assuming that the data passed in through a JSON field is a string, check that it’s a string.

If a more primitive GraphQL type, like a `Number`{:.language-javascript} fulfills the same functionality requirements as a `JSON`{:.language-javascript} type, even at the cost of some verbosity, use the primitive type.
