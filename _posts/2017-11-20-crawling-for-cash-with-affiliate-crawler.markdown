---
layout: post
title:  "Crawling for Cash with Affiliate Crawler"
excerpt: "I've created a new tool called Affiliate Crawler that's designed to crawl through your written web content, looking for affiliate and referral marketing opportunities."
author: "Pete Corey"
date:   2017-11-20
tags: ["Elixir", "Affiliate Crawler", "Announcement", "Tools", "Web Crawling"]
related: ["/blog/2017/10/09/learning-to-crawl-building-a-bare-bones-web-crawler-with-elixir/", "/blog/2017/11/20/fleshing-out-urls-with-elixir/"]
---

Several weeks ago, I released a monster of an article titled [Learning to Crawl - Building a Bare Bones Web Crawler with Elixir](http://www.east5th.co/blog/2017/10/09/learning-to-crawl-building-a-bare-bones-web-crawler-with-elixir/). I mentioned early on in that post that I was working on a small side-project that involved web crawling.

After a weekend of furious coding, the side project I mysteriously alluded to is now ready to be released to the world!

Without further ado, __check out [Affiliate Crawler](https://www.affiliatecrawler.com/)!__

[Affiliate Crawler](https://www.affiliatecrawler.com/) is a tool designed to help bloggers and content creators monetize their writing through affiliate and referral links. You give the tool a starting URL and it crawls through your website (following internal links), looking for links to external products and services that can be monetized through affiliate or referral programs (Amazon’s Affiliate Program, etc…).

The project largely came out of my search for inoffensive ways of monetizing the [hundreds of articles I’ve produced over the years](http://www.east5th.co/blog/all/) (without making me feel sleazy). Monetization through affiliate and referral linking seems like the best solution.

After spending hours researching affiliate programs and manually grepping through my posts for monetizable links, I realized that there might be value [in automating that process](https://www.affiliatecrawler.com/?http://www.east5th.co/blog/all). And with that blast of inspiration, [Affiliate Crawler](https://www.affiliatecrawler.com/) was born!

<div style="width: 50%; margin: 2em auto;">
  <a href="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/affiliate-crawler-full.png" target="_blank" rel="noopener" style="background-color: transparent;"><img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/affiliate-crawler-cropped.png" style=" width: 100%;"/></a>
  <p style="text-align: center; color: #ccc; margin: 0;">Affiliate Crawler run against this blog.</p>
</div>

As I mentioned, the first version of [Affiliate Crawler](https://www.affiliatecrawler.com/) only took a weekend to build. That short turnaround time was intentional. After spending nearly six months on my last project, [Inject Detect](http://www.injectdetect.com/), I’ve learned the value of validating ideas before pouring your soul into their development.

That said, I’m starting small with a limited feature set and a small collection of affiliate and referral programs. My goal with this release is to see if there’s any potential here. If you’re curious about the nuts and bolts behind the project, [I’ve opened sourced the entire thing](https://github.com/pcorey/affiliate_crawler).

Are you a blogger or a writer? Have you explored affiliate programs as a source of potential revenue? __Do you think this type of tool valuable?__ Let me know! I’d love to [hear from you](https://twitter.com/petecorey).
