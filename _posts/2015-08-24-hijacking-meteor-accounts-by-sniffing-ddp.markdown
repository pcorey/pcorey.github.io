---
layout: post
title:  "Hijacking Meteor Accounts by Sniffing DDP"
titleParts: ["Hijacking Meteor Accounts", "By Sniffing DDP"]
description: "Meteor accounts can be hijacked by an attacker listening for your credentials as they fly across the wire. Find out how to protect your application."
author: "Pete Corey"
date:   2015-08-23
tags: ["Javascript", "Meteor", "Security"]
---

You’re in your neighborhood Starbucks scarfing down an Everything With Cheese Bagel while browsing the web, and you decide to visit your favorite [Meteor](https://www.meteor.com/) application. You go to the website, type in your authentication credentials, and hit “Log In”, paying no mind that the application is running over <code class="language-*">http</code>, not <code class="language-*">https</code>.

Unbeknownst to you, sitting in a dimly lit corner closest to the restrooms, someone is [sniffing the public wifi](https://www.wireshark.org/). As you hit “Log In”, they see your authentication credentials fly across the wire.

<img src="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/wireshark2.png" style="max-width: 100%;">

In its raw form, a login attempt over [DDP](https://www.meteor.com/ddp) using the <code class="language-*">account-password</code> package looks like this:

<pre class="language-javascript"><code class="language-javascript">["{\"msg\":\"method\",\"method\":\"login\",\"params\":[{\"user\":{\"email\":\"joe@schmoe.com\"},\"password\":{\"digest\":\"5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8\",\"algorithm\":\"sha-256\"}}],\"id\":\"9\"}"]
</code></pre>

The attacker sees the website you’re connected to, your email address and a hash of the password you provided. Now that he has all of this information, hijacking your account is as simple as navigating to the Meteor application and running the following in his browser console:

<pre class="language-javascript"><code class="language-javascript">Accounts.callLoginMethod({
    methodArguments: [{
      user: {email: "joe@schmoe.com"},
      password: {digest: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", algorithm: "sha-256"}
    }]
});
</code></pre>

And just like that, someone was able to catch your login credentials as they flew unencrypted across the network, and use them to take control of your account.

## Smells Like Hash

But how can this be? You know that when you call <code class="language-javascript">Meteor.loginWithPassword</code> on the client, the password you provide is [hashed before it’s sent to the server](https://github.com/meteor/meteor/blob/3790e0987b7dbfbe7ecd070462d16f1e3bf6c901/packages/accounts-password/password_client.js#L33). How can an attacker log in without access to the actual password string?

The <code class="language-javascript">accounts-password</code> package hashes the provided password before sending it across the network in an attempt to prevent attackers from being able to see the raw password. The server then compares the user-provided hash with the hash it keeps the <code class="language-javascript">users</code> collection. If the two hashes match, the server assumes that the user provided the correct password, and logs them into the application.

This means that the hash is effectively being treated as a password. If you send the right hash, you will be logged into the associated account, regardless of whether you know what the actual password is. Because this hash, or pseudo-password, is being sent in plain text over the network, anyone who intercepts it can easily replay the message and send their own login request.

## SSL To The Rescue

People often ask me if they should be using SSL/TLS (<code class="language-javascript">https</code>) with their Meteor applications. My answer is always a resounding, “Yes!” At its core, DDP is a plain text protocol that offers no protection against inspection, tampering or replay over the network. This means that all of your users’ potentially private data is being broadcast to the slice of the world between the client and the server.

So how does SSL save the day? By adding and correctly configuring SSL and navigating to your Meteor application over https, you’re creating a secure connection between the client and the server. All network communications are completely encrypted and [protected from replay attacks](http://security.stackexchange.com/a/20106).

Using SSL is an easy way to ensure that private data stays private, even when it’s being shipped back and forth between the client and the server.
