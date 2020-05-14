---
layout: post
title:  "Adding More Chords to Glorious Voice Leader"
excerpt: "Algorithmically generating \"all possible\" chord qualities is a suprisingly complex task. Read about how I took a hybrid approach to account for the ambiguities and asymmetries of how humans name chords."
author: "Pete Corey"
date:   2020-05-14
tags: ["Music", "Glorious Voice Leader"]
related: []
---

Prior to its latest release, [Glorious Voice Leader](http://gloriousvoiceleader.com/) only let you choose from a pitifully small selection of chords to build a progression with. For a tool who's primary purpose is to guide you through the wondrous world of guitar harmony, this was inexcusable.

[Glorious Voice Leader](http://gloriousvoiceleader.com/) was in dire need of more chord types.

That said, faced with the enormous data entry task of manually adding every chord quality I could think of (of which, [here are a few](https://en.wikipedia.org/wiki/Chord_letters)), my programmer instincts kicked in. "Music is theory is an organized, systematic area of study," I told myself. "There has to be a way to algorithmically generate all possible chord qualities," my naive past self believed.

What a poor fool.

## What's the Problem?

I've written and re-written this post a handful of times now, and each time I've failed to sufficiently capture the complexity of the task at hand. Regardless of the direction I've tackled it from, be it generating names directly and inferring notes from that name, or inferring a name from a collection of notes, this is an incredibly complicated problem.

Music is art, and music theory exists to describe it. And unfortunately for me, people have been describing music in various ways for _a very long time_. This means that music theory is deeply cultural, _deeply rooted in tradition_, and not always as systematic as we'd like to believe it to be.

The first thing we need to do when coming up with "all possible chord qualities" is deciding which tradition we want to follow. For the purposes of [Glorious Voice Leader](http://gloriousvoiceleader.com/), I'm largely concerned with the jazz tradition of chord naming, which has largely evolved to [describe chords used in modern popular music](https://en.wikipedia.org/wiki/Lead_sheet).

But even within a single niche, ambiguities and asymmetries abound!

A "maj7/6" chord has the same notes as a "maj13 no 9", assuming _your_ "maj13" chords don't have an 11th.

Some folks assume that a "maj13" chord includes a natural 11th. Some assume it includes a sharpened 11th. Other still assume that the 11th is omitted by entirely from a "maj13" chord.

Is "aug9" an acceptable chord name, or should it be "9#5"? Both qualities share the same set of notes, and both should be understandable to musicians, but only the latter is the culturally accepted name.

Speaking of alterations like "#5" and "b9", which order should these appear in the chord name? Sorted by the degree being altered? Or sorted by importance? More concretely, is it a "7b9#5" chord, or a "7#5b9"? 

Many notes in a chord are optional, _including the root note_! A Cmaj13 without a 1st, or 5th is perfectly acceptable. Even the third can be optional. But is a Cmaj13 without a 1st, 3rd, and 5th still a Cmaj13? At what point does a chord with missing notes cease to be that chord?

The subtleties and nuances goes on an on.

## A More Human Approach

Rather than fully automating the generation of chord qualities and names through algorithmic means, I decided to take a more human approach. I start with a large set of human-accepted chord formulas and their corresponding names:

<pre class='language-javascript'><code class='language-javascript'>
const baseQualities = [
  ["maj", "1 3 5"],
  ["maj6", "1 3 5 6"],
  ["maj/9", "1 3 5 9"],
  ["maj6/9", "1 3 5 6 9"],
  ["maj7", "1 3 5 7"],
  ...
]
</code></pre>

From there, we can modify our formulas to specify which notes in the chord are optional. It's important to note that when specifying optional notes, any or all of those notes may be missing and the name must still make sense.

<pre class='language-javascript'><code class='language-javascript'>
const baseQualities = [
  ["maj", "1 3 5"],
  ["maj6", "1 3 (5) 6"],
  ["maj/9", "1 3 (5) 9"],
  ["maj6/9", "(1) 3 (5) 6 9"],
  ["maj7", "(1) 3 (5) 7"],
  ...
]
</code></pre>

So a chord with a formula of "1 3 5 6 9", "3 5 6 9", "1 5 6 9", or "3 6 9" can still be considered a "maj6/9" chord.

For ever `[name, formula]`{:.language-javascript} pair, we'll tease out the full set of scale `degrees`{:.language-javascript} and the set of `optionals`{:.language-javascript}. From there, we find all `_.combinations`{:.language-javascript} of those `optionals`{:.language-javascript} that we'll remove from the list of `degress`{:.language-javascript}. For each combination, the `degrees`{:.language-javascript} without the `missing`{:.language-javascript} degrees creates a new formula and name specifying which degrees are missing:

<pre class='language-javascript'><code class='language-javascript'>
export const qualities = _.chain(baseQualities)
  .flatMap(([name, formula]) => {
  
    let degrees = _.chain(formula)
      .split(/\s+/)
      .map(degree => _.trim(degree, "()"))
      .value();
    
    let optionals = _.chain(formula)
      .split(/\s+/)
      .filter(degree => _.startsWith(degree, "("))
      .map(degree => _.trim(degree, "()"))
      .value();
    
    return _.chain(_.range(_.size(optionals) + 1))
      .flatMap(i => _.combinations(optionals, i))
      .map(missing => {
        let result = {
          name: _.chain(missing)
            .map(degree => `no ${_.replace(degree, /#|b/, "")}`)
            .join(" ")
            .thru(missingString => _.trim(`${name} ${missingString}`))
            .value(),
          formula: _.chain(degrees)
            .without(...missing)
            .join(" ")
            .value()
        };
        result.value = JSON.stringify(result);
        return result;
      })
      .value();
  })
  ...
</code></pre>

Some formulas have so many optional notes that the removal of enough of them results in a chord with less than three notes. We don't want that, so we'll add one final filter to our `qualities`{:.language-javascript} chain:

<pre class='language-javascript'><code class='language-javascript'>
export const qualities = _.chain(baseQualities)
  .flatMap(([name, formula]) => { ... })
  .reject(({ degrees, parent, missing }) => {
    return _.size(degrees) < 3;
  })
  .value();
</code></pre>

And that's all there is to it.

## Final Thoughts

From a set of eighty two `baseQualities`{:.language-javascript} that I entered and maintain by hand, this algorithm generates three hundred twenty four total qualities that users of [Glorious Voice Leader](http://gloriousvoiceleader.com/) are free to choose from.

This list is by no means exhaustive, but with this approach I can easily change and add to it, without concern for the oddities and asymmetries of how actual humans name the chords they play.

A part of me still believes that an algorithmic approach can generate chord quality names that fall in line with human expectations, but I haven't found it. I imagine this is one of those problems that will live in the back of my mind for years to come.
