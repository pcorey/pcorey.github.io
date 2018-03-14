---
layout: post
title:  "Passwordless Authentication with Phoenix Tokens"
description: "Passwordless authentication is a powerful new paradigm for authentication workflows. Learn how to implement passwordless in an Elixir and Phoenix application."
author: "Pete Corey"
date:   2017-04-24
tags: ["Elixir", "Phoenix", "Passwordless", "Authentication"]
---

__Subtitled: I got 99 problems, but a password ain’t one.__

I’m in the process of building a security-focused SaaS application (shameless plug: [Inject Detect](http://www.injectdetect.com/)), and I’ve decided to use a passwordless authentication scheme. Since I’ve decided to stop using passwords, I feel like a great burden has been lifted from my shoulders.

In this post, let’s dig into how awesome passwordless authentication is, and just how easy it is to set up in your [Elixir](http://elixir-lang.org/)/[Phoenix](http://www.phoenixframework.org/) application.

## Passwordless in a Passwordful World

Before we dig into the nuts and bolts of building out a passwordless system, we should probably talk about what exactly “passwordless” means.

How can we authentication users without passwords?

The general idea behind a passwordless authentication scheme is that instead of a user regurgitating a password to prove their identity, they’re emailed a “magic link” that, when clicked, will activate their session.

---- 

In many ways, a passwordless authentication scheme is very similar to traditional password-based authentication. The only difference is that we require the user makes a trip to their inbox.

So why bother? Shouldn’t we focus on creating less work for our users? _Aren’t passwords fine?_

It turns out that [passwords aren’t fine](https://blog.codinghorror.com/your-password-is-too-damn-short/). There are numerous problems with passwords as we know them. Not only do people often choose poor passwords and have deplorable password habits (full disclosure: I’m one of these people), but they fundamentally don’t do the job they’re designed to do.

How so?

Authentication ultimately boils down to proving you are who you say you are. This is often done by presenting the system with a fact that can only be known by you. If you can produce this fact, the system assumes that you are who you say you are.

Unfortunately, your passwords _aren’t_ secrets only known by you. Every time you use ([or reuse](https://nakedsecurity.sophos.com/2013/04/23/users-same-password-most-websites/)) a password in a system, you’re giving that system knowledge of your password. You’re trusting the ethics and [technical competency](https://www.nytimes.com/2016/12/14/technology/yahoo-hack.html) of that system with the defining factor of your online identity.

---- 

How is passwordless better?

I believe that passwordless authentication is a better alternative over password-based authentication for the simple reason that turns authentication into a process of active consent, rather than the passive transfer of a piece of information.

___Your active consent cannot be given to another system, or stolen by an attacker.___ As long as you control the channel through which consent is granted (email, SMS, etc…), you control your identity.

Take the power back!

## Going Passwordless with Phoenix Tokens

Now that I’ve spent all that time waxing poetic about the beauties of passwordless authentication, let’s talk about how can actually implement it in a Elixir/Phoenix based application.

I debated going into great detail in this section discussing how to implement passwordless authentication in a few different stack permutations (Vanilla Phoenix, React, Apollo, Absinthe, etc…), but instead, let’s talk about the common theme in all of these implementations: [Phoenix Tokens](https://hexdocs.pm/phoenix/Phoenix.Token.html).

Phoenix Tokens do two things that turn out to be invaluable for building out a passwordless authentication scheme:

- They generate cryptographically strong [bearer tokens](https://tools.ietf.org/html/rfc6750#section-1.2).
- They let you make assertions about the age of a token.

There are three major workflows of a passwordless system. Let’s run through each of them and see how easy they are to implement using Phoenix Tokens.

## Signing Up

In a passwordless system, all we need to create an account for a new user is their email address.

If we don’t care to verify the email address they provided, we can immediately sign them in by using `Phoenix.Token.sign`{:.language-elixir} to generate the user an `auth_token`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
Phoenix.Token.sign(Endpoint, user.id, :crypto.strong_rand_bytes(32))
</code></pre>

This `auth_token`{:.language-elixir} will be saved and passed down to the client and stored in `localStorage`{:.language-javascript}. Any subsequent requests to the server will send along this token to identify the currently logged in user.

When the server receives a request with an attached `auth_token`{:.language-elixir}, it can look up the associated user.

If we want to limit the maximum age of a user’s session, we can verify the token using `Phoenix.Token.verify`{:.language-elixir} and pass in a `:max_age`{:.language-elixir} in seconds:

<pre class='language-elixir'><code class='language-elixir'>
Phoenix.Token.verify(Endpoint, user.id, auth_token, max_age: 1209600)
</code></pre>

In this example, we’re limiting sessions to two weeks (or 1,209,600 seconds). If a user tries to use an expired token, or a token not associated with any users, we return an error.

## Signing Out

Once our new user has signed up, signing out is as simple as deleting their associated `auth_token`{:.language-elixir}.

Once the `auth_token`{:.language-elixir} is removed, and cleared from their browser’s `localStorage`{:.language-javascript}, all subsequent requests they make will be unauthenticated until they sign back in.

{% include newsletter.html %}

## Signing In

Now we’re getting to the interesting part.

Once our user has signed out, how do they sign back into our passwordless application?

On the “sign in” page, the user will enter their email address and click a “Send me a magic link” button. Next, our server will use `Phoenix.Token.sign`{:.language-elixir} to generate a new `requested_token`{:.language-elixir}, which will be saved and emailed to the provided email address.

<pre class='language-elixir'><code class='language-elixir'>
Phoenix.Token.sign(Endpoint, user.id, :crypto.strong_rand_bytes(32))
</code></pre>

The email will contain a link to a “verify requested token” route in our application which takes the `requested_token`{:.language-elixir} as a parameter.

That route looks up the user with the provided `requested_token`{:.language-elixir}, verifies that the `requested_token`{:.language-elixir} isn’t expired, generates a new `auth_token`{:.language-elixir} for that user, and finally removes the verified `requested_token`{:.language-elixir} from the user:

<pre class='language-elixir'><code class='language-elixir'>
Phoenix.Token.verify(Endpoint, user.id, requested_token, max_age: 600)
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
Phoenix.Token.sign(Endpoint, user.id, :crypto.strong_rand_bytes(32))
</code></pre>

In this example, our “magic link” emails only last for ten minutes.

Once a user clicks the link, their new `auth_token`{:.language-elixir} will be sent down to the client and they’ll be automatically signed in!

## Final Thoughts

Passwordless authentication is definitely new territory for me, and I suspect, a lot of other software developers.

I strongly believe that it’s important to explore other options for user authentication. The status quo simply isn’t working. Whether you look at it from a user experience perspective, or from a perspective of security, traditional passwords in practice are ineffective and wrought with problems.

Passwordless authentication may not be the ideal solution, but I believe that it’s a step in the right direction.

If you want to see passwordless authentication in action, sign up for the [Inject Detect](http://www.injectdetect.com/) newsletter to receive the latest news on its upcoming release!
