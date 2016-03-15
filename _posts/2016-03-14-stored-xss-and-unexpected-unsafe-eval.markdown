---
layout: post
title:  "Stored XSS and Unexpected Unsafe-Eval"
titleParts: ["Stored XSS", "and Unexpected Unsafe-Eval"]
date:   2016-03-14
tags: ["security"]
---

In a [previous post](http://blog.east5th.co/2016/03/07/cross-site-scripting-through-jquery-components/), I discussed the possibility of exposing [Cross Site Scripting](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)) (XSS) vulnerabilities in your [Meteor](https://www.meteor.com/) application through the use of [jQuery](https://jquery.com/) components.

I gave an example where a malicious string with a `<script>`{:.language-markup} tag was being injected into the DOM through a call to `$.html`{:.language-javascript}. For example:

<pre class="language-javascript"><code class="language-javascript">$(...)
  .html("<script>Roles.addUsersToRoles('...', 'admin');</script>");
</code></pre>

My recommendation in that post was to sanitize the string with `Blaze._encode`{:.language-javascript} before injecting it into the DOM. 

Another potential solution to this problem is to use the `browser-policy`{:.language-javascript} [Meteor package](https://atmospherejs.com/meteor/browser-policy) to establish a [Content Security Policy (CSP)](http://www.html5rocks.com/en/tutorials/security/content-security-policy/) within your application. However, this solution comes with its share of quirks.

## When CSP Falls Short

A Content Security Policy is used to tell the browser, among other things, what types of Javascript is allowed to run within a client's browser, and what should be blocked. 

Many applications instruct their Content Security Policy to disallow [inline scripts](https://developer.chrome.com/extensions/contentSecurityPolicy#relaxing-inline-script) (`unsafe-inline`{:.language-javascript}). Inline scripts refer to any javascript that executes within an HTML element’s event handler attributes, within a `<script>`{:.language-markup} tag, or through the URL with a `javascript:`{:language-javascript} protocol.

It may seem like disallowing inline scripts would prevent our Cross Site Scripting issue. After all, the malicious Javascript ___is___ running from an inline `<script>`{:.language-markup} tag that's being injected into the DOM.

However, in the eyes of the Content Security Policy, a `<script>`{:.language-markup} tag injected through a call to `$.html`{:.language-javascript} is not considered an inline script.

## Unexpected Unsafe-Eval

If your Content Security Policy disallows inline scripts, but allows [Javascript evaluation](https://developer.chrome.com/extensions/contentSecurityPolicy#relaxing-eval) (`unsafe-eval`{:.language-javascript}), your application would still be vulnerable to this particular type of Cross Site Scripting attack.

Under the hood, this after-the-fact injection of a `<script>`{:.language-markup} tag, and its subsequent execution is considered an eval statement. Only by disallowing `unsafe-eval`{:.language-javascript} can you prevent this type of XSS attack.

<img src="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/unsafe-eval.png" style="max-width: 100%">

This is incredibly unintuitive and may lead to dangerous misunderstandings about what types of Javascript your application is allowed to execute. For a [variety of reasons](https://code.google.com/p/gmaps-api-issues/issues/detail?id=4201), some applications require the use of `unsafe-eval`{:.language-javascript}. Without understanding the subtleties of what is considered an eval by your Content Security Policy, you may be vulnerable to severe Cross Site Scripting attacks.

It's important to remember that a Content Security Policy is not a panacea against all front-end attacks. Instead, it's a helpful safeguard that can be used ___in conjunction___ with other safeguards like properly sanitizing data, and validating user input.
