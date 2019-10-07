---
layout: post
title:  "Generating Guitar Chords with Cartesian Products"
excerpt: "Cartesian products are an algorithmic superpower. Check out how we can use them to quickly and easily generate all possible guitar chords across the fretboard."
author: "Pete Corey"
date:   2019-10-07
tags: ["Javascript", "Music"]
related: []
---

Given two or more lists, like `[1, 2]`{:.language-javascript} and `[3, 4]`{:.language-javascript}, the [Cartesian product](https://en.wikipedia.org/wiki/Cartesian_product) of those lists contains all ordered combinations of the elements within those lists: `[1, 3]`{:.language-javascript}, `[1, 4]`{:.language-javascript}, `[2, 3]`{:.language-javascript}, and `[2, 4]`{:.language-javascript}. This may not seem like much, but Cartesian products are an algorithmic superpower. Maybe it's [J's subtle influence](http://www.petecorey.com/blog/tags/#j) over my programming style, but I find myself reaching more and more for Cartesian products in the algorithms I write, and I'm constantly awed by the simplicity and clarity the bring to my solutions.

As an example of how useful they can be, let's look at the problem of generating all possible guitar chord voicings, like I do in [Glorious Voice Leader](https://www.gloriousvoiceleader.com/). _As a quick aside, if you want to know more about Glorious Voice Leader, check out [last week's post!](http://www.petecorey.com/blog/2019/09/30/all-hail-glorious-voice-leader/)_

Imagine we're trying to generate all possible [C major](https://en.wikipedia.org/wiki/C_major) chord voicings across a guitar's [fretboard](https://en.wikipedia.org/wiki/Fingerboard). That is, we're trying to find all playable combinations of the notes `C`{:.language-javascript}, `E`{:.language-javascript}, and `G`{:.language-javascript}. How would we do this?

One approach, as you've probably guessed, is to use Cartesian products!

Let's assume that we have a function, `findNoteOnFretboard`{:.language-javascript}, that gives us all the locations (zero-based `string`{:.language-javascript}/`fret`{:.language-javascript} pairs) of a given `note`{:.language-javascript} across the fretboard. For example, if we pass it a `C`{:.language-javascript} (`0`{:.language-javascript} for our purposes), we'll receive an array of `string`{:.language-javascript}/`fret`{:.language-javascript} pairs pointing to every `C`{:.language-javascript} note on the fretboard:

<pre class='language-javascript'><code class='language-javascript'>
[[0,8],[1,3],[1,15],[2,10],[3,5],[3,17],[4,1],[4,13],[5,8]]
</code></pre>

Plotted on an actual guitar fretboard, we'd see all of our `C`{:.language-javascript} notes exactly where we'd expect them to be:

<div id="cs" style="width: 100%;"></div>

Now imagine we've done this for each of our notes, `C`{:.language-javascript}, `E`{:.language-javascript}, and `G`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
let cs = findNoteOnFretboard(frets, strings, tuning)(0);
let es = findNoteOnFretboard(frets, strings, tuning)(4);
let gs = findNoteOnFretboard(frets, strings, tuning)(7);
</code></pre>

The set of all possible voicings of our C major chord, or voicings that contain one of each of our `C`{:.language-javascript}, `E`{:.language-javascript}, and `G`{:.language-javascript} notes, is just the cartesian product of our `cs`{:.language-javascript}, `es`{:.language-javascript}, and `gs`{:.language-javascript} lists!

<pre class='language-javascript'><code class='language-javascript'>
let voicings = _.product(cs, es, gs);
</code></pre>

_We're using the [`lodash.product`{:.language-javascript}](https://www.npmjs.com/package/lodash.product) here, rather than going through the process of writing our own Cartesian product generator._

We can even generalize this to any given array of `notes`{:.language-javascript}, and wrap it up in a function:

<pre class='language-javascript'><code class='language-javascript'>
const voicings = (
  notes,
  tuning = [40, 45, 50, 55, 59, 64],
  frets = 18,
  strings = _.size(tuning)
) =>
  _.chain(notes)
    .map(findNoteOnFretboard(frets, strings, tuning))
    .thru(notesOnFretboard => _.product(...notesOnFretboard))
    .value();
</code></pre>

## Finding Notes on the Fretboard

So that's great and all, but how do we implement our `findNoteOnFretboard`{:.language-javascript} function? With Cartesian products, of course! We'll generate a list of every string and fret position on the fretboard by computing the Cartesian product of each of our possible `string`{:.language-javascript} and `fret`{:.language-javascript} values:

<pre class='language-javascript'><code class='language-javascript'>
const findNoteOnFretboard = (frets, strings, tuning) => note =>
  _.chain(_.product(_.range(strings), _.range(frets)))
    .value();
</code></pre>

Next, we'll need to filter down to just the `string`{:.language-javascript}/`fret`{:.language-javascript} pairs that point to the specified `note`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const isNote = (note, tuning) => ([string, fret]) =>
  (tuning[string] + fret) % 12 === note;

const findNoteOnFretboard = (frets, strings, tuning) => note =>
  _.chain(_.product(_.range(strings), _.range(frets)))
    .filter(isNote(note, tuning))
    .value();
</code></pre>

The `isNote`{:.language-javascript} helper function returns whether the note at the given `string`{:.language-javascript}/`fret`{:.language-javascript} is the `note`{:.language-javascript} we're looking for, regardless of octave.

## Filtering Out Doubled Strings

Currently, our chord voicing generator looks like this:

<pre class='language-javascript'><code class='language-javascript'>
const isNote = (note, tuning) => ([string, fret]) =>
  (tuning[string] + fret) % 12 === note;

const findNoteOnFretboard = (frets, strings, tuning) => note =>
  _.chain(_.product(_.range(strings), _.range(frets)))
  .filter(isNote(note, tuning))
  .value();

const voicings = (
  notes,
  tuning = [40, 45, 50, 55, 59, 64],
  frets = 18,
  strings = _.size(tuning)
) =>
  _.chain(notes)
    .map(findNoteOnFretboard(frets, strings, tuning))
    .thru(notesOnFretboard => _.product(...notesOnFretboard))
    .value();
</code></pre>

Not bad. We've managed to generate all possible voicings for a given chord in less than twenty lines of code! Unfortunately, we have a problem. Our solution generates _impossible_ voicings!

The first problem is that it can generate voicings with two notes on the same string:

<div id="double" style="width: 100%;"></div>

On a stringed instrument like the guitar, it's impossible to sound both the `C`{:.language-javascript} and `E`{:.language-javascript} notes simultaneously. We'll need to reject these voicings by looking for voicings with "doubled strings". That is, voicings with two or more notes played on the same string:

<pre class='language-javascript'><code class='language-javascript'>
const voicings = (
  notes,
  tuning = [40, 45, 50, 55, 59, 64],
  frets = 18,
  strings = _.size(tuning)
) =>
  _.chain(notes)
    .map(findNoteOnFretboard(frets, strings, tuning))
    .thru(notesOnFretboard => _.product(...notesOnFretboard))
    .reject(hasDoubledStrings)
    .value();
</code></pre>

Our `hasDoubledStrings`{:.language-javascript} helper simply checks if the size of the original voicing doesn't match the size of our voicing after removing duplicated strings:

<pre class='language-javascript'><code class='language-javascript'>
const hasDoubledStrings = chord =>
  _.size(chord) !==
  _.chain(chord)
    .map(_.first)
    .uniq()
    .size()
    .value();
</code></pre>

## Filtering Out Impossible Stretches

Unfortunately, our solution has one last problem. It can generate chords that are simply too spread out for any human to play. Imagine trying to stretch your hand enough to play this monster of a voicing:

<div id="stretch" style="width: 100%;"></div>

No good. We'll need to reject these voicings that have an unplayable stretch:

<pre class='language-javascript'><code class='language-javascript'>
const voicings = (
  notes,
  tuning = [40, 45, 50, 55, 59, 64],
  frets = 18,
  maxStretch = 5,
  strings = _.size(tuning)
) =>
  _.chain(notes)
    .map(findNoteOnFretboard(frets, strings, tuning))
    .thru(notesOnFretboard => _.product(...notesOnFretboard))
    .reject(hasDoubledStrings)
    .reject(hasUnplayableStretch(maxStretch))
    .value();
</code></pre>

Let's keep things simple for now and assume that an "unplayable stretch" is anything over five frets in distance from one note in the voicing to another.

<pre class='language-javascript'><code class='language-javascript'>
const hasUnplayableStretch = maxStretch => chord => {
  let [, min] = _.minBy(chord, ([string, fret]) => fret);
  let [, max] = _.maxBy(chord, ([string, fret]) => fret);
  return max - min > maxStretch;
};
</code></pre>

## Expansion and Contraction

Our `voicings`{:.language-javascript} function now generates all possible `voicings`{:.language-javascript} for any given set of `notes`{:.language-javascript}. A nice way of visualizing all of these voicings on the fretboard is with a heat map. Here are all of the C major voicings we've generated with our new Cartesian product powered `voicings`{:.language-javascript} function:

<div id="all" style="width: 100%;"></div>

The darker the fret, the more frequently that fret is used in the set of possible voicings. Click any fret to narrow down the set of voicings.

The Cartesian product, at least in the context of algorithms, embodies the idea of expansion and contraction. I've found that over-generating possible results, and culling out impossibilities leads to incredibly clear and concise solutions.

Be sure to add the Cartesian product to your programming tool box!


<div id="root" style="display: none;"></div>

<style>
#cs, #double, #stretch, #all {
    width: 100%;
}

#all {
    cursor: pointer;
}

#cs .fretboard, #cs canvas,
#double .fretboard, #double canvas,
#stretch .fretboard, #stretch canvas,
#all .fretboard, #all canvas
{
    width: 120% !important;
	margin-left: -10%;
}
</style>


<script src="/js/2019-10-07-generating-guitar-chords-with-cartesian-products/runtime.js"></script>
<script src="/js/2019-10-07-generating-guitar-chords-with-cartesian-products/2.js"></script>
<script src="/js/2019-10-07-generating-guitar-chords-with-cartesian-products/main.js"></script>
