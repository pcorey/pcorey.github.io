---
layout: post
title:  "Chrome LiveReload Extension and Remote Machines"
titleParts: ["Chrome LiveReload Extension", "and Remote Machines"]
description: "The Chrome LiveReload plugin doesn't work well with remote development servers. Here's a workaround."
author: "Pete Corey"
date:   2014-11-05
tags: ["Javascript", "Grunt"]
---

Last night I decided it would be a good idea to join the 21st century and incorporate [LiveReload](http://livereload.com/) into my frontend workflow. Since I’m already using [grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch) to watch my [LESS](http://lesscss.org/)/[SASS](http://sass-lang.com/) files, I figured this would be a breeze. grunt-contrib-watch supports LiveReload out of the box! All that was needed was an options block inside of my watch config:

<pre class="language-javascript"><code class="language-javascript">watch: {
    options: {
        livereload: true,
    },
    ...
</code></pre>

This option spins up a LiveReload server on my dev machine running on port <code class="language-*">35729</code> by default. In order to leverage LiveReload, your client must include the <code class="language-*">livereload.js</code> script served by this service. This can be done by either manually adding a script tag to your project, or using the [Chrome LiveReload extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en). I quickly installed the extension, eagerly pressed the LiveReload button and... got an error!

> Could not connect to LiveReload server. Please make sure that a compatible LiveReload server is running. (We recommend guard-livereload, until LiveReload 2 comes to your platform.)

Strange. My dev server was running on a VM on <code class="language-*">192.168.0.12</code>, so to verify that the LiveReload server was running I went to <code class="language-*">http://192.168.0.12:35729/</code> in the brower. As expected, I received a JSON response from grunt-contrib-watch’s tinylr server:

<pre class="language-javascript"><code class="language-javascript">{
    "tinylr": "Welcome",
    "version": "0.0.5"
}
</code></pre>

Very strange. Livereload was running on my dev machine, but the Chrome extension was unable to connect to it. As a sanity check, I decided to forgo connecting with the browser extension and manually added the <code class="language-*">livereload.js</code> script tag to my project:

<pre class="language-markup"><code class="language-markup">&lt;script src=”http://192.168.0.12:35729/livereload.js”&gt;&lt;/script&gt;
</code></pre>

After reloading the page, I noticed that it was able to successfully pull down the <code class="language-*">livereload.js</code> file and LiveReload changes were taking effect.

While this approach worked, I wasn’t satisfied. I wanted to use the browser extension, not manually include the script in my project. I started digging into the plugin to find out what was going on.

The first thing I did was enable “Developer Mode” in the Chrome extensions window. That allowed me to install and enable the [Chrome Apps & Extensions Developer Tool](https://chrome.google.com/webstore/detail/chrome-apps-extensions-de/ohmmkhmmmpcnpikjeljgnaoabkaalbgc?hl=en). I fired up the Extension Dev Tools, opened the LiveReload console and once again tried to connect to my dev server. The log messages made it clear what was going on:

<pre class="language-*"><code class="language-*">Connecting to ws://127.0.0.1:35729/livereload...
Haven't received a handshake reply in time, disconnecting.
WebSocket connection to 'ws://127.0.0.1:35729/livereload' failed: WebSocket is closed before the connection is established.
Web socket error.
Web socket disconnected.</code></pre>

The LiveReload extension was attempting to connect to <code class="language-*">127.0.0.1</code>, not <code class="language-*">192.168.0.1</code>. A quick look through <code class="language-*">global.js</code> shows that host is hardcoded to <code class="language-*">127.0.0.1</code> in the <code class="language-*">initialize</code> function.

After looking through the github issues for the LiveReload extension project, I found an [unmerged pull request](https://github.com/livereload/livereload-extensions/pull/16) from 2013 by [Greg Allen](https://github.com/jgallen23) that fixed the issue. [Bigwave](https://github.com/bigwave) in the comments had built a version of the extension with the fix and released on the app store as [RemoteLiveReload](https://chrome.google.com/webstore/detail/remotelivereload/jlppknnillhjgiengoigajegdpieppei). After installing this new extension, my LiveReload setup started working without a hitch. Thanks Greg and Bigwave!
