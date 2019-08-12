---
layout: post
title:  "Customizable Meteor Navbar with Orion CMS"
titleParts:  ["Customizable Meteor Navbar", "with Orion CMS"]
excerpt: "Let's extend the Meteor-based Orion CMS with our own customizable navbar."
author: "Pete Corey"
date:   2015-03-02
tags: ["Javascript", "Meteor"]
---

[Last week](/blog/2015/02/23/custom-categories-with-meteors-orion-cms/) I talked about building a dictionary driven category system for articles using the fantastic [Orion](http://orion.meteor.com/) CMS. This week I’m going to continue in that same vein by building a fully customizable navbar!

So what’s the plan of attack? In Orion, we’ll define an [entity](http://orion.meteor.com/docs/entities) called <code class="language-javascript">pages</code>. This entity will hold the title and content for a variety of pages that will exist on our site. We want to be able to choose a selection of these pages to appear on our navbar in a specified order. We’ll keep that list of pages in an Orion [dictionary](http://orion.meteor.com/docs/dictionary).

## Defining the Pages Entity

The first step is to define the <code class="language-javascript">pages</code> entity that will be used by our application. This will be a straight-forward Orion entity:

<pre class="language-javascript"><code class="language-javascript">orion.addEntity('pages', {
    title: {
        type: String,
        label: 'Title'
    },
    content: {
        type: String,
        label: 'Content',
        autoform: {
            afFieldInput: {
                type: 'froala',
                inlineMode: false,
            }
        }
    }
}, {
    icon: 'bookmark',
    sidebarName: 'Pages',
    pluralName: 'Pages',
    singularName: 'Page',
    tableColumns: [
        {
            data: 'title',
            title: 'Title'
        },
        orion.attributeColumn('froala', 'content', 'Preview')
    ]
});
</code></pre>

## Defining the Page Order

The next step is to define an Orion dictionary entry to hold the list of pages as they will appear in the navbar:

<pre class="language-javascript"><code class="language-javascript">orion.admin.addAdminSubscription(orion.subs.subscribe('entity', 'pages'));

orion.dictionary.addDefinition('pages.$', 'config', {
    type: String,
    label: 'Page',
    optional: false,
    autoform: {
        type: 'select',
        options: function() {
            return orion.entities.pages.collection.find().fetch().map(function(page) {
                return {
                    value: page._id,
                    label: page.title
                };
            });
        }
    }
});

orion.dictionary.addDefinition('pages', 'config', {
    type: Array,
    minCount: 1,
    optional: false,
    label: 'Page Order'
});
</code></pre>

There are a few moving parts here. Let’s break them down to get a better understanding of what’s going on.

### Building Our Orion Interface

The first thing to notice is that our page order dictionary entry actually consists of two entries: <code class="language-javascript">pages</code> and <code class="language-javascript">pages.$</code>. Our goal is to have the page order list be a list of selections populated with <code class="language-javascript">pages</code> entities. This means that pages must be an <code class="language-javascript">Array</code> type. The children of <code class="language-javascript">pages</code> (<code class="language-javascript">pages.$</code>) are given the type <code class="language-javascript">String</code>. When using Orion, it’s required that you add the definition for child dictionary entries (<code class="language-javascript">pages.$</code>) before adding the parent (<code class="language-javascript">pages</code>).

### Populating Our Selects

In order to build the navbar, we need to be able to select which pages will appear from the set of all pages in the system. This means that we need to have the options of our <code class="language-javascript">pages.$</code> attribute driven by the <code class="language-javascript">pages</code> entity collection. How do we do this?

Just like [last time](/blog/2015/02/23/custom-categories-with-meteors-orion-cms/), the answer is to provide a custom <code class="language-javascript">options</code> function. Our <code class="language-javascript">options</code> function will fetch all of the documents in the <code class="language-javascript">pages</code> entity collection and transform them into select options:

<pre class="language-javascript"><code class="language-javascript">options: function() {
    return orion.entities.pages.collection.find().fetch().map(function(page) {
        return {
            value: page._id,
            label: page.title
        };
    });
}
</code></pre>

If you were to visit your Orion dashboard at this point, you may notice that your page order selects aren’t populating with data (or maybe they are, if you visited the entities page first). This is because we haven’t subscribed to the <code class="language-javascript">pages</code> entity collection yet. The final piece to this puzzle is to add a new subscription to the admin dashboard:

<pre class="language-javascript"><code class="language-javascript">orion.admin.addAdminSubscription(orion.subs.subscribe('entity', 'pages'));
</code></pre>

And that’s it! We now have a system where we can create pages in our CMS, and choose which of those pages will appear in our navbar.  Check out the [nav tag](https://github.com/pcorey/hello-orion/tree/nav) on my [hello-orion](https://github.com/pcorey/hello-orion) Github project to see a working example.
