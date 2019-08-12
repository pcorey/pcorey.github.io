---
layout: post
title:  "Minimal Coding with Spacemacs and Olivetti"
excerpt: "Less is more when it comes to your code editor. Check out how I used Olivetti to configure a visually minimal Spacemacs setup."
author: "Pete Corey"
date:   2018-09-10
tags: ["Emacs"]
related: []
image: "https://s3-us-west-1.amazonaws.com/www.east5th.co/img/minimal-coding-with-spacemacs-and-olivetti/spacemacs.png"
---

As I mentioned [on Twitter](https://twitter.com/petecorey/status/1034631777795493888), I've been experimenting lately with using a visually minimal [Spacemacs](http://spacemacs.org/) setup. I've been using this new setup every day for several weeks, and I'm absolutely in love with it.

Want screenshots and an overview of how it works? Read on!

## But First, Screenshots

[Olivetti is an Emacs package](https://github.com/rnkn/olivetti) designed to create a distraction-free writing experience within your editor. Most of Olivetti's screenshots show it in the context of editing markdown. That makes sense, as the term "distraction-free writing" is usually applied to the context of writing prose.

But what if I want a "distraction-free writing" environment for writing code?

It turns out that Olivetti is still perfectly suited for the job. Check out a few screenshots of my current Spacemacs setup. Note that the screenshots below capture _my entire screen_, from edge to edge. There's nothing behind the curtain here:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/minimal-coding-with-spacemacs-and-olivetti/spacemacs.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Spacemacs with Olivetti.</p>
</div>

I've configured Olivetti to only activate when in `prog-mode`{:.language-lisp}, or in `text-mode`{:.language-lisp}. This means that things like Spacemac's home buffer, and inline terminals retain their original layouts. This distinction has been working beautifully for me so far:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/minimal-coding-with-spacemacs-and-olivetti/spacemacs-with-terminal.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Spacemacs with multiterm.</p>
</div>

## Using Olivetti within Spacemacs

To get Olivetti working with Spacemacs, I needed an Olivetti [layer](https://github.com/syl20bnr/spacemacs/blob/master/doc/LAYERS.org). Unfortunately, an out-of-the-box Spacemacs layer doesn't exist for Olivetti. Thankfully, the process of creating a custom, private layer isn't a difficult one.

{% include newsletter.html %}

We can create a new private layer from within Spacemacs by running the `configuration-layer/create-layer`{:.language-lisp} command with `M-x`{:.language-lisp} (or `SPC`{:.language-lisp} + `:`{:.language-lisp}). Let's call our layer `olivetti`{:.language-lisp}. This creates a new `~/.emacs.d/private/olivetti`{:.language-lisp} folder and populates a `packages.el`{:.language-lisp} file with some boilerplate.

We'll replace the contents of `packages.el`{:.language-lisp} with the following:

<pre class='language-lisp'><code class='language-lisp'>
(defconst olivetti-packages
  '(olivetti))

(defun olivetti/init-olivetti ()
  (use-package olivetti))
</code></pre>

This tells Spacemacs that we need the `olivetti`{:.language-lisp} package, and to use the package once it's been loaded.

Once that's done, we need to edit our Spacemacs configuration file (`SPC f e d`{:.language-lisp}), and add an `olivetti`{:.language-lisp} entry under our `dotspacemacs-configuration-layers`{:.language-lisp} list to instruct Spacemacs to load our new private layer.

<pre class='language-lisp'><code class='language-lisp'>
(defun dotspacemacs/layers ()
  (setq-default
   ...
   dotspacemacs-configuration-layers
   '(
     ...
     olivetti
     )))
</code></pre>

Finally, we need to configure Olivetti to run in `prog-mode`{:.language-lisp} and `text-mode`{:.language-lisp}. We can do this in our `dotspacemacs/user-config`{:.language-lisp} callback:

<pre class='language-lisp'><code class='language-lisp'>
(add-hook 'text-mode-hook (lambda ()
                            (interactive)
                            (message "Olivetti text-mode-hook")
                            (olivetti-set-width 81)
                            (hidden-mode-line-mode)
                            (spacemacs/toggle-vi-tilde-fringe-off)
                            (olivetti-mode 1)))
(add-hook 'prog-mode-hook (lambda ()
                            (interactive)
                            (message "Olivetti prog-mode-hook")
                            (olivetti-set-width 81)
                            (hidden-mode-line-mode)
                            (spacemacs/toggle-vi-tilde-fringe-off)
                            (olivetti-mode 1)))
</code></pre>

I use this opportunity to tune Olivetti and Spacemacs to my liking. Feel free to make any changes you deem necessary.

With that, we're good to go!

## How To Not Get Lost

The key to not getting lost without any visual indicators is to always know where you are!

That may sound like a truism, but visually paring down my code editing environment has made me realize that there is no substitute for deep understanding and mastery of your tools. I don't need a modeline to tell me which mode I'm in if I already know. I don't need a constant reminder of which line I'm on, when I can navigate directly to any given line with `:`{:.language-lisp}.

Many of the visual indicators that modern editors provide are really just noise. I'm not going to say that noise is never helpful, but you can almost always get by without it.

If you're interested in seeing _exactly_ how my Spacemacs is set up, [you can see my entire `.spacemacs`{:.language-path} file here](https://gist.github.com/pcorey/6b8d67d42a90c1c69913f58d211a576f). It's very ugly. I'm warning you now.
