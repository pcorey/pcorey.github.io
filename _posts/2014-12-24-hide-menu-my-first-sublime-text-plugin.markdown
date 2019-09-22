---
layout: post
title:  "Hide Menu: My First Sublime Text Plugin"
titleParts: ["Hide Menu", "My First Sublime Text Plugin"]
excerpt: "I've created a Sublime Text plugin to scratch an itch, and I documented the whole process."
author: "Pete Corey"
date:   2014-12-24
tags: ["Python"]
---

My new [bspwm setup](/blog/2014/12/15/joining-the-tiling-wm-master-race/) currently doesn’t have a pretty [GTK](http://www.gtk.org/) theme installed, so the menu in [Sublime Text](http://www.sublimetext.com/3) looks fairly unattractive. With my workflow, whenever I open Sublime Text (<code class="language-*">subl .</code>), the menu is always shown, regardless of if I hid it during my last session. So what’s the solution to hiding the menu at startup? <span style="text-decoration: line-through">Find a plugin, of course! Oh, there are no plugins that do this?</span> Write a plugin, of course!

<a href="http://i.imgur.com/w0JqpLg.png"><img src="http://i.imgur.com/w0JqpLg.png" alt="My current bspwm setup" style="max-width: 100%;"></a>

## Building the Plugin

Unfortunately, I’ve never written a Sublime Text plugin. Thankfully there are many resources to help out a person in my situation. [This post](http://clarknikdelpowell.com/blog/creating-sublime-text-3-plugins-part-1/) explained how to create a new Sublime Text plugin. [This one](http://sublimetexttips.com/execute-a-command-every-time-sublime-launches/) showed how to run code when Sublime Text is started. And finally, [this guy](http://www.reddit.com/r/SublimeText/comments/2oxpcy/hide_menu_on_startup/cmrh3y5) gave me the command I needed to execute to toggle the menu visibility. After testing everything out, I researched how to [submit the plugin](https://sublime.wbond.net/docs/submitting_a_package) to [package control](https://sublime.wbond.net/), and made my [pull request](https://github.com/wbond/package_control_channel/pull/3885). The final result is available via [package control](https://sublime.wbond.net/packages/Hide%20Menu), on [github](https://github.com/pcorey/sublime-hide-menu), and the incredibly simple code is below:

<pre class="language-python"><code class="language-python">import sublime
import sublime_plugin


def plugin_loaded():
    window = sublime.active_window()
    window.run_command("toggle_menu")
</code></pre>

## Problems…

Unfortunately, the plugin has its issues. As mentioned [here](http://www.reddit.com/r/SublimeText/comments/2oxpcy/hide_menu_on_startup/cmrxe7z), with some workflows, Sublime Text will remember the state of the menu’s visibility and the <code class="language-*">toggle_menu</code> command issued by my plugin will show the menu instead of hiding it. As far as I know, there is no way to either detect if the menu is visible before issuing the toggle, or sending some kind of “set visibility” command rather than a toggle. I’ve opened [an issue](https://github.com/pcorey/sublime-hide-menu/issues/1) about this on the project’s github. If you have a solution or any feedback about it, please leave a pull request/comment.
