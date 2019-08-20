---
layout: post
title:  "TIL About Node.js' REPL Module"
excerpt: "Today I learned that Node.js ships, out of the box, with a fully functional REPL module that can easily be added to any process. This is a game changer for me when it comes to local development."
author: "Pete Corey"
date:   2019-08-20
tags: ["Javascript", "Node.js"]
related: []
---

Today I learned that Node.js ships with [a `repl`{:.language-javascript} module](https://nodejs.org/api/repl.html) that can be used to spin up a full-featured REPL on any Node.js process. This can be a fantastic tool for debugging a running server, or manually triggering back-end events.

Let's assume that we've built a Node.js server who's entry point is a `server.js`{:.language-javascript} file. Let's also assume that we have a constant (maybe pulled from our environment, maybe elsewhere) called `REPL`{:.language-javascript} who's truthiness determines whether we should start our REPL instance on standard in. Spinning up our REPL is as easy as:

<pre class='language-javascript'><code class='language-javascript'>
if (REPL) {
    require('repl').start();
}
</code></pre>

Once our server starts up, we'll be greeted by a familiar prompt:

<pre class='language-*'><code class='language-*'>
Starting server...
Listening on localhost:8080!
> 
</code></pre>

Fantastic! Normal REPL rules apply. Our server will continue to run and its output will continue to stream to standard out. Our REPL prompt will stick to the bottom of the tail, as expected.

More advanced options can be gleaned from [the `repl`{:.language-javascript} documentation](https://nodejs.org/api/repl.html). Happy REPLing!
