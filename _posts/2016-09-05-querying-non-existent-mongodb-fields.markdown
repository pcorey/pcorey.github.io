---
layout: post
title:  "Querying Non-Existent MongoDB Fields"
excerpt: "In MongoDB, documents without set values for fields will match queries looking for a null value. Check out how this quirk exposes subtle vulnerabilities in Meteor applications."
author: "Pete Corey"
date:   2016-09-05
tags: ["Javascript", "Meteor", "MongoDB", "Security"]
---

We were recently contacted by one of our readers asking about a security vulnerability in one of their Meteor applications.

They noticed that when they weren’t authenticated, they were able to pull down a large number of documents from a collection through a publication they thought was protected.

## The Vulnerability

The publication in question looked something like this:

<pre class='language-javascript'><code class='language-javascript'>
Meteor.publish("documents", function() {
  return Documents.find({ 
    $or: [
      { userId: this.userId },
      { sharedWith: this.userId }
    ]
  });
});
</code></pre>

When an unauthenticated user subscribes to this publication, their `userId`{:.language-javascript} would be `undefined`{:.language-javascript}, or `null`{:.language-javascript} when it’s translated into a [MongoDB](https://www.mongodb.com) query.

This means that the query passed into `Documents.find`{:.language-javascript} would look something like this:

<pre class='language-javascript'><code class='language-javascript'>
{
  $or: [
    { userId: null },
    { sharedWith: null }
  ]
}
</code></pre>

The `$or`{:.language-javascript} query operator means that if either of these sub-queries match a document, that document will be returned to the client.

The first sub-query, `{ userId: null }`{:.language-javascript}, mostly likely won’t match any documents. It’s unlikely that a `Document`{:.language-javascript} will be created without a `userId`{:.language-javascript}, so there will be no `Documents`{:.language-javascript} with a `null`{:.language-javascript} or nonexistent `userId`{:.language-javascript} field.

The second sub-query is more interesting. Due to [a quirk with how MongoDB handles `null`{:.language-javascript} equality queries](https://docs.mongodb.com/manual/tutorial/query-for-null-fields/#equality-filter), the `{ sharedWith: null }`{:.language-javascript} sub-query will return all documents who’s `sharedWith`{:.language-javascript} field is either `null`{:.language-javascript}, or unset. This means the query will return ___all unshared documents___.

An un-authenticated user subscribing to the `"documents"`{:.language-javascript} publication would be able to view huge amounts of private data.

This is a bad thing.

## Fixing the Query

There are several ways we can fix this publication. The most straight-forward is to simply deny unauthenticated users access:

<pre class='language-javascript'><code class='language-javascript'>
Meteor.publish("documents", function() {
  if (!this.userId) {
    throw new Meteor.Error("permission-denied");
  }
  ...
});
</code></pre>

Another fix would be to conditionally append the `sharedWith`{:.language-javascript} sub-query if the user is authenticated:

<pre class='language-javascript'><code class='language-javascript'>
Meteor.publish("documents", function() {
  let query = {
    $or: [{ userId: this.userId }]
  };
  if (this.userId) {
    query.$or.push({ sharedWith: this.userId });
  }
  return Documents.find(query);
});
</code></pre>

This will only add the `{ sharedWith: this.userId }`{:.language-javascript} sub-query if `this.userId`{:.language-javascript} resolves to a truthy value.

## Final Thoughts

This vulnerability represents a [larger misunderstanding](https://docs.mongodb.com/manual/tutorial/query-for-null-fields/#equality-filter) about MongoDB queries in general. Queries searching for a field equal to `null`{:.language-javascript} will match on all documents who’s field in question equals `null`{:.language-javascript}, or who don’t have a value for this field.

For example, this query: `{ imaginaryField: null }`{:.language-javascript} will match on all documents in a collection, unless they have a value in the `imaginaryField`{:.language-javascript} field that is not equal to `null`{:.language-javascript}.

This is a very subtle, but very dangerous edge case when it comes to writing MongoDB queries. Be sure to keep it in mind when designing the MongoDB queries used in your Meteor publications and methods.
