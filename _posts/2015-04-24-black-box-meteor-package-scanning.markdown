---
layout: post
title:  "Black Box Meteor - Package Scanning"
date:   2015-04-24
categories:
---

An interesting side effect of [Meteor’s](http://www.meteor.com/) packing system is that all packages used in a project are visible to the client. Open up a browser and take a look at the global <code class="language-javascript">Package</code> object:

<pre class="language-javascript"><code class="language-javascript">Object.keys(Package);
</code></pre>

For a simple project, you may see results like this:

<pre class="language-javascript"><code class="language-javascript">["underscore", "meteor", "json", "base64", "ejson", "logging", "reload", "tracker", "random", "retry", "check", "id-map", "ordered-dict", "geojson-utils", "minimongo", "ddp", "insecure", "mongo", "autoupdate", "meteor-platform", "autopublish", "webapp", "deps", "reactive-dict", "session", "livedata", "jquery", "htmljs", "observe-sequence", "reactive-var", "blaze", "ui", "templating", "spacebars", "launch-screen"]
</code></pre>

So what are the consequences of this? Immediately, we see that this application is using [autopublish](https://github.com/meteor/meteor/tree/devel/packages/autopublish) and [insecure](https://github.com/meteor/meteor/tree/devel/packages/insecure). A malicious user could quickly couple a search for autopublish or insecure with a search for any globally defined [Collections](http://docs.meteor.com/#/full/mongo_collection):

<pre class="language-javascript"><code class="language-javascript">Object.keys(window).filter(function(key) {
    return window[key] instanceof Meteor.Collection;
});
</code></pre>

Or just directly look through the [Mongo](http://www.mongodb.com/) collections published to the client:

<pre class="language-javascript"><code class="language-javascript">Meteor.connection._mongo_livedata_collections
</code></pre>

In a fraction of a second, a malicious user can see if your application is [overpublishing, or vulnerable to arbitrary Mongo modifications](http://docs.meteor.com/#/full/dataandsecurity) through the autopublish and insecure packages.

But what about other packages? What if a malicious user is aware of a vulnerability in an existing Meteor package. Using the <code class="language-javascript">Package</code> object on the client, that user can quickly check to see if an application is making use of that package, and is therefore vulnerable.

One sidenote is that the <code class="language-javascript">Package</code> object does not include the version of the package being used. If a malicious users knows that a vulnerability exists in some version of a package but not in other versions, they would not immediately know if your application were vulnerable to their exploit.

So what can you do to protect your application? First, in nearly all cases your production application should not being using autopublish or insecure. Remove those packages. After that, always be sure to keep your packages updated to ensure that you're not shipping code that may contain known flaws or vulnerabilities.