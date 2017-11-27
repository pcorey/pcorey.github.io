---
layout: post
title:  "Custom Block Helpers and Meteor Composability"
titleParts: ["Custom Block", "Helpers and", "Meteor Composability"]
description: "Custom block helpers can help you build more composable Meteor front-ends. This article can help you master them."
author: "Pete Corey"
date:   2015-01-13
tags: ["Javascript", "Meteor"]
---

I'll admit it; working with [AngularJS](https://angularjs.org/) has left me with a certain sense of entitlement. I expect my front-end framework to be able to let me build distinct elements that can be composed together and [placed within each other](https://docs.angularjs.org/api/ng/directive/ngTransclude). After [reading](https://www.discovermeteor.com/) about [Meteor's](https://www.meteor.com/) [templating](http://docs.meteor.com/#/full/templates_api) system, I was under the impression that content could not be transcluded into a template. After all, where would it go?

<pre class="language-*"><code class="language-*">&#123;&#123;> myTemplate&#125;&#125;</code></pre>

It wasn't until I read through [Spacebar's](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md) documentation that I found out about the amazingly useful [custom block helpers](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#custom-block-helpers). Custom block helpers let us inject or transclude content (HTML, text, variable interpolations, other templates) into a template. Let's check it out!

## Using Custom Block Helpers

If you read through the Custom Block Helpers section of the Spacebar docs, you'll notice that <code class="language-*">Template.contentBlock</code> behaves almost exactly like AngularJS' <code class="language-*">ng-transclude</code> directive. It marks the place where content will be injected into the template's markup. Let's look at an example:


<pre class="language-markup"><code class="language-markup">&lt;template name="myTemplate"&gt;
    &#123;&#123;#if this&#125;&#125;
    &lt;h1&gt;&#123;&#123;title&#125;&#125;&lt;/h1&gt;
    &lt;div&gt;
        &#123;&#123;&gt; Template.contentBlock&#125;&#125;
    &lt;/div&gt;
    &#123;&#123;else&#125;&#125;
        &lt;h1&gt;No content provided&lt;/h1&gt;
        &lt;div&gt;
            &#123;&#123;#if Template.elseBlock&#125;&#125;
                &#123;&#123;&gt; Template.elseBlock&#125;&#125;
            &#123;&#123;else&#125;&#125;
                &lt;p&gt;No elseBlock provided&lt;/p&gt;
            &#123;&#123;/if&#125;&#125;
        &lt;/div&gt;
    &#123;&#123;/if&#125;&#125;
&lt;/template&gt;

&lt;body&gt;
    &#123;&#123;#myTemplate title="My Title"&#125;&#125;
        &lt;p&gt;My custom content&lt;/p&gt;
    &#123;&#123;else&#125;&#125;
        &lt;p&gt;This is my else block&lt;/p&gt;
    &#123;&#123;/myTemplate&#125;&#125;
&lt;/body&gt;
</code></pre>

There's a lot going on in this example. Let's break it down.

### Check Your Context

The first thing I do in my template is check the truthiness of the template's data context (<code class="language-*">this</code>). If a truthy data context is passed into the template, I render one set of markup (which includes data from the context), otherwise, I render an alternate set of markup.

### Inject Your Content

You'll notice that I'm using <code class="language-*">Template.contentBlock</code> in the first set of output and <code class="language-*">Template.elseBlock</code> in the next. Interestingly, when you define a custom block helper, you can also define an "else" block to go along with it. In the second set of output I'm checking if <code class="language-*">Template.elseBlock</code> is truthy. If it is, I render it, otherwise, I render some markup explaining that an else block was not provided.

### Use Your Template

To actually use your new template and inject content into it, you no longer use the [inclusion tag](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#inclusion-tags) syntax. Instead, you reference your template using [block tag](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#block-tags) syntax. You can see this at the bottom of the above example. Within your block tag you include your content to be injected and an optional else block. Note that any arguments you pass into your template becomes that template's data context.

## Final Thoughts

While the above example is completely contrived and mostly useless, I think it shows some really useful functionality. I feel like custom blocks are going to be a big game changer in my Meteor development workflow. There's a [great article](https://www.discovermeteor.com/blog/spacebars-secrets-exploring-meteor-new-templating-engine/) over at [Discover Meteor](https://www.discovermeteor.com/) that touches on custom blocks with a more practical example. Check it out!
