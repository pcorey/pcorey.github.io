---
layout: post
title:  "The Missing Link In Meteor's Rate Limiter"
titleParts: ["The Missing Link In Meteor's", "Rate Limiter"]
excerpt: "It's possible to carry out a Denial of Service attack against a Meteor application by flooding it with subscriptions. Check out how you can protect yourself."
author: "Pete Corey"
date:   2016-05-16
tags: ["Javascript", "Meteor", "Security"]
---

{% capture correction %}
I was contacted on __February 25th, 2020__, by Ross Newton, who informed me that this article may no longer be correct or relevant.

> In the Meteor docs for [DDPRateLimiter](https://docs.meteor.com/api/methods.html#ddpratelimiter), they have updated it to now allow rules to be created on an actual connectionId. As I understand it, this would effectively solve the problem that your blog article is about. The fact that connections are not being rate limited.
{% endcapture %}

{% include correction.html content=correction %}

Meteor’s [`DDPRateLimiter`{:.language-javascript}](http://docs.meteor.com/#/full/ddpratelimiter) was released into Meteor in version 1.2 with surprisingly little fanfare. I say this is surprising because `DDPRateLimiter`{:.language-javascript} helps minimize one of the most prevalent risks found in nearly all Meteor applications: [Denial of Service attacks](https://www.owasp.org/index.php/Denial_of_Service).

By putting hard limits on the rate at which people can call your methods and subscribe to your publications, you prevent them from being able to overrun your server with these potentially expensive and time consuming requests.

Unfortunately, Meteor’s `DDPRateLimiter`{:.language-javascript} in its current form only partially solves the problem of easily DOS-able applications.

## Meteor's Rate Limiter

In [this forum post](https://forums.meteor.com/t/does-galaxy-provide-ddos-protection/14584), [Adam Brodzinski](https://forums.meteor.com/users/SkinnyGeek1010/activity), points out that the `"meteor.loginServiceConfiguration"`{:.language-javascript} publication within the core `accounts-base`{:.language-javascript} package is not being rate limited by default. He argues that this exposes a serious vulnerability to all Meteor applications using this package who haven’t taken extra precautions.

Without an established rate limit on this publication, any malicious user can potentially exploit it by making repeated subscriptions. These subscriptions flood the DDP queue and prevent other requests from being processed.

> The exploit allows you to turn any meteor app on and off like a light switch.

These types of method and publication-based Denial of Service attacks are fairly well documented, and they’re even [discussed in the Guide](http://guide.meteor.com/security.html#rate-limiting). Be sure to take a look if this kind of attack is new to you.

## A Chink In The Armor

The initial vagueness of Adam’s post intrigued me. I started digging deeper into how and when `DDPRateLimiter`{:.language-javascript} is used by Meteor core. My sleuthing payed off!

___I found a chink in the rate limiter’s armor.___

The `DDPRateLimiter`{:.language-javascript} is invoked on the server [whenever a subscription is made](https://github.com/meteor/meteor/blob/be986fd70926c9dd8eff6d8866205f236c8562c4/packages/ddp-server/livedata_server.js#L591-L613), and [whenever a method is called](https://github.com/meteor/meteor/blob/be986fd70926c9dd8eff6d8866205f236c8562c4/packages/ddp-server/livedata_server.js#L686-L705). These invocations are fairly simple. They increment either a `"subscription"`{:.language-javascript}, or `"method"`{:.language-javascript} counter and use these counters to check if the current rate of subscription or method calls exceeds any established limits. If the subscription/method exceeds a limit, an exception is thrown.

However, there’s a third type of DDP interaction that can be abused by malicious users: the DDP connection process itself.

Meteor users [SockJS](https://github.com/so/so-client) to handle its WebSocket connections. You’ll find the actual code that handles these connections in the [`ddp-server`{:.language-javascript} package](https://github.com/meteor/meteor/blob/be986fd70926c9dd8eff6d8866205f236c8562c4/packages/ddp-server/stream_server.js#L88-L109). The DDP server [extends this connection hooking functionality and registers callbacks](https://github.com/meteor/meteor/blob/be986fd70926c9dd8eff6d8866205f236c8562c4/packages/ddp-server/livedata_server.js#L1332-L1380) for handling DDP-specific WebSocket messages.

If you look closely at the `"connection"`{:.language-javascript} event handler, you’ll notice that it makes no attempt to rate limit the number of connection requests. 

In fact, the `DDPRateLimiter`{:.language-javascript} doesn’t even have a `"connection"`{:.language-javascript} type. This means that a single user can repeatedly spam a Meteor server with DDP/WebSocket connection requests, all of which will be happily accepted until the server runs out of resources and chokes.

___If abused, this can bring down a Meteor server in seconds.___

## Protecting Your Application

[Sikka](https://github.com/meteorhacks/sikka), like `DDPRateLimiter`{:.language-javascript}, is another Meteor package designed to enforce rate limiting. Unfortunately, Sikka also won’t help protect against this particular kind of attack.

Sikka works by [hooking into the `processMessage`{:.language-javascript} method](https://github.com/meteorhacks/sikka/blob/1bfcc280a2ba3c16c3f3e0b5fb1474d15a688dd5/lib/server/session_hooks.js#L4-L5) found in Meteor’s [livedata server](https://github.com/meteor/meteor/blob/be986fd70926c9dd8eff6d8866205f236c8562c4/packages/ddp-server/livedata_server.js#L495). Unfortunately, the `processMessage`{:.language-javascript} method is called after a WebSocket connection is established. From within this method, we have no way of preventing abusive connection requests.

<hr/>

As discussed, `DDPRateLimiter`{:.language-javascript} in its current form won’t prevent this type of Denial of Service attack.

Thinking out loud, one potential solution may be to modify Meteor core and add a third rate limiting type: `"connection"`{:.language-javascript}. This new rate limit type could be incremented and validation within each `"connection"`{:.language-javascript} event:

<pre class="language-javascript"><code class="language-javascript">self.server.on('connection', function (socket) {
  if (Package['ddp-rate-limiter']) {
    var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
    var rateLimiterInput = {
      type: "connection",
      connection: socket
    };

    DDPRateLimiter._increment(rateLimiterInput);
    var rateLimitResult = DDPRateLimiter._check(rateLimiterInput);
    if (!rateLimitResult.allowed) {
      return socket.end();
    }
  }
  ...
</code></pre>

If this technique works, extending the `DDPRateLimiter`{:.language-javascript} in this way would give Meteor developers the power and flexibility to establish connection rate limits that make sense for their own applications.

Maybe this kind of functionality could even be implemented as a Meteor package, if the `"connection"`{:.language-javascript} event listeners could be [correctly overridden](https://github.com/meteor/meteor/blob/be986fd70926c9dd8eff6d8866205f236c8562c4/packages/ddp-server/stream_server.js#L134-L138).

<hr/>

The surefire and recommended way of preventing this kind of attack is moving your Meteor application behind a proxy or load balancer like [NGINX](https://www.nginx.com/resources/wiki/) or [HAProxy](http://www.haproxy.org/). Implementing rate limiting using these tools is [fairly simple](https://lincolnloop.com/blog/rate-limiting-nginx/), and very effective.

Rate limiting on the network level means that abusively excessive requests to the `/websocket`{:.language-javascript} HTTP endpoint will fail, which stops the [WebSocket handshake process](https://en.wikipedia.org/wiki/WebSocket#WebSocket_protocol_handshake) dead in its tracks, killing the connection before it hits your Meteor server.

I highly recommend moving your Meteor applications behind some kind of proxy layer, rather than exposing them directly to the world.

## Final Thoughts

Denial of Service attacks in the Meteor world can be a scary thing to think about. The use of WebScokets and queue-based processing of DDP messages means that ___when they hit, they hit hard___.

Fortunately, with the proper precautions, naive Denial of Service attacks are totally avoidable! Be sure to always rate limit your methods and publications, and move your application behind a proxy that does the same.
