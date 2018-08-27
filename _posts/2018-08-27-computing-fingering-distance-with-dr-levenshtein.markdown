---
layout: post
title:  "Computing Fingering Distance with Dr. Levenshtein"
description: "In this article I get by with a little help from my friend, Vladimir Levenshtein, and algorithmically computer the fingering distance between two guitar chords."
author: "Pete Corey"
date:   2018-08-27
tags: ["Elixir", "Music"]
related: ["/blog/2018/07/30/voice-leading-with-elixir/", "/blog/2018/08/13/algorithmically-fingering-guitar-chords-with-elixir/"]
image: "https://s3-us-west-1.amazonaws.com/www.east5th.co/img/computing-fingering-distance-with-dr-levenshtein/1.png"
---

Jumping off after our previous two articles on [Voice Leading with Elixir](/blog/2018/07/30/voice-leading-with-elixir/), and [Algorithmically Fingering Guitar Chords with Elixir](/blog/2018/08/13/algorithmically-fingering-guitar-chords-with-elixir/), we're left with a series of chord voicings ranked according to how well they voice lead from our starting chord, and the set of all possible fingerings for each of these voicings.

Given that our starting chord has a known fingering, which fingering of each of these "best" voicings is the "easiest" to play after our starting chord?

This is an interesting question, and gives us the opportunity to flex our algorithmic muscles again. This time we'll be basing our solution on a modified version of [the Levenshtein distance algorithm](https://en.wikipedia.org/wiki/Levenshtein_distance) for finding the "edit distance" between two strings.

## What is "Fingering Distance"?

The term "fingering distance" is my way of referring to how difficult it is to transition from playing one chord on the guitar to another. For example, going from playing a Dm chord on the middle four strings to an Em chord is easy. We just have to slide the shape up two frets.

However, starting on that same Dm chord and playing an Em chord on the top four strings is a more difficult transition. We need to change positions on the fretboard, and every finger in the chord needs to be moved.

---- 

The family of ["edit distance" algorithms](https://en.wikipedia.org/wiki/Edit_distance) tackles a similar problem. How difficult is it to transform one string into another, given a set of operations with fixed costs?

The Levenshtein distance algorithm is an example of an "edit distance" algorithm with three operations: insertion, deletion, and substitution. The Levenshtein distance between `kitten`{:.language-elixir} and `sitting`{:.language-elixir} is `3`{:.language-elixir}, where the `k`{:.language-elixir} is substituted for an `s`{:.language-elixir}, and `e`{:.language-elixir} is substituted for `i`{:.language-elixir}, and the `g`{:.language-elixir} is inserted at the end of the word.

In the classic Levenshtein distance algorithm each of the three basic operations has a unit cost (a cost of `1`{:.language-elixir}). [This doesn't always have to be the case](https://twitter.com/eugico/status/1029129770271993857). We can modify the algorithm to use our own set of operations, like "place finger", "lift finger", "move finger", and "slide finger" to model how we transition from one chord to another. These operations might have a variable weight, depending on the operation and how far each finger has to move:

* Placing and lifting a finger both seem similarly difficult. Let's give both of these operations a constant unit cost.

* Moving from the fifth fret, fifth string to the fifth fret, fourth string seems fairly simple, but moving from the fifth fret, fifth string to the second fret, third string would be more difficult. We'll give the "move finger" operation a weight dependent on the distance we have to move.

* Sliding a finger up or down a string seems to be special sub-case of the "move finger" operation. I would argue that sliding a finger from any fret to any other fret on a string is roughly the same difficult. We'll give the "slide finger" operation a constant unit cost.

Let's use this as a jumping off point for building our "fingering distance" calculator.

## Calculating Fingering Distance

Let's start by defining a new module that will hold our new `distance/2`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Chord.Distance.Fingering do
  def distance(chord, chord),
    do: 0
end
</code></pre>

Obviously, if we pass in two identical chords, the distance between them is `0`{:.language-elixir}.

A more interesting case occurs when we're comparing a chord with one or more notes to an empty list. The total distance between these two "chords" is our "place finger" cost applied to each of the remaining notes in our `chord`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def distance(chord, []),
  do:
    chord
    |> Enum.reject(&(&1 == nil))
    |> length
</code></pre>

We'll need to handle the inverse case as well:

<pre class='language-elixir'><code class='language-elixir'>
def distance([], chord),
  do:
    chord
    |> Enum.reject(&(&1 == nil))
    |> length
</code></pre>

The real meat of the algorithm comes into play when it's time to determine the distance between two non-empty chords:

<pre class='language-elixir'><code class='language-elixir'>
def distance([note_a | rest_a] = chord_a, [note_b | rest_b] = chord_b),
  do:
    Enum.min([
      distance(rest_a, chord_b) + 1,
      distance(chord_a, rest_b) + 1,
      distance(rest_a, rest_b) + note_distance(note_a, note_b)
    ])
</code></pre>

As you can see, our `distance/2`{:.language-elixir} function is recursive. At every level of recursion, we calculate the distance required to transform `chord_a`{:.language-elixir} into `chord_b`{:.language-elixir} by first:

* Lifting a finger from `chord_a`{:.language-elixir}.
* Lifting a finger from `chord_b`{:.language-elixir}.
* Moving `note_a`{:.language-elixir} to `note_b`{:.language-elixir}.

The initial choice with the lowest final cost is the choice we pick. Our decision ripples up through our stack until we're left with the final, minimal cost of transitioning from `chord_a`{:.language-elixir} to `chord_b`{:.language-elixir}.

Thank you, [Dr. Levenshtein](https://en.wikipedia.org/wiki/Vladimir_Levenshtein)!

## Calculating Note Distance

As we've seen, both placing and lifting a finger have constant unit costs. The real magic of our fingering distance algorithm happens in the `note_distance/2`{:.language-elixir} helper function, where we calculating the cost of moving fingers between frets ands strings.

We'll start with some trivial base cases. If the two notes we're comparing are the same, the distance between them is `0`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def note_distance(note, note),
  do: 0
</code></pre>

If the first "note" is `nil`{:.language-elixir}, we're actually being asked for the cost of placing a finger:

<pre class='language-elixir'><code class='language-elixir'>
def note_distance(nil, _),
  do: 1
</code></pre>

Similarly, if the second "note" is `nil`{:.language-elixir}, we're being asked how much it costs to lift a finger:

<pre class='language-elixir'><code class='language-elixir'>
def note_distance(_, nil),
  do: 1
</code></pre>

Now things are getting interesting. If we're asked for the distance between two notes that live on the same string, we'll report back the unit cost, as we discussed earlier:

<pre class='language-elixir'><code class='language-elixir'>
def note_distance({_, _, string}, {_, _, string}),
  do: 1
</code></pre>

However, if the two notes live on different strings, we'll treat out guitar's fretboard like a grid, or city block, and return the ["manhattan distance"](https://en.wikipedia.org/wiki/Taxicab_geometry) between the two notes:

<pre class='language-elixir'><code class='language-elixir'>
def note_distance({fret_a, _, string_a}, {fret_b, _, string_b}),
  do: abs(fret_a - fret_b) + abs(string_a - string_b)
</code></pre>

And that's really all there is to it.

## A Few Examples

Going back to our previous examples, going from our Dm on the middle four string set to an Em on the same string should have a cost of `4`{:.language-elixir}. We're just sliding each finger up two frets:

<pre class='language-elixir'><code class='language-elixir'>
Chord.Distance.Fingering.distance(
  [nil, {5, 1}, {7, 3}, {7, 4}, {6, 2}, nil],
  [nil, {7, 1}, {9, 3}, {9, 4}, {8, 2}, nil]
)
</code></pre>

And we do get `4`{:.language-elixir}!

The cost of transitioning from that same Dm chord to an Em on the upper four string set should be higher than `4`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
Chord.Distance.Fingering.distance(
  [nil, {5, 1}, {7, 3}, {7, 4}, {6, 2}, nil],
  [nil, nil, {2, 1}, {4, 3}, {5, 4}, {3, 2}]
)
</code></pre>

And it is! We get a distance of `6`{:.language-elixir}.

## The Next Best Chord

And now for the grand finale. Let's say we want to find the set of Cmaj7 voicings that have the best voice leading between our starting G7 chord. This is old hat from our previous articles:

<pre class='language-elixir'><code class='language-elixir'>
[0, 4, 7, 11]
|> Chord.voicings(4)
|> Enum.map(&{Chord.Distance.Semitone.distance(&1, [nil, 10, 12, 10, 12, nil]), &1})
|> Enum.uniq()
|> Enum.sort()
|> Enum.chunk_by(&elem(&1, 0))
|> List.first()
|> Enum.map(&elem(&1, 1))
</code></pre>

But now let's take each of those voicings and find the best fingering for each with regards to how we're fingering our G7 chord:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.map(fn chord ->
  chord
  |> Chord.fingerings()
  |> Enum.uniq()
  |> Enum.map(
    &{Chord.Distance.Fingering.distance(&1, [nil, {10, 1}, {12, 3}, {10, 1}, {12, 4}, nil]), &1}
  )
  |> Enum.sort()
  |> Enum.map(&elem(&1, 1))
  |> List.first()
end)
</code></pre>

Finally, we'll take each fingered chord and render it to the console:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/computing-fingering-distance-with-dr-levenshtein/1.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our final chords.</p>
</div>

Awesome!

## Final Thoughts

If you can't tell, I'm in love with this project. I've been playing with it quite a bit in my free time, and I've managed to coax it into generating entire progressions for me that sound and play beautifully.

If you're interested in seeing me put more work into this, and potentially develop it into a fully-functional web application, [let me know on Twitter](https://twitter.com/petecorey).

If you want to check out the full source code, be sure to check out [the `Chord`{:.language-elixir} project on Github](https://github.com/pcorey/chord/).
