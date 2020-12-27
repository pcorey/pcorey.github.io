---
layout: post
title:  "MongoDB Lookup Aggregation"
excerpt: "In which a reader and I work together to write a MongoDB aggregation pipeline to reconstruct a tree, where each level of the tree is stored in separate collections."
author: "Pete Corey"
date:   2020-12-26
tags: ["Correspondence", "MongoDB", "Javascript"]
related: []
---

Recently, I received an email from a reader asking for tips on writing a MongoDB aggregation that aggregated the layers of a tree, stored in separate collections, into a single document:

> Hi Pete,

> I had a question related to your article on [MongoDB object array lookup aggregations](http://www.petecorey.com/blog/2020/01/29/mongodb-object-array-lookup-aggregation/).

> I'm working on something similar, but with a small difference. Imagine I have three collections that represent the different layers of a tree. A is the root. B are the children of A, and C are the children of B. Each child holds the ID of its parent in a `parentId`{:.language-javascript} field.

> The end goal is to write an aggregation that fleshes out every layer of the tree:

<blockquote><pre class='language-javascript'><code class='language-javascript'>{
  _id
  B: [
    {
      _id
      parentId
      C: [
        {
          _id, 
          parentId
        }
      ]
    }
  ]
}
</code></pre></blockquote>

> How should I approach this? Thanks.

Hello friend,

I feel your pain. Writing MongoDB aggregation feels like an under-documented dark art. In newer versions of Mongo you can write sub-pipelines under lookups. I think this will get you where you want to go:

<pre class='language-javascript'><code class='language-javascript'>db.getCollection('a').aggregate([
  {
    $lookup: {
      from: 'b',
      let: { "id": '$_id' },
      as: 'b',
      pipeline: [
        { $match: { $expr: { $eq: ['$$id', '$parentId'] } } },
        {
          $lookup: {
            from: 'c',
            let: { "id": '$_id' },
            as: 'c',
            pipeline: [
              { $match: { $expr: { $eq: ['$$id', '$parentId'] } } },
            ]
          }
        }
      ]
    }
  }
]);
</code></pre>

You can keep adding sub-piplines until you get as deep as you need.

I hope that helps.

Pete
