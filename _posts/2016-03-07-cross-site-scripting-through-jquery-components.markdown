---
layout: post
title:  "Cross Site Scripting Through jQuery Components"
titleParts: ["Cross Site Scripting Through", "jQuery Components"]
excerpt: "Your application may be correctly sanitizing user-provided input, but are your jQuery components? Watch out for Cross Site Scripting attacks!"
author: "Pete Corey"
date:   2016-03-07
tags: ["Javascript", "Meteor", "Security"]
---

In the past, I’ve talked about tracking down [Cross Site Scripting (XSS)](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)) vulnerabilities within your [Meteor](https://www.meteor.com/) application by [hunting for triple-brace injections](/blog/2015/04/03/black-box-meteor-triple-brace-xss/). I argued that XSS was relatively uncommon because you needed to explicitly use this special injection syntax to inject raw HTML into the DOM. 

While this is mostly true, there are other ways for XSS to rear its ugly head in your Meteor application.

<hr/>

Imagine the following situation. You have a template that uses data from a [MongoDB](https://www.mongodb.com/) collection to populate a dropdown. To render the dropdown, you’re using a [jQuery](https://jquery.com/) plugin. This plugin expects you to provide the dropdown options as an argument, rather than through the DOM:

<pre class="language-javascript"><code class="language-javascript">Template.choices.onRendered(function() {

  // Build our dropdown options from the Choices collection
  let options = Choices.find().fetch().map(choice => {
    return {
      label: choice.name,
      value: choice._id_
    };
  });
  
  // Initialize the dropdown
  this.$("select").dropdown({
    options: options
  });
});
</code></pre>

If you took the time to look at how the jQuery plugin works, you would notice that it’s taking the options we’re providing it, and dumping them directly into the DOM:

<pre class="language-javascript"><code class="language-javascript">$(...)
  .$("&lt;option&gt;")
  .attr("value", option.value)
  .html(option.label);
</code></pre>

This plugin is making no attempt to sanitize the values or labels that are being injected into the DOM. Its operating under the assumption that the data will already be sanitized by the time it reaches the plugin.

<hr/>

Unfortunately, this opens the door to a [Stored Cross Site Scripting](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)#Stored_XSS_Attacks) vulnerability in our application. Because neither the jQuery plugin nor our application are sanitizing the values pulled from the database before injecting them into the DOM, a malicious user could easily take advantage of the situation.

Imagine that an attacker were to change the `name`{:.language-javascript} of one of the `Choice`{:.language-javascript} documents to a string containing some malicious `<script>`{:.language-markup} tag:

<pre class="language-javascript"><code class="language-javascript">Choices.update(..., {
  $set: {
    name: `&lt;script&gt;
             Roles.addUsersToRoles("${Meteor.userId()}", "admin");
          &lt;/script&gt;`
  }
});</code></pre>

Now, whenever that option is rendered in the dropdown, that malicious Javascript will be executed.

Interestingly, if another user were to use the dropdown, the malicious Javascript would run ___on their behalf___. This means that if an Administrator were to open the dropdown and render this malicious option, they would unintentionally give the `admin`{:.language-javascript} role to the attacking user.

This is a bad thing.

<hr/>

Thankfully, the solution to this issue is relatively straight-forward. Before passing our options into the jQuery plugin, we should sanitize them to prevent malicious tags from being inserted into the DOM as HTML.

The [Blaze package](https://github.com/meteor/meteor/tree/devel/packages/blaze) comes with a handy utility called `Blaze._escape`{:.language-javascript} that does just that. It takes in any string and [escapes](http://www.htmlescape.net/htmlescape_tool.html) any HTML special characters into their corresponding HTML encoded form.

We can incorporate `Blaze._escape`{:.language-javascript} into our previous example like so:

<pre class="language-javascript"><code class="language-javascript">Template.choices.onRendered(function() {
  let options = Choices.find().fetch().map(choice => {
    return {
      label: Blaze._escape(choice.name),
      value: choice._id_
    };
  });
  this.$("select").dropdown({
    options: options
  });
});</code></pre>

This would transform the malicious `name`{:.language-javascript} into a benign string that could safely be injected into the DOM:

<pre class="language-javascript"><code class="language-javascript">'&amp;lt;script&amp;gt;Roles.addUsersToRoles("...", "admin");&amp;lt;/script&amp;gt;'</code></pre>

When injected into the DOM, this would be interpreted as plain text, rather than a `<script>`{:.language-javascript} tag. This means that the malicious Javascript would not be executed, and the Cross Site Scripting vulnerability would no longer exist!

<hr/>

It's important to ___always take responsibility for the safety of your application___. When using third-party plugins or packages, never make assumptions about what they are, or are not doing - especially when it comes to security. 

When in doubt, dig into the source and find out exactly what's going on!
