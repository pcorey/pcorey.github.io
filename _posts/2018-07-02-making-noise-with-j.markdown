---
layout: post
title:  "Making Noise with J"
excerpt: "Let's try to make music with the J programming language and a handful of other helpful tools and utilities."
author: "Pete Corey"
date:   2018-07-02
tags: ["J", "Music"]
related: []
---

I've always been fascinated by live-coded music. Frameworks like [Chuck](http://chuck.cs.princeton.edu/), [Supercollider](https://supercollider.github.io/), [Overtone](http://overtone.github.io/), [Extempore](https://extemporelang.github.io/), and [Sonic PI](https://sonic-pi.net/), along with popular performers and musicians like [Sam Aaron](https://www.youtube.com/watch?v=KJPdbp1An2s) and [Andrew Sorensen](https://www.youtube.com/watch?v=GSGKEy8vHqg) have never ceased to amaze and inspire me.

That said, whenever I've tried to use one of those tools or frameworks to create my own music, I've always quickly given up. Maybe it's because I'm just lazy and learning new things is hard, but I've always told myself that it's because the tools I was using _just didn't fit_ with how I felt programming music should be. Syntactically, ergonomically, and conceptually, the tools just didn't jive.

And then I stumbled across [J](http://jsoftware.com/).

J and [the entire family of APL languages](https://en.wikipedia.org/wiki/APL_(programming_language)) have a beautiful terseness and closeness to the data being operated on. They're also fundamentally designed to operate on arrays, a data structure ripe for musical interpretation. I've convinced myself that if I can learn J, I'll be able to build the live coding environment of my dreams!

That's a big goal, but I'm taking baby steps to get there. Today, I'll show you how I managed to make noise with J.

## Making Noise Without J

My plan for making noise with J doesn't actually involve my J software producing any noise directly. Instead, it'll act as a controller that instructs other software on my machine to make noise on its behalf.

The software making the noise will be [SimpleSynth](http://notahat.com/simplesynth/), which is a small, easy to use MIDI synthesizer. If you're following along, feel free to use any other MIDI synth you'd like, or a full audio workstation like [Ableton](https://www.ableton.com/en/) or even [GarageBand](https://www.apple.com/mac/garageband/).

<div style="width: 60%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/making-noise-with-j/1.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">SimpleSynth.</p>
</div>

When we fire up SimpleSynth, it'll ask which MIDI source it should use. [MIDI](https://en.wikipedia.org/wiki/MIDI) is a protocol that lets us pass around musical information, like when and how loud certain notes should be played, between different devices. SimpleSynth is asking which stream of notes it should listen to and play.

<div style="width: 60%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/making-noise-with-j/3.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Setting up our J virtual device in MIDI Studio.</p>
</div>

I used MacOS' built-in MIDI Studio to create a virtual MIDI channel called "J", with a MIDI port called "Bus 1." After making sure the virtual device was online, I selected it in SimpleSynth.

<div style="width: 60%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/making-noise-with-j/2.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Selecting our J virtual device in SimpleSynth.</p>
</div>

The last piece of the puzzle is finding some way of programmatically sending MIDI messages through my "J Bus 1" to be played by SimpleSynth. Geert Bevin's [SendMIDI](https://github.com/gbevin/SendMIDI) command line tool did just the trick. 

Once installed, we can use SendMIDI to send MIDI notes to SimpleSynth from our command line:

<pre class='language-j'><code class='language-j'>sendmidi dev "J Bus 1" on 60 100
</code></pre>

Turning `on`{:.language-j} note `60`{:.language-j}, with a velocity of `100`{:.language-j} effectively plays a middle C at full volume.

Now we're making music!

## Talking to SendMIDI with J

The next challenge lies in getting J to execute `sendmidi`{:.language-j} commands.

After much searching and head scratching, I learned that J exposes [a wide range of miscellaneous functionality](https://twitter.com/seanstickle/status/1000766939193634825) under [the "foreigns" (`!:`{:.language-j}) verb](http://www.jsoftware.com/help/dictionary/d412.htm). Calling `2!:1 y`{:.language-j} lets you spawn a new process, running whatever command you pass in through `y`{:.language-j}.

Let's try invoking our spawn verb with our `sendmidi`{:.language-j} command:

<pre class='language-j'><code class='language-j'>   2!:1 'sendmidi dev "J Bus 1" on 60 100'
|interface error
|       2!:1'sendmidi dev "J Bus 1" on 60 100'
</code></pre>

After even more searching and head scratching, I realized that I needed to use the fully-qualified `sendmidi`{:.language-j} path when making the call:

<pre class='language-j'><code class='language-j'>   2!:1 '/usr/local/bin/sendmidi dev "J Bus 1" on 60 100'
</code></pre>

I hear sound! Success!

## Making Music with J

While this is great, it's not much better just running our `sendmidi`{:.language-j} command directly from the command line. What would make things even better is if we could build ourselves a `play`{:.language-j} verb that plays any notes passed to it.

For example, if I were to run:

<pre class='language-j'><code class='language-j'>   play 60 64 67
</code></pre>

I'd expect J to construct and execute our `sendmidi`{:.language-j} command, which should play a C major chord:

<pre class='language-j'><code class='language-j'>sendmidi dev "J Bus 1" on 60 100 on 64 100 on 67 100
</code></pre>

After a few brain-expanding weekends of playing around in J, I came up with this version of the `play`{:.language-j} verb:

<pre class='language-j'><code class='language-j'>   on =: ('on ',5|.' 100 ',":)"0
   play =: [:2!:1'/usr/local/bin/sendmidi dev "J Bus 1" ',[:,/on
</code></pre>

The `on`{:.language-j} verb turns an integer note into an "on string" of the format, `'on <note> 100 '`{:.language-j}, and the `play`{:.language-j} verb spawns the result of appending `'/usr/local/bin/sendmidi ...'`{:.language-j} to append mapped over `on`{:.language-j} applied to `y`{:.language-j}.

Put simply, it constructs our `sendmidi`{:.language-j} command and executes it.

We can play a C major chord:

<pre class='language-j'><code class='language-j'>   play 60 64 67
</code></pre>

Or any other chord we want:

<pre class='language-j'><code class='language-j'>   play 60 63 54 70 73
</code></pre>

## Final Thoughts

Please keep in mind that I'm very new to J, and even newer to tacit programming. If you see anything that can be improved, clarified, or corrected, please [let me know](https://twitter.com/petecorey).

I still feel very clunky and slow when it comes to using J. Building this two line program took hours of my time. That said, I feel like there is potential here. As I grow more used to the tacit paradigm and play with other ways of interacting to DAWs and other audio producers, I feel like J might turn into my ideal music creation environment.

Time will tell.
