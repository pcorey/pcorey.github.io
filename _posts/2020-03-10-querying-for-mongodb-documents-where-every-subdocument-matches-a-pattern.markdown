---
layout: post
title:  "Querying for MongoDB Documents Where Every Sub-document Matches a Pattern"
excerpt: "Recently I found myself tasked with removing documents from a MongoDB collection that had an array of sub-documents entirely matching a pattern. The final solution required I flip my perspective on the problem entirely."
author: "Pete Corey"
date:   2020-03-10
tags: ["Javascript", "MongoDB"]
related: []
---

Imagine you're implementing a feature to remove all "empty" documents from a MongoDB "events" collection. These documents aren't completely empty. Each document will always have an array of `checks`{:.language-javascript}, and each check will have an array of `sources`{:.language-javascript} that satisfied that check.

For example, here are a few documents in our events collection:

<pre class='language-javascript'><code class='language-javascript'>
{
    "checks": [
        {
            "sources": []
        },
        {
            "sources": []
        },
    ]
}
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
{
    "checks": [
        {
            "sources": [
                {
                    "_id": 1
                }
            ]
        },
        {
            "sources": []
        },
    ]
}
</code></pre>

The first document is considered "empty", because all of the `sources`{:.language-javascript} arrays nested within each of the `checks`{:.language-javascript} is empty (`[]`{:.language-javascript}). The second document isn't empty, because the `sources`{:.language-javascript} array within the first check isn't an empty array.

## That's Not How All Works!

That's the situation I found myself in while working on a recent client project. Skimming (too quickly) through the MongoDB documentation, I decided that the [`$all`{:.language-javascript}](https://docs.mongodb.com/manual/reference/operator/query/all/) query operator would be the perfect tool to solve my problem. After all, I was looking for documents where _all_ of the `sources`{:.language-javascript} arrays were empty.

My first stab at cleaning up these empty event documents looked something like this:

<pre class='language-javascript'><code class='language-javascript'>
await Event.model.deleteMany({
    checks: {
        $all: [
            {
                $elemMatch: {
                    sources: { $eq: [] }
                }
            }
        ]
    }
});
</code></pre>

My plan was to use the [`$all`{:.language-javascript}](https://docs.mongodb.com/manual/reference/operator/query/all/) and [`$elemMatch`{:.language-javascript}](https://docs.mongodb.com/manual/reference/operator/query/elemMatch/) MongoDB operators together to find and remove any event documents who's `checks`{:.language-javascript} sub-documents all contain empty (`{ $eq: [] }`{:.language-javascript}) `sources`{:.language-javascript} arrays.

Unfortunately, __this is not how `$all`{:.language-javascript} works.__

The `$all`{:.language-javascript} operator matches on any documents who's sub-documents contain "all" of the elements listed within the `$all`{:.language-javascript} operator. It _does not_ match on documents where every sub-document matches the described element.

For example, a query like `{ foo: { $all: [ 1, 2, 3 ] } }`{:.language-javascript} will match on documents that have `1`{:.language-javascript}, `2`{:.language-javascript}, and `3`{:.language-javascript} within their `foo`{:.language-javascript} array. Their `foo`{:.language-javascript} arrays can contain other elements, like `4`{:.language-javascript}, `5`{:.language-javascript}, or `6`{:.language-javascript}, but it must at least contain _all_ of our specified values.

Applying this to our situation, we can see that our query will delete all documents that have at least one empty check, and not documents that have all empty checks.

This means we're deleting event documents that aren't empty!

## We Don't Even Need All

Armed with this new knowledge and [guided by a failing test](https://en.wikipedia.org/wiki/Test-driven_development), I went to work trying to refactor my solution. After much tinkering, I came to the conclusion that the query I'm after can't be directly expressed using the `$all`{:.language-javascript} query operator. However, flipping the problem around, I came to a simpler solution that doesn't make use of `$all`{:.language-javascript} at all!

Instead of looking for documents where every sub-document in the `checks`{:.language-javascript} array contains an empty `sources`{:.language-javascript} array, let's look for documents that have a non-empty `sources`{:.language-javascript} array in any one of their `checks`{:.language-javascript}. The result set we're looking for is the inverse of this set of documents.

We can express this nice and neatly with MongoDB's [`$not`{:.language-javascript}](https://docs.mongodb.com/manual/reference/operator/query/not/index.html) operator:

<pre class='language-javascript'><code class='language-javascript'>
await Event.model.deleteMany({
    checks: {
        $not: {
            $elemMatch: {
                sources: { $ne: [] }
            }
        }
    }
});
</code></pre>

As you can see, we're removing any events who's `checks`{:.language-javascript} array does not contain any sub-documents with a non-empty `sources`{:.language-javascript} array.

That's it! With that, we're able to clean up any truly "empty" events, while preserving any events with non-empty `sources`{:.language-javascript}.
