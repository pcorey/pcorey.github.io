---
layout: post
title:  "All Hail Glorious Voice Leader!"
excerpt: "I'm excited to announce the newest addition to my chord-generating family of programs: Glorious Voice Leader! Check out this example of what it's made to do."
author: "Pete Corey"
date:   2019-09-30
tags: ["Announcement", "Music", "Glorious Voice Leader"]
related: []
image: "/img/2019-09-30-all-hail-glorious-voice-leader/cmaj7.png"
---

I’ve been writing code that generates guitar chords [for over a year now](http://www.petecorey.com/blog/tags/#music), in [various languages](https://github.com/pcorey/chord) and with varying degrees of success. My newest addition to this family of chord-creating programs is [Glorious Voice Leader](https://www.gloriousvoiceleader.com/)!

Glorious Voice Leader is an enigmatic <strike>leader</strike> tool who’s mission is to help you [voice lead](https://en.wikipedia.org/wiki/Voice_leading) smoothly between chords. It does this by generating all possible (and some impossible) voicings of a given chord, and sorting them based on the chromatic distance from the previous chord in the progression. 

> Glorious Voice Leader says, __"the less you move, the more you groove!"__

Obviously, this robotic “rule” needs to be tempered by human taste and aesthetic, so the various choices are presented to you, the user, in the form of a [heat map](https://en.wikipedia.org/wiki/Heat_map) laid over a guitar [fretboard](https://en.wikipedia.org/wiki/Fingerboard). The notes in the voicings that Glorious Voice Leader think lead better from the previous chord are darkened, and notes that don’t lead as well are lightened.

To get a grasp on this, let’s consider an example.

Let’s pretend we’re trying to play [a ii-V-I progression](https://en.wikipedia.org/wiki/Ii%E2%80%93V%E2%80%93I_progression) on the guitar in the [key of C](https://en.wikipedia.org/wiki/C_major). When we tell Glorious Voice Leader that our first chord will be a [Dm7](https://en.wikipedia.org/wiki/Minor_seventh_chord), it gives us a heat map of the various initial voicings to choose from:

<div id="d" style="width: 100%;"></div>

With this initial chord, darker notes in the heat map are used more frequently by the generated voicings, and lighter notes are used more rarely. __Click on the notes of the Dm7 voicing you want to start with.__

Once we’ve told Glorious Voice Leader where to start, we can tell it where we want to go next. In our case, our next chord will be a [G7](https://en.wikipedia.org/wiki/Dominant_seventh_chord). Here’s where things get interesting. Glorious Voice Leader generates all possible G7 voicings, and ranks them according to how well they lead from the Dm7 we just picked out.

__Pick out a G7 voicing with darkened notes:__

<div id="g" style="width: 100%;"></div>

Now we tell Glorious Voice Leader that we want to end our progression with a [Cmaj7](https://en.wikipedia.org/wiki/Major_seventh_chord) chord. 

__Choose your Cmaj7 voicing:__

<div id="c" style="width: 100%;"></div>

That's it! With Glorious Voice Leader's help, we've come up with an entire ii-V-I chord progression. Grab yourself a guitar and play through the whole progression. I'm willing to bet it sounded pretty nice.

For this example, we’ve embedded a small, reluctant version of Glorious Voice Leader directly into this page. [Check out the above example in its full-fledged glory](https://www.gloriousvoiceleader.com/#eJyFzrsKAjEQheF3mXqQmUlmc3mVkGKFFIvBoMZClry7iyAKinY/p/g4aYVDuUGknYhaZq9KJEFVHcK5tQ5REE7XuS59KReIKREadMiUM8Kx9ce4ZZ33pW69joEv1Gsw1isbT84I6Ydlf1vPE+4NtcoSxAarYhxPk/uO8l+URr4DVgNJ1A==) at the Glorious Voice Leader website. If you're eager for another example, here's [the entire series of diatonic seventh chords descending in fourths](https://www.gloriousvoiceleader.com/#eJyN08FuwjAMBuB36TmabMd2HF6l6oFJHNDQ0DZ2mFDffWmaQCg5cGmq1Or/1XHH6/Bx+Bt28AZMIuCNfBT2JOSG7/P5kh654et3fzpejoefYTeO4NgFhzhNbvg8X9ZNcgiTG3FdvIvpyg5pKTrt3w+nVHUdlqr8Qqw3qTKvS226mWd3A6H5GBMoiGoktfCKA52lZNow4JGRinIodRTLxlw/XVoOqrCZBlQTUnrSeKclqelKzE2xjAldDJXsikp1XQtig4HUE6+B0AJCOq3IHU7YcjATVlTl2LY1obQmbjTWYrixGEamoBDBlDjqKxLK6avHO+lJqCRXUSrrSWIjUZTAxssAp9nxL/WEHgyaVdKX3AVaZNJKqJEEgNSLQMbMAUz6o7uVSElfPFw8G4k0yYuIG9FNEhoJg7B4NSCJpgrPx9P5i2q85HFZWf6Rco+WMjCV5lsKzNM/8YQgEQ==), as suggested by Glorious Voice Leader.

If you find this interesting, be sure to give [Glorious Voice Leader](https://www.gloriousvoiceleader.com/) a try and let me know what you think! Expect more features and write-ups in the near future.


<div id="root" style="display: none;"></div>

<style>
#d, #g, #c {
    width: 100%;
	cursor: pointer;
}

#d .fretboard, #d canvas,
#g .fretboard, #g canvas,
#c .fretboard, #c canvas
{
    width: 120% !important;
	margin-left: -10%;
}
</style>


<script src="/js/2019-09-30-all-hail-glorious-voice-leader/runtime.js"></script>
<script src="/js/2019-09-30-all-hail-glorious-voice-leader/2.js"></script>
<script src="/js/2019-09-30-all-hail-glorious-voice-leader/main.js"></script>

