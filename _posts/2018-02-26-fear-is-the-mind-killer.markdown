---
layout: post
title:  "Fear is the Mind Killer"
description: "I must not fear. Fear is the mind-killer. Fear is the little-death that brings total obliteration."
author: "Pete Corey"
date:   2018-02-26
tags: ["Writing"]
related: []
---

I've had a very stressful week. Stressful times at work don't come often for me, but when they hit, they hit hard.

I'm working on a Node.js-based data ingestion service for a client. Everything is going well. The service is nearly finished, and I'm ready to start testing against simulated production load.

Because the requirements are vague, and the rules surrounding the system are in a constant state of flux, I've built the system in a way to prioritize understanding over performance. Given that, I expect the final solution to be somewhat slow. I'm ready for it. "If the ingestion is too slow", I tell myself, "I'll throw on a few layers of caching and things will be fine!"

I'm wrong.

I start to test the system against simulated production loads, and I realize that it's ridiculously slow. _Unusably slow._ __Unfixably slow.__

The Fear starts to set in. I begin digging into each layer of my system, adding cache layers, swapping list traversals for map lookups, offloading work to the database, adding indexes, and throwing every trick I have at the problem. I'm not getting anywhere and real panic starts to wash over me.

That kind of fear always brings ugly, and often unrelated things to the surface. What if I'm just not good enough to fix this? What if I lose this contract? How will I find another job? What happens when my runway runs out and I can't pay my bills?

I stop.

I breathe.

I force myself to recognize that right now, my stress levels are the deterrent that is keeping me from solving this problem. Every question that rushed into my mind while I was in a pit of fear is intangible and irrelevant.

I start to dig into what I've built with a new set of eyes. Seeing the forest for the trees, I realize that the architecture of my solution just wouldn't work. Some rough, back of the napkin math revealed that it was approximately a `O(n^4)`{:.language-*} solution, with gargantuan values of `n`{:.language-*}.

Rather than give into anguish, I start thinking about other ways to solve the problem. How can I structure the solution to process data in large swaths, rather than sequentially? I start to form a solution. After a day of thinking and sketching, I have a roughly working prototype. __Amazingly, the new prototype is orders of magnitude faster than my original solution.__ It's working!

I log off on a high note.

---- 

The next day I get to work finalizing my new solution.

After another day's work guided by my existing test suite, I'm back up to feature parity with my original solution. Testing against the simulated production load shows that it's still several orders of magnitude faster than my original solution.

However, I soon notice that the ingestion process isn't going as I'd expect. I seem to be skipping over large swaths of data.

Some investigation into my test suite shows that my new solution is broken for a particular data path; the data path used by the production simulation data. The simulated production data fails to satisfy a guard, and a huge portion of the new code I wrote is bypassed. No wonder my new solution is so fast. _It isn't doing anything._

__Instantly the panic from yesterday washes over me.__ It's even worse this time. Now I've actually tried, and I've failed. Thoughts about incompetence and existential dread start to well up, but again, I force myself to stop.

I breathe.

Intuitively and intellectually I know that this new solution is a better one. I just need to find the problem and fix it. After an hour or so of debugging, the problem reveals itself. It was a bug in how I was filtering data. A simple fix with massive performance gains.

Bolstered by this fix, I go on to make several more performance optimizations. At the end of the day, my new solution, now functioning, is even faster than it was in the morning.

---- 

All this is to say that stress, panic, and fear are all very real and unavoidable aspects of professional software development. At least for me.

It always strikes me as interesting that such an inherently analytical field can foster such intense emotions in people. Maybe it has to do with always working at the edge of your skill and the limit of your knowledge. Once you walk off that edge, it can be terrifying.

I don't have many tools for coping with stress. My main tactic is to acknowledge it and put it out of my mind. Sometimes that can be easier said than done.

When I'm deep in the pit of fear, I try to remind myself that __the pit has never done anything for me__. Once you find yourself there, the first step is always to drag yourself out. It's only once you're out that you can assess your situation with a calm, rational mind, and begin the real work of fixing your situation.

> I must not fear. Fear is the mind-killer. Fear is the little-death that brings total obliteration. I will face my fear. I will permit it to pass over me and through me. And when it has gone past I will turn the inner eye to see its path. Where the fear has gone there will be nothing. Only I will remain. <br/> — [Dune](http://amzn.to/2CEBVGg)

How do you handle stress as a software developer? How often does it hit you? Is your fear a constant, subtle thing, or does it hit you like a tsunami, wash you out to sea, and force you to swim for shore?

[Let me know](https://twitter.com/petecorey).
