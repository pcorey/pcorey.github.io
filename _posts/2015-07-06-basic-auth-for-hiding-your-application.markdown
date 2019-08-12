---
layout: post
title:  "Basic Auth For Hiding Your Application"
titleParts: ["Basic Auth", "For Hiding Your Application"]
excerpt: "Basic authentication is a great way to quickly lock down an application from prying eyes. Learn the ins and outs."
author: "Pete Corey"
date:   2015-07-06
tags: ["Javascript", "Meteor", "Security"]
---

<p style="border: 1px dashed tomato; padding: 1em; background-color: rgba(255, 99, 71, 0.125);">The package-based Basic Auth solution presented in this post <b>leaves DDP endpoints exposed to unauthorized users</b>. For more information, read my follow-up post on <a href="/2016/03/28/bypassing-basic-auth-through-ddp-connections/">Bypassing Package-Based Basic Auth</a>.</p>

Recently I’ve been playing with techniques for sharing private [Meteor](https://www.meteor.com/) applications with others. An example of this may be showing a beta version of an application to a client. That client may not want __any of the application__ exposed to the public, including splash pages or login screens.

I've found that a quick solution to this problem is to use good old [basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication).

Adding basic auth to a Meteor application is incredibly simple thanks to a [handful of packages](https://atmospherejs.com/?q=basic-auth) that have wrapped the [basic-auth-connect](https://www.npmjs.com/package/basic-auth-connect) npm package. I’ve whipped up a quick example using [kit:basic-auth](https://atmospherejs.com/kit/basic-auth) and deployed it to [basic-auth.meteor.com](http://basic-auth.meteor.com/). Use <code class="language-*">username</code>/<code class="language-*">password</code> for your login credentials.

Adding this basic level of protection was as simple as adding the package to my project:

<pre class="language-bash"><code class="language-bash">meteor add kit:basic-auth
</code></pre>

And updating my <code class="language-bash">settings.json</code> file with the credentials:

<pre class="language-javascript"><code class="language-javascript">{
    "basicAuth": {
        "username": "username",
        "password": "password"
    }
}
</code></pre>

Basic authentication isn't seen much anymore, and it's not a particularly useful security paradigm, especially for Meteor applictations. However, it can be incredibly useful when trying to quickly lock down a web asset, or in our case, a single-page web application.
