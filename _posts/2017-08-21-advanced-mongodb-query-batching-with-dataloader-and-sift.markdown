---
layout: post
title:  "Advanced MongoDB Query Batching with DataLoader and Sift"
excerpt: "DataLoader and Sift.js are a powerful duo when it comes to implementing advanced caching strategies for your GraphQL queries."
author: "Pete Corey"
date:   2017-08-21
tags: ["Javascript", "Node.js", "GraphQL", "MongoDB"]
---

Last week we dove into the gloriously efficient world of [batching GraphQL queries with DataLoader](http://www.east5th.co/blog/2017/08/14/batching-graphql-queries-with-dataloader/).

In all of the examples we explored, the queries being batched were incredibly simple. For the most part, our queries consisted of `_id`{:.language-javascript} lookups followed by a post-processing step that matched each result to each `_id`{:.language-javascript} being queried for.

This simplicity is great when working with examples, but the real world is a much more complicated, nuanced place.

Let’s dive into how we can work with more complicated [MongoDB](https://www.mongodb.com/) queries, and use [`sift.js`{:.language-javascript}](https://github.com/crcn/sift.js/) to map those queries back to individual results in a batched set of query results.

## A More Complicated Example

Instead of simply querying for patients or beds by `_id`{:.language-javascript}, let’s set up a more complicated example.

Imagine that we’re trying to find if a patient has been in a particular set of beds in the past week. Our query might look something like this:

<pre class='language-javascript'><code class='language-javascript'>
return Beds.find({
    patientId: patient._id,
    bedCode: { $in: bedCodes },
    createdAt: { $gte: moment().subtract(7, "days").toDate() }
});
</code></pre>

If this query were used as a resolver within our GraphQL `patient`{:.language-javascript} type, we would definitely need to batch this query to avoid `N + 1`{:.language-javascript} inefficiencies:

<pre class='language-javascript'><code class='language-javascript'>
{
    patients {
        name
        recentlyInBed([123, 234, 345]) {
            bedCode
            createdAt
        }
    }
}
</code></pre>

[Just like last time](http://www.east5th.co/blog/2017/08/14/batching-graphql-queries-with-dataloader/), our new query would be executed once for every patient returned by our `patients`{:.language-javascript} resolver.

## Batching with DataLoader

Using [DataLoader](https://github.com/facebook/dataloader), we can write a loader function that will batch these queries for us. We’d just need to pass in our `patient._id`{:.language-javascript}, `bedCodes`{:.language-javascript}, and our `createdAt`{:.language-javascript} date:

<pre class='language-javascript'><code class='language-javascript'>
return loaders.recentlyInBedLoader({
    patientId: patient._id,
    bedCodes,
    createdAt: { $gte: moment().subtract(7, "days").toDate()
});
</code></pre>

Now let’s implement the `recentlyInBedLoader`{:.language-javascript} function:

<pre class='language-javascript'><code class='language-javascript'>
export const recentlyInBedLoader = new DataLoader(queries => {
    return Beds.find({ $or: queries }).then(beds => {
        // TODO: ???
    });
});
</code></pre>

Because we passed our entire MongoDB query object into our data loader, we can execute all of our batched queries simultaneously by grouping them under a single [`$or`{:.language-javascript} query operator](https://docs.mongodb.com/manual/reference/operator/query/or/).

But wait, how do we map the results of our batched query batch to the individual queries we passed into our loader?

We could try to manually recreate the logic of our query:

<pre class='language-javascript'><code class='language-javascript'>
return queries.map(query => {
    return beds.filter(bed => {
        return query.patientId == bed.patientId &&
            _.includes(query.bedCodes, bed.bedCode) &&
            query.createdAt.$gte <= bed.createdAt;
    });
});
</code></pre>

This works, but it seems difficult to manage, maintain, and test. Especially for more complex MongoDB queries. There has to be a better way!

{% include newsletter.html %}

## Sift.js to the Rescue

[Sift.js](https://github.com/crcn/sift.js/) is a library that lets you filter in-memory arrays using MongoDB query objects. This is exactly what we need! We can rewrite our loader function using sift:

<pre class='language-javascript'><code class='language-javascript'>
export const recentlyInBedLoader = new DataLoader(queries => {
    return Beds.find({ $or: queries }).then(beds => {
        return queries.map(query => sift(query, beds));
    });
});
</code></pre>

Perfect!

Now we can write loaders with arbitrarily complex queries and easily map the batched results back to the individual queries sent into the loader.

Sift can actually be combined with DataLoader to write completely generic loader functions that can be used to batch and match any queries of any structure against a collection, but that’s a post for another day.
