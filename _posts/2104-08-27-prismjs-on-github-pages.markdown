---
layout: post
title:  "Prism.js and Github Pages"
date:   2014-08-27 15:19:00
categories:
---

In a previous post I mentioned that I would be using [Prism.js](http://prismjs.com/) as my syntax highlighter. Originally, I tried adding <code class="language-*">prism.rb</code> to my <code class="language-*">_plugins</code> directory. That let me use the prism liquid tag locally:

<pre class="language-*"><code class="language-*">{{ "{% prism javascript "}}%}
    //javascript goes here...
{{ "{% endprism "}}%}
</code></pre>

BUT! After pushing those changes to Github, I recieved a build error email:

> The page build failed with the following error:
>
> The tag `prism` in `_posts/2014-08-26-look-ma-no-wordpress.markdown` is not a recognized Liquid tag. For more information, see [https://help.github.com/articles/page-build-failed-unknown-tag-error](https://help.github.com/articles/page-build-failed-unknown-tag-error).

The link leads to a page explaining how to use [Jekyll plugins with Github Pages](https://help.github.com/articles/using-jekyll-plugins-with-github-pages). Unfortunately, only a handfull of plugins are supported, and Prism isn't one of them.

The workaround solution is to remove <code class="language-*">prism.rb</code> from your <code class="language-*">_plugins</code> directory, and use plain markdown to build your code blocks instead:

<pre class="language-*"><code class="language-*">&lt;pre&gt;&lt;code class="language-javascript"&gt;
    //javascript goes here...
&lt;/pre&gt;&lt;/code&gt;
</code></pre>

Aside from a little more verbosity, the only real downside that I can find with this approach is that if your first line of code is not inline with your <code class="language-*">&lt;pre&gt;&lt;code&gt;</code> line, you will have an extra line break before your first line of code.