---
layout: post
title:  "DOS Your Meteor Application With Where"
titleParts: ["DOS Your Meteor Application", "With Where"]
description: "MongoDB's 'where' operator can be used by malicious users to wreak serious havok on your database. Learn to protect yourself."
author: "Pete Corey"
date:   2015-08-10
tags: ["Javascript", "Meteor", "Security", "NoSQL Injection"]
---

If you’ve read my previous posts, you’ll know that [I talk](http://blog.east5th.co/2015/07/14/why-is-rename-disallowed/) [quite a bit](http://blog.east5th.co/2015/07/21/exploiting-findone-to-aggregate-collection-data/) [about the dangers](http://blog.east5th.co/2015/06/15/allow-and-deny-challenge-check-yourself/) of [not checking](http://blog.east5th.co/2015/05/05/meteor-security-in-the-wild/) your method and publication arguments. These posts usually boil down to the dangers of letting users pass arbitrary data into your collection query objects. These types of vulnerabilities usually take the form of data leakage, or unauthorized data modifications (which are very serious issues), but it's also possible to completely hang an application with a well-crafted query.

Let’s dig into an example to see how this can happen and what we can do to prevent it!

## The Setup

Let’s pretend that you’re building a [Meteor](https://www.meteor.com/) application. Within this application you have a very simple method called <code class="language-javascript">grabData</code>. It expects you to pass in an ID, and it will return the corresponding item from the <code class="language-javascript">Data</code> collection:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  grabData: function(id) {
    return Data.findOne(id);
  }
});
</code></pre>

Awesome, our method works! Now imagine what would happen if a malicious user ran the following method call in their browser console:

<pre class="language-javascript"><code class="language-javascript">Meteor.call('grabData', {$where: "d = new Date; do {c = new Date;} while (c - d < 10000);"});
</code></pre>

Uh oh… What is this [$where operator](http://docs.mongodb.org/manual/reference/operator/query/where/)? _What’s all this <code class="language-javascript">Date</code> and looping business?_ ___And why is my app completely unresponsive?___

## The Exploit

The <code class="language-javascript">$where</code> operator will execute any valid Javascript string on each element in the collection over which you're running your query. It's intended use is to run complicated queries that may carry out some business logic on a document before deciding whether to include it in the result set. Unfortunately, <code class="language-javascript">$where</code> will execute __any__ Javascript passed into it - including Javascript designed to loop forever.

We were expecting the client to pass an ID into <code class="language-javascript">grabData</code>, but our malicious user decided to get more creative. They passed in a [selector object](http://docs.meteor.com/#/full/selectors) with a <code class="language-javascript">$where</code> operator designed to spin your Mongo instance’s CPU at 100% for 10 seconds. By pegging the CPU of your Mongo instance (which may or may not be the same CPU used by your Meteor application), the malicious user has essentially [DOS’d your application](https://www.owasp.org/index.php/Denial_of_Service).

Check out a quick demonstration:

<video width="100%" src="/webm/dosme.webm" controls></video>

This is a particularly nasty vulnerability. In this case, our malicious user was kind enough to free the CPU after 10 seconds. In the real world, an attacker may peg your CPU indefinitely, forcing you to restart your Mongo instance.

## The Fix

So how do we avoid this type of ["NoSQL injection"](https://www.owasp.org/index.php/Testing_for_NoSQL_injection)? Wherever possible, don’t trust user input, and definitely don’t pass it directly into a collection query. Always [check](http://docs.meteor.com/#/full/check) that your user arguments match your expectations, and be especially careful when using the <code class="language-javascript">$where</code> operator.

A simple fix to our <code class="language-javascript">grabData</code> method may look like this:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  grabData: function(id) {
    check(id, String);
    return Data.findOne(id);
  }
});
</code></pre>

You can use my new package, [east5th:check-checker](https://github.com/East5th/check-checker) to see if you have any unchecked arguments in your application’s publications and methods.
