---
layout: post
title:  "Clapping Music with TidalCycles"
excerpt: "Let's use TidalCycles to recreate Steve Reich's \"Clapping Music\", and hopefully learn a thing or two along the way."
author: "Pete Corey"
date:   2020-04-16
image: "/img/2020-04-16-clapping-music-with-tidalcycles/clappingMusic.png"
tags: ["Music", "Tidal"]
related: []
---

I'm always looking for ways of making music with my computer that feels natural to me and fits with my mental model of music creation. As part of that search, I decided to try learning [TidalCycles](https://tidalcycles.org/index.php/Welcome). Tidal is a language embedded into Haskell and designed to write and manipulate patterns to create music.

After [getting set up](https://tidalcycles.org/index.php/Tutorial) and tinkering for a bit, I decided to try using Tidal to create an intentional piece of music. Tidal's focus on patterns made me think of another musician obsessed with patterns and repetition, [Steve Reich](https://en.wikipedia.org/wiki/Steve_Reich). That connection planted a seed in my mind, and I decided to try recreating Steve Reich's [_Clapping Music_](https://en.wikipedia.org/wiki/Clapping_Music) with Tidal:

<video style="width: 100%;" src="/webm/2020-04-16-clapping-music-with-tidalcycles/clappingMusic.webm" controls></video>

The meat of my implementation is in these three statements that describe the shifting rhythm:

<pre class='language-javascript'><code class='language-javascript'>
repeatCycles 4
$ iter "12"
$ n "0 0 0 ~ 0 0 ~ 0 ~ 0 0 ~"
</code></pre>

We start with our base pattern (`n "0 0 0 ~ 0 0 ~ 0 ~ 0 0 ~"`{:.language-javascript}). Next, we use [`iter`{:.language-javascript}](https://tidalcycles.org/index.php/iter) to split that pattern into the twelve variations we'll play throughout the piece. However, we want to repeat each variation for some number of cycles before moving onto the next. It turns out that [`repeatCycles`{:.language-javascript}](https://tidalcycles.org/index.php/repeatCycles) is a nice way of accomplishing this. We repeat each variation for four cycles before moving onto the next.

Because we're repeating each variation of our pattern for four cycles, we'll want to use [`seqP`{:.language-javascript}](https://tidalcycles.org/index.php/seqP) to sequence `13 * 4`{:.language-javascript} cycles of both rhythms to start and end our piece in unison:

<pre class='language-javascript'><code class='language-javascript'>
seqP [
  (
    0,
    13 * 4,
    ...
  ),
  (
    0,
    13 * 4,
    ...
  )
]
</code></pre>

When using `seqP`{:.language-javascript}, it's important to `resetCycles`{:.language-javascript} to make sure we start on cycle `0`{:.language-javascript}.

And that's all there is to it! It's simple in hindsight, but I spent quite a while figuring this out, and learned from many mistakes along the way. The end result was worth it. Rock on, Steve Reich.
