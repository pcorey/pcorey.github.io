---
layout: post
title:  "Meteor and Mongod.lock"
titleParts:  ["Meteor and", "Mongod.lock"]
excerpt: "Crashing Meteor applications can sometimes wreak havok on your MongoDB lock file. Learn how to fix that problem in this article."
author: "Pete Corey"
date:   2015-02-16
tags: ["Meteor", "MongoDB"]
---

When [Mongo](http://www.mongodb.com/) closes incorrectly, (due to things like crashes, hard reboots, etc...), it leaves behind a non-zero byte <code class="language-bash">mongod.lock</code> file. The presence of this file indicates that Mongo wasn’t cleaned up correctly and will prevent Mongo from starting normally.

In a [Meteor](https://www.meteor.com/) project, <code class="language-bash">meteor</code> will fail with the following messages if it detects that Mongo was not correctly shut down:

<pre class="language-*"><code class="language-*">=> Started proxy.
Unexpected mongo exit code 100. Restarting.
Unexpected mongo exit code 100. Restarting.
Unexpected mongo exit code 100. Restarting.
Can't start Mongo server.
MongoDB had an unspecified uncaught exception.
This can be caused by MongoDB being unable to write to a local database.
Check that you have permissions to write to .meteor/local. MongoDB does
not support filesystems like NFS that do not allow file locking.
</code></pre>

To fix this, two things need to happen. First, remove the lock file:

<pre class="language-bash"><code class="language-bash">% rm .meteor/local/db/mongod.lock
</code></pre>

Not that the lock file is deleted, Meteor should start without any complaints from Mongo. To be safe, Mongo’s repair routine should be run on your Meteor database. Normally, this is done using a <code class="language-bash">mongod</code> command (<code class="language-bash">mongod --repair</code>), but since Meteor doesn’t use <code class="language-bash">mongod</code>, we need to kick off the repair from within the Mongo shell:

<pre class="language-bash"><code class="language-bash">% meteor mongo
> db.repairDatabase()
{ “ok” : 1}
</code></pre>

That’s it! You can read more about how to [recover data after an unexpected shutdown](http://docs.mongodb.org/manual/tutorial/recover-data-following-unexpected-shutdown/) in the Mongo docs.
