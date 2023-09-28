---
layout: post
title:  "Finding Queries with Missing Indexes in Meteor Applications"
excerpt: "I find the existing tooling for tracking down slow queries to be cluncky and unintuitive. Adding a few lines to your Meteor application lets you track down those under-indexed queries quickly."
author: "Pete Corey"
date:   2023-09-23
tags: ["Meteor", "MongoDB", "Indexes"]
related: []
---

I find myself back in Meteor-land recently, trying to track down queries with missing or lacking indexes. I find much of the tooling around tracking down these unindexed queries to be lacking, so I wrote a quick [matb33:collection-hooks](https://github.com/matb33/meteor-collection-hooks)-based helper block to print out unindexed, or suspiscious queries in real time as they're made by the Meteor application:

```
[
  [CollectionOne, "CollectionOne"],
  [CollectionTwo, "CollectionTwo"],
  ...
].forEach(([collection, name]) => {
  collection.before.find(function (userId, selector, options) {
    collection
      .rawCollection()
      .find(selector, options)
      .explain()
      .then((res) => {
        console.log(
          `~~~ ${name}.find ${res?.queryPlanner?.winningPlan?.inputStage?.stage} ${res?.executionStats?.totalKeysExamined} ${res?.executionStats?.totalDocsExamined}`
        );
        if (
          res?.queryPlanner?.winningPlan?.inputStage?.stage == "COLLSCAN" ||
          res?.executionStats?.totalKeysExamined > 2000 ||
          res?.executionStats?.totalDocsExamined > 2000
        ) {
          console.log(`!!! ${name} ${JSON.stringify(selector, null, 2)}`);
        }
      });
  });
});
```

Just drop in the collection and their corresponding labels into the list above to explain query plans as they happen from your Meteor server.
