---
layout: post
title:  "Check-Checker Checks Your Checks"
titleParts: ["Check-Checker", "Checks Your Checks"]
excerpt: "Check-Checker is a package that looks for missing or incomplete calls to 'check' in your Meteor methods and publications. It's a powerful tool in the fight against NoSQL Injection."
author: "Pete Corey"
date:   2015-07-27
tags: ["Javascript", "Meteor", "Security", "NoSQL Injection", "Announcement"]
---

I’ve been shouting about why you should [check](http://docs.meteor.com/#/full/check) all of the user provided arguments in your [Meteor](https://www.meteor.com/) applications for months now. Working with unchecked arguments can lead to [a variety](http://blog.east5th.co/2015/07/21/exploiting-findone-to-aggregate-collection-data/) [of serious](http://blog.east5th.co/2015/06/15/allow-and-deny-challenge-check-yourself/) [security issues](http://blog.east5th.co/2015/04/06/nosql-injection-or-always-check-your-arguments/) in your application.

But still, I find myself coming into [client projects](http://www.east5th.co/) and [security assessments](http://assess.east5th.co/) where I see developers forgetting to <code class="language-*">check</code> their arguments!

<hr/>

The [audit-argument-checks](http://blog.pahan.me/using-meteor-audit-argument-checks/) is a great package designed to get people to check all of their method and publication arguments. Unfortunately, it has its shortcomings.

<code class="language-*">audit-argument-checks</code> will only tell you that you’re missing check coverage for a method or publication _at runtime_, when that method or publication is called. The package politely informs you of this missing coverage by throwing an exception and killing the current method or publication.

What’s worse, <code class="language-*">audit-argument-checks</code> is not a <code class="language-*">debugOnly</code> package, so these exceptions will continue to be thrown in production releases, potentially breaking your application (arguably for good reason).

<hr/>

Wouldn’t it be great if we could get a report of missing checks at startup, rather than through exceptions at runtime? Now you can! Check out my newly released [east5th:check-checker](https://github.com/East5th/check-checker) package.

> meteor add east5th:check-checker

<code class="language-*">check-checker</code> was born of my need to quickly get informed about the state of argument checking in an application during a [security assessment](http://assess.east5th.co/). It’s built on top of [ESLint](http://eslint.org/), and uses static analysis techniques to find all method and publication declarations in a Meteor application. If <code class="language-*">check</code> is not called on a method or publication argument within the body of the handler, a warning is shown in the server logs.

Imagine you have a file in your Meteor project, <code class="language-*">example.js</code>, that contains method and publication declarations with unchecked arguments:

<pre class="language-javascript"><code class="language-javascript">if (Meteor.isServer) {
  Meteor.methods({
    foo: function(bar) {
      return MyCollection.find();
    }
  });

  Meteor.publish({
    test: function(rab, oof) {
      SensitiveDocuments.update(rab, oof);
    }
  });
}
</code></pre>

After adding <code class="language-*">check-checker</code>, you'll see the following warning in your server logs after the application starts:

<pre class="language-*"><code class="language-*">/example.js:
   Method 'foo' has an unchecked argument: bar
   Publication 'baz' has an unchecked argument: rab
   Publication 'baz' has an unchecked argument: oof
</code></pre>

<hr/>

The goal of <code class="language-*">check-checker</code> is to make it easier for developers to _quickly_ find where they're lacking check coverage. The faster you can find the chinks in your armor, the faster you can secure your application.


