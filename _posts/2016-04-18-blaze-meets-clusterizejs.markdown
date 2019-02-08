---
layout: post
title:  "Blaze Meets Clusterize.js"
titleParts: ["Blaze Meets", "Clusterize.js"]
description: "Blaze can be slow when rendering hundreds of elements. Speed it up with Clusterize.js!"
author: "Pete Corey"
date:   2016-04-18
tags: ["Javascript", "Meteor"]
---

Recently, I’ve been working on a [Meteor](https://www.meteor.com/) project that deals with lots of data. Most of this data is rendered in “cards” that populate a vertically scrolling list. 

These cards need to be very quickly scannable, sortable, and filterable by any users of the application. To do this quickly, we need to publish all of this data to the client and let the UI handle its presentation; we can’t rely on techniques like infinite scrolling or on-the-fly subscriptions.

This situation led to an interesting problem with [Blaze](https://www.meteor.com/blaze) and an even more interesting solution leveraging [Clusterize.js](https://nexts.github.io/Clusterize.js/) and a client-side cache. Let’s dig into it!

## Blazingly Slow

The naive Blaze solution to presenting a bunch of UI components is to simply render each of these cards within an <code class="language-javascript">&#123;&#123;#each}}</code> block:

<pre class="language-javascript"><code class="language-javascript">&#123;&#123;#each data in cards}}
  &#123;&#123;> card data}}
&#123;&#123;/each}}
</code></pre>
               
Unfortunately, as we start to render (and re-render) more and more cards in our list, or application slows to a crawl. After lots of profiling, debugging, and researching I came to the conclusion that Blaze simply isn’t designed to handle this much rendering and re-rendering.
               
[Arunoda](https://twitter.com/arunoda) of [MeteorHacks](https://meteorhacks.com/) (partially) explains the issue in [this article](https://meteorhacks.com/improving-blaze-performance-part-1/) and its [corresponding blog post](https://forums.meteor.com/t/making-blaze-faster/5762).

## Enter Clusterize.js

For our situation, a better approach was to use [Clusterize.js](https://nexts.github.io/Clusterize.js/) to efficiently manage and render the massive list of cards.

Rather than dumping all of our cards into the DOM at once, Clusterize.js only renders the small portion of the cards that are currently visible. As you scroll through the list, those DOM elements are recycled and replaced with the newly visible cards. This efficient use of the DOM makes Clusterize a much more effective option when dealing with large sets of scrolling data.

Unfortunately, using Clusterize.js with Blaze wasn’t the most straight-forward process. Here’s a breakdown of how I approached the problem.

I didn’t want this Clusterize.js implementation code to permeate the rest of my front-end code, so I decided to abstract all of the Clusterize-specific complexity I was about to introduce into its own private Blaze component. This component introduced some boilerplate DOM elements required by Clusterize and an `onRendered`{:.language-javascript} hook required to initialize the plugin:

<pre class="language-markup"><code class="language-markup">&lt;template name="clusterize">
  &lt;div id="scrollArea">
    &lt;div id="contentArea" class="clusterize-content">
    &lt;/div>
  &lt;/div>
&lt;/template>
</code></pre>

<pre class="language-javascript"><code class="language-javascript">Template.clusterize.onRendered(function() {
  // Initialize Clusterize.js here...
  this.clusterize = undefined;
});
</code></pre>

The component was designed to accept a cursor and a template name. Each document returned by the cursor was associated with a single card that needed to be rendered with the given template. We could use the component like this:

<pre class="language-javascript"><code class="language-javascript">&#123;&#123;> clusterize cursor=getCardDocuments
               template="card"
               options=getClusterizeOptions}}
</code></pre>

Where `getCardDocuments`{:.language-javascript} was a helper that returned a cursor, and `getClusterizeOptions`{:.language-javascript} returned an options object to be passed into Clusterize.js.

## Basic Rendering

The most straight forward way of using Clusterize.js is to render our cards in the DOM using a Blaze `&#123;&#123;#each}}`{:.language-javascript} tag, and then initialize the plugin:

<pre class="language-markup"><code class="language-markup">&lt;div id="contentArea" class="clusterize-content">
  &#123;&#123;#each document in cursor}}
    &#123;&#123;> Template.dynamic template=template data=document}}
  &#123;&#123;/each}}
&lt;/div>
</code></pre>

Unfortunately, this leads to the same problems that started this whole mess. Naively rendering lots of templates in Blaze is inherently slow!

Another technique would be to manage the rendering process ourselves and give Clusterize.js a list of raw HTML strings to manage and render:

<pre class="language-javascript"><code class="language-javascript">Template.cachedClusterize.onRendered(function() {
  this.autorun(() => {

    // Any time data changes, re-run
    let data = Template.currentData();
    if (!data) {
      return;
    }

    // Build the HTML for each patient card
    let template = Template[data.template];
    let rows = data.cursor.fetch().map(function(document) {
      return Blaze.toHTMLWithData(template, document);
    });

    // Update or initialize Clusterize.js
    if (this.clusterize) {
      this.clusterize.update(rows);
    }
    else {
      this.clusterize = new Clusterize(_.extend({
        rows: rows,
        scrollElem: this.$("#scrollArea")[0],
        contentElem: this.$("#contentArea")[0]
      }, data.options));
    }

  });
});
</code></pre>
    
This seems like a step in the right direction, but as the cursor changes, you might notice that our component takes quite a bit of time to re-render each of the cards before passing the raw HTML off to Clusterize.js…

There has to be a faster way!

## Cached Rendering

Thankfully, speeding up this implementation was fairly straight-forward. The key insight is that we don’t want to waste time re-rendering a card if we’ve already rendered it in the past. This sounds like an ideal job for a cache!

In this case, I decided to use a simple [LRU cache](https://www.npmjs.com/package/lru-cache) (specifically, `lru-cache`{:.langauge-javascript}) to cache my rendered templates. This cache can be set up in your application in a variety of ways depending on your current Meteor version.

I decided that a simple, but effective caching strategy would be to store each card’s rendered HTML string in the cache, indexed by the card’s `_id`{:.language-javascript}. 

This change makes the Clusterize.js render method slightly more complex:

<pre class="language-javascript"><code class="language-javascript">...
let rows = data.cursor.fetch().map(function(document) {
  // Has this card already been rendered?
  let html = TemplateCache.get(document._id);
  if (html) {
    return html;
  }

  // Render the card and save it to the cache...
  html = Blaze.toHTMLWithData(template, document);
  TemplateCache.set(document._id, html);
  return html;
});
...
</code></pre>

Now, if we ever try to re-render a card that’s already been rendered on the client, we’ll find that card in the cache and instantly return the card’s rendered HTML.

This greatly improves the speed of our Clusterize.js component as we change the set of cards we’re trying to render.

## Cache Invalidation

Unfortunately, our Clusterize.js component in its current form has some major issues.

If we ever update any data on a document that should be reflected on that document’s card, we’ll never see that change. Because that card has already been rendered and cached, it’ll never be re-rendered. We’re stuck looking at old, stale data in our cards list.

To deal with this situation, we need to clear any cache entries for a card whenever its corresponding document is changed. The most straight-forward way of doing this is through an `observe`{:.language-javascript} handler on the cursor provided to our component:

<pre class="language-javascript"><code class="language-javascript">...
// Invalidate our cache whenever a doucment changes
data.cursor.observe({
  changed: function(id) {
    TemplateCache.del(id);
  }
});
...
</code></pre>

Bam! We now have incredibly fast, dynamically updating cards in our Clusterize.js managed list!

## Next Steps

What I described here is a fairly simplified version of the Clusterize.js component I finally landed on.

This version doesn’t handle “client-side joins” within your rendered cards. It also doesn’t handle changes made to documents on the server, while that document doesn’t exist in the client’s cursor. These downfalls can easily be addressed with slightly more sophisticated invalidation rules and caching schemes.

At the end of the day, Clusterize.js was a life saver. With some minor massaging, it was able to step in and replace Blaze to do some majorly impressive feats of rendering.
