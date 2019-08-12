---
layout: post
title:  "Mongo Text Search with Meteor"
titleParts: ["Mongo Text Search", "with Meteor"]
excerpt: "MongoDB text searches can offer significant performance boosts over simple regular expression based queries."
author: "Pete Corey"
date:   2015-01-26
tags: ["Javascript", "MongoDB", "Meteor"]
---

My most recent project, [Suffixer](http://www.suffixer.com/), involves doing a primarily text-based search over more than 80k documents. Initially, I was using [$regex](http://docs.mongodb.org/manual/reference/operator/query/regex/) to do all of my querying, but this approach was [unacceptably slow](https://www.youtube.com/watch?v=07So_lJQyqw). I decided to try out [MongoDB’s](http://www.mongodb.org/) [text search](http://docs.mongodb.org/manual/reference/operator/query/text/) functionality to see if I could get any performance gains.

I replaced my main query with something like this:

<pre class="language-javascript"><code class="language-javascript">MyCollection.find({$text: {$search: searchText}});
</code></pre>

Unfortunately, Meteor seemed very unhappy with this change. I immediately began setting errors in my server logs:

> Exception from sub ZskAqGy2t2jJckpXK MongoError: invalid operator: $search

A quick investigation showed what was wrong. Meteor uses Mongo 2.4, instead of 2.6. You can check this by running <code class="language-*">db.version()</code> in your Mongo shell (<code class="language-*">meteor mongo</code>). [Text search in 2.4](http://docs.mongodb.org/v2.4/tutorial/search-for-text/) is syntactically significatly different than [text search in 2.6](http://docs.mongodb.org/manual/reference/operator/query/text/).

If you insist on using Meteor’s bundled version of Mongo, this [Meteorpedia post](http://www.meteorpedia.com/read/Fulltext_search) shows how to manually kick off the search command in a reactive context.

A much better solution is to simply use your own instance of Mongo 2.6. Follow the available [installation guides](http://docs.mongodb.org/manual/installation/) to get an instance running on your machine (or remotely). Once Mongo is successfully installed, you can instruct Meteor to use this new instance of Mongo by pointing to it with the <code class="language-*">MONGO_URL</code> [environment variable](http://docs.meteor.com/#/full/deploying).

Using Mongo’s text search coupled with a text index drastically improved the performance of my web-app.
