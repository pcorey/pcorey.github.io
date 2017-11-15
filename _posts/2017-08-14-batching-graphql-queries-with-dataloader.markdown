---
layout: post
title:  "Batching GraphQL Queries with DataLoader"
description: "Learn how to avoid the dreaded N+1 problem and optimize your GraphQL queries with DataLoader and MongoDB."
author: "Pete Corey"
date:   2017-08-14
tags: ["Javascript", "Node.js", "GraphQL", "Apollo", "MongoDB"]
---

One of the biggest drawbacks of an out-of-the-box [GraphQL](http://graphql.org/) solution is its tendency to make ridiculous numbers of [`N+1`{:.language-*} queries](https://stackoverflow.com/questions/97197/what-is-n1-select-query-issue). For example, consider the following GraphQL query:

<pre class='language-javascript'><code class='language-javascript'>
{
    patients {
        name
        bed {
            code
        }
    }
}
</code></pre>

We’re trying to grab all of the `patients`{:.language-javascript} in our system, and for each patient, we also want their associated `bed`{:.language-javascript}.

While that seems simple enough, the resulting database queries are anything but. Using the most obvious resolvers, our GraphQL server would ultimate make `N+1`{:.language-*} queries, where `N`{:.language-javascript} represents the number of patients in our system.

<pre class='language-javascript'><code class='language-javascript'>
const resolvers = {
    Query: {
        patients: (_root, _args, _context) =>  Patients.find({})
    },
    Patient: {
        bed: ({ bedId }, _args, _context) => Beds.findOne({ _id: bedId })
    }
};
</code></pre>

Our application first queries for all patients (`Patients.find`{:.language-javascript}), and then makes a `Beds.findOne`{:.language-javascript} query for each patient it finds. Thus, we’ve made `N`{:.language-javascript} (bed for patients) `+1`{:.language-javascript} (patients) queries.

This is unfortunate.

We could easily write a traditional REST endpoint that fetches and returns this data to the client using exactly two queries and some post-query transformations:

<pre class='language-javascript'><code class='language-javascript'>
return Patients.find({}).then(patients => {
    return Beds.find({ _id: { $in: _.map(patients, 'bedId') } }).then(beds => {
        let bedsById = _.keyBy(beds, '_id');
        return patients.map(patient => {
            return _.extend({}, patient, {
                bed: bedsById[patient.bedId]
            });
        });
    });
});
</code></pre>

Despite its elegance, the inefficiency of the GraphQL solution make it a no-go for many real-world applications.

Thankfully, there’s a solution! 🎉

[Facebook’s `dataloader`{:.language-javascript} package](https://github.com/facebook/dataloader) is the solution to our GraphQL inefficiency problems.

> DataLoader is a generic utility to be used as part of your application's data fetching layer to provide a consistent API over various backends and reduce requests to those backends via batching and caching.

There are many fantastic resources for learning about DataLoader, and even on [using DataLoader](http://dev.apollodata.com/tools/graphql-tools/connectors.html#DataLoader-and-caching) in an [Apollo-based project](https://github.com/apollographql/GitHunt-API). For that reason, we’ll skip some of the philosophical questions of how and why DataLoader works and dive right into wiring it into our [Apollo server](http://dev.apollodata.com/tools/) application.

All we need to get DataLoader working in our application is to create our [“batch”, or “loader” functions](https://github.com/facebook/dataloader#batch-function) and drop them into our GraphQL context for every GraphQL request received by our server:

<pre class='language-javascript'><code class='language-javascript'>
import loaders from "./loaders";
...
server.use('/graphql', function(req, res) {
    return graphqlExpress({
        schema,
        context: { loaders }
    })(req, res);
});
</code></pre>

Continuing on with our current patient and bed example, we’ll only need a single loader to batch and cache our repeated queries against the `Beds`{:.language-javascript} collection.

Let’s call it `bedLoader`{:.language-javascript} and add it to our `loaders.js`{:.language-javascript} file:

<pre class='language-javascript'><code class='language-javascript'>
export const bedLoader = new DataLoader(bedIds => {
    // TODO: Implement bedLoader
});
</code></pre>

Now that `bedLoader`{:.language-javascript} is being injected into our GraphQL context, we can replace our resolvers’ calls to `Beds.findOne`{:.language-javascript} with calls to `bedLoader.load`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const resolvers = {
    Patient: {
        bed: ({ bedId }, _args, { loaders }) => loaders.bedLoader.load(bedId)
    }
};
</code></pre>

DataLoader will magically aggregate all of the `bedId`{:.language-javascript} values that are passed into our call to `bedLoader.load`{:.language-javascript}, and pass them into our `bedLoader`{:.language-javascript} DataLoader callback.

Our job is to write our loader function so that it executes a single query to fetch all of the required beds, and then returns them in order. That is, if `bedIds`{:.language-javascript} is `[1, 2, 3]`{:.language-javascript}, we need to return bed `1`{:.language-javascript} first, bed `2`{:.language-javascript} second, and bed `3`{:.language-javascript} third. If we can’t find a bed, we need to return `undefined`{:.language-javascript} in its place:

<pre class='language-javascript'><code class='language-javascript'>
export const bedLoader = new DataLoader(bedIds => {
    return Beds.find({ _id: { $in: bedIds } }).then(beds => {
        const bedsById = _.keyBy(beds, "_id");
        return bedIds.map(bedId => bedsById[bedId]);
    });
});
</code></pre>

That’s it!

Now our system will make a single query to grab all of the `patients`{:.language-javascript} in our system. For every patient we find, our `bed`{:.language-javascript} resolver will fire and that patient’s `bedId`{:.language-javascript} into our `bedLoader`{:.language-javascript} DataLoader. Our `bedLoader`{:.language-javascript} DataLoader will gather all of our `bedId`{:.language-javascript} values, make a single query against the `Beds`{:.language-javascript} collection, and return the appropriate bed to the appropriate `bed`{:.language-javascript} resolver.

Thanks to DataLoader we can have the elegance of a GraphQL approach, combined with the efficiency and customizability of the manual approach.
