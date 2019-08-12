---
layout: post
title:  "Firebase! - T.U.S.T.A.C.R. Part 2"
titleParts: ["Firebase!", "T.U.S.T.A.C.R. Part 2"]
excerpt: "Follow along as I build out the back-end of a URL shortener built using Firebase!"
author: "Pete Corey"
date:   2014-10-1
tags: ["Javascript", "Firebase", "Video"]
---

After building out the frontend for [thisurlshortenertotallyandcompletely.rocks](http://www.thisurlshortenertotallyandcompletely.rocks/), I was in need of a backend. I recently heard about [Firebase](https://www.firebase.com/), and figured it would be a perfect fit for this project. Check out a quick video overview and my rundown below:

<div style="position: relative; padding-bottom: 56.25%; padding-top: 25px; height: 0;">
    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="//www.youtube.com/embed/f08iapAx3y4" frameborder="0" allowfullscreen></iframe>
</div>

## Up And Running
I was blown away at how quickly I could get up and running with Firebase. With two lines of Javascript, I was persisting data to a server. I can’t find the words to describe how awesome this felt.

<pre><code class="language-javascript">var ref = new Firebase("&lt;endpoint&gt;");
ref.set({hello: 'world'});</code></pre>

## De-normalizing my Data
Most of my experience is with relational databases, not [MongoDB](http://www.mongodb.com/) style document stores or “NoSQL” databases. Because of that, my initial reaction is to see denormalized schemas as “wrong”. It took a good amount of time to convince myself that mirroring my data in two separate collections was the right way to go about things.

I played with the idea of somehow using Firebase priorities to get around this, but in the end I realized I couldn’t lookup data by URL and key without two separate collections. This is definitely just a mental shift that I need to get over when working with this style of database.

## WebSockets!
One of the coolest things I found while playing with Firebase was the use of [WebSockets](http://www.html5rocks.com/en/tutorials/websockets/basics/) to push events down to the client. I can see this being a huge deal when combined with something like [AngularJS](https://angularjs.org/) ([AngularFire](https://www.firebase.com/docs/web/libraries/angular/index.html)). Three way binding from the DOM all the way up to the database? Yes please!

I’ve been imagining something like a [CQRS](http://martinfowler.com/bliki/CQRS.html) style system where commands are implemented as explicit calls (maybe even traditional REST PUT/POST/DELETE requests?) to the server, but all of the querying is done using Firebase style WebSocket endpoints that can automatically listen for data changes. I’m still fleshing these ideas out, but I’ll definitely be thinking more about this kind of thing in the future.

## T.U.S.T.A.C.R

So that's it! [thisurlshortenertotallyandcompletely.rocks](http://www.thisurlshortenertotallyandcompletely.rocks/) is finished and live. Watch out bitly, there's a new sheriff in town!

Check out the project on [github](http://www.thisurlshortenertotallyandcompletely.rocks/?2)!
