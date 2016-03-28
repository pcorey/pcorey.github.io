---
layout: post
title:  "Bypassing Package-Based Basic Auth"
titleParts: ["Bypassing Package-Based", "Basic Auth"]
date:   2016-03-28
tags: ["security"]
---

In a previous post, I talked about using [Basic Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basic_access_authentication) to [hide your Meteor application from prying eyes](http://blog.east5th.co/2015/07/06/basic-auth-for-hiding-your-application/). Unfortunately, the most straight-forward way of implementing this kind of protection has its flaws.

To see those flaws, let’s imagine that we’ve set up a basic [Meteor](https://www.meteor.com/) application with the `kit:basic-auth`{:.language-javascript} package and a Meteor method:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  foo: function() {
    return "bar";
  }
});
</code></pre>

When we try to navigate to the application (`http://localhost:3000/`{:.language-javascript}), we notice that we can’t access the application without valid credentials. Great!

## Bypassing Basic Auth

However, [Jesse Rosenberger](https://github.com/abernix) recently pointed out that `kit:basic-auth`{:.language-javascript}, and similar packages such as `jabbslad:basic-auth`{:.language-javascript}, do not provide Basic Auth protection for [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) connections. This means that any external user can easily bypass this authentication mechanism and access your Meteor methods and publications.

For example, an external user could connect directly to your application using Meteor’s [DDP API](http://docs.meteor.com/#/full/ddp_connect) and call your `"foo"`{:.language-javascript} method:

<pre class="language-javascript"><code class="language-javascript">var connection = DDP.connect("http://localhost:3000/");
connection.call("foo", function(err, res) {
  console.log(res);
});
</code></pre>

Any unauthorized user that runs the above code will receive a result of `"bar"`{:.language-javascript} from the `"foo"`{:.language-javascript} method.

This is a bad thing.

## Calling In the Dark

While the DDP API gives users access to all of your Meteor methods and publications, ___it doesn’t reveal those methods and publications___. In order to call a method or subscribe to a publication, a user needs to know its name.

However, this kind of [security through obscurity](https://en.wikipedia.org/wiki/Security_through_obscurity) shouldn’t be considered any real protection. An attacker eager to discover your DDP endpoints could build a [brute forcer](https://en.wikipedia.org/wiki/Brute-force_attack) that guesses method and publication names in an attempt to uncover your endpoints.

## A Better Basic Auth

At first glance, the `kit:basic-auth`{:.language-javascript} and `jabbslad:basic-auth`{:.language-javascript} packages seem to be doing all the right things. They're injecting the Basic Auth check as a piece of [connect middleware](https://github.com/senchalabs/connect) at the [head of the stack](https://github.com/cwaring/meteor-basic-auth/blob/master/kit:basic-auth.js#L10-L12) which, in theory, should catch all HTTP traffic and verify the user's credentials.

Unfortunately, the Meteor framework establishes the socket connection long before any of these middleware methods are called. This means that Basic Auth is ignored during the WebSocket handshake and upgrade process.

One possible technique for overcoming this middleware issue is to “overshadow” all `"request"`{:.language-javascript} and `"upgrade"`{:.language-javascript} listeners and inject our Basic Auth check there. The Meteor framework [does this exact thing](https://github.com/meteor/meteor/blob/master/packages/ddp-server/stream_server.js#L134-L162) to support raw WebSocket connections.

However, a more straightforward approach to this problem may be to move your application behind a proxy such as [HAProxy](http://www.haproxy.org/), or [NGINX](https://www.nginx.com/) and implement Basic Auth at that level. The proxy would protect all assets and endpoints, including the `/sockjs/.../websocket`{:.language-http} endpoint, which is used to establish a WebSocket connection with the server.

## Final Thoughts & Thanks

I'd like to give a massive thanks to [Jesse Rosenberger](https://github.com/abernix) who pointed out this issue to me, and gave me a huge amount of very helpful information and observations.

I'd also like to apologize to anyone hiding applications behind a package-based Basic Auth guard based on my advice. I've updated my [previous post](http://blog.east5th.co/2015/07/06/basic-auth-for-hiding-your-application/) on this subject to reflect what I've learned and pointed out the current shortcomings of this package-based approach.
