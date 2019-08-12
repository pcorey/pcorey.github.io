---
layout: post
title:  "Being John Malkovich on Twitter"
date:   2017-11-13
excerpt: "I've created a script that injects a healthy dose of empathy injected into your Twitter experience. Experience what it's like being John Malkovich on Twitter."
author: "Pete Corey"
tags: ["Javascript", "Experiments"]
---

Twitter is a weird place. 

I’ll be the first to admit that expressing yourself through text is hard enough as it is. Adding a ~~one hundred forty~~ two hundred eighty character restriction to the mix seems to inspire the worst in people. Based on how I see people treat one another on Twitter, it seems that hate is the most compressible emotion.

Maybe it was having someone explain the importance of building inclusive safe spaces, while in the same breath discussing the necessity of [shared-blocking and network-based blocking](https://blocktogether.org/) (i.e. "Oh, this person follows Milo? Kick them in the shins!”). Maybe it was my fiancé reading passages of [The Bhagavad Gita](http://amzn.to/2jajFAF) as I drifted off to sleep. Or maybe I’ve just watched [Being John Malkovich](http://amzn.to/2zrzG9t) one too many times.

Whatever the cause, I was inspired.

What if our day-in-day-out Twitter experience was forcibly injected with a healthy dose of empathy? After a few minutes of tinkering, I had a script that would literally put yourself in the e-shoes of everyone you encounter on Twitter:

<pre class='language-javascript'><code class='language-javascript'>
setInterval(() => {
    var fullname = $(".DashboardProfileCard-name").text().trim();
    var username = $(".DashboardProfileCard-screennameLink .u-linkComplex-target").text().trim();
    var pic = $(".DashboardProfileCard-avatarImage").attr("src");
    $(".fullname").text(fullname);
    $(".js-user-profile-link b, .ProfileCard-screennameLink .u-linkComplex-target").text(username);
    $(".js-action-profile-avatar, .js-user-profile-link").attr("src", pic);
}, 250);
</code></pre>

The script simply replaces everyone’s full name, screen name, and profile picture with your own. The `setInterval`{:.language-javascript} is a stopgap solution to make sure this replacement happens for any new tweets or modals that appear on screen during your browsing.

If you’re hesitant to run random scripts in your console, as you should be, check out this short demo:

<video width="100%" style="margin: 2em 0;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/Being+John+Malkovich+on+Twitter.webm" autoplay loop controls></video>

As silly as this change might seem, browsing through Twitter like this has had a real, visceral affect on me. 

What I think is especially interesting is that this script seems to (temporarily) trick my brain into asking “why did I tweet that”, instead of “why did they tweet that?”, which seems to trigger wholly other criteria for evaluation and judgement.

I strongly encourage you to try it out for yourself. If even just for a few minutes.

> When he sees all being as equal <br/>
> in suffering or in joy <br/>
> because they are like himself, <br/>
> that man has grown perfect in yoga. <br/>
> [The Bhagavad Gita](http://amzn.to/2jajFAF)
