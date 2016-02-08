---
layout: post
title:  "Sorting By Ownership With MongoDB"
titleParts: ["Sorting By Ownership With", "MongoDB"]
date:   2015-11-16
tags: []
---

I sometimes find myself coming up against constraints or limitations imposed upon my software either through the tools that I'm using, or by a limited understanding of how to use those tools. In these situations we're always given two options:

1. Bend or reshape your solution to fit the constraint
2. Maintain your design and overcome the limitation

A perfect example of this would be something as seemingly simple as sorting a collection of documents by ownership using [MongoDB](https://www.mongodb.com/).

Let's say we have a huge collection of documents in our database. An example document would look something like this:

<pre class="language-javascript"><code class="language-javascript">{
  ownerId: "XuwWcLue9zom8DqEA",
  name: "Foo"
  ...
}
</code></pre>

Each document is owned by a particular user (denoted by the `ownerId`{:.language-javascript} field). On the front-end, we want to populate a table with these documents. The current user's documents should appear first, secondarily sorted by the document's `name`{:.language-javascript} field, and all other documents should follow, sorted by their name.

## Sorting by Ownership is Hard

There are a couple things going on here that make this a difficult problem. First thing's first, "ownership" is a computed value. You can't determine if a document belongs to a user until you receive some input from the user; specifically their ID.

Unfortunately, while [there are tools](https://github.com/dburles/meteor-collection-helpers) that let us attach computed values to our documents, we can't search or sort on those fields at a database level. This also means that ___we can't paginate our data off of those calculated fields___.

The second issue is the size of our imaginary collection. If our collection were smaller, we could just pull everything into memory and (painfully) sort the documents ourselves:

<pre class="language-javascript"><code class="language-javascript">Collection.find({}).sort(function(a, b) {
  if (a.ownerId === Meteor.userId()) {
    if (b.ownerId === Meteor.userId()) {
      return a.name < b.name ? -1 :
             a.name == b.name ? 0 : 1;
    }
    else {
      return -1;
    }
  }
  else if (b.ownerId === Meteor.userId()) {
    return 1;
  }
  else {
    return a.name < b.name ? -1 :
           a.name == b.name ? 0 : 1;
  }
});
</code></pre>

Unfortunately, we have a very large number of documents, so pulling them all down into memory at once is unfeasible. This means that ___we need to sort and paginate our data in the database___. See issue #1.

This leaves us with two options as application developers:

1. Change our application design to better fall in line with the restrictions MongoDB imposes upon us. For example, we could show two separate tables - one of documents we own sorted by name, and another of documents we don't own sorted by name.
2. ___Fight back!___

Let's choose option #2.

## Encoding Ownership In The Document

The fundamental problem that we're facing here is that ___everything we want to sort on needs to live on the document we're sorting___. This means that if we want to sort on ownership, ownership for each user needs to be encoded into each document. This can be a little mind-bending to consider.

At first, you may be thinking that ownership _is already encoded_ through the `ownerId`{:.language-javascript} field. Unfortunately, `ownerId`{:.language-javascript} only tells us the owner's ID, not whether the current user's ID matches that ID. We need to somehow store that calculation on the document to be able to use it in an actionable way.

One way to do this is to create a field on the document when it's created. ___The value of this field is the owner's ID.___ Within that field we store a simple object that holds an ownership flag:

<pre class="language-javascript"><code class="language-javascript">{
  …
  "XuwWcLue9zom8DqEA": {
    "owner": 1
  }
}
</code></pre>

This object can be inserted into each document automatically using a variety of hooking or data management techniques. Here's how you would implement it if you were using [`matb33:collection-hooks`{:.language-*}](https://github.com/matb33/meteor-collection-hooks):

<pre class="language-javascript"><code class="language-javascript">Documents.before.insert(function(userId, doc) {
  doc[userId] = {
    owner: 1
  };
  return doc;
});
</code></pre>

This seems a little unconventional, but it opens up the path to our goal: sorting by ownership. Check out how we would [construct our sorting query](http://docs.meteor.com/#/full/sortspecifiers):

<pre class="language-javascript"><code class="language-javascript">
var sort = [
  [this.userId + ".owner", -1],
  ["name", 1]
];

Documents.find({
  ...
}, {
  sort: sort,
  ...
});
</code></pre>

Using this query, all documents we own will be returned first, sorted by their name, followed by all documents we don't own, sorted by their name. Victory!

## Don't Pollute the Document

There is a downside to the above approach.

By encoding the ownership calculation into the document itself, ___we're polluting the document___. This new nested object has no real purpose, other than to get around a technical limitation, and in many ways is just a duplication of the information held by `ownerId`{:.language-javascript}.

A better solution would give us this same functionality without polluting the document. Thankfully, we can leverage the power of [MongoDB aggregations](https://docs.mongodb.org/manual/aggregation/) to accomplish just that.

Our aggregation will operate in two steps. The first step will be to calculate the ownership flag and add it to each document we're sorting. The second step is to sort our documents, first by this ownership flag and next by the document's name.

We'll use the [`$cond`{:.language-javascript} operator](https://docs.mongodb.org/manual/reference/operator/aggregation/cond/#exp._S_cond) to calculate a new `owned`{:.language-javascript} flag on each document by comparing the value of `ownerId`{:.language-javascript} to the current user's ID (which is passed into our aggregation). This calculated value is set on each returned document during the [projection stage](https://docs.mongodb.org/manual/reference/operator/aggregation/project/#pipe._S_project) of our aggregation pipeline. Check it out:

<pre class="language-javascript"><code class="language-javascript">Documents.aggregate([
    {
        $project: {
            owned: {$cond: [{$eq: ["$ownerId", this.userId]}, 1, 0]},
            name: "$name"
            ...
        }
    },
    {
        $sort: {
            owned: -1,
  name: 1
        }
    }
]);
</code></pre>

We're using Mongo's aggregation framework within our Meteor application using the [`meteorhacks:aggregation`{:.language-*}](https://github.com/meteorhacks/meteor-aggregate) package. Be sure to check out Josh Owen's great article about [using `meteorhacks:aggregation`{:.language-*} to power your publications](http://joshowens.me/using-mongodb-aggregations-to-power-a-meteor-js-publication/).

By building the `owned`{:.language-javascript} field on the fly in our aggregation, we get all of the benefits of encoding our ownership information into the document, with none of the downsides of permanently polluting the document with this information.

## Don't Let the Tool Use You

Every tool we use comes with a certain set of limitations and constraints. Sometimes these constraints exists for very good reasons, and trying to work around them can lead to very serious performance issues or security vulnerabilities. Other times, these constraints are just limitations of the technologies we're using, or limitations in our understanding.

Originally, we thought MongoDB was the problem. By exploring alternative solutions and building a deeper understanding of the tool, we realized that we could use MongoDB to solve the problem!

When you're facing limitations imposed by your tools, don't immediately concede. Always try to understand why the limitation exists, and how you can (or can't) overcome it.
