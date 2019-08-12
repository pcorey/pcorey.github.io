---
layout: post
title:  "Rendering ASCII Chord Charts with React"
excerpt: "It's time to move our Chord project to the web. Let's use React to generate ASCII-based guitar chord charts."
author: "Pete Corey"
date:   2018-10-08
tags: ["Javascript", "Music"]
related: []
image: "https://s3-us-west-1.amazonaws.com/www.east5th.co/img/rendering-ascii-chord-charts-with-react/chords.png"
---

A few weeks ago I begrudgingly decided that [my Chord project](https://github.com/pcorey/chord/) needs a web-based front-end. After weighing various options, I decided to implement the heart of the front-end as a [React](https://reactjs.org/)-based [ASCII chord chart renderer](http://localhost:4000/blog/2018/07/30/voice-leading-with-elixir#rendering-chords).

After some initial code sketching, I had a working prototype, and a few revisions later I found myself happy with the final code. Let's dig into it!

## What's the Goal?

Before we start diving into code, let's take a look at what we'll be building.

Our Chord back-end treats chords as either a list of optional numbers representing frets played on specific strings, or a list of optional two-tuples of numbers representing the fret played and the finger used to play that fret. For example, on the back-end we'd represent [a classic open C major chord](https://www.guitar-chords.org.uk/c-major-chord.html) with the following list:

<pre class='language-elixir'><code class='language-elixir'>
[nil, 3, 2, 0, 1, nil]
</code></pre>

And with a common fingering:

<pre class='language-elixir'><code class='language-elixir'>
[nil, {3, 3}, {2, 2}, {0, nil}, {1, 1}, nil]
</code></pre>

Unfortunately, Javascript doesn't have a "tuple" type, so we're forced to represent our chords as either one or two dimensional arrays of numbers. In our front-end, those same chords would be represented like so:

<pre class='language-javascript'><code class='language-javascript'>
[null, 3, 2, 0, 1, null]
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
[null, [3, 3], [2, 2], [0, null], [1, 1], null]
</code></pre>

Our goal is to transform that representation into the following chord chart:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/rendering-ascii-chord-charts-with-react/cmaj.png" style="display: block; margin:1em auto; max-width: 80px;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">C major chord chart.</p>
</div>

Let's get to it!

## Building Our Chart

We'll start by creating a new React component to render a chord passed in through a given `chord`{:.language-javascript} prop, and rendering a styled `pre`{:.language-javascript} element to hold our soon-to-be chord chart:

<pre class='language-javascript'><code class='language-javascript'>
const Chart = styled.pre`
  font-family: "Source Code Pro";
  text-align: center;
`;

export default ({ chord }) => {
  return (
    &lt;Chart/>
  );
};
</code></pre>

Before we render our chord, we'll need to calculate some basic metrics which we'll use throughout the process, and lay out our plan of attack:

<pre class='language-javascript'><code class='language-javascript'>
export default ({ chord, name }) => {
    let { min, max } = getMinAndMax(chord)

  return (
    &lt;Chart>
      {_.chain()
        .thru(buildFretRange)
        .thru(buildFretRows)
        .thru(intersperseFretWire)
        .thru(appendFingering)
        .thru(attachLeftGutter)
        .thru(joinRows)
        .value()}
    &lt;/Chart>
  );
};
</code></pre>

The `getMinAndMax`{:.language-javascript} helper is defined globally inside our module and simply filters out unplayed frets and returns an object consisting of the minimum fret used in the chord (`min`{:.language-javascript}), and the maximum fret used in the chord (`max`{:.language-javascript}):

<pre class='language-javascript'><code class='language-javascript'>
const getMinAndMax = chord =>
  _.chain(chord)
    .map(string => (_.isArray(string) ? string[0] : string))
    .reject(_.isNull)
    .thru(frets => ({
      min: _.min(frets),
      max: _.max(frets)
    }))
    .value();
</code></pre>

Once we're armed with these metrics, we can see that our game plan is to build our range of frets (`buildFretRange`{:.language-javascript}), build each of our fret rows (`buildFretRows`{:.language-javascript}), intersperse our fret wire between those fret rows (`intersperseFretWire`{:.language-javascript}), append any fingering instructions that were passed in with our `chord`{:.language-javascript} (`appendFingering`{:.language-javascript}), attach the left gutter (`attachLeftGutter`{:.language-javascript}), and join everything together (`joinRows`{:.language-javascript}).

{% include newsletter.html %}

Now we need to build out each of these component pieces.

## Divide and Conquer

With `min`{:.language-javascript} and `max`{:.language-javascript} in scope, we can easily build a helper function to build our fret range:

<pre class='language-javascript'><code class='language-javascript'>
const buildFretRange = () => _.range(min, Math.max(max + 1, min + 5));
</code></pre>

Notice that we're enforcing a minimum height on our chord chart. If the range of our chord is less than five frets, we'll render enough empty frets at the bottom of the chart to fill the remaining space.

Our resulting range is a range of numbers, one for each fret used in the span of our chord.

---- 

Once we have our chord's range, we can transform each of the frets in that range into a renderable representation of a fret row:

<pre class='language-javascript'><code class='language-javascript'>
const buildFretRows = frets =>
  _.map(frets, fret =>
    _.chain(_.range(chord.length))
      .map(
        string =>
          (_.isArray(chord[string]) ? chord[string][0] : chord[string]) ==
          fret ? (
            &lt;Finger>{fret == 0 ? "○" : "●"}&lt;/Finger>
          ) : (
            &lt;Wire>{fret == 0 ? "┬" : "│"}&lt;/Wire>
          )
      )
      .value()
  );
</code></pre>

We start by mapping over each `fret`{:.language-javascript} in our list of `frets`{:.language-javascript}. For each `fret`{:.language-javascript}, We map over each of the strings in our chord (`_.range(chord.length)`{:.language-javascript}). Next, we check if each `string`{:.language-javascript} and `fret`{:.language-javascript} combination is being played in our current chord. If it is, we render either a `●`{:.language-javascript} symbol, if the fret is being fingered, or a `○`{:.language-javascript} symbol if we're playing an open string.

If we're not playing the `string`{:.language-javascript}/`fret`{:.language-javascript} combination, we render a fret wire with either the `┬`{:.language-javascript} symbol used to represent the nut of the guitar, or the `│`{:.language-javascript} symbol used to represent an unfretted string.

Both `Finger`{:.language-javascript} and `Wire`{:.language-javascript} are simply styled `span`{:.language-javascript} elements:

<pre class='language-javascript'><code class='language-javascript'>
const Finger = styled.span`
  font-weight: bold;
`;

const Wire = styled.span``;
</code></pre>

---- 

At this point, our chord chart is starting to take shape, but without any horizontal fret wire or fret markers, it's a bit disorienting to look at:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/rendering-ascii-chord-charts-with-react/withoutFretwire.png" style="display: block; margin:1em auto; max-width: 80px;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">C major chord chart without fret wire.</p>
</div>

Let's clear things up a bit by interspersing fret wire between each of our fret rows:

<pre class='language-javascript'><code class='language-javascript'>
const intersperseFretWire = rows =>
  _.flatMap(rows, row => [
    row,
    &lt;Wire>{`├${_.repeat("┼", chord.length - 2)}┤`{:.language-javascript}}&lt;/Wire>
  ]);
</code></pre>

We use Lodash's `flatMap`{:.language-javascript} to append a `Wire`{:.language-javascript} component after each of our fret rows. This leaves us with an array of alternating fret rows and fret wires.

---- 

Some chords come complete with fingering suggestions. We'll place those suggestions below our chord chart:

<pre class='language-javascript'><code class='language-javascript'>
const appendFingering = rows => [
  ...rows,
  &lt;Fingering>
    {_.chain(chord)
      .map(fret => (_.isArray(fret) ? fret[1] : " "))
      .value()}
  &lt;/Fingering>
];
</code></pre>

Note that the `Fingering`{:.language-javascript} component is just a (un-)styled `span`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const Fingering = styled.span``;
</code></pre>

----

We're almost finished. Some chords are played further up the neck than others. Without indicating where the nut of our guitar is, a player has no way of orienting themselves.

Let's give the readers of our charts some grounding by labeling the lowest fret of our chart in a left gutter:

<pre class='language-javascript'><code class='language-javascript'>
const attachLeftGutter = rows =>
  _.map(rows, (row, i) => (
    &lt;Fragment>
      &lt;Label>{i == 0 && min != 0 ? _.pad(min, 2) : "  "}&lt;/Label>
      {row}
    &lt;/Fragment>
  ));
</code></pre>

React's [new `Fragment`{:.language-javascript} syntax](https://reactjs.org/docs/fragments.html) gives us a nice way of combining multiple rendered components without introducing extra DOM cruft.

Notice that we're not rendering fret labels for open chords. Because we're rendering the nut using special symbols (`┬`{:.language-javascript}), we don't need to indicate that the chord starts on fret zero.

## Final Thoughts

That's all there is to it. We can use our new component to render a wide variety of chords:

<pre class='language-javascript'><code class='language-javascript'>
&lt;Chord chord={[null, 10, 10, 9, 12, null]} />
&lt;Chord chord={[null, 8, 10, 9, 10, null]} />
&lt;Chord chord={[null, 3, 8, 6, 9, null]} />
&lt;Chord chord={[null, [3, 3], [2, 2], [0, null], [1, 1], null]} />
&lt;Chord chord={[null, [10, 2], [10, 3], [9, 1], [12, 4], null]} />
</code></pre>

All of which look beautiful when rendered in glorious ASCII!

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/rendering-ascii-chord-charts-with-react/chords.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our chords.</p>
</div>

Be sure to check out [the entire project on Github](https://github.com/pcorey/chord-chart/), and while you're at it, check out [the refactor of my original solution done by Giorgio Torres](https://github.com/pcorey/chord-chart/pull/1). Giorgio swooped in [after I complained](https://twitter.com/petecorey/status/1035657245457928192) that my first iteration was some of the ugliest React I've ever written and contributed his highly-polished solution. Thanks Giorgio!
