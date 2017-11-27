---
layout: post
title:  "Thinking Out Loud About Screencasting Platforms"
titleParts: ["Thinking Out Loud About", "Screencasting Platforms"]
description: "I've been thinking out loud lately about building a screen-casting platform designed for software developers."
author: "Pete Corey"
date:   2014-11-21
tags: []
---

One of my goals over the past few months has been to start live streaming/screencasting my development sessions. I’ve been watching [Izac Filmalter’s Twitch stream](http://www.twitch.tv/izakfilmalter) for the past few days and I think it’s fantastic! Streaming can benefit both the streamer (me) and the community at large (you). Developing to an audience would force me to polish not only the products I create, but also the process I go through to create them. Explaining what I’m doing to you would reinforce my understanding of the topic, and hopefully provide you with some value as well. Plus, in a pinch I can use you as a [rubber ducky](http://en.wikipedia.org/wiki/Rubber_duck_debugging).

## Current Options

There are a few existing options when it comes to streaming services and platforms, but all of them have their drawbacks.

* [On Air Hangouts](https://plus.google.com/hangouts/onair) - Google’s On Air Hangouts are essentially hangout sessions that you can broadcast to any number of viewers for free. Unfortunately, On Air stream quality maxes out at 720p.

* [Twitch.tv](http://www.twitch.tv/) - Twitch.tv is a video game streaming platform with a fantastic community. Twitch supports source resolution streaming, but requires that you stream your content directly to their RTMP servers, which can be a barrier to entry. Their terms of use also state that only video game related streaming is allowed. If it weren’t for this policy, I would say that twitch is currently the best streaming option available.

* [Youtube Live](https://www.youtube.com/yt/playbook/live.html) - Youtube Live is the best alternative to Twitch. They support up to 1080p streaming, but like Twitch, they require that you manually stream your content directly to their RTMP server.

While configuring [OBS](https://obsproject.com/) or [FMLE](http://www.adobe.com/products/flash-media-encoder.html) to stream to Twitch or Youtube Live’s RTMP ingestion servers is relatively straightforward, it’s an unneeded barrier to entry when technologies like [WebRTC](http://www.webrtc.org/) exist.

So, what’s a developer to do when he wants to screencast differently?

## BYOPWWRTC (Build Your Own Platform With WebRTC)

[WebRTC](http://www.webrtc.org/) is a newly emerging browser technology that (among a huge number of other things) allows for the capture and streaming of video and audio directly within the browser. Since WebRTC works directly within the browser, no external streaming software is required. WebRTC can set up to peer-to-peer streaming directly to a small number of viewers, or the stream can be routed through a centralized server ([MCU](http://en.wikipedia.org/wiki/Multipoint_control_unit)) to be broadcast to a wider audience. Building a screencasting platform on WebRTC seems like an obvious choice. We get the ease of use of browser based streaming, up to [1080p quality](https://code.google.com/p/webrtc/issues/detail?id=1750), and the possibilities of both peer-to-peer and centralized architectures.

Imagining the finalized product, peer-to-peer streaming would always be free as it puts no load on the system (other than page views). Depending on your machine/network capabilities, you will have a limited number of viewers to whom you can effectively peer-to-peer stream. After that limit is reached, the system would suggest you start using a centralized streaming model. This may need to be a paid service to support the MCU infrastructure.

Since this would be a platform targeted towards developers, I can imagine a variety of cool features like Github/Bitbucket integration, similar screencaster discovery (based on stack, framework, language, project, etc...), in-chat syntax highlighting, and many others.

## Inspiring Resources

* [Google I/O 2013 WebRTC Presentation](https://www.youtube.com/watch?v=p2HzZkd2A40)
* [Slides for above presentation](http://io13webrtc.appspot.com/#1)
* [WebRTC Experiments](https://www.webrtc-experiment.com/)
* [Talky.io](https://talky.io/)
* [SimpleWebRTC](https://simplewebrtc.com/)
* [otalk](https://otalk.org/)
* [Licode](http://lynckia.com/licode/index.html)
* [Jitsi Videobridge](https://jitsi.org/Projects/JitsiVideobridge)
* [Janus](http://janus.conf.meetecho.com/)

## Final Thoughts

At the moment this is nothing more than an idea. I am by no means a WebRTC expert. I've only recent started researching this topic, but WebRTC seems like an ideal solution for this problem. In the very near future, I will hopefully start building out a proof of concept of the peer-to-peer streaming system. Once that's up and running I would be able to stream the continued developement of the project. Stay tuned!
