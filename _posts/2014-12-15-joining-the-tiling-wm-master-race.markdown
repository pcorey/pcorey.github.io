---
layout: post
title:  "Joining the Tiling WM Master Race"
date:   2014-12-15
categories:
---

Recently I decided to elevate my [Linux Mint 17.1](http://www.linuxmint.com/) development environment from its plebeian out-of-the-box [Cinnamon](http://cinnamon.linuxmint.com/) origins to its rightful place among the glorious #TilingWMMasterRace. I thought I’d document the process of installing and configuring [bspwm](https://github.com/baskerville/bspwm) to help others looking to do something similar.

## bspwm for dummies

For the initial setup and configuration of bspwm, I recommend you read and follow [Bill Indelicato](http://windelicato.com/)’s excellent guide, [bspwm for dummies](https://github.com/windelicato/dotfiles/wiki/bspwm-for-dummies).  It’s worth noting that in addition to the packages he lists, you should have <code class="language-*">build-essential</code> installed when trying to build bspwm on Linux Mint. The steps in his guide can be distilled down to:

<pre><code class="language-bash">sudo apt-get install vim dmenu rxvt-unicode git build-essential xcb libxcb-util0-dev libxcb-ewmh-dev libxcb-randr0-dev libxcb-icccm4-dev libxcb-keysyms1-dev libxcb-xinerama0-dev
git clone https://github.com/baskerville/bspwm.git
git clone https://github.com/baskerville/sxhkd.git
cd ~/bspwm && make && sudo make install
cd ~/sxhkd && make && sudo make install
mkdir -p ~/.config/bspwm ~/.config/sxhkd
cp ~/bspwm/examples/bspwmrc ~/.config/sxhkd/bspwmrc
cp ~/bspwm/examples/sxhkdrc ~/.config/sxhkd/sxhkdrc
chmod +x ~/.config/bspwm/bspwmrc
echo -e “sxhkd -f 100 & \nexec bspwm” &gt; ~/.xinitrc
</code></pre>

## sxhkdrc changes

I run my linux dev environment as a virtual machine, which means that using super as my bspwm control key can cause issues. Thankfully it’s incredibly simple to remap these [sxhkd](https://github.com/baskerville/sxhkd) hotkey bindings in <code class="language-*">~/.config/sxhkd/sxhkdrc</code>:

<pre><code class="language-bash">sed -i ‘s/super/alt/g’ ~/.config/sxhkd/sxhkdrc
sed -i ‘s/alt + alt/alt + ctrl/g’ ~/.config/sxhkd/sxhkdrc
</code></pre>

## .Xdefaults

<code class="language-*">~/.Xdefaults</code> is where you configure the look and feel of [urxvt](http://software.schmorp.de/pkg/rxvt-unicode.html). I started with a template <code class="language-*">~/.Xdefaults</code> I found online, switched to use Ubuntu Mono and borrowed a nice color scheme I found on this [helpful article](http://blog.z3bra.org/2013/10/home-sweet-home.html). You can see what the [final result](https://github.com/pcorey/dotfiles/blob/master/.Xdefaults) on my github.

## .xinitrc and .xsession

On a system without a graphical login manager, you could simply log into your system and run <code class="language-*">startx</code> to run <code class="language-*">~/.xinitrc</code> and run bspwm. However, Linux Mint uses the [MDM Display Manager](https://github.com/linuxmint/mdm), which means that [X](http://www.x.org/wiki/) is already running when we log in and we need to take an extra step to get bspwm running. Thankfully, all we need to do is make a symbolic link to <code class="language-*">~/.xinitrc</code> called <code class="language-*">~/.xsession</code>. When MDM logs us in, it will execute <code class="language-*">~/.xsession</code>, which will effectively execute our <code class="language-*">~/.xinitrc</code> and run bspwm.

<pre><code class="language-bash">ln -s ~/.xinitrc ~/.xsession
</code></pre>

After making this link, log out, select “Run Xclient script” session and log back in. You should be greeted with a black screen. Hit <code class="language-*">alt + enter</code> to open a terminal.

## sxhkd -f 100

After initially following the steps in bspwm for dummies, I noticed that doing mouse based window resizes was incredibly slow. After a little research, I found this [reddit thread](http://www.reddit.com/r/archlinux/comments/1ynykb/bspwm_compton_really_slow_windows/cfmhq73) that suggested a fix of limiting the maximum frequency for motion events to 100. You can check out [sxhkd.c](https://github.com/baskerville/sxhkd/blob/master/sxhkd.c) on github to see how this works. Look at <code class="language-*">max_freq</code> and <code class="language-*">motion_interval</code>. When a <code class="language-*">max_freq</code> is specified and a <code class="language-*">motion_interval</code> is calculated (> 0), the <code class="language-*">motion_notify</code> method will return early, preventing sxhkd from spamming bspwm with commands.

## Final Thoughts

This should leave you with a minimal, functional and clean bspwm setup. There’s definitely much more that can be done from here, but the road you take is up to you. Check out all of my [dotfiles](https://github.com/pcorey/dotfiles) on github.

<a href="http://i.imgur.com/Pqp4abB.png"><img src="http://i.imgur.com/Pqp4abB.png" alt="My current bspwm setup" style="max-width: 100%;"></a>