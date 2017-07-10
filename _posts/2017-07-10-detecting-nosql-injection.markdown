---
layout: post
title:  "Detecting NoSQL Injection"
date:   2017-07-10
tags: []
---

The entire premise behind my latest project, [Inject Detect](http://www.injectdetect.com/), is that [NoSQL Injection attacks](http://www.east5th.co/blog/2017/07/03/what-is-nosql-injection/) can be detected in real-time as they’re being carried out against your application.

But how?

In this article, I’ll break down the strategy I’m using for detecting NoSQL Injection in MongoDB-based web applications.

At a high level, the idea is to build up a set of expected queries an application is known to make, and to use that set to detect unexpected queries that might be to result of a NoSQL Injection attack.

Let’s dig into the details.

## Expected Queries

Every web application has a finite number of queries it can be expected to make throughout the course of its life.

For example, a shopping cart application might query for single orders by `_id`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
Orders.findOne(orderId);
</code></pre>

Similarly, it might query for a number of orders created in the past three days:

<pre class='language-javascript'><code class='language-javascript'>
Orders.find({createdAt: {$gte: moment().subtract(3, "days").toDate()}});
</code></pre>

These queries aren’t limited to fetching data. When a user “deletes” an order, the application may want to set a flag on the order in question:

<pre class='language-javascript'><code class='language-javascript'>
Orders.update({userId: this.userId}, {$set: {deleted: true}});
</code></pre>

Each of these individual queries can be generalized based on the shape of the query and the type of data passed into it.

For example, we expect the `Orders.findOne`{:.language-javascript} query to always be called with a String. Similarly, we expect the `Orders.find`{:.language-javascript} query to be passed a Date for the `createdAt`{:.language-javascript} comparison. Lastly, the `Orders.update`{:.language-javascript} query should always be passed a String as the `userId`{:.language-javascript}.

<pre class='language-javascript'><code class='language-javascript'>
Orders.findOne({_id: String});
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
Orders.find({createdAt: {$gte: Date}});
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
Orders.update({userId: String}, ...);
</code></pre>

An application might make thousands of queries per day, but each query will match one of these three generalized query patterns.

## Unexpected Queries

If our application makes a query that does not fall into this set of expected queries, we’re faced with one of two possibilities:

1. We left a query out of our set of expected queries.
2. Our application is vulnerable to a NoSQL Injection vulnerability.

Imagine our application makes the following query:

<pre class='language-javascript'><code class='language-javascript'>
Orders.findOne({_id: { $gte: "" }});
</code></pre>

A query of this pattern (`Orders.findOne({_id: {$gte: String}})`{:.language-javascript}) doesn’t exist in our set of expected queries. This means that this is either an expected query that we missed, or our application is being exploited.

It’s unlikely that our application is trying to find a single `Order`{:.language-javascript} who’s `_id`{:.language-javascript} is greater than or equal to an empty string.

In this case, it’s far more likely that someone is exploiting our `Orders.findOne({_id: String})`{:.language-javascript} query and passing in an `orderId`{:.language-javascript} containing a MongoDB query operator (`{$gte: ""}`{:.language-javascript}) rather than an expected String.

We’ve detected NoSL Injection!

By watching for queries that fall outside our set of expected queries, we can detect NoSQL Injection as it happens.

## Similar Expected Queries

Basing our NoSQL Injection detection strategy around expected and unexpected queries has an added bonus.

Because we have a set of all expected queries for a given application, unexpected queries that are the result of NoSQL Injection attacks can often be linked back to the query being exploited.

To illustrate, in our previous example we detected an unexpected query against our application:

<pre class='language-javascript'><code class='language-javascript'>
Orders.findOne({_id: {$gte: ""}});
</code></pre>

Inspecting our set of expected queries, it’s obvious that the most similar expected query is the `Orders.findOne`{:.language-javascript} query:

<pre class='language-javascript'><code class='language-javascript'>
Orders.findOne({_id: String});
</code></pre>

As the application owner, we know that we need to enforce more stringent checks on the type of the provided `orderId`{:.language-javascript}.

Based on this information, an application owner or developer can deduce which specific query is being exploited within their application and [respond quickly with a fix](http://www.east5th.co/blog/2017/07/03/what-is-nosql-injection/#how-do-you-prevent-nosql-injection).

## Final Thoughts

Progress on [Inject Detect](http://www.injectdetect.com/) continues to move along at a steady pace. Once finished, Inject Detect will automatically apply this type of real-time NoSQL Injection detection to every query made by your Meteor application.

If you’re interested in learning more, be sure to sign up for the [Inject Detect newsletter](http://www.injectdetect.com/#sign-up).
