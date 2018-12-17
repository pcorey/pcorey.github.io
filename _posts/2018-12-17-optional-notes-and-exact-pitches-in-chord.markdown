---
layout: post
title:  "Optional Notes and Exact Pitches in Chord"
description: "My main goal with the Chord project is to model lead sheets. Let's move one step closer to that goal and add support for generating chords with optional notes and exact pitches."
author: "Pete Corey"
date:   2018-12-17
tags: ["Elixir", "Music"]
related: []
---

Currently [my Elixir-powered Chord project](https://github.com/pcorey/chord/) does a lot of really cool things. It can generate a huge number of guitar chords given a set of notes you want included in those chords. It also computes the [voice leading distance](http://www.petecorey.com/blog/2018/07/30/voice-leading-with-elixir/) and [fingering distance](http://www.petecorey.com/blog/2018/08/27/computing-fingering-distance-with-dr-levenshtein/) between those chords, which let's us map out "ideal" chord progressions.

While this functionality is awesome in and of itself, it's missing a few key features that would bring it to the next level.

Traditionally, musicians quickly learn song with the help of [lead sheets](https://en.wikipedia.org/wiki/Lead_sheet). A lead sheet consists of a melody laid out over a set of chords. It's up to the musician to interpret and play those chords with the given melody in a way that makes sense for both the player and the listener.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/Lead-sheet-wikipedia.svg" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;"><a href="https://en.wikipedia.org/wiki/File:Lead-sheet-wikipedia.svg">An example lead sheet.</a></p>
</div>

I want Chord to be able to generate possible interpretations of a lead sheet by giving us chord progressions that include optional notes and specific melody notes.

## Supporting Optional Notes

It may be surprising to hear, but often times many of the notes that make up a chord are entirely optional!

For example, if I'm playing a Cmaj7 chord, which is made up of the root of the chord, the third, the fifth, and the major seventh, it's usually acceptable to omit the fifth of the chord. The fifth usually just serves to add harmonic stability to the root note, and isn't necessary to convey the color of the chord to the listener.

The ability to mark a note as optional drastically expands the possible set of chords we can generate for a given set of notes. For each optional note, we need to generate all of the possible chords that include that note, all of the possible chords that do not include it, and merge the results together.

Let's update [our `Chord.Voicing`{:.language-elixir} module](https://github.com/pcorey/chord/blob/2eb0dee6167d3fb1dc215d346a15c416b89ff65d/lib/chord/voicing.ex) to do that now.

Within our `Chord.Voicing`{:.language-elixir} module is a function, [`all_note_sets/1`{:.language-elixir}](https://github.com/pcorey/chord/blob/2eb0dee6167d3fb1dc215d346a15c416b89ff65d/lib/chord/voicing.ex#L50-L60) that takes a set of notes, and returns a list of all possible "note sets" that can be spread across the strings of the guitar to build chords.

A note set is really just a collection of notes we want to play. For example, if we're trying to play a Cmaj7 with an optional fifth, some of our note sets might look like this:

<pre class='language-elixir'><code class='language-elixir'>
[[0, 4, 11],            # root, third, seventh
 [0, 4, 11, 0],         # root, third, seventh, root
 [0, 4, 11, 4],         # root, third, seventh, third
 [0, 4, 11, 11],        # root, third, seventh, seventh
 [0, 4, 11, 7],         # root, third, seventh, fifth
 [0, 4, 11, 7, 0],      # root, third, seventh, fifth, root
 ...
 [0, 4, 7, 11, 11, 11]] # root third, seventh, seventh, seventh, seventh
</code></pre>

Notice that the smallest note set is the set of all three required notes. Also note that after those first three required notes is every possible permutation of every possible note in the chord, required and optional notes included.

We can implement this fairly easily in our `all_note_sets/1`{:.language-elixir} function. Let's start by filtering the provided set of `notes`{:.language-elixir} down to just the required notes:

<pre class='language-elixir'><code class='language-elixir'>
required_notes =
  Enum.filter(notes, fn
    {:optional, note} -> false
    _ -> true
  end)
</code></pre>

We'll assume that optional notes are keyword tuples with `:optional`{:.language-elixir} as the first element and the actual note as the second value. Require notes are simply bare note values.

Next, let's filter `notes`{:.language-elixir} down to the list of just optional notes:

<pre class='language-elixir'><code class='language-elixir'>
optional_notes =
  Enum.filter(notes, fn
    {:optional, note} -> true
    _ -> false
  end)
</code></pre>

Finally, let's get a list together of all possible notes, optional and required included:

<pre class='language-elixir'><code class='language-elixir'>
all_notes =
  Enum.map(notes, fn
    {_, note} -> note
    note -> note
  end)
</code></pre>

Now that we've put our ducks in a row, generating all of our possible note sets if fairly straight forward.

We know that every note set will start with our set of required notes. That means that the length of each note set will range in length from the length of the required notes to `6`{:.language-elixir}, the number of strings on a guitar:

<pre class='language-elixir'><code class='language-elixir'>
length(required_notes)..6
</code></pre>

We also know that after the set of required notes the remaining space in the note set will be filled by every permutation of all possible notes (allowing repetition):

<pre class='language-elixir'><code class='language-elixir'>
Permutation.generate(all_notes, length - length(required_notes), true)
</code></pre>

We can loop over each of these sets of values and combine the results in a list comprehension to come up with our final list of note sets:

<pre class='language-elixir'><code class='language-elixir'>
for length <- length(required_notes)..6,
    tail <- Permutation.generate(all_notes, length - length(required_notes), true) do
  required_notes ++ tail
end
</code></pre>

## Supporting Exact Pitches

Once we've built our note sets, we need to translate them into actual chords. Our `Chord.Voicing`{:.language-elixir} module does this with the help of [the `all_notes/3`{:.language-elixir} function](https://github.com/pcorey/chord/blob/2eb0dee6167d3fb1dc215d346a15c416b89ff65d/lib/chord/voicing.ex#L62-L82), which takes a single note from our note set and finds all possible locations on the fretboard where that note can be played.

[As we talked about in a previous article](http://www.petecorey.com/blog/2018/07/30/voice-leading-with-elixir/), it does this by building a complete fretboard and then filtering out, or sieving, any notes on the fretboard that aren't the note we're trying to play.

The original code that decided if the provided `target_note`{:.language-elixir} matched the note at the given fret (`index`{:.language-elixir}) and `string`{:.language-elixir} looked something like this:

<pre class='language-elixir'><code class='language-elixir'>
if rem(note, 12) == target_note do
  {string, index}
else
  nil
end
</code></pre>

If the [pitch class](https://en.wikipedia.org/wiki/Pitch_class) of the note (`rem(note, 12)`{:.language-elixir}) matches our `target_note`{:.language-elixir}, add the current string and fret to the list of tuples to be returned by our `all_notes/3`{:.language-elixir} function.

This solution assumes that all of the notes in our note sets are pitch classes, or values between `0`{:.language-elixir} and `11`{:.language-elixir}. If we're looking for a C and our `target_note`{:.language-elixir} is `0`{:.language-elixir}, it will match on any octave of C it finds across the fretboard.

We can modify this solution to support exact pitches with minimal effort. If we assume that exact pitches will be passed in through the `target_note`{:.language-elixir} parameter just like pitch classes (as plain numbers), we can add a fallback check to our condition that checks for exact equality:

<pre class='language-elixir'><code class='language-elixir'>
cond do
  rem(note, 12) == target_note -> {string, index}
  note == target_note -> {string, index}
  true -> nil
end
</code></pre>

If the pitch class of the current note doesn't match our `target_note`{:.language-elixir}, the untouched value of `note`{:.language-elixir} still might. For example, if we're looking specifically for a middle C (`60`{:.language-elixir}), this condition would match on only those exact pitches, and not any higher or lower octaves of C.

## Final Thoughts

Our `Chord.Voicing`{:.language-elixir} module now supports building chords out of note sets that include both optional notes and exact pitches. We're one step closer to modeling lead sheets!

As an interesting aside, when I started this refactor, I noticed that the original implementation of `all_note_sets/1`{:.language-elixir} was _completely wrong_. I'm not sure what was going through my mind when I wrote that first version, but it was only returning a small subset of all possible note sets. Equipped with the new implementation, Chord is generating many times the number of possible chords for us to play with.

Be sure to [check out the entire Chord project on Github](https://github.com/pcorey/chord), and stay tuned for more updates and experiments.
