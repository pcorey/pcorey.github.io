---
layout: post
title:  "Meteor Velocity: Down the Debugging Rabbit Hole"
titleParts:  ["Meteor Velocity", "Down the Debugging", "Rabbit Hole"]
description: "Dive down a debugging rabbit hole with me as we identify and fix a bug in the Velocity test framework."
author: "Pete Corey"
date:   2015-02-09
tags: ["Javascript", "Meteor", "Testing", "Debugging"]
---

## Meteor Requires Node v0.10.33 or Later

The other day I added [Velocity](http://velocity.meteor.com/) to a [Meteor](https://www.meteor.com/) app (<code class="language-bash">meteor add mike:mocha</code>) and I was greeted with a strange error when the server restarted:

> W20150130-22:24:55.285(-8)? (STDERR) [velocity-mirror] Meteor requires Node v0.10.33 or later.

Hmm. Doesn’t the current version of Meteor (1.0.3) use its own instance of Node v0.10.33? Let’s check...

<pre class="language-bash"><code class="language-bash">% meteor shell
> process.argv[0]
‘/home/pcorey/.meteor/packages/meteor-tool/.1.0.40.moil5k++os.linux.x86_32+web.browser+web.cordova/meteor-tool-os.linux.x86_32/dev_bundle/bin/node’
</code></pre>

<pre class="language-bash"><code class="language-bash">% /home/pcorey/.meteor/packages/meteor-tool/.1.0.40.moil5k++os.linux.x86_32+web.browser+web.cordova/meteor-tool-os.linux.x86_32/dev_bundle/bin/node --version
v0.10.33
</code></pre>

Just like I thought, Meteor is using Node v0.10.33. So where is this error coming from? Let’s do some [monkey patching](http://en.wikipedia.org/wiki/Monkey_patch) to find out!

## Monkey Patching to the Rescue

I started by editing Meteor’s [boot.js](https://github.com/meteor/meteor/blob/devel/tools/server/boot.js) (<code class="language-*" style="white-space: normal;">/home/pcorey/.meteor/packages/meteor-tool/.1.0.40.moil5k++os.linux.x86_32+web.browser+web.cordova/meteor-tool-os.linux.x86_32/tools/server/boot.js</code>). I overwrote <code class="language-*">console.error</code> with my own custom function which [prints the current call stack](http://stackoverflow.com/a/11386493/96048) and then logs the error as usual:

<pre class="language-javascript"><code class="language-javascript">oldConsoleError = console.error;
console.error = function() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;

    oldConsoleError(stack.toString().replace(/,/g,'\n'));
    oldConsoleError.apply(this, arguments);
}
</code></pre>


So now what happens when we start the Meteor server?

<pre class="language-bash"><code class="language-bash">(STDERR) Socket.&lt;anonymous&gt; (/home/pcorey/velocity-test/.meteor/local/build/programs/server/packages/velocity_node-soft-mirror.js:493:17)
(STDERR) Socket.emit (events.js:95:17)
(STDERR) Socket.&lt;anonymous&gt; (_stream_readable.js:764:14)
(STDERR) Socket.emit (events.js:92:17)
(STDERR) emitReadable_ (_stream_readable.js:426:10)
(STDERR) emitReadable (_stream_readable.js:422:5)
(STDERR) readableAddChunk (_stream_readable.js:165:9)
(STDERR) Socket.Readable.push (_stream_readable.js:127:10)
(STDERR) Pipe.onread (net.js:528:21)
(STDERR) [velocity-mirror] Meteor requires Node v0.10.33 or later.
</code></pre>


Interesting… It looks like we should take a look at <code class="language-bash">velocity_node-soft-mirror.js:493</code>:

<pre class="language-javascript"><code class="language-javascript">mirrorChild.getChild().stderr.on('data', function (data) {
    console.error('[velocity-mirror]', data.toString());
}); 
</code></pre>

So this is where the error is coming from. <code class="language-*">mirrorChild</code> is a child node process spawned a few lines earlier:

<pre class="language-javascript"><code class="language-javascript">mirrorChild.spawn({
    command: 'node',
    args: [mainJs],
    options: {
        silent: true,
        detached: true,
        cwd: process.env.PWD,
        env: _.defaults(environment, process.env)
    }
});
</code></pre>

It looks like it’s simply running <code class="language-bash">node</code>, which will use the version of node on the system’s <code class="language-bash">PATH</code>, not Meteor’s bundled version of node. Let’s check what version of node lives on the <code class="language-bash">PATH</code>:

<pre class="language-bash"><code class="language-bash">% node --version
v0.10.25
</code></pre>

Mystery solved. Velocity is spawning a “mirror” instance of Meteor but it’s using whatever instance of node is installed on the machine, not the version bundled with Meteor.

## Fixing the Problem

Interestingly, if we look through the [node-soft-mirror](https://github.com/meteor-velocity/node-soft-mirror) package on Github, we can see that this problem exists in the tagged version [0.2.6 and below](https://github.com/meteor-velocity/node-soft-mirror/blob/v0.2.4/nodeMirrorServer.js#L62), but it was fixed in version [0.2.7](https://github.com/meteor-velocity/node-soft-mirror/blob/v0.2.7/nodeMirrorServer.js#L64). If we take a look at the [meteor-mocha-web](https://github.com/mad-eye/meteor-mocha-web/) project on Github, we can see that it’s [explicitly depending on](https://github.com/mad-eye/meteor-mocha-web/blob/master/package.js#L24) version 0.2.4 of node-soft-mirror.

An easy way to fix this is to explicitly add version 0.2.7 or higher of node-soft-mirror to our project.

<pre class="language-*"><code class="language-*">meteor add velocity:node-soft-mirror@0.3.1
</code></pre>

After that, the Meteor server should start without issue and everything should work as expected.

Well, that was definitely an adventure. It was pretty obvious what was going on after I dug into the internals of the error and how Velocity uses its “mirror”, but hindsight is always 20/20. I’ve filed [a bug](https://github.com/mad-eye/meteor-mocha-web/issues/125) on the meteor-mocha-web project to update their node-soft-mirror package.

## TL;DR

The current version of <code class="language-*">mike:mocha</code> uses the version installed on the system, not the version packaged with Meteor. Explicitly add <code class="language-*">velocity:node-soft-mirror</code> v0.2.7 or above to fix the problem.
