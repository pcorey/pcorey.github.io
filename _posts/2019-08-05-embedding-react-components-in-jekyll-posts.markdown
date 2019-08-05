---
layout: post
title:  "Embedding React Components in Jekyll Posts"
description: "In my last post I embedded several React-based examples directly into my Jekyll-generated article. Let's dig into how I accomplished that and how you can embed React components into your own Jekyll pages."
author: "Pete Corey"
date:   2019-08-05
tags: ["Javascript", "React", "Jekyll"]
related: []
image: "/img/2019-08-05-embedding-react-components-in-jekyll-posts/example.png"
---

Last week I published an article on ["clipping convex hulls"](/blog/2019/07/29/clipping-convex-hulls-with-thing/). The article included several randomly generated examples. Every time you refresh the article, you're given a new set examples based on a new set of randomly generated points.

I thought we could dive into how I used React to generate each of those examples, and how I embedded those React components into a [Jekyll](https://jekyllrb.com/)-generated static page.

## Creating Our Examples

To show off the process, let's create three React components and embed them into this very article (things are about to get meta). We'll start by creating a new React project using [`create-react-app`{:.language-javascript}](https://github.com/facebook/create-react-app):

<pre class='language-*'><code class='language-*'>create-react-app examples
cd examples
yarn start
</code></pre>

This `examples`{:.language-javascript} project will hold all three examples that we'll eventually embed into our Jekyll-generated article.

The first thing we'll want to do in our `examples`{:.language-javascript} project is to edit `public/index.html`{:.language-javascript} and replace the `root`{:.language-javascript} div with three new divs, `one`{:.language-javascript}, `two`{:.language-javascript}, and `three`{:.language-javascript}: one to hold each of our examples:

<pre class='language-markup'><code class='language-markup'>
&lt;body>
  &lt;noscript>You need to enable JavaScript to run this app.&lt;/noscript>
  &lt;div id="one">&lt;/div>
  &lt;div id="two">&lt;/div>
  &lt;div id="three">&lt;/div>
&lt;/body>
</code></pre>

Next, we'll need to instruct React to render something into each of these divs. We can do that by editing our `src/index.js`{:.language-javascript} file and replacing its contents with this:

<pre class='language-javascript'><code class='language-javascript'>
import React from 'react';
import ReactDOM from 'react-dom';
import "./index.css";

ReactDOM.render(&lt;One />, document.getElementById('one'));
ReactDOM.render(&lt;Two />, document.getElementById('two'));
ReactDOM.render(&lt;Three />, document.getElementById('three'));
</code></pre>

We'll need to define our `One`{:.language-javascript}, `Two`{:.language-javascript}, and `Three`{:.language-javascript} components. Let's do that just below our imports. We'll simply render different colored divs for each of our three examples:

<pre class='language-javascript'><code class='language-javascript'>
const One = () => (
  &lt;div style=&lbrace;{ height: "100%", backgroundColor: "#D7B49E" }} />
);

const Two = () => (
  &lt;div style=&lbrace;{ height: "100%", backgroundColor: "#DC602E" }} />
);

const Three = () => (
  &lt;div style=&lbrace;{ height: "100%", backgroundColor: "#BC412B" }} />
);
</code></pre>

We're currently telling each of our example components to fill one hundred percent of their parents' height. Unfortunately, without any additional information, these heights will default to zero. Let's update our `index.css`{:.language-javascript} file to set some working heights for each of our example divs:

<pre class='language-css'><code class='language-css'>
html, body {
  height: 100%;
  margin: 0;
}

#one, #two, #three {
  height: 33.33%;
}
</code></pre>

If we run our `examples`{:.language-javascript} React application, we'll see each of our colored example divs fill approximately one third of the vertical height of the browser.

<div style="width: 100%; margin: 2em auto;">
  <img src="/img/2019-08-05-embedding-react-components-in-jekyll-posts/example.png" style=" width: 100%;"/>
</div>

## Embedding Our Examples

So now that we've generated our example React components, how do we embed them into our Jekyll post?

Before we start embedding our React examples into a Jekyll post, we need a Jekyll post to embed them into. Let's start by creating a new post in the `_posts`{:.language-javascript} folder of our Jekyll blog, called `2019-08-05-embedding-react-components-in-jekyll-posts.markdown`{:.language-javascript}:

<pre class='language-*'><code class='language-*'>
---
layout: post
title:  "Embedding React Components in Jekyll Posts"
---

Last week I published an article on "clipping convex hulls"...
</code></pre>

Great. Now that we have a post, we need to decide where our examples will go. Within our post, we need to insert three divs with identifiers of `one`{:.language-javascript}, `two`{:.language-javascript}, `three`{:.language-javascript}, to match the divs in our `examples`{:.language-javascript} React project.

Let's place one here:

<div id="one" style="height: 4em;"></div>

Another here:

<div id="two" style="height: 4em;"></div>

And the third just below the following code block that shows off how these divs would appear in our post:

<pre class='language-markup'><code class='language-markup'>
...

Let's place one here:

&lt;div id="one" style="height: 4em;">&lt;/div>

Another here:

&lt;div id="two" style="height: 4em;">&lt;/div>

...

&lt;div id="three" style="float: right; height: 4em; margin: 0 0 0 1em; width: 4em;">&lt;/div>

...
</code></pre>


<div id="three" style="float: right; height: 4em; margin: 0 0 0 1em; width: 4em;"></div>

Notice that we're explicitly setting the heights of our example components, just like we did in our React project. This time, however, we're setting their heights to `4em`{:.language-javascript}, rather than one third of their parents' height. Also notice that the third example is floated right with a width of `4em`{:.language-javascript}. Because our React components conform to their parents properties, we're free to size and position them however we want within our Jekyll post.

At this point, the divs in our post are empty placeholders. We need to embed our React components into the post in order for them to be filled.

Let's go into our `examples`{:.language-javascript} React project and [build the project](https://facebook.github.io/create-react-app/docs/production-build):

<pre class='language-javascript'><code class='language-javascript'>
yarn build
</code></pre>

This creates a `build`{:.language-javascript} folder within our `examples`{:.language-javascript} project. The `build`{:.language-javascript} folder contains the compiled, minified, standalone version of our React application that we're free to deploy as a static application anywhere on the web.

You'll notice that the `build`{:.language-javascript} folder contains everything needed to deploy our application, including an `index.html`{:.language-javascript} file, a `favicon.ico`{:.language-javascript}, our bundled CSS, and more. Our Jekyll project already provides all of this groundwork, so we'll only be needing a small portion of our new build bundle.

Specifically, we want the Javascript files dumped into `build/static/js`{:.language-javascript}. We'll copy the contents of `build/static/js`{:.language-javascript} from our `examples`{:.language-javascript} React project into a folder called `js/2019-08-05-embedding-react-components-in-jekyll-posts`{:.language-javascript} in our Jekyll project.

We should now have three Javascript files and three source map files being served statically by our Jekyll project. The final piece of the embedding puzzle is to include the three scripts at the bottom of our Jekyll post:

<pre class='language-javascript'><code class='language-javascript'>
&lt;script src="/js/2019-08-05-embedding-react-components-in-jekyll-posts/runtime~main.a8a9905a.js">&lt;/script>
&lt;script src="/js/2019-08-05-embedding-react-components-in-jekyll-posts/2.b8c4cbcf.chunk.js">&lt;/script>
&lt;script src="/js/2019-08-05-embedding-react-components-in-jekyll-posts/main.2d35bbcc.chunk.js">&lt;/script>
</code></pre>

Including these scripts executes our React application, which looks for each of our example divs, `one`{:.language-javascript}, `two`{:.language-javascript}, and `three`{:.language-javascript} on the current page and renders our example components into them. Now, when we view our post, we'll see each of our example components rendered in their full, colorful glory!


<script src="/js/2019-08-05-embedding-react-components-in-jekyll-posts/runtime~main.a8a9905a.js"></script>
<script src="/js/2019-08-05-embedding-react-components-in-jekyll-posts/2.b8c4cbcf.chunk.js"></script>
<script src="/js/2019-08-05-embedding-react-components-in-jekyll-posts/main.2d35bbcc.chunk.js"></script>

