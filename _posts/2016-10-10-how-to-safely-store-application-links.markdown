---
layout: post
title:  "How to Safely Store Application Links"
description: "Does your application give users the ability to link to arbitray external URLs? You may be exposing your users to an unnecessary vulnerability."
author: "Pete Corey"
date:   2016-10-10
tags: ["Javascript", "Meteor", "Security"]
---

Sometimes your Meteor application will need to store internal application links.

Maybe you want to save the last route a user visited, or maybe you want to associate notifications with a certain route within your application.

## Storing URLs

It can be tempting to store these links as full URLs in your database and render them on the client as a simple anchor tag:

<pre class='language-markup'><code class='language-markup'>
&lt;a href="&#123;&#123;url}}">&#123;&#123;link}}&lt;/a>
</code></pre>

Don’t give into temptation! This kind of linking can be a source of danger for your users.

If a malicious user has control over the URL inserted into the database, they can link other users of your application to potentially dangerous third-party websites.

For example, an attacker could manually create a new notification and provide their own URL:

<pre class='language-javascript'><code class='language-javascript'>
Notifications.insert({
  link: "Error dectected - please fix!",
  url: "http://www.evil-website.com"
});
</code></pre>

Other users might see this “Error detected - please fix!” link, click it, and be redirected to `http://www.evil-website.com`{:.language-javascript}.

Evil Website® might attempt to deceive them, extract some information from them, or even be used as a vehicle for exploiting a [Cross Site Request Forgery (CSRF)](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)) vulnerability on another website.

## Storing Routes

Rather than storing the entire URL in your database, only store the information necessary to recreate the URL on the client.

For example, when using [Iron Router](https://github.com/iron-meteor/iron-router) (or [Flow Router](https://github.com/kadirahq/flow-router)), it would be sufficient to simply store the route name in your database. On the client, you could use the `pathFor`{:.language-javascript} helper to construct the link:

<pre class='language-markup'><code class='language-markup'>
&lt;a href="&#123;&#123;pathFor route}}">&#123;&#123;link}}&lt;/a>
</code></pre>

Similarly, in-application links can be built using the `<Link>`{:.language-javascript} React component if your application is using [React Router](https://github.com/ReactTraining/react-router):

<pre class='language-markup'><code class='language-markup'>
&lt;Link to=`$&#123;route}`>&#123;link}&lt;/Link>
</code></pre>

Building dynamic internal links like this is a much safer alternative to using raw anchor tags. It prevents attackers from potentially linking other users of your application to malicious third-party websites.
