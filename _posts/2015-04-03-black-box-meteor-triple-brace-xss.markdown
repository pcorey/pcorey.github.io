---
layout: post
title:  "Black Box Meteor - Triple Brace XSS"
titleParts: ["Black Box Meteor", "Triple Brace XSS"]
excerpt: "Meteor's 'tripple braces' are a primary source of Cross Site Scripting vulnerabilities in your application. Learn how an attacker can find them in your application."
author: "Pete Corey"
date:   2015-04-03
tags: ["Javascript", "Meteor", "Security", "XSS", "Black Box Meteor"]
---

[Meteor](https://www.meteor.com/) is an incredibly interesting framework from a security perspective. Due to the unique way in which it deals with it's client/server separation, most of the information and functionality passed to the client is presented in a very uniform, organized way. From a black box security testing perspective, this can make life much easier!

We'll start our black box adventure by searching for potential [Cross Site Scripting (XSS)](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)) and/or [Stored XSS](https://www.owasp.org/index.php/Testing_for_Stored_Cross_site_scripting_(OTG-INPVAL-002)) attack vectors. One potential attack vector is the use of [triple brace tags](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#triple-braced-tags). Allowing un-sanitized user input into these raw tags can potentially let malicious users execute javascript on other clients' machines. This is bad!

## Finding Triple Braces

Thanks to the [Spacebars compiler](https://meteorhacks.com/how-blaze-works.html), we have all of the information we need to find templates that make use of triple braces.

Let's take a tour of the template information given to each client. All of the templates used in the application live in the <code class="language-javascript">Template</code> object. We can get a list of template names (along with some other <code class="language-javascript">Template</code> specific object keys, such as <code class="language-javascript">instance</code>, etc...) by grabbing the keys of the object:

<pre class="language-javascript"><code class="language-javascript">Object.keys(Template);
</code></pre>

If you're interested in a particular template, you can drill into its <code class="language-javascript">renderFunction</code> and access it directly, or turn it into a string and peruse the source:

<pre class="language-javascript"><code class="language-javascript">Template.interestingTemplate.renderFunction.toString();
</code></pre>

You'll notice that the <code class="language-javascript">renderFunction</code> holds the result of the Spacebars compilation process. The DOM is represented as [HTMLjs](https://github.com/meteor/meteor/tree/devel/packages/htmljs) objects, interspersed with Spacebars objects. In our case, the triple braces we're looking for are transformed into calls to <code class="language-javascript">Spacebars.makeRaw</code>.

Using this knowledge, we can easily find all of the templates that use triple braces throughout the application:

<pre class="language-javascript"><code class="language-javascript">Object.keys(Template).filter(function(key){
    return Template[key] &&
           Template[key].renderFunction &&
           Template[key].renderFunction.toString().indexOf('Spacebars.makeRaw') > -1;
});
</code></pre>

We could take this a step further by doing some monkey patching. Let's replace the [Spacebars.makeRaw](https://github.com/meteor/meteor/blob/0b1d744731dc7fb4477331ebad5f5d62276000f1/packages/spacebars/spacebars-runtime.js#L108-L115) method with a method that adds a data attribute to the first element passed into it:

<pre class="language-javascript"><code class="language-javascript">Spacebars._makeRaw = Spacebars.makeRaw;
Spacebars.makeRaw = function (value) {
    function injectDataAttr() {
        var idx = value.indexOf('>');
        if (idx == -1) {
            return value;
        }
        return value.substr(0, idx) +
               ' data-make-raw' +
               value.substr(idx);
    }
    if (value == null)
        return null;
    else if (value instanceof HTML.Raw) {
        return HTML.Raw(injectDataAttr(value.value));
    }
    else {
        return HTML.Raw(injectDataAttr(value));
    }
};
</code></pre>

You can then add a CSS rule to outline each raw element:

<pre class="language-css"><code class="language-css">[data-make-raw] {
    outline: 1px solid tomato;
}
</code></pre>

Or do it from the [console](http://davidwalsh.name/add-rules-stylesheets):

<pre class="language-javascript"><code class="language-javascript">var style = document.createElement("style");
style.appendChild(document.createTextNode(""));
document.head.appendChild(style);
style.sheet.insertRule('[data-make-raw] { outline: 1px solid tomato; }',0);
</code></pre>

Here's an example running against [Telescope](http://www.telescopeapp.org/):

<a href="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/telescope.png"><img src="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/telescope.png" alt="Telescope example" style="max-width: 100%;"></a>

In this case I would make absolutely sure that the post title and each of the comments are being properly sanitized before being stored in the database and rendered on the client. If we miss either of these, we're looking at a Stored XSS vulnerability!

## What Does It All Mean?

This is just a tool to point you in the direction of potential vulnerabilities. It will show you __all__ uses of triple braces throughout your application, but not all triple braces are bad! There are many valid uses of these raw tags, but you need to ensure that the content being rendered is truly safe. Always be sure to sanitize any user input that may find its way into a triple brace tag.

Also keep in mind that there are other XSS attack vectors such as the use of [Spacebars.SafeString](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#safestring), [dynamic attributes](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#dynamic-attributes), and even [within attribute values](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#in-attribute-values) on certain attributes like <code class="language-*">href</code> and <code class="language-*">onclick</code>, to name a few.

Always be vigilant! Never trust user input!
