---
layout: post
title:  "MongoDB Object Array Lookup Aggregation"
excerpt: ""
author: "Pete Corey"
date:   2020-01-29
tags: ["Javascript", "MongoDB"]
related: []
---

As part of an ongoing quest to speed up an application I'm working on, I found myself tasked with writing a fairly complicated [MongoDB aggregation pipeline](https://docs.mongodb.com/manual/aggregation/). I found no existing documentation on how to accomplish the task at hand, so I figured I should pay it forward and document my solution for future generations.

## Widgets and Icons

Imagine we have two MongoDB collections. Our first collection holds information about `widgets`{:.language-javascript} in our system:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('widgets').insert({
    _id: 1,
    name: 'Name',
    info: [
        {
            iconId: 2,
            text: 'Text'
        }
    ]
});
</code></pre>

Every widget has a `name`{:.language-javascript} and a list of one or more `info`{:.language-javascript} objects. Each `info`{:.language-javascript} object has a `text`{:.language-javascript} field and an associated icon referenced by an `iconId`{:.language-javascript}.

Our `icons`{:.language-javascript} collection holds some basic information about each icon:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('icons').insert({
    _id: 2,
    name: 'Icon',
    uri: 'https://...'
});
</code></pre>

The goal is to write an aggregation that returns our widgets with the associated icon documents attached to each corresponding `info`{:.language-javascript} object:

<pre class='language-javascript'><code class='language-javascript'>
{
    _id: 1,
    name: 'Name',
    info: [
        {
            iconId: 2,
            text: 'Text',
            icon: {
                _id: 2,
                name: 'Icon',
                uri: 'https://...'
            }
        }
    ]
}
</code></pre>

## Working Through the Pipeline

The aggregation that accomplishes this goal operates in six stages. Let's work through each stage one by one. We'll start by [`$unwind`{:.language-javascript}](https://docs.mongodb.com/manual/reference/operator/aggregation/unwind/)ing our `info`{:.language-javascript} array:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('widgets').aggregate([
    { $unwind: '$info' }
]);
</code></pre>

This creates a new document for every widget/info pair:

<pre class='language-javascript'><code class='language-javascript'>
{
    _id: 1,
    name: 'Name',
    info: {
        iconId: 2,
        text: 'Text',
    }
}
</code></pre>

Next, we'll [`$lookup`{:.language-javascript}](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/) the icon associated with the given `iconId`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('widgets').aggregate([
    ...
    {
        $lookup: {
            from: 'icons',
            localField: 'info.iconId',
            foreignField: '_id',
            as: 'info.icon'
        }
    }
]);
</code></pre>

Our resulting document will now have a list of icons in the `info.icon`{:.language-javascript} field:

<pre class='language-javascript'><code class='language-javascript'>
{
    _id: 1,
    name: 'Name',
    info: {
        iconId: 2,
        text: 'Text',
        icon: [
            {
                _id: 2,
                name: 'Icon',
                uri: 'https://...'
            }
        ]
    }
}
</code></pre>

This is a step in the right direction, but we know that the `info`{:.language-javascript} to `icons`{:.language-javascript} relationship will always be a one to one relationship. We'll always receive exactly one icon as a result of our `$lookup`{:.language-javascript}.

Armed with this knowledge, we know we can `$unwind`{:.language-javascript} on `info.icon`{:.language-javascript} and safely turn our `info.icon`{:.language-javascript} array into an object:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('widgets').aggregate([
    ...
    { $unwind: '$info.icon' }
]);
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
{
    _id: 1,
    name: 'Name',
    info: {
        iconId: 2,
        text: 'Text',
        icon: {
            _id: 2,
            name: 'Icon',
            uri: 'https://...'
        }
    }
}
</code></pre>

But now we need to roll our `info`{:.language-javascript} back up into an array. We can accomplish this by [`$group`{:.language-javascript}](https://docs.mongodb.com/manual/reference/operator/aggregation/group/)ing our widgets together based on their `_id`{:.language-javascript}. However, we need to be careful to preserve the original document to avoid clobbering the entire widget:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('widgets').aggregate([
    ...
    {
        $group: {
            _id: '$_id',
            root: { $mergeObjects: '$$ROOT' },
            info: { $push: '$info' }
        }
    }
]);
</code></pre>

Our resulting document contains our `info`{:.language-javascript} array and the original, pre-`$group`{:.language-javascript} widget document in the `root`{:.language-javascript} field:

<pre class='language-javascript'><code class='language-javascript'>
{
    root: {
        _id: 1,
        name: 'Name',
        info: {
            iconId: 2,
            text: 'Text',
            icon: {
                _id: 2,
                name: 'Icon',
                uri: 'https://...'
            }
        }
    },
    info: [
        {
            iconId: 2,
            text: 'Text',
            icon: {
                _id: 2,
                name: 'Icon',
                uri: 'https://...'
            }
        }
    ]
}
</code></pre>

The next step in our pipeline is to replace our root document with the `root`{:.language-javascript} object merged with the actual root document. This will override the `info`{:.language-javascript} object in `root`{:.language-javascript} with our newly grouped together `info`{:.language-javascript} array:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('widgets').aggregate([
    ...
    {
        $replaceRoot: {
            newRoot: {
                $mergeObjects: ['$root', '$$ROOT']
            }
        }
    }
]);
</code></pre>

We're getting close to our goal:

<pre class='language-javascript'><code class='language-javascript'>
{
    _id: 1,
    name: 'Name',
    info: [
        {
            iconId: 2,
            text: 'Text',
            icon: {
                _id: 2,
                name: 'Icon',
                uri: 'https://...'
            }
        }
    ],
    root: {
        _id: 1,
        name: 'Name',
        info: {
            iconId: 2,
            text: 'Text',
            icon: {
                _id: 2,
                name: 'Icon',
                uri: 'https://...'
            }
        }
    }
}
</code></pre>

An unfortunate side effect of this merger is that our resulting document still has a `root`{:.language-javascript} object filled with superfluous data. As a final piece of housecleaning, let's remove that field:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('widgets').aggregate([
    ...
    {
        $project: {
            root: 0
        }
    }
]);
</code></pre>

And with that we're left with our original goal:

<pre class='language-javascript'><code class='language-javascript'>
{
    _id: 1,
    name: 'Name',
    info: [
        {
            iconId: 2,
            text: 'Text',
            icon: {
                _id: 2,
                name: 'Icon',
                uri: 'https://...'
            }
        }
    ]
}
</code></pre>

Success!

## All Together

For posterity, here's the entire aggregation pipeline in its entirety:

<pre class='language-javascript'><code class='language-javascript'>
db.getCollection('widgets').aggregate([
    { $unwind: '$info' },
    {
        $lookup: {
            from: 'icons',
            localField: 'info.iconId',
            foreignField: '_id',
            as: 'info.icon'
        }
    },
    { $unwind: '$info.icon' },
    {
        $group: {
            _id: '$_id',
            root: { $mergeObjects: '$$ROOT' },
            info: { $push: '$info' }
        }
    },
    {
        $replaceRoot: {
            newRoot: {
                $mergeObjects: ['$root', '$$ROOT']
            }
        }
    },
    {
        $project: {
            root: 0
        }
    }
]);
</code></pre>

I'll be the first to say that I'm not a MongoDB expert, and I'm even less knowledgeable about building aggregation pipelines. There may be other, better ways of accomplishing this same task. If you know of a better, more efficient pipeline that gives the same results, please let me know!
