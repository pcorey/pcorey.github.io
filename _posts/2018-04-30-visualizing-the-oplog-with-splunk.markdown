---
layout: post
title:  "Visualizing the Oplog with Splunk"
description: "In an attempt to track down the cause of a mysterious spike in CPU consumption in a Meteor application, I decided to plot a time series chart of Mongo's Oplog collection."
author: "Pete Corey"
date:   2018-04-30
tags: ["Meteor", "Splunk"]
related: []
---

I recently found myself investigating a mysterious occurrence in a production Meteor application. Seemingly randomly, without any obvious connection to user activity or periodic job activity, our Meteor server would spike to one hundred precent CPU consumption and stay pegged there until it was restarted.

After investigating nearly every hunch I could come up with, I was left with very few courses of action. My final theory was that a massive influx of MongoDB operations were flooding into our database. Any concerned observers listening within our Meteor application would be overwhelmed trying to catch up with the changes and consume all available CPU cycles on the server.

In order to test this theory, I wanted to plot the MongoDB Oplog as a time series chart and compare it against the timeline of known CPU spikes, looking for any correlations.

I had many options for how to approach this problem, but I decided to use [Splunk](https://www.splunk.com/)  to visualize and explore the Oplog data. I'm very happy with how Splunk performed, and I can see myself using it again.

---- 

I was interested in all [Oplog events](https://docs.mongodb.com/manual/core/replica-set-oplog/) that happened in the twenty-four hour period surrounding a known CPU spike at 22:55 UTC on April 23rd, 2018. I fired up [Studio 3T](https://studio3t.com/) and ran the following query against the `oplog.rs`{:.language-*} collection of my MongoDB database:

<pre class='language-javascript'><code class='language-javascript'>
db['oplog.rs'].find({
  $and: [
    {ts: {$gte: new Timestamp(1524480600,1)}},
    {ts: {$lte: new Timestamp(1524567000,1)}}
  ]
});
</code></pre>

The above query returned over seven hundred fifty thousand results, which I was able to export into a JSON file using Studio 3T (Studio 3T is the only MongoDB client I've found that supports saving an entire set of query results to file).

---- 

Once those seven hundred fifty thousand Oplog events were exported to disk, I was able to upload them directly into a Splunk index. Splunk gracefully parsed the JSON data and flattened each object into a neatly searchable collection.

With the data available in Splunk, I was free to start exploring.

My first step was to plot a time chart of all of the Oplog events. Given the large amount of data I was working with, I decided to bin my events into five minute bands:

<pre class='language-*'><code class='language-*'>index="oplog"
| timechart span=5m count
</code></pre>

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/visualizing-the-oplog-with-splunk/1.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">An overview of our data.</p>
</div>

Interestingly, an obvious dip in Oplog events occurred around the time of the observed CPU spike. This is the exact opposite of what I expected to see given my working hypothesis.

<div style="width: 50%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/visualizing-the-oplog-with-splunk/2.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Zooming in on the dip.</p>
</div>

Investigating further, I decided to plot a time series for every type of Oplog event, based on the `op`{:.language-*} field:

<pre class='language-*'><code class='language-*'>index="oplog"
| timechart span=1m count by op
</code></pre>

To improve clarity, I also focused on a narrower time range, reduced my bin size, and switched to a log scale Y axis.

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/visualizing-the-oplog-with-splunk/3.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Everything working as intended.</p>
</div>

This new chart shows that insert (`i`{:.language-*}) and update (`u`{:.language-*}) operations completely stop during the dip, but no-op (`n`{:.language-*}) operations continue as usual. This seemed to indicate that the database was healthy, but the Meteor application stopped making insert and update requests.

This makes sense. If our server was eating up available CPU cycles, it probably wouldn't find the time to query the database.

---- 

After visualizing the Oplog events around several of these CPU spikes, it became painfully obvious that my working hypothesis was not correct. There wasn't any influx of database operations prior to a spike, and any dips in database activity were easily attributable to server restarts.

So now we're back to square one. Was all of this for nothing?

Absolutely not!

When you're investigating a problem, proving that something is _not_ the cause of the problem can be incredibly valuable. By repeatedly narrowing down the possible set of culprits, we simplify the problem in our minds and make the real cause that much easier to find.

---- 

After spending more time digging into this issue, I'm convinced that it's related to ["fork bombs"](https://sandstorm.io/news/2016-09-30-fiber-bomb-debugging-story) crippling the server, and discussed in [this issue](https://github.com/meteor/meteor/issues/9796) filed against the Meteor project.

That said, this exploration proved to be incredibly valuable. By proving to myself that obverserver overload was not the cause of the spikes, I was able to rule out a huge swatch of potential fixes.

I was also able to spend some time trying out a fantastic new tool. I'm sure I'll find myself using Splunk again in the future.
