---
layout: post
title:  "My Meteor Hello World - countwith.me"
date:   2014-12-08
categories:
---

I decided to make a very simple webapp to get my feet wet with the [Meteor](https://www.meteor.com/) framework. The result is [countwith.me](http://countwith.me)! The site is basically just a real-time, anonymous counter. Users can submit the next number in the sequence. If their number is incorrect, the count resets to 1. Even though it’s a mind-numbingly simple app, I learned quite a bit from it.

## Using Grunt

My first instinct when building out a front-end for a project is to use [Grunt](http://gruntjs.com/) and [Bower](http://bower.io/). In order to prevent Meteor from trying to process and bundle all of my Grunt and Bower resources and dependencies, I decided to keep them in a hidden directory called <code class="language-*">.grunt</code>, which Meteor ignores. <code class="language-*">Gruntfile.js</code> is set up to watch <code class="language-*">scss</code> for [SASS](http://sass-lang.com/) changes, and then dump the compiled css file in the root directory. I have a grunt copy target set up to manually copy select resources (<code class="language-*">lodash.min.js</code>, <code class="language-*">moment.min.js</code>) out of <code class="language-*">.grunt/bower_components</code> into <code class="language-*">js</code>. Meteor finds these css and js resources and bundles them.

From what I’ve seen, using Grunt and Bower in this way isn’t the “Meteor way” of doing things. Instead, I should be using meteor packaged versions of the tools I need, like [meteor-scss](https://github.com/fourseven/meteor-scss), [meteor-lodash](https://github.com/hipertracker/meteor-lodash) and [meteor-moment](https://github.com/acreeger/meteor-moment). I’m not sure how I feel about this. I keep see the benefits of using things that only exist within the Meteor ecosystem, but at this point it seems like we’re just adding an extra, unnecessary layer of package management.

## Subscription onReady

One of the first things I did was set up a template to iterate over a <code class="language-*">Counts</code> collection and display the number in a span:

<pre><code class="language-markup">&lt;template name="numbers"&gt;
    &#123;&#123;#each counts&#125;&#125;
        &lt;span class="number &#123;&#123;#if wrong&#125;&#125;wrong&#123;&#123;/if&#125;&#125;"&gt;&#123;&#123;number&#125;&#125;&lt;/span&gt;
    &#123;&#123;/each&#125;&#125;
&lt;/template&gt;
</code></pre>

As the collection began to grow, I was surprised to see that the data in the DOM would be initially incorrect when the app first started or was refreshed. A quick search led me to a [StackOverflow answer](http://stackoverflow.com/a/15131960/96048) that suggested not displaying data until the subscription <code class="language-*">onReady</code> callback is called. A quick check of the [docs](http://docs.meteor.com/#/basic/Meteor-subscribe) made it pretty clear how the <code class="language-*">onReady</code> callback works. By setting a session variable when the subscription was ready, I was able to hide the collection’s DOM elements until they were ready to be seen:

<pre><code class="language-markup">&lt;section class="numbers &#123;&#123;#if notReady&#125;&#125;not-ready&#123;&#123;/if&#125;&#125;"&gt;
    &lt;span class="number" contenteditable&gt;???&lt;/span&gt;
    &#123;&#123;&gt; numbers&#125;&#125;
&lt;/section&gt;
</code></pre>

## Publish/Subscribe and MiniMongo - Ohhhh, Now I Get It

As my <code class="language-*">Counts</code> collection grew in size, I was beginning to have some severe performance problems. I spent several hours slamming my head against the Chrome Dev Tools trying to track down what I thought was some kind of memory leak. If only I had ready the [Understanding Meteor Publications &amp; Subscriptions](https://www.discovermeteor.com/blog/understanding-meteor-publications-and-subscriptions/) article, I would be 3 hours richer.

Initially, I was using auto-publishing and setting up my sorting and limiting <code class="language-*">Counts</code> query on the client:

<pre><code class="language-javascript">if (Meteor.isClient()) {
    ...
    counts: function() {
        return Counts.find({}, {sort: {timestamp: -1}, limit: 30});
    },
</code></pre>

After removing <code class="language-*">autopublish</code>, I wanted to move that logic to the server, so I did just that:

<pre><code class="language-javascript">if (Meteor.isClient()) {
    ...
    counts: function() {
        return Counts.find();
    },
...
if (Meteor.isServer()) {
    Meteor.publish('counts', function () {
        return Counts.find({}, {sort: {timestamp: -1}, limit: 30});
    });
</code></pre>

However, after my client refreshed itself, I noticed that my data was not being updated when I submitted new numbers. I was under the impression that this server-side <code class="language-*">Counts</code> query was not returning a reactive collection to the client. In a desperate attempt to fix the problem I removed the sorting and limiting from the server and moved them to the client. This worked, and I went about my business, oblivious to my impending doom.

<pre><code class="language-javascript">if (Meteor.isClient()) {
    ...
    counts: function() {
        return Counts.find({}, {sort: {timestamp: -1}, limit: 30});
    },
...
if (Meteor.isServer()) {
    Meteor.publish('counts', function () {
        return Counts.find();
    });
</code></pre>

Hours later, after reading through the previously linked Understanding Meteor article, I realized the errors of my ways. I also realized that the data being passed to the client __was__ reactive, it simply didn’t __look__ like it was updating because the default sort order was placing the new counts at the bottom of the list, out of sight. The ultimate fix was to sort and limit on the server, __and__ sort on the client.

<pre><code class="language-javascript">if (Meteor.isClient()) {
    ...
    counts: function() {
            return Counts.find({}, {sort: {timestamp: -1}});
        },
...
if (Meteor.isServer()) {
    Meteor.publish('counts', function () {
        return Counts.find({}, {sort: {timestamp: -1}, limit: 30});
    });
</code></pre>

## Conclusion

Check out [countwith.me](http://countwith.me). Also check out its [github repo](https://github.com/pcorey/countwith.me). Ultimately, I’m very happy with how the project turned out. I never thought that such an incredibly simple webapp would teach me so much about a framework. Every little thing I learned about the framework gave me glimpses into much deeper topics that I’m anxious to explore. It’s interesting how such a seemsly simple framework can be so deeply nuanced.
