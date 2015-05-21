---
layout: post
title:  "Meteor Composability"
titleParts:  ["Meteor Composability"]
date:   2015-03-09
categories:
---

Last week I had the chance to give a talk at the [Meteor San Diego Meetup](http://www.meetup.com/Meteor-San-Diego/events/220311939/). My goal was to give some techniques and ideas for building component based [Meteor](https://www.meteor.com/) applications. You can check out the slides [here](http://www.1pxsolidtomato.com/meteor-composability/#/) and read my write-up below!

What do [AngularJS](https://angularjs.org/), [Polymer](https://www.polymer-project.org/) and [React](http://facebook.github.io/react/) all have in common? They emphasize building complex web applications by combining and composing together simple, independent components. By "component", I mean a stand-alone piece of functionality (usually) tied to a visual element. Because they're responsible only for their own view and functionality and communicate with the outside world through an established interface, they're very easy to understand and digest. Once you start building applications as compositions of components, you'll start to see them everywhere!

So how about Meteor? Can we build component based web applications with our favorite framework? [Templates](http://docs.meteor.com/#/full/templates_api) and [inclusion tags](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#inclusion-tags) are presented as the go-to system for building components in Meteor in just about every beginner resource and in the [official docs](http://docs.meteor.com/#/full/quickstart). In fact, as a beginner I believed that this was the only way to pull templates into my application.

As I began to build more complex applications, I quickly began to realize that this simple template inclusion just wasn't cutting it. A modal dialog is a fantastic example to illustrate the issues I was having with this system. Suppose I had a basic modal component. It's purpose was to render content in a container centered on the screen, and to de-emphasise the rest of the content on the page. When the user clicks outside of the content container, the modal would be dismissed.

If I only had one modal in my application, a naive approach would be to create a single template and include it with inclusion tag syntax:

<pre class="language-javascript"><code class="language-javascript">&#123;&#123;&gt; modal&#125;&#125;
</code></pre>

What if I wanted other content in the modal? Maybe I would pass it in through the data context:

<pre class="language-javascript"><code class="language-javascript">&#123;&#123;&gt; modal content="This is my content"&#125;&#125;
</code></pre>

What if I wanted more complex content? Like a sign-out button? I may either add a flag to my data context, or create an entirely new modal template:

<pre class="language-javascript"><code class="language-javascript">&#123;&#123;&gt; modal content="Content..." signout=true&#125;&#125;
&#123;&#123;&gt; signoutModal content="Content..."&#125;&#125;
</code></pre>

If you take the first route, the complexity of your modal template will soon spiral out of control. The modal now has to concern itself with the complexities of the data it contains, along with the complexities of just being a modal. If you go the second route, you'll quickly have an explosion of modal-esque templates. A change to your modal's behavior would require updating each of these templates, instead of making your change in a single place. Both of these scenarios are far from ideal.

## Custom Block Helpers

Thankfully, there is a solution! Deep within the [Spacebars readme](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md), you'll find a section on [custom block helpers](https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md#custom-block-helpers). Custom block helpers give us a new syntax for pulling templates into our application, and even allow us to pass content into our templates. Within our template we can use standard inclusion tag syntax to pull in a special block, <code class="language-javascript">Template.contentBlock</code>, which injects the content we've passed into our template into the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) at this point. If you're familiar with AngularJS, you'll notice that this is very similar to the [ng-transclude](https://docs.angularjs.org/api/ng/directive/ngTransclude) directive.

Using custom block helpers, we can build a more powerful modal template:

<pre class="language-markup"><code class="language-markup">&lt;body&gt;
    &#123;&#123;#modal&#125;&#125;
        &lt;h1&gt;Hello!&lt;/h1&gt;
        &lt;p&gt;I'm modal content!&lt;/p&gt;
    &#123;&#123;/modal&#125;&#125;
&lt;/body&gt;

&lt;template name="modal"&gt;
    &lt;div class="modal fade"&gt;
        &lt;div class="modal-dialog"&gt;
            &lt;div class="modal-content"&gt;
                &#123;&#123;&gt; Template.contentBlock&#125;&#125;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/div&gt;
&lt;/template&gt;
</code></pre>

<pre class="language-javascript"><code class="language-javascript">if (Meteor.isClient) {
    Template.modal.rendered = function() {
        $('.modal').modal();
    };
}
</code></pre>

Now, our modal template is only concerned with being a modal. The template sets up the DOM structure required to create a [Bootstrap modal](http://getbootstrap.com/javascript/#modals) and instantiates the modal when it's rendered. It doesn't have to concern itself with the complexities of the content you want to place inside of it.

## Dynamic Template Includes

We can elevate our modal template to the next level by leveraging another powerful Meteor feature, [dynamic template includes](https://www.discovermeteor.com/blog/blaze-dynamic-template-includes/). Dynamic templates includes let us provide the name of the template we want to include along with a data context at runtime, rather than at compile time.

What if we wanted to define custom content for our modal's header, content container and footer? With dynamic template includes, it's easy:

<pre class="language-markup"><code class="language-markup">&lt;template name="modal"&gt;
    &lt;div class="modal fade" tabindex="-1"&gt;
        &lt;div class="modal-dialog"&gt;
            &lt;div class="modal-content"&gt;
                &lt;div class="modal-header"&gt;
                    &#123;&#123;&gt; Template.dynamic
                        template=header
                        data=headerData&#125;&#125;
                &lt;/div&gt;
                &#123;&#123;&gt; Template.dynamic
                    template=content
                    data=contentData&#125;&#125;
                &lt;div class="modal-footer"&gt;
                    &#123;&#123;&gt; Template.dynamic
                        template=footer
                        data=footerData&#125;&#125;
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/div&gt;
&lt;/template&gt;
</code></pre>

<pre class="language-markup"><code class="language-markup">&lt;body&gt;
    &#123;&#123;&gt; modal
        header='myHeader'
        content='myContent'
        footer='myFooter'&#125;&#125;
&lt;/body&gt;

&lt;template name="myHeader"&gt;
    &lt;em&gt;This is the header&lt;/em&gt;
&lt;/template&gt;

&lt;template name="myContent"&gt;
    &lt;p&gt;This is where the content goes.&lt;/p&gt;
    &lt;p&gt;There can be multiple elements.&lt;/p&gt;
&lt;/template&gt;

&lt;template name="myFooter"&gt;
    &lt;button&gt;Footer!&lt;/button&gt;
&lt;/template&gt;
</code></pre>

While it is a little more work defining our modal content in templates instead of in-line, it makes our modal template much more powerful and versatile.

## Build Your Own Data Context

Our new modal template even allows us to explicitly pass [data contexts](https://www.discovermeteor.com/blog/a-guide-to-meteor-templates-data-contexts/) into our content templates. Check out how we would pass a data context into our footer template:

<pre class="language-markup"><code class="language-markup">&lt;body&gt;
    &#123;&#123;&gt; modal
        header='myHeader'
        content='myContent'
        footer='myFooter' footerData=getFooterData&#125;&#125;
&lt;/body&gt;
</code></pre>

<pre class="language-javascript"><code class="language-javascript">Template.body.helpers({
    getFooterData: function() {
        return {
            runInFooterContext: function() {
                console.log('in footer');
            },
            runInBodyContext: function() {
                console.log('in body');
            }.bind(this)
        };
    }
});

Template.myFooter.events({
    'click button': function() {
        this.runInFooterContext();
        this.runInBodyContext();
    }
});
</code></pre>

In this example, we're building our footer's data context in a helper method on the body template. This data context has two methods: <code class="language-javascript">runInFooterContext</code> and <code class="language-javascript">runInBodyContext</code>. When the button in the footer template is clicked, we call both of these functions.

An interesting trick that can be used when juggling data contexts is that methods bound to the current data context can be passed into a child template's data context. In this example, the <code class="language-javascript">runInBodyContext</code> function is bound to the body's data context before it's passed into the footer template. When it's accessed and called within the footer data context, it is executed under the body's data context.

## Final Thoughts

I hope this gave you a few ideas for building more component based systems with Meteor. Check out the [slide deck](http://www.1pxsolidtomato.com/meteor-composability/#/7/2) for this talk, and let me know if you have any feedback or questions!
