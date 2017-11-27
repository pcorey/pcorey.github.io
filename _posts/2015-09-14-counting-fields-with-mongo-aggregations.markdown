---
layout: post
title:  "Counting Fields With Mongo Aggregations"
titleParts: ["Counting Fields", "With Mongo Aggregations"]
description: "How would you write a MongoDB query to cound the number of fields in a set of documents? Let's dive into a solution!"
author: "Pete Corey"
date:   2015-09-14
tags: ["Javascript", "MongoDB"]
---

This past week I spent time wrestling with a particularly difficult [MongoDB aggregation](http://docs.mongodb.org/manual/aggregation/). For my own sake, I figured I should document what I learned.

Imagine you have a set of users working through various workflows. The users' current workflow state is held in a subdocument whos name relates to the name of their active workflow. For example, the first two users below are currently in workflow "A", while the third user is in workflow "B":

<pre class="language-javascript"><code class="language-javascript">/* 0 */
{
  _id: "...",
  workflow: {
    A: {
      pos: 3
    }
  }
}

/* 1 */
{
  _id: "...",
  workflow: {
    A: {
      pos: 1
    }
  }
}

/* 2 */
{
  _id: "...",
  workflow: {
    B: {
      pos: 4
    }
  }
}
</code></pre>

My goal is to find out how many users are currently in workflow "A", and how many are in workflow "B". Without further ado, here's the aggregate query I ended up with:

<pre class="language-javascript"><code class="language-javascript">db.users.aggregate([
    {
        $group: {
            _id: null,
            in_workflow_a: {$sum: {$cond: [{$gte: ['$workflow.A, null]}, 1, 0]}},
            in_workflow_b: {$sum: {$cond: [{$gte: ['$workflow.B, null]}, 1, 0]}}
        }
    }
])
</code></pre>

Let's break it down piece by piece.

Since I'm interested the states of all users in the system, I'm not using a <code class="language-javascript">$match</code> block. If you wish to you limit your query to a specific subset of users, you could do that filter in an initial <code class="language-javascript">$match</code>:

<pre class="language-javascript"><code class="language-javascript">db.users.aggregate([
    {
        $match: {
            _id: {
                $in: [
                    user Ids...
                ]
            }
        }
    },
    ...
])
</code></pre>

The first thing you'll notice about the <code class="language-javascript">$group</code> block is that we're specifying a <code class="language-javascript">null</code> <code class="language-javascript">_id</code>. This use of <code class="language-javascript">_id</code> is [fairly well documented](http://docs.mongodb.org/manual/reference/operator/aggregation/group/#definition), and essentially means we'll group all of the documents we're matching over into a single result document.

The next bit is the interesting part. We're defining two fields that will appear in our result document: <code class="language-javascript">in_workflow_a</code>, and <code class="language-javascript">in_workflow_b</code>. We build up each of these fields with a <code class="language-javascript">$sum</code>. We want to add <code class="language-javascript">1</code> to these fields if the respective workflow subdocument exists, and <code class="language-javascript">0</code> if it does not. We accomplish this by using the <code class="language-javascript">$cond</code> [aggregation operator](http://docs.mongodb.org/manual/reference/operator/aggregation/cond/).

The way we're using <code class="language-javascript">$cond</code> is fairly interesting. My first attempts at writting this aggregation used <code class="language-javascript">$exists</code> within the <code class="language-javascript">$cond</code>, but Mongo was unhappy about that:

<pre class="language-javascript"><code class="language-javascript">uncaught exception: aggregate failed: {
  "errmsg" : "exception: dotted field names are only allowed at the top level",
  "code" : 16405,
  "ok" : 0
}
</code></pre>

[David Weldon](https://dweldon.silvrback.com/) led me out of the darkness with an interesting comparison trick. By using <code class="language-javascript">$gte</code> to compare the potentially non-existant workflow object against <code class="language-javascript">null</code>, we can easily determine whether it exists or not. When Mongo compares values of different types, it uses [this comparison order](http://docs.mongodb.org/manual/reference/bson-types/#bson-types-comparison-order). As you can see, aside from the internally used MinKey type, every other BSON type is considered canonically greater than <code class="language-javascript">null</code>. This means that an empty or <code class="language-javascript">null</code> field will return <code class="language-javascript">false</code>, and any other types or values will return <code class="language-javascript">true</code>!

The final result of our aggregation looks something like this:

<pre class="language-javascript"><code class="language-javascript">/* 0 */
{
    "result" : [ 
        {
            "_id" : null,
            "in_workflow_a" : 2,
            "in_workflow_b" : 1
        }
    ],
    "ok" : 1
}
</code></pre>

Victory! The aggregation loops through all users in the system, incrementing the counter for each users current workflow, and finally returns the total counts.
