---
layout: post
title:  "How am I Building Inject Detect?"
excerpt: "Here's a high-level architectural and technilogical outline for how I plan to build out the Inject Detect application."
author: "Pete Corey"
date:   2017-03-20
tags: ["Inject Detect", "Elixir", "MongoDB"]
---

I [recently announced](http://www.east5th.co/blog/2017/03/06/inject-detect-coming-soon/) that I’m working on a new project called [Inject Detect](http://www.injectdetect.com/). It’s an understatement to say that I’m incredibly excited about this project!

Since announcing the project, I’ve spent the last couple weeks carefully considering my best steps forward. I’ve finally landed on what I believe is a solid plan of attack for building out [Inject Detect](http://www.injectdetect.com/), and I want to share it with the world.

Let’s dig into it!

## What's the Main Focus?

The first step in any project is to build a thorough understanding of the problem we’re trying to solve and understand how solving that problem brings value to our client or customer.

In the case of [Inject Detect](http://www.injectdetect.com/), our goal is to detect and notify Meteor application owners of NoSQL Injection attacks as they happen.

We give our customers real-time, actionable information to help them protect their applications and safeguard them against attack. A valuable by-product of this constant vigilance is peace of mind.

What does this mean for us?

We need to approach our solution with this value in the forefront of our mind. Everything we do should first and foremost maximize value for our customers.

## High Level Architecture

From a very high level, [Inject Detect](http://www.injectdetect.com/) is composed of two major components: a Meteor package that is installed in each monitored application, and a server to aggregate data sent from those applications and alert customers of potential NoSQL Injection attacks.

The Meteor package’s primary job is to hook into all queries made against a Meteor’s application’s MongoDB database and send that query information up to the server.

The server sifts through these incoming queries, comparing them to a set of expected queries for a given application. If an unexpected query is detected, the server sends a notification to the application owner, alerting them of a potential problem.

## Collecting Queries on the Client

The fundamental function of [Inject Detect](http://www.injectdetect.com/) is to sleuth over all queries made against a MongoDB database.

There are multiple ways of accomplishing this:

There are tools that use the [MongoDB Profiler](https://docs.mongodb.com/manual/reference/method/db.setProfilingLevel/) to observe queries in real-time. Unfortunately, the level of profiling required to intercept all queries can negatively affect database performance.

There are tools like [MongoReplay](https://docs.mongodb.com/manual/reference/program/mongoreplay/#bin.mongoreplay) that can be installed alongside MongoDB and act as proxies, intercepting MongoDB queries as they come in off the network. Unfortunately, installing these kinds of tools isn’t possible on hosted MongoDB solutions like Compose or Atlas.

So what are we left with?

The last option is to intercept queries at the application level. In the context of a Meteor application, this means hooking directly into the `Mongo.Collection`{:.language-javascript} functionality at a low level.

Since this is the only option that won’t negatively impact database-level performance and will work for any type of MongoDB installation, this is the option for us.

## But What About Sensitive Query Data?

Application owners may be concerned about sending full query objects off to a third-party service. Thankfully, [Inject Detect](http://www.injectdetect.com/) doesn’t need to whole query object!

Imagine an application has a query that is used to authenticate a user based on their “resume token”:

<pre class='language-javascript'><code class='language-javascript'>
Meteor.users.find({
  "services.resume.loginTokens.hashToken": "ABC123..."
})
</code></pre>

In the wrong hands, this query information can be used to impersonate the user with the `"ABC123..."`{:.language-javascript} resume token. This isn’t the kind of information you want to trust to third parties.

Fear not, [Inject Detect](http://www.injectdetect.com/) respects your privacy!

[Inject Detect](http://www.injectdetect.com/) only needs the structure of the query to detect potential NoSQL Inject attacks, not the fully populated query object.

In this example, we’d be send the following information up to the [Inject Detect](http://www.injectdetect.com/) server:

<pre class='language-javascript'><code class='language-javascript'>
{
  collection: "users",
  query: {
    "services.resume.loginTokens.hashToken": String
  }
}
</code></pre>

Rather than being sent the entire query object, complete with sensitive data, we’re sending a schema of the query.

We don’t care about the value of `hashToken`{:.language-javascript}, we just care that it’s a `String`{:.language-javascript}.

This is enough information to detect potential abuse, and keeps private customer data where it should be - safe and sound in your application.

## Prioritizing Performance on the Client

But we have to consider more than just privacy…

It wouldn’t be the best idea to send a request to [Inject Detect](http://www.injectdetect.com/) for every query made in a client application. The [Inject Detect](http://www.injectdetect.com/) server would quickly be overwhelmed by a huge number of incoming requests, and the client application would be overburdened with outbound requests.

Talk about inefficient!

Instead, the client-side Meteor portion of [Inject Detect](http://www.injectdetect.com/) batches queries as they’re intercepted and only sends them to the server every `N`{:.language-javascript} seconds.

For the initial release of the application, I’m planning on sending query batches to the server at most once every thirty seconds.

This will alleviate any potential performance issues for both [Inject Detect](http://www.injectdetect.com/) and applications using the [Inject Detect](http://www.injectdetect.com/) Meteor package, and the cost of being as close to “hard real-time” as we can get.

## The Inject Detect Server

The [Inject Detect](http://www.injectdetect.com/) server will listen for incoming queries from your Meteor application and compare them against sets of known queries that are made by your application.

If an unexpected query is detected, [Inject Detect](http://www.injectdetect.com/) will notify you immediately. Additionally, it will try to identify which query is being exploited to give you immediate insight into where to look in your application.

But what about the nuts and bolts?

For a variety of reasons, the [Inject Detect](http://www.injectdetect.com/) server will be implemented as an [Elixir](http://elixir-lang.org/) application.

The “core domain” of the application will be implemented using Event Sourcing techniques. I’ve been using event-based systems extensively for client projects with great success.

The [Inject Detect](http://www.injectdetect.com/) front-end application will initially be implemented as a [Phoenix](http://www.phoenixframework.org/) application for simplicity.

We’ll dig into these details in future posts.

## Final Thoughts and Next Steps

I’m very excited to begin working on this project and even more excited to bring [Inject Detect](http://www.injectdetect.com/) into the world.

NoSQL Injection seems to be one of the most widespread and under-acknowledged security issues in Meteor applications (and in many other applications using MongoDB).

[Inject Detect](http://www.injectdetect.com/) will help application owners detect when these attacks happen, and help track down their root causes.

Next week, we’ll dive into the Meteor package side of [Inject Detect](http://www.injectdetect.com/) and discuss how we can hook into all database queries made by a Meteor application at a low level.

In the meantime, [focus on security](http://www.east5th.co/blog/2017/03/13/why-security/)!
