---
layout: post
title:  "Materialize Highs and Lows"
date:   2015-03-25
categories:
---

After reading [Nick Wientge's](http://exygen.io/) [great post](http://blog.differential.com/the-easy-way-to-add-material-design-to-your-meteor-app/) on using the [Materialize](http://materializecss.com/) framework to add [Material Design](http://www.google.com/design/spec/material-design/introduction.html) ideals to your [Meteor](https://www.meteor.com/) project, I was eager to jump on board.

The CSS and static component side of the Materialize framework is fantastic! After a few hours, I had converted a [Bootstrap](http://getbootstrap.com/) project over to a more Material Design inspired aesthetic, complete with schnazzy animations and transitions.

Unfortunately, I began to hit a few roadblocks when I started combining Materialize's javascript components with reactive data from Meteor.

## Form Select

The application I was converting to Materialize made heavy use of reactively populated <code class="language-*">select</code> elements. I figured the transition to Materialize would be as simple as calling <code class="language-*">material_select</code> when the <code class="language-*">select</code> was rendered:

<pre class="language-javascript"><code class="language-javascript">Template.select.rendered = function() {
    this.$('select').material_select();
};
</code></pre>

But, since Materialize mirrors the <code class="language-*">options</code> data in a hidden list in the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), we'll need to re-initialize the select plugin every time the data changes. No problem:

<pre class="language-javascript"><code class="language-javascript">Template.select.rendered = function() {
    this.autorun(function() {
        this.data.options; //autorun trigger goes here
        this.$('select').material_select();
    });
};
</code></pre>

And, it doesn't work! At least with the most current Materialize release at the time of this post ([v0.95.3](https://github.com/Dogfalo/materialize/tree/v0.95.3)). In v0.95.3, re-running the <code class="language-*">material_select</code> plugin will not re-generate the options list, even if new options have been added to the <code class="language-*">select</code>. Thankfully, this has been reported as a [bug](https://github.com/Dogfalo/materialize/issues/452) and subsequently [fixed](https://github.com/Dogfalo/materialize/commit/a06d9a4bcf4b7913e1e58c5fa417bbb7b3279c46), but you'll need to grab to latest code for yourself to make use of the fix.

These issues can also be entirely avoided by adding the <code class="language-*">browser-default</code> class to your <code class="language-*">select</code>. This will cause Materialize to not mirror your <code class="language-*">select</code>'s options in the DOM and use a styled version of the native <code class="language-*">select</code> instead. Reactivity will work out of the box, as it would for any other <code class="language-*">select</code> element.

## Collapsible Elements

Collapsible elements also have issues with dynamic content. Collapsible elements are initialized by calling the <code class="language-*">collapsible</code> plugin on the collapsible list. This will turn all of the child list items into collapsible containers:

<pre class="language-markup"><code class="language-markup">&lt;template name="collapsible"&gt;
    &lt;ul class="collapsible"&gt;
        &#123;&#123;#each items&#125;&#125;
            &lt;li&gt;
                &lt;div class="collapsible-header"&gt;&#123;&#123;header&#125;&#125;&lt;/div&gt;
                &lt;div class="collapsible-body"&gt;&#123;&#123;body&#125;&#125;&lt;/div&gt;
            &lt;/li&gt;
        &#123;&#123;/each&#125;&#125;
    &lt;/ul&gt;
&lt;/template&gt;
</code></pre>

<pre class="language-javascript"><code class="language-javascript">Template.collapsible.rendered = function() {
    this.$('.collapsible').collapsible();
};
</code></pre>

But what happens when another item is added to <code class="language-*">items</code>? We'll need to re-initialize the <code class="language-*">collapsible</code> plugin:

<pre class="language-javascript"><code class="language-javascript">Template.select.rendered = function() {
    this.autorun(function() {
        this.data.items; //autorun trigger goes here
        this.$('.collapsible').collapsible();
    });
};
</code></pre>

Unfortunately, this doesn't work exactly as we expected. While the new item is collapsible, re-initializing the plugin also closes all currently open items. If we dig into the source, we can see why this happens.

Let's take a look at the "expandable" data path. When the plugin is initialized, it loops over each <code class="language-*">collapsible-header</code> and checks its <code class="language-*">active</code> status. If it is active, it calls <code class="language-*">expandableOpen</code>. [Take a look](https://github.com/Dogfalo/materialize/blob/master/js/collapsible.js#L71-L73).

<code class="language-*">expandableOpen</code> toggles the <code class="language-*">active</code> class on the <code class="language-*">collapsible-header</code>'s parent (<code class="language-*">li</code>), and then checks its value. If it is active, it expands the container, otherwise it collapses it. [Check it out](https://github.com/Dogfalo/materialize/blob/master/js/collapsible.js#L43-L49). The re-initialize issue happens because the parent <code class="language-*">li</code> already has the <code class="language-*">active</code> class for previously initialized items. When we toggle the class, we inadvertently close the container.

The accordion data path is a little more complicated, but the same general issue exists.

I've created an [issue](https://github.com/Dogfalo/materialize/issues/1007) and a [pull request](https://github.com/Dogfalo/materialize/pull/1008) to fix this issue with the <code class="language-*">collapsible</code> plugin. Go open source!

## Final Thoughts

Materialize is a great front-end framework. It allowed me to quickly and easily build a Material Design style application.

That being said, I don't think it's the best fit for a Meteor application. I'm not interested in dealing with the unnecessary complexity of managing the initialization and re-initialization of each of my components as they're reactively added to the DOM.

At the end of the day, I believe I'm better off using [Polymer](https://www.polymer-project.org/0.5/) as a static component library to build my Material Design applications.