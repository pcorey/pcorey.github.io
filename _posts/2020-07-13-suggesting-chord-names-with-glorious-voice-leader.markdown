---
layout: post
title:  "Suggesting Chord Names with Glorious Voice Leader"
excerpt: "Glorious Voice Leader now has the ability to display suggestions for chord names that exactly match the notes entered on the fretboard. Try it out with the simplified demo that's been embedded in this post."
author: "Pete Corey"
date:   2020-07-13
tags: ["Music", "Glorious Voice Leader"]
image: "/img/2020-07-13-suggesting-chord-names-with-glorious-voice-leader/chord.png"
related: []
---

[Glorious Voice Leader](http://gloriousvoiceleader.com/), my chord-obsessed side project, now has the ability to turn a collection of notes played on the guitar fretboard into a list of possible chord names. Deciding on a specific chord name is still a very human, very context dependent task, but we can let the computer do a lot of the heavy lifting for us.

<div id="root" style=""></div>

I've included a simplified version of this chord namer to the left. Feel free to click on the frets to enter any guitar chord you'd like the name of. [Glorious Voice Leader](http://gloriousvoiceleader.com/) will crunch the numbers and come up with a list of possible names that exactly describes the chord you've entered, sorted alphabetically.

In the full-fledged [Glorious Voice Leader](http://gloriousvoiceleader.com/) application, this functionality is accessible by simply clicking on the fretboard without first selecting the name of the chord you want. This felt like an intuitive design decision. You might know the shape of a specific chord you want to play in a progression, but you're not sure of its name.

Enter it into the fretboard and [Glorious Voice Leader](http://gloriousvoiceleader.com/) will give you a corresponding list of names. When you click on one of those names, it'll automatically suggest alternative voicings that voice lead smoothly from the previous chord.

The actual code behind this feature is dead simple. We simply filter over our set of all possible chord roots and qualities, and compare the set of notes in each resulting chord with the set of notes entered by the user:

<pre class='language-javascript'><code class='language-javascript'>
let possibleNames = _.chain(qualities)
  .flatMap(quality =>
    _.map(Object.keys(roots), root => {
      return {
        root,
        quality
      };
    })
  )
  .filter(({ root, quality }) => {
    if (_.isEmpty(chord.notes)) {
      return false;
    }
    let chordNotes = _.chain(chord.notes)
      .map(([string, fret]) => (tuning[string] + fret) % 12)
      .uniq()
      .sortBy(_.identity)
      .value();
    let qualityNotes = _.chain(quality.quality)
      .map(note => (roots[root] + note) % 12)
      .sortBy(_.identity)
      .value();
    return _.isEqual(chordNotes, qualityNotes);
  })
  .map(({ root, quality }) => {
    return `${root}${quality.name}`;
  })
  .sortBy(_.identity)
  .value();
</code></pre>

From there we simply present the list of possible chord names to the user in some meaningful or actionable way.

For future work, it would be nice to sort the list of name suggestions in order of the lowest notes they entered on the fretboard. For example, if they entered the notes `C`{:.language-*}, `E`{:.language-*}, `G`{:.language-*}, and `B`{:.language-*} in ascending order, we should sort the `Cmaj7`{:.language-*} suggestion before the `Am9 no 1`{:.language-*} suggestion. As with all of the items on my future work list, there are many subtitles and nuances here that would have to be addressed before it becomes a reality.

I hope you find this helpful. If you find [Glorious Voice Leader](http://gloriousvoiceleader.com/) interesting or useful in any way, please let me know!


<script src="/js/2020-07-13-suggesting-chord-names-with-glorious-voice-leader/runtime-main.2a872957.js"></script>
<script src="/js/2020-07-13-suggesting-chord-names-with-glorious-voice-leader/2.86822c88.chunk.js"></script>
<script src="/js/2020-07-13-suggesting-chord-names-with-glorious-voice-leader/main.9376f2a2.chunk.js"></script>

<style>
canvas {
  width: 100%;
  height: 100%;
}

#root {
  float: left;
  height: 40rem;
  margin: 0 0 0 2rem;
}
</style>
