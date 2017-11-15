---
layout: post
title:  "NoSQL Injection in Kadira"
description: "I discovered and disclosed a NoSQL Injection vulnerability in the open-sourced Kadira project. Let's disect it and see how it could have been prevented."
author: "Pete Corey"
date:   2017-05-22
tags: ["Inject Detect", "NoSQL Injection", "Meteor", "MongoDB", "Security"]
---

Not long ago, the Meteor Development Group purchased [Kadira](https://kadira.io/) after the Kadira team announced it would be shutting down. Shortly after, MDG open sourced the entire project [on Github](https://github.com/kadira-open/kadira-server). 🎉

Being the curious developer that I am, I decided to sleuth through Kadira’s source looking for trouble.

I found several security issues which I reported to Meteor’s security team and were promptly fixed. Of those issues, the most notable was a [NoSQL Injection vulnerability](http://www.east5th.co/blog/2016/10/24/a-five-minute-introduction-to-nosql-injection/) in Kadira’s user-facing [`kadira-ui`{:.language-javascript} Meteor application](https://github.com/kadira-open/kadira-server/tree/master/kadira-ui).

Let’s dive into the vulnerability and take a look at why it exists, how it could have been exploited, and how to prevent it.

## Finding the Vulnerability

The best way to hit the ground running when looking for NoSQL Injection vulnerabilities in a Meteor application is to grep for calls to `Meteor.methods`{:.language-javascript}, or `Meteor.publish`{:.language-javascript}. This gives you a very quick idea of the entry points available to you as a user (or an attacker).

After finding all methods and publications, your next step is to peruse through every argument being passed into each method and publication and make sure that they’re being [thoroughly checked](http://www.east5th.co/blog/2015/08/31/incomplete-argument-checks/).

In the [`kadira-ui`{:.language-javascript} project](https://github.com/kadira-open/kadira-server/tree/master/kadira-ui), I managed to find a Meteor method that wasn’t thoroughly checking its arguments. The `"alerts.create"`{:.language-javascript} method was checking that the `alertInfo`{:.language-javascript} argument matched `Match.Any`{:.language-javascript}. Unfortunately, checking that an argument matches `Match.Any`{:.language-javascript} is roughly equivalent to not checking it at all.

This is looking promising.

Tracing out the path of this method showed that `alertInfo`{:.language-javascript} is passed into a function called `setAppName`{:.language-javascript}. An `appId`{:.language-javascript} field is pulled out of the `alertInfo`{:.language-javascript} object and is ultimately passed directly into a MongoDB query:

<pre class='language-javascript'><code class='language-javascript'>
var appId = alertsInfo.meta.appId;
var app = Apps.findOne(appId);
</code></pre>

Passing an unchecked argument into a MongoDB query is the perfect recipe for a NoSQL Injection vulnerability.

## Exploiting the Vulnerability

Because we, as intrepid explorers/malicious attackers, have complete control over the data passed into the `Apps.findOne`{:.language-javascript} query, we’re presented with a few different choices in how we could exploit this vulnerability.

We could try to target a random application in the database by passing in a special MongoDB query operator when calling `"alerts.create"`{:.language-javascript} from the client, like `{_id: {$gte: ""}}`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
Meteor.call("alerts.create", { meta: { appId: { _id: {$gte: ""} } } });
</code></pre>

Or we could try something more impactful.

Because we have control over the _entire query_, we can pass in a [`$where`{:.language-javascript} query operator](https://docs.mongodb.com/manual/reference/operator/query/where/). The `$where`{:.language-javascript} query operator is special in that it lets us pass in and execute raw Javascript in the MongoDB database process.

We can use this to our advantage to initiate a Denial of Service attack against the database and the Meteor application itself:

<pre class='language-javascript'><code class='language-javascript'>
Meteor.call("alerts.create", {
    meta:{
        appId:{
            $where: "d = new Date; do {c = new Date;} while (c - d < 100000);"
        }
    }
});
</code></pre>

In this example, we’re providing a query that will run a tight, unyielding loop for one hundred seconds per document in the `Apps`{:.language-javascript} collection. It’s important to realize that this one hundred second time limit can be extended indefinitely or removed altogether.

We’ve essentially thrown the database into an infinite loop.

Pegging the CPU of the MongoDB host in this way drastically reduces the availability of the database and in many situations renders the Meteor application completely unusable.

With a single query, we’ve taken down the entire application.

Read more about [the dangers of the `$where`{:.language-javascript} query](http://www.east5th.co/blog/2015/08/10/dos-your-meteor-application-with-where/), and watch me exploit a similar vulnerability in my [“NoSQL Injection in Modern Web Applications”](http://www.east5th.co/blog/2016/03/21/nosql-injection-in-modern-web-applications/) talk given at CraterConf!

## Fixing the Vulnerability

The fix for this specific instance of NoSQL Injection is to more thoroughly check the `alertsInfo`{:.language-javascript} argument passed into the `"alerts.create"`{:.language-javascript} method.

We’re expecting `appId`{:.language-javascript} to be a `String`{:.language-javascript}, so let’s check that it is:

<pre class='language-javascript'><code class='language-javascript'>
check(alertInfo, Match.ObjectIncluding({
    meta: Match.ObjectIncluding({
        appId: String
    })
}));
</code></pre>

If a malicious user provides anything other than a `String`{:.language-javascript} (like a `{$where: ...}`{:.language-javascript} query operator) in the `appId`{:.language-javascript} field, our method will throw an exception.

Ideally, it would be better to fully flesh out the expected schema of `alertInfo`{:.language-javascript} and avoid using `Match.ObjectIncluding`{:.language-javascript}, but I’m not familiar enough with the application to make that change. In your application, you should check _every field_ of _every argument_ down to its primitive fields.

This change is enough to prevent a NoSQL Injection attack through the `alertInfo.meta.appId`{:.language-javascript} field.

Even though Meteor isn’t actively maintaining their open sourced version of Kadira, [I submitted a pull request to the project](https://github.com/kadira-open/kadira-server/pull/1) for posterity and to warn future users of the vulnerability.

## Thanks to the Meteor Team

I’d like to give a huge shout out to the Meteor team for their speedy and professional response to this situation.

Nick Martin responded to my report within ten minutes and confirmed and patched my findings in their internal version of Kadira within twenty four hours.

Not only that, but they sent me a killer collection of swag!

<img width="100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/meteor-swag.png">

I’d also like to thank MDG for swooping in during a time of crisis within the community, purchasing the Kadira platform, and open sourcing the entire product to the world. That act should be seen as no small gift to the Meteor community.

## Inject Detect

If you’ve been following along for the past few months, you’ll know that [I’m deep into the development](http://www.east5th.co/blog/2017/05/01/inject-detect-progress-report/) of my security-focused project, [Inject Detect](http://www.injectdetect.com/).

[Inject Detect](http://www.injectdetect.com/) is being developed to fight the exact problem I laid out in this article: NoSQL Injection. NoSQL Injection is an incredibly prevalent vulnerability in Meteor applications, and I’ve been fighting a war against it [for years now](https://github.com/East5th/check-checker).

[Inject Detect](http://www.injectdetect.com/) is my newest and most powerful weapon to combat the threat of NoSQL Injection.

While [Inject Detect](http://www.injectdetect.com/) is still under development, I’m fast approaching a releasable version. Be sure to [sign up for the Inject Detect newsletter](http://www.injectdetect.com/#sign-up) to stay up to date on its upcoming release!
