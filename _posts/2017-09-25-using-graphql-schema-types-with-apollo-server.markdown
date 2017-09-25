---
layout: post
title:  "Using GraphQL Schema Types with Apollo Server"
date:   2017-09-25
tags: []
---

Apollo is a [beautifully cohesive set of tools](https://www.apollodata.com/) for quickly and efficiently building out a [GraphQL-powered](http://graphql.org/) project. Unfortunately, that cohesiveness can cause problems when you try to do something a little out of the norm.

Recently, I ran into a problem with trying to use traditional GraphQL schema types (like `GraphQLObjectType`{:.language-javascript}) together with an Apollo-generated schema.

Straight out of the box, these two approaches don’t play nicely together. However, I managed to put together a working, but less than ideal, solution.

Read on!

## The Problem

Recently, I’ve been working on an Apollo-powered client project. Apollo schema strings are used to define types and schemas throughout the project.

While working on a new feature for the project, I began using [Mongoose](http://mongoosejs.com/) to model data living in a [MongoDB](https://www.mongodb.com/) database. Using Mongoose and GraphQL together meant I had to define two nearly identical schemas.

One schema for Mongoose:

<pre class='language-javascript'><code class='language-javascript'>
export default new Schema({
    _id: Number,
    name: String,
    roomId: Number
});
</code></pre>

And another for GraphQL:

<pre class='language-javascript'><code class='language-javascript'>
export default `
    type Bed {
        _id: Int
        name: String
        roomId: Int
        room: Room
    }
`;
</code></pre>

From past experience, I knew that having to maintain both schemas would be a nightmare. They would inevitably diverge, either through laziness, forgetfulness, or ignorance, and that divergence would lead to problems down the road.

The solution to this problem, in my mind, was to generate the GraphQL schema from the Mongoose model.

## Mongoose Schema to GraphQL

Thankfully, after a quick search I found a Node.js package to do exactly that: Sarkis Arutiunian’s [`mongoose-schema-to-graphql`{:.language-javascript}](https://github.com/sarkistlt/mongoose-schema-to-graphql).

As you would expect, the `createType`{:.language-javascript} function in the `mongoose-schema-to-graphql`{:.language-javascript} package accepts a Mongoose schema as an argument and returns a corresponding `GraphQLObjectType`{:.language-javascript} object as a result.

Armed with this tool, I could replace the `Bed`{:.language-javascript} GraphQL type definition with a call to `createType`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
export default () => [
    createType(Bed.schema),
    `
        extend type Bed {
            room: Room
        }
    `
];
</code></pre>

At least that was the dream…

Unfortunately, trying to pass the generated `GraphQLObjectType`{:.language-javascript} into Apollo’s `makeExecutableSchema`{:.language-javascript} fails. The [`typeDefs`{:.language-javascript} option in `makeExecutableSchema`{:.language-javascript}](http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#makeExecutableSchema) only accepts an array of GraphQL schema strings, or a function that returns an array of GraphQL schema strings.

Trying to pass in a `GraphQLObjectType`{:.language-javascript} causes `makeExecutableSchema`{:.language-javascript} to blow up.

## A (Less Than Ideal) Solution

Our `mongoose-schema-to-graphql`{:.language-javascript} package only returns raw GraphQL types, and `makeExecutableSchema`{:.language-javascript} only accepts schema strings.

Short of forking and extending Apollo’s `graphql-tools`{:.language-javascript}, it seems like our only option is to convert the `GraphQLObjectType`{:.language-javascript} returned by `createType`{:.language-javascript} into a string before handing it off to `makeExecutableSchema`{:.language-javascript}.

But how do we convert a `GraphQLObjectType`{:.language-javascript} into a corresponding GraphQL schema string?

<pre class='language-javascript'><code class='language-javascript'>
export default () => [
    printType(createType(Bed.schema)),
    `
        extend type Bed {
            room: Room
        }
    `
];
</code></pre>

The [`printType`{:.language-javascript} utility function in Facebook’s `graphql`{:.language-javascript} package](https://github.com/graphql/graphql-js/blob/eb01a23c578d949ccea2fa2b350e65a3893e6895/src/utilities/schemaPrinter.js#L139-L153) saves the day!

We can use the `printType`{:.language-javascript} function to convert the `GraphQLObjectType`{:.language-javascript} generated from our Mongoose model into a GraphQL schema string which we can then drop into `makeExecutableSchema`{:.language-javascript}.

Unfortunately, `makeExecutableSchema`{:.language-javascript} immediately undoes all of that work we just did and [converts the GraphQL schema strings it was passed into raw GraphQL types](https://github.com/apollographql/graphql-tools/blob/master/src/schemaGenerator.ts#L190-L192).

Oh well, at least it works.

## Coming to Terms

While the `createType`{:.language-javascript}/`printType`{:.language-javascript} conversion process works, I wasn’t happy with the solution.

In my throes of desperation, [I opened an issue on the `graphql-tools`{:.language-javascript} project](https://github.com/apollographql/graphql-tools/issues/398) asking for either a better approach to this problem, or support for raw GraphQL types within `makeExecutableSchema`{:.language-javascript}.

Sashko confirmed my suspicions that there currently isn’t a better way of dealing with this situation. He mentioned that the ability to intermingle these two styles of schema creation within `makeExecutableSchema`{:.language-javascript} has been requested in the past, and pull requests are welcome.

Maybe I’ll build up the courage to dive deeper into `graphql-tools`{:.language-javascript} and look for a better solution.
