---
layout: post
title:  "NoSQL Injection - Or, Always Check Your Arguments!"
date:   2015-04-06
categories:
---

Since [Meteor](https://www.meteor.com/) only supports the [fantastic](http://en.wikipedia.org/wiki/Stockholm_syndrome) [MongoDB](http://www.mongodb.com/), we no longer have to worry about the ever present threat of [SQL injection](https://www.owasp.org/index.php/SQL_Injection). Gone are the days of query parameters and ORMs. Right? Wrong!

While not as well-known or potentially as dangerous as SQL injection, as MongoDB developers, we still need to be ever vigilant against [NoSQL injection](https://www.owasp.org/index.php/Testing_for_NoSQL_injection).

SQL injection usually occurs when SQL query strings are constructed by concatenating or directly inserting unescaped user input into the query. This gives the malicious user (mostly) free reign to modify the command however they see fit, or potentially run additional commands against your database.

MongoDB queries take the form of [JSON/BSON](http://www.mongodb.com/json-and-bson) objects, not strings. We should be safe from injection, right? To an extent, yes. But let's take a look at a very simple example. Suppose we have a Meteor publication that takes an argument and passes that argument through to a Collection query:

<pre class="language-javascript"><code class="language-javascript">Meteor.publish('injectMe', function(foo) {
    return SensitiveDocuments.find({
        foo: foo
    });
});
</code></pre>

Let's say the client subscribes to this publication and passes in some piece of user information (<code class="language-*">foo</code>). Ideally, only the sensitive documents related to that user's <code class="language-*">foo</code> will be returned by the subscription.

In this case, <code class="language-*">foo</code> is intended to be a string. But what happens if a malicious client opens their browser console and makes this subscription:

<pre class="language-javascript"><code class="language-javascript">Meteor.subscribe('injectMe', {$gte: ''});
</code></pre>

Suddenly, all of the sensitive documents for every user will be served to the malicious user. All of the sensitive documents in the database will have a value of <code class="language-*">foo</code> that is ordinally [greater than or equal to](http://docs.mongodb.org/manual/reference/operator/query/gte/) an empty string.

To guard against this, always [check](http://docs.meteor.com/#/full/check_package) each of your arguments. To ensure that every argument sent to your methods and publications is being checked, you can add the [audit-argument-checks](https://github.com/meteor/meteor/tree/devel/packages/audit-argument-checks) package to your project:

<pre class="language-bash"><code class="language-bash">meteor add audit-argument-checks
</code></pre>

While the consequences of this aren't nearly as [far reaching](http://security.stackexchange.com/questions/6919/levraging-a-shell-from-sql-injection) as those of SQL injection, it's still something to be aware of when you're developing your Meteor publications and methods.
