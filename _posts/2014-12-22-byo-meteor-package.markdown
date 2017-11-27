---
layout: post
title:  "BYO Meteor Package"
titleParts:  ["BYO Meteor", "Package"]
description: "Follow along as I build and publish my first Meteor package!"
author: "Pete Corey"
date:   2014-12-22
tags: ["Javascript", "Meteor"]
---

This morning I started working on a quick project called Suffixer, which is a tool to help you find interesting domain names. For this project I needed a searchable english dictionary accessible from within a [Meteor](https://www.meteor.com/) app. After some sleuthing, I decided that [adambom's dictionary JSON](https://github.com/adambom/dictionary) would be my best bet. The next step was importing that JSON data into Meteor in the most "Meteor way".

## Creating a Package

Since this is a fairly reusable component, I decided to throw it into a [Meteor package](http://docs.meteor.com/#/full/packagejs). Doing this is as simple and running a "create package" command inside your Meteor project:

<pre><code class="language-bash">meteor create --package pcorey:dictionary
</code></pre>

This will create a package called <code class="language-*">pcorey:dictionary</code> in the <code class="language-*">packages</code> directory within your project. There you'll find <code class="language-*">package.js</code> and other files to get you started. Next, throw some code into the file referenced in the <code class="language-*">onUse</code> section of <code class="language-*">package.js</code>. Finally, add the package to your project:

<pre><code class="language-bash">meteor add pcorey:dictionary
</code></pre>

You'll notice that Meteor will immediately pick up this change and build your package into the project. For local packages, this is all you need to get started.

However, I wanted to keep this package in its own github repo and eventually publish it to Meteor's package repository. With that in mind, I  pulled it out of my <code class="language-*">packages</code> folder within my project and into its own directory.

## Package Assets

If you take a look at my package's [github repository](https://github.com/pcorey/meteor-dictionary), you'll notice that I'm including <code class="language-*">dictionary.json</code> in the <code class="language-*">package.js</code> file:

<pre><code class="language-javascript">Package.onUse(function(api) {
    api.versionsFrom('1.0.1');
    api.addFiles('dictionary.js');
    api.addFiles('dictionary.json', 'server', {isAsset: true});
});
</code></pre>

I'm passing an additional two arguments to this call of addFiles. The <code class="language-*">'server'</code> argument is straight forward; it's telling meteor to only make this file available to the server. The <code class="language-*">{isAsset: true}</code> argument is used to incidcate that this file should be loadable as an [asset](http://docs.meteor.com/#/full/assets). This is a fairly [undocumented feature](http://docs.meteor.com/#/full/pack_addFiles) that I only discovered after some [frantic googling](https://github.com/meteor/meteor/issues/1259). Adding the file to the package in this way lets you load it as an asset in the package:

<pre><code class="language-javascript">var dictionary = JSON.parse(Assets.getText('dictionary.json'));
</code></pre>

## Exporting

My package defines a collection called <code class="language-*">Dictionary</code> that I intended to be used on the client side by projects importing this package. However, without explicitly [exporting](http://docs.meteor.com/#/full/pack_export) <code class="language-*">Dictionary</code>, it will remain hidden within the package's scope.

You can specify your package's exports in your <code class="language-*">package.js</code> file. Here's I'm exporting the <code class="language-*">Dictionary</code> collection defined in <code class="language-*">dictionary.js</code> and making it accessible to both the client and the server:

<pre><code class="language-javascript">api.export('Dictionary', ['client', 'server']);
</code></pre>

## Publishing Your Package

Once you have your package completed, the next step is to publish it to Meteor's package repository:

<pre><code class="language-bash">meteor publish --create
</code></pre>

When making changes to you package, be sure to increment your version in <code class="language-*">package.js</code> and then re-publish the package:

<pre><code class="language-bash">meteor publish
</code></pre>

You can now add your package to any Meteor project using the standard meteor add command. That's it!

