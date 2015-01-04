---
layout: post
title:  "Zapier Named Variables - Scheduling Posts Part 2"
date:   2015-01-05
categories:
---

[Last time](http://1pxsolidtomato.com/2014/12/29/scheduling-posts-with-jekyll-github-pages-and-zapier/), I talked about using [Zapier](https://zapier.com/app/dashboard) to schedule [Jekyll](http://jekyllrb.com/) blog posts with [Github Pages](https://pages.github.com/). I briefly touched on how I wished that Zapier had some kind of string manipulation functionality to help pull a schedule date out of the git commit message. Not long after the post went live, [@zapier](https://twitter.com/zapier) sent me a link that helped me accomplish exactly that.

<blockquote class="twitter-tweet" data-conversation="none" lang="en"><p><a href="https://twitter.com/petecorey">@petecorey</a> Awesome stuff Pete! re: string manipulation, we don&#39;t do much on that front but this may help: <a href="https://t.co/PR9WqbMVVO">https://t.co/PR9WqbMVVO</a></p>&mdash; Zapier (@zapier) <a href="https://twitter.com/zapier/status/549637465133182976">December 29, 2014</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

## Named Variables

[Named variables](https://zapier.com/help/named-variables/) in Zapier allow you to break apart your trigger data into multiple fields accessible from within your zap. In our case, named variables allow us to specify our <code class="language-*">Scheduled</code> field anywhere within our git commit message and then use it when creating our Google Calendar event.

Integrating named variables into the scheduler zap was incredibly simple. First, push a git commit with the <code class="language-*">Scheduled</code> variable somewhere within the commit message:

<pre class="language-*"><code class="language-*">Scheduling this post for Monday, the 5th at 9 in the morning.

Scheduled(1/5/2015 9:00AM)
</code></pre>

After the commit has been pushed to [Github](https://github.com/), I edited the scheduler zap and in step 5, changed the Start and End Date & Time fields from using <code class="language-*">Commit Message</code> to using <code class="language-*">Commit Message Scheduled</code>.

<img src="http://i.imgur.com/Et28RKR.png" style="max-width: 100%;">

That’s it! Now, my git commit messages can contain useful information as well as scheduled dates which can easily be parsed out and used by Zapier.

I've shared an updated template of this zap. You can grab it [here](http://zpr.io/7U7R).