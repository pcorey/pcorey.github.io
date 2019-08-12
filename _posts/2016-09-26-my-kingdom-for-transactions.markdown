---
layout: post
title:  "My Kingdom for Transactions"
excerpt: "Transactions are an incredibly undervalued tool in a developer's toolbox. They're often not missed until they're desperately needed. By then, it may be too late."
author: "Pete Corey"
date:   2016-09-26
tags: ["Javascript", "MongoDB"]
---

Recently, while reviewing a system I built for a client, I realized how strongly the “decision” to use [MongoDB](https://www.mongodb.com/) effected the architecture and structure of the system.

Using a better tool for the job would have significantly simplified the architecture of the solution and resulted in a more robust and reliable final product.

## The System

The general idea of the system is that there are a set of “entities”. Each entity has a set of actions that can be done on them. For example, let’s imagine that we have a `Child`{:.language-javascript} entity. Here are a few of the actions that can be taken on our `Child`{:.language-javascript}:

- `put_to_bed`{:.language-javascript}
- `feed_breakfast`{:.language-javascript}
- `take_to_school`{:.language-javascript}
- `consume_free_time`{:.language-javascript}
- etc…

Each action has two main parts. A `validate`{:.language-javascript} method, and a `do`{:.language-javascript} method.

Whenever you execute an action on an entity, the `validate`{:.language-javascript} function will be called first. If this functions fails in any way, we’ll return the failure to the caller and stop all execution of the action before moving forward.

If `validate`{:.language-javascript} doesn’t catch any problems, we’ll move on to the `do`{:.language-javascript} function, which executes the meat of the action.

As an example, our `put_to_bed`{:.language-javascript} action might look something like this:

<pre class='language-javascript'><code class='language-javascript'>
put_to_bed: {
    validate({bedId}) {
        check(bedId, String);
    },
    do() {
        Child.update(this._id, {
            $set: { in_bed: true }
        });
        Bed.findOne(bedId).do("set_occupant", { childId: this._id });
    }
}
</code></pre>

This seems all well and good. We check that `bedId`{:.language-javascript}, or the ID of the `Bed`{:.language-javascript} we’re putting the child into is a `String`{:.language-javascript}. When we execute the action, we update the current `Child`{:.language-javascript} document and set `in_bed`{:.language-javascript} to true. Next, we find the bed we’re putting the child into and set its occupant to the child’s ID.

## Broken State

But what happens if the bed already has an occupant?

Calling `Bed.findOne(bedId).do(...)`{:.language-javascript} will trigger the `set_occupant`{:.language-javascript} action to be triggered on the bed. It’s `valiate`{:.language-javascript} function will be called, which might look something like this:

<pre class='language-javascript'><code class='language-javascript'>
set_occupant: {
    validate({childId}) {
        check(childId, String);
        if (this.occupied) {
            throw new Meteor.Error("occupied");
        }
    },
    ...
}
</code></pre>

The `set_occupant`{:.language-javascript} action on the `Bed`{:.language-javascript} will fail.

This leaves our system in a broken state. The child claims that it’s in bed (`in_bed: true`{:.language-javascript}), but the bed is occupied by someone else.

## Two Phase Commit Problems

The MongoDB documentation explains that this kind of multi-document transaction-style commit can be accomplished using [two phase commits](https://docs.mongodb.com/manual/tutorial/perform-two-phase-commits/). The idea is that we keep track of our set of database changes as we carry out actions, and undo them if things go wrong.

The example two phase commit described in [the documentation](https://docs.mongodb.com/manual/tutorial/perform-two-phase-commits/) updates two documents within the same collection. Unfortunately our problem is a little more complex.

[The example](https://docs.mongodb.com/manual/tutorial/perform-two-phase-commits/) holds the IDs of the documents being updated in the transaction’s `source`{:.language-javascript} and `destination`{:.language-javascript} fields. Our transactions will update an arbitrary number of documents across any number of collections.

Instead of a single `source`{:.language-javascript} and `destination`{:.language-javascript} pair, we would need to maintain a list of affected documents, storing both the documents’ `_id`{:.language-javascript} and `collection`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
{
    ...
    documents: [
        {
            collection: "children",
            _id: ...
        },
        {
            collection: "beds",
            _id: ...
        }
    ]
}
</code></pre>

If something goes wrong in a two phase commit, any updates that have already been carried out need to be rolled back.

In the example scenario described in the [MongoDB documentation](https://docs.mongodb.com/manual/tutorial/perform-two-phase-commits/), rollbacks are easy. All updates are simple increments (`$inc: { balance: value }`{:.language-javascript}), and can be undone by decrementing by the same value (`$inc: { balance: -value }`{:.language-javascript}).

But again, our scenario is more complicated.

Our actions are free to modify their respective documents in any way. This means that we have no natural way of undoing these modifications without either storing more additional data, or adding additional code.

One potential solution would be to store the original, pre-modification document along with the transaction’s `_id`{:.language-javascript} in the `pendingTransactions`{:.language-javascript} list:

<pre class='language-javascript'><code class='language-javascript'>
{
    in_bed: true,
    ...
    pendingTransactions: [
        {
            _id: ...,
            document: {
                in_bed: false,
                ...,
                pendingTransactions: []
            }
        }
    ]
}
</code></pre>

In the case of a roll-back, we could replace the entire document with this pre-modification document. The downside of this approach is that it drastically increases the size of our entity documents.

Another approach would be to create a new `undo`{:.language-javascript} function to go along with each of our actions’ `do`{:.language-javascript} functions. The `undo`{:.language-javascript} function would simply undo any operations done by the `do`{:.language-javascript} function.

This approach is very similar to the migration model used by [Active Record](http://edgeguides.rubyonrails.org/active_record_migrations.html#using-the-up-down-methods) and other [migration frameworks](https://github.com/percolatestudio/meteor-migrations). The obvious downsides of this approach are that we’re adding a huge amount of extra code to our application.

As my good friend [Bret Lowrey](https://lowrey.me/) says, “Code is like a war - the best code is one never written.”

## My Kingdom For Transactions

It’s amazing how much architectural effort needs to be put into creating a functional, but awkward solution to this problem.

Interestingly, this kind of problem isn’t unique to this specific application. Most web applications do some kind of transactional updates against multiple documents across one or more collections.

Many developers just ignore the possibility of mid-transaction failures. If it happens, it happens. We’ll just clean up the database on an ad hoc basis.

And why not? When your alternatives are either doubling the size of your codebase or doubling the size of your database, a little manual labor starts to sound more appealing.

For this particular application, we decided that it would make more sense to invest in heavier upfront validation (via robust `validate`{:.language-javascript} functions and simulations), rather than implementing a proper two phase commit system.

However, this entire mess could have been completely avoided if we had gone with a database that supported [proper transactions](https://www.postgresql.org/docs/8.3/static/tutorial-transactions.html).

My kingdom for transactions…
