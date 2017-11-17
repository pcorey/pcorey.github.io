---
layout: post
title:  "Accounts is Everything Meteor Does Right"
description: "Meteor's Accounts system is one of Meteor's most killer features, and one of the reasons I find it difficult to leave the framework."
author: "Pete Corey"
date:   2016-10-03
tags: ["Javascript", "Meteor", "Authentication"]
---

When I first came to [Meteor](https://www.meteor.com/), I was [immediately amazed](/blog/2014/12/02/meteor-first-impressions/) by full-stack reactivity. After the novelty of being able to instantly see changes in my database on the client wore off, I started building applications.

Soon, I realized that Meteor had something special.

## Meteor’s Special Sauce

A big component of Meteor’s “special sauce” is the [Accounts system](https://guide.meteor.com/accounts.html). The powerful functionality and ease of use provided by the Accounts packages is a perfect example of what makes Meteor amazing.

Does your application need to authenticate users? No problem, just add `accounts-password`{:.language-javascript}, and include a pre-built template in your application:

<pre class='language-javascript'><code class='language-javascript'>
&#123;&#123;> loginButtons}}
</code></pre>

<img style="width: 30%; margin: 1em 0 1em 1em; float:right;" title="A customized Meteor sign-up page" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/exampleAuth.png">

While the default user interface might not win any design awards, the utility of the Accounts package goes above and beyond anything I’ve ever used in any other platform or framework.


Two simple steps take you from zero to sixty in terms of authentication. Once you’re cruising, you can add a variety of other packages to [customize the user experience](https://github.com/meteor-useraccounts/core/blob/master/Guide.md) or to incorporate things like [authorization](https://github.com/alanning/meteor-roles), [presence tracking](https://github.com/mizzao/meteor-user-status), [user management](https://github.com/yogiben/meteor-admin), etc…

## Being Opinionated

All of this is possible because Meteor takes an incredibly opinionated view of users and accounts. The Accounts package dictates with complete authority everything from how and where user documents will be stored, all the way through to the how the client will pass credentials up to the server.

All of this is decided and implemented in advance, and for the most part, set in stone. The Accounts package offers a few inroads for customization, but for the most part everything is fixed.

In nearly every scenario I’ve faced in the Real World™ this has been fine. I’ve rarely needed to go above and beyond the functionality provided by the Accounts package.

In the few instances where I did need more than the Accounts package provided, I simply forked the package and customized it to suite my needs.

## Phoenix In Comparison

Compare the process of setting up authentication in a Meteor application to the process of setting up authentication in our [Phoenix Todos application](https://github.com/pcorey/phoenix_todos).

<img style="width: 30%; float: right; margin: 1em;" title="Excerpt of Phoenix Todos authentication code" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/authCode.png">

In the literate commits series where we’re converting the [Meteor Todos](https://github.com/meteor/todos/tree/react/) application over the to an [Elixir](http://elixir-lang.org/)/[Phoenix](http://www.phoenixframework.org/) stack, it took four articles to fully set up our authentication system:

[Phoenix Todos - The User Model](/blog/2016/09/07/phoenix-todos-part-2/)<br/>
[Phoenix Todos - Back-end Authentication](/blog/2016/09/14/phoenix-todos-part-3/)<br/>
[Phoenix Todos - Transition to Redux](/blog/2016/09/21/phoenix-todos-part-4/)<br/>
[Phoenix Todos - Finishing Authentication](/blog/2016/09/28/phoenix-todos-part-5/)

During those four weeks, we manually set up every aspect of our authentication system from designing our user model, setting up our JWT signing procedure, writing back-end routes to handle authentication actions, through to wiring up the front-end to handle calling these routes and persisting the authenticated user client-side.

___This is a huge amount of work!___

That’s not to say that implementing these things yourself doesn’t come without its benefits. Complete control gives you complete freedom. However, exercising these freedoms can be exhausting.

## Final Thoughts

It’s important to remember that this kind of up-front work isn’t exclusive to using Phoenix. This has been my experience with every framework and platform I’ve used to date until I found Meteor.

Some frameworks try to ease some of the burden off of the developer, but none have managed to make my life as pleasant as Meteor.

Once I found Meteor, I immediately became accustomed to authentication being handled for me. Going back to manually implementing things that I want to “just work” feels like going back in time.

I’ve noticed that others feel the same way. When this developer talked about his experiences [migrating away from Meteor](https://remotebase.io/blog/rewriting-without-meteor/) he noted how he particularly missed Meteor’s robust accounts system.

Based on recent [rumblings in the community](https://forums.meteor.com/), Meteor has fallen on hard times. In times like these, it’s important to remember everything the framework does well and balance those with its weaknesses.
