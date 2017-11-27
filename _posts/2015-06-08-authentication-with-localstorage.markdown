---
layout: post
title:  "Authentication with localStorage"
titleParts: ["Authentication With", "localStorage"]
description: "Authentication through localStorage has the handy property of being CSRF-proof. Find out what that means and why it matters in this article!"
author: "Pete Corey"
date:   2015-06-08
tags: ["Javascript", "Meteor", "Security"]
---

Unlike most modern web frameworks, [Meteor](https://www.meteor.com/) doesn’t make use of [cookies](https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Cookies). Instead, it uses the relatively new [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage) functionality found in modern browsers. This design decision essentially makes Meteor immune to [Cross Site Request Forgery (CSRF)](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_%28CSRF%29) attacks, and opens the door to exciting new authentication features not previously possible with cookies.

## CSRF Proof

If Meteor were to use cookies for authentication, it would have to be done during the [WebSocket handshake](http://en.wikipedia.org/wiki/WebSocket#WebSocket_protocol_handshake). The handshake is the first and only HTTP request Meteor applications make to the server and is therefore the only place to pass session cookies to the server. However, without some kind of added protection, authentication at this point would expose our Meteor applications to a particularly nasty variant of CSRF dubbed [Cross Site WebSocket Hijacking](https://www.christian-schneider.net/CrossSiteWebSocketHijacking.html), or CSWSH. 

In this scenario, CSWSH could occur if a user authenticated with our application visited a malicious website that attempted to establish a DDP connection to our Meteor application:

<pre class="language-javascript"><code class="language-javascript">var ddp = DDP.connect(‘http://our-application.io’);
ddp.subscribe(...);
ddp.call(...);
</code></pre>

<code class="language-javascript">DDP.connect</code> makes a <code class="language-*">GET</code> request to our application’s WebSocket endpoint, passing along our session cookie. The <code class="language-*">GET</code> request returns with a <code class="language-*">101 Switching Protocols</code> response and the WebSocket is established. WebSocket connections aren’t protected by modern browsers' [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), so the browser happily establishes the DDP connection. The malicious site is now free to view, modify, and delete all of your user’s data without their knowledge or consent. Uh oh!

## localStorage To The Rescue

Rather than using cookies and implementing [complicated countermeasures](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_%28CSRF%29_Prevention_Cheat_Sheet) against CSRF attacks, Meteor opts for a more elegant solution and stores session tokens in <code class="language-javascript">localStorage</code>. <code class="language-javascript">localStorage</code>, unlike cookie data, is accessed via JavaScript and is __only__ accessible by the domain it belongs to. Unlike cookies, they are not sent along with HTTP requests. This means there is no chance of a third party website directly or indirectly accessing and using our users’ session tokens.

## Reactive Authentication

Using <code class="language-javascript">localStorage</code> as our authentication mechanism also lets us do cool things like reactive authentication. Imagine a user with your web application loaded on two different tabs. If that user were to log in to your application on one tab, they would instantly be logged in on the other tab. Similarly, logging out of the application in one tab also logs the user out in the second tab. Meteor accomplishes this by listening for [storage events](https://developer.mozilla.org/en-US/docs/Web/Events/storage) and reactively updating the client’s authentication state. These storage events also open the door for more exciting authentication functionality, like [sharing authentication state across multiple applications](https://github.com/AdmitHub/meteor-shared-auth).
