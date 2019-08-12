---
layout: post
title:  "Custom Categories with Meteor's Orion CMS"
titleParts: ["Custom Categories", "with Meteor's Orion CMS"]
excerpt: "Let's extend the Meteor-based Orion CMS with our own custom categories."
author: "Pete Corey"
date:   2015-02-23
tags: ["Javascript", "Meteor"]
---

Lately I've been playing with [Orion](http://orion.meteor.com/), the fantastic [Meteor](https://www.meteor.com/) based [CMS](http://en.wikipedia.org/wiki/Content_management_system). The way Orion builds on top of [aldeed:collection2](https://github.com/aldeed/meteor-collection2) and [aldeed:autoform](https://github.com/aldeed/meteor-autoform) to create an incredibly flexible and powerful CMS is inspiring.

One feature I wanted out of Orion was the ability to have data from the [dictionary](http://orion.meteor.com/docs/dictionary) be accessible from within an [entity](http://orion.meteor.com/docs/entities). For example, I wanted to keep a list of Categories in Orion's dictionary and associate each Article entity with one of these categories. After doing a little digging, I found a way to accomplish this.

I've created a [gist](https://gist.github.com/pcorey/99507eda6f28f8cc3bc0) to show off this functionality. The [key lines of code](https://gist.github.com/pcorey/99507eda6f28f8cc3bc0#file-gistfile1-js-L13-L25) are shown below:

<pre class="language-javascript"><code class="language-javascript">allowedValues: function() {
    return orion.dictionary.collection.findOne()['categories'];
},
autoform: {
    options: function() {
        return orion.dictionary.collection.findOne()['categories'].map(function(value) {
            return {
                value: value,
                label: value
            };
        });
    }
}
</code></pre>

When setting up your entity's [attributes](http://orion.meteor.com/docs/attribute), you'll need to add custom <code class="language-*">allowedValues</code> and <code class="language-*">autoform</code> functions. The <code class="language-*">allowedValues</code> function returns the possible string values that can be saved into this field. These values are pulled from the <code class="language-*">categories</code> field of the dictionary document. <code class="language-*">autoform</code> is used to build the select options presented to the user. In this case, we're using the category string as both the <code class="language-*">value</code> and the <code class="language-*">label</code>.

Interestingly, if <code class="language-*">allowedValues</code> is not a function, it will build the options automatically. However, if <code class="language-*">allowedValues</code> is a function, the dropdown will be empty. We need to explicitly specify a <code class="language-*">autoform.options</code> function to build our options for us. I haven’t looked into what’s causing this.

These are issues with this approach. If a user creates an article with a certain category, but then deletes that category from the dictionary, the article will still hold the deleted value in its category field. When that article is edited in Orion, the category field will be blank. I'm hoping to spend a little more time in the future to address these issues and dig deeper into this kind of Orion functionality.

<video width="100%" src="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/categories.webm" controls></video>
