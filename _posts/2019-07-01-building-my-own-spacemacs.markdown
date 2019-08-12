---
layout: post
title:  "Building My Own Spacemacs"
excerpt: "I've decided to ditch Spacemacs in favor of maintaining my own custom Emacs configuration. I couldn't be happier with the result."
author: "Pete Corey"
date:   2019-07-01
tags: ["Emacs"]
related: []
image: "/img/2019-07-01-building-my-own-spacemacs/screenshot2.png"
---

I switched from Vim to [Spacemacs](http://spacemacs.org/) several years ago and have never looked back. At first, Spacemacs offered an amazingly polished and complete editing environment that I immediately fell in love with. But over the years my Spacemacs environment began to fall apart. My config grew stale, I found myself having to write clumsy custom layers to incorporate unsupported Emacs packages, and the background radiation of bugs and glitches started to become unignorable.

At [the suggestion of Andrew on Twitter](https://twitter.com/firstrow/status/1143558783295217664), I decided to ditch Spacemacs completely and roll my own Emacs configuration.

I couldn't be happier with the result!

Before we dive into some of the details, [here's my entire Emacs `init.el`{:.language-lisp} file at the time of posting this article](https://github.com/pcorey/.emacs.d/blob/8d187c56d7e3d931a09398acc91fbd3181093f0a/init.el). My current configuration is modeled after the tiny subset of Spacemacs I found myself using on a day-to-day basis. You can get an idea of my typical workflow by looking at my [General](https://github.com/noctuid/general.el) [key mappings](https://github.com/pcorey/.emacs.d/blob/8d187c56d7e3d931a09398acc91fbd3181093f0a/init.el#L158-L218).

I work on several projects throughout the day, so I use [Projectile](https://github.com/bbatsov/projectile) to manage operations within each of those projects. I use [Perspective](https://github.com/nex3/perspective-el) to isolate buffers between those projects. The `projectile-persp-switch-project`{:.language-lisp} package acts as a nice bridge between the two projects:

<pre class='language-lisp'><code class='language-lisp'>"p" 'projectile-command-map
"pp" 'projectile-persp-switch-project
"pf" 'counsel-projectile
</code></pre>

Spacemacs has the home-grown concept of a "layout" that lets you switch between numbered workspaces. I was worried I would miss this feature, as a common workflow for me was to hit `SPC p l <workspace number>`{:.language-lisp} to switch between various workspaces. Thankfully, I've found that `projectile-persp-switch-project`{:.language-lisp} works just as well if not better that Spacemac's "layout" system. I hit `SPC p p`{:.language-lisp} and then type one or two characters to narrow down onto the project I want. I no longer have to remember workspace numbers, and I don't need to worry about exceeding ten workspaces.

When I'm not using `counsel-projectile`{:.language-lisp} to find files within a project, I use `deer`{:.language-lisp} to navigate directories:

<pre class='language-lisp'><code class='language-lisp'>"a" '(:ignore t :which-key "Applications")
"ar" 'ranger
"ad" 'deer
</code></pre>

The only other external application I use is a terminal, but I use it so frequently I've mapped it to `SPC '`{:.language-lisp}, just like Spacemacs:

<pre class='language-lisp'><code class='language-lisp'>"'" 'multi-term
</code></pre>

I've also included [a few cosmetic customizations](https://github.com/pcorey/.emacs.d/blob/8d187c56d7e3d931a09398acc91fbd3181093f0a/init.el#L49-L59) to build out a distraction-free code editing environment.

<div style="width: 100%; margin: 2em auto;">
  <img src="/img/2019-07-01-building-my-own-spacemacs/screenshot.png" style=" width: 100%;"/>
</div>

<div style="width: 100%; margin: 2em auto;">
  <img src="/img/2019-07-01-building-my-own-spacemacs/screenshot2.png" style=" width: 100%;"/>
</div>

As you can see, I have a fairly simple workflow, and [my custom Emacs configuration reflects that simplicity](https://github.com/pcorey/.emacs.d/blob/8d187c56d7e3d931a09398acc91fbd3181093f0a/init.el). Not only is my configuration simpler, but I've noticed that startup times have reduced significantly, and the number of in-editor bugs and glitches I've encountered as dropped to zero. I've also developed a much deeper understanding of Emacs itself and the Emacs ecosystem.

I couldn't be happier!
