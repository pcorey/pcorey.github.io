---
layout: post
title:  "Voice Leading with Elixir"
description: ""
author: "Pete Corey"
date:   2018-07-30
tags: ["Elixir", "Music"]
related: []
---

I play quite a bit of guitar in my free time. Once of the things I've been practicing lately is improving my voice leading between chords.

Voice leading refers to how the individual notes, or voices, within a chord move when you transition to another chord. You often want as little movement as possible to keep the transition from sounding jarring (unless you're going for jarring).

So for example, if I play a G7 way up the neck, I probably wouldn't want to follow it with a Cmaj7 played towards the nut. Instead, I'd like to find another voicing of Cmaj7 that's both physically and musically closer to our G7 chord.

Knowing how to voice lead between chords usually requires a vast knowledge of the fretboard, a huge chord vocabulary, and lots of practice. But who needs all then when you have a computer and [the Elixir programming language](https://elixir-lang.org/)?

Let's use Elixir to chug through all of the possible Cmaj7 chords and find those with the best voice leading from our G7!

## Rendering Chords

Before we start talking about recruiting our computer to help us find the best voice leading between chords, we should take a detour and talk about guitar chords and how we'll work with them.

When you break it down to the basic, a "guitar" is just six strings attached to a piece of wood. A "chord" is just a set of notes played simultaneously across any number of those strings. Different notes can be played on each string by pressing on any "fret" along the neck.

<video style="width: 100%;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/voice-leading-with-elixir/G7.webm" loop controls></video>

Given those definitions, the simplest ways to represent a chord using Elixir data structures probably be as a six element list (or tuple).

Here's our G7 chord represented as an array:

<pre class='language-elixir'><code class='language-elixir'>
[nil, 10, 12, 10, 12, nil]
</code></pre>

From the thickest string to the thinnest, we're not playing anything on the first string (`nil`{:.language-elixir}). We're playing a G on the next string (`10`{:.language-elixir}), a D on the next string (`12`{:.language-elixir}), an F on the next string (`10`{:.language-elixir}), a B on the next string (`12`{:.language-elixir}), and nothing on the thinnest string (`nil`{:.language-elixir}).

To make our lives easier, we should come up with some way of displaying these chords in a more guitarist-friendly manner. One common option for displaying guitar chords is with [chord charts](http://www.tedgreene.com/images/lessons/students/PaulVachon/HowToReadTedGreeneChordDiagrams.pdf):

To kick things off, let's write a `Chord.Renderer`{:.language-elixir} module with a `to_string/2`{:.language-elixir} function that takes a chord and returns a unicode-based chart for the provided chord:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Chord.Renderer do
  def to_string(chord, chord_name) do
  end
end
</code></pre>

The first thing we'll need to do is find out the "reach" of our chord. What's the lowest fret used in the chord and the highest?

<pre class='language-elixir'><code class='language-elixir'>
{min, max} =
  chord
  |> Enum.reject(&(&1 == nil))
  |> Enum.min_max()
</code></pre>

We can use Elixir's `Enum.reject/2`{:.language-elixir} to filter out unplayed strings and then use `Enum.min_max/1`{:.language-elixir} to easily find both the lowest and highest fret used in the chord.

Next we'll iterate over every set of frets within the range of the chord and render each row using a `row_to_string/4`{:.language-elixir} helper function:

<pre class='language-elixir'><code class='language-elixir'>
0..max(max - min, 3)
|> Enum.map(&row_to_string(&1, min, chord, chord_name))
</code></pre>

Most fret charts render some minimum number of rows, even if the chord only takes up one fret of vertical space. We'll iterate between `0`{:.language-elixir} and either `max - min`{:.language-elixir}, or `3`{:.language-elixir}, depending on which value is larger. This means we'll always render at least four rows of frets for each diagram.

We'll also want to intersperse the horizontal fret lines below each row of fingered notes on each row of frets:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.intersperse([:bright, :black, "\n   ├┼┼┼┼┤\n"])
</code></pre>

We're using [Elixir's ANSI color codes](https://hexdocs.pm/elixir/IO.ANSI.html) to color our fretboard lines a dark grey color, and building our final string as [an IO list](https://www.bignerdranch.com/blog/elixir-and-io-lists-part-1-building-output-efficiently/), rather than a single concatenated string.

Because we're using ANSI color codes, we need to format and convert our resulting nested list structure into a string before returning it from our `to_string/2`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
|> IO.ANSI.format()
|> IO.chardata_to_string()
</code></pre>

---- 

Our `row_to_string/3`{:.language-elixir} helper function is fairly straight forward. It simply renders a left gutter, the row of frets with any potential fingerings, and a right gutter:

<pre class='language-elixir'><code class='language-elixir'>
defp row_to_string(offset, base, chord, chord_name),
  do: [
    left_gutter(offset, base + offset),
    Enum.map(chord, &fret_to_string(&1, base + offset)),
    right_gutter(offset, chord_name)
  ]
</code></pre>

The `left_gutter/2`{:.language-elixir} helper function renders the lowest fret used in the chord on the first line of the chart:

<pre class='language-elixir'><code class='language-elixir'>
defp left_gutter(0, fret),
    do: [:bright, :yellow, String.pad_leading("#{fret}", 2, " ") <> " "]
</code></pre>

Otherwise, we render a spacer:

<pre class='language-elixir'><code class='language-elixir'>
defp left_gutter(_, _),
  do: "   "
</code></pre>

Similarly, the `right_gutter/2`{:.language-elixir} helper function either renders an optional `chord_name`{:.language-elixir} on the first line of the chord chart:

<pre class='language-elixir'><code class='language-elixir'>
defp right_gutter(0, chord_name),
  do: [:yellow, " #{chord_name}"]
</code></pre>

Or an empty string:

<pre class='language-elixir'><code class='language-elixir'>
defp right_gutter(_, _),
  do: ""
</code></pre>

That's all there is to it!

Now we can render chords by passing them into `Chord.Renderer.to_string/2`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
Chord.Renderer.to_string([nil, 10, 12, 10, 12, nil], "G7")
|> IO.puts
</code></pre>

<pre class='language-*'><code class='language-*'>10 │●│●││ G7
   ├┼┼┼┼┤
   ││││││
   ├┼┼┼┼┤
   ││●│●│
   ├┼┼┼┼┤
   ││││││
</code></pre>

And in its fully colored glory:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/voice-leading-with-elixir/G7.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our G7 chord, as rendered by our new module.</p>
</div>

## Chord Distance

We can roughly approximate how "good" the voice leading is between two chords by counting the number of frets each finger has to move when changing chords. We can call this the "distance" between the two chords. In the simplest terms, chords with good voice leading have minimal distance between each other.

If we can write a function that computes this distance between chords, we might be able to generate all possible Cmaj7 voicings, and find the voicing that leads best from our G7!

Let's say that each fret moved on a single string equals one unit of "distance", and adding or removing a note to or from a string also counts as a single unit of distance.

Using that heuristic, let's write a new `Chord`{:.language-elixir} module and a `distance/2`{:.language-elixir} function that calculates the distance between two chords.

If both chords are equal, there is zero distance between them:

<pre class='language-elixir'><code class='language-elixir'>
def distance(chord, chord),
  do: 0
</code></pre>

Otherwise, the distance between two chords is the sum of the distance between their individual fretted notes on each string:

<pre class='language-elixir'><code class='language-elixir'>
def distance([fret_a | rest_a], [fret_b | rest_b]),
  do: distance(fret_a, fret_b) + distance(rest_a, rest_b)
</code></pre>

If a the first chord doesn't have a note fretted on a string, and the next chord does, we'll add one unit of distance:

<pre class='language-elixir'><code class='language-elixir'>
def distance(nil, fret),
  do: 1
</code></pre>

And visa versa:

<pre class='language-elixir'><code class='language-elixir'>
def distance(fret, nil),
  do: 1
</code></pre>

Otherwise, if both strings have fretted notes, the distance moved on that string is the number of frets between the two chords on that string:

<pre class='language-elixir'><code class='language-elixir'>
def distance(fret_a, fret_b),
  do: abs(fret_a - fret_b)
</code></pre>

We can manually calculate the distance between our G7 chord (`[nil, 10, 12, 10, 12, nil]`{:.language-elixir}), and a few different Cmaj7 voicings we may know:

<pre class='language-elixir'><code class='language-elixir'>
Chord.distance([nil, 10, 12, 10, 12, nil], [nil, 3, 5, 4, 5, nil])   # 27
Chord.distance([nil, 10, 12, 10, 12, nil], [8, 10, 9, 9, nil, nil])  # 6
</code></pre>

So according to our heuristic, the second voicing of Cmaj7 has much better voice leading between our G7 than the first voicing of Cmaj7.

This is great, but we're still limited by our knowledge of the fretboard. What if we only know two voicings of a Cmaj7 chord. Is this the best we can do?

Absolutely not!

## Brute Forced Voicings

The last piece of this puzzle is to write a function that will generate all possible voicings of a given chord across the neck of the guitar. If we have all of the possible voicings of our Cmaj7, for example, we can easily find the voicing that has the best voice leading from our G7 chord!

Let's start by creating a new `voicings/1`{:.language-elixir} function in our `Chord`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
def voicings(notes) do
end
</code></pre>

The `voicings/1`{:.language-elixir} function accepts an array of numbers representing the notes we want in our chord. For example, if we wanted all of the voicings of our Cmaj7 chord, we'd call `vocings/1`{:.language-elixir} with a C (`0`{:.language-elixir}), an E (`4`{:.language-elixir}), a G (`7`{:.language-elixir}), and a B (`11`{:.language-elixir}). These numbers correspond to the lowest set of [MIDI notes](http://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies), ranging from `0`{:.language-elixir} to `11`{:.language-elixir}.

The first thing we want to do is calculate all of the possible "note sets" that will be spread across our guitar strings:

<pre class='language-elixir'><code class='language-elixir'>
notes
|> all_note_sets()
</code></pre>

If a chord has fewer notes than the number of strings we want to play, some number of those notes will have to be repeated. To illustrate, imagine we want to play our four note Cmaj7 using all six strings of the guitar. We'll obviously have four strings playing C, E, G, and B, but what will the other two strings play?

The `all_note_sets/1`{:.language-elixir} helper functions calculates this list of all possible note sets using some hand-waving combinatorics, and a few unfortunate list comprehensions:

<pre class='language-elixir'><code class='language-elixir'>
def all_note_sets(notes) do
  for length <- 6..length(notes) do
    for base <- Combination.combine(notes, min(length, length(notes))) do
      for extension <- Combination.combine(notes, length - length(notes)) do
        base ++ extension
      end
    end
  end
  |> Enum.reduce(&Kernel.++/2)
  |> Enum.reduce(&Kernel.++/2)
end
</code></pre>

Next, our `voicings/1`{:.language-elixir} function needs to take each of these possible note sets and build all possible chords using that set of notes:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.map(&build_chords/1)
</code></pre>

The `build_chords/1`{:.language-elixir} helper works by recursively building up all possible chords made of all possible notes in the provided note sets.

<pre class='language-elixir'><code class='language-elixir'>
def build_chords(note_set, chord \\ [nil, nil, nil, nil, nil, nil], chords \\ [])
</code></pre>

It starts by looking at the first note in the provided note set and finds all occurrences of that note across all of the strings of our guitar using the `all_notes/1`{:.language-elixir} helper:

<pre class='language-elixir'><code class='language-elixir'>
note
|> all_notes
</code></pre>

Next, it filters out notes on strings already used in the current chord under construction:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.filter(fn {string, fret} -> Enum.at(chord, string) == nil end)
</code></pre>

Finally, it takes each note, inserts it into the current chord, and checks the "stretch" of the chord. If the chord spans more than five frets, we deem it impossible to play and filter it out (which is obviously an over-simplification, especially at higher frets). Otherwise, we recursively call `build_chords/3`{:.language-elixir}, passing in the newly updated current chord and the remaining set of notes in our note set:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.map(fn {string, fret} ->
  new_chord = List.replace_at(chord, string, fret)

  {min, max} =
    new_chord
    |> Enum.reject(&(&1 == nil))
    |> Enum.min_max(fn -> {0, 0} end)

  if max - min <= 5 do
    build_chords(rest, new_chord, chords)
  else
    chords
  end
end)
</code></pre>

---- 

The `all_notes/1`{:.language-elixir} helper function works by accepting the abstract value of the note we're looking for (C is `0`{:.language-elixir}), the optional [MIDI notes](http://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies) of the tuning of each string, and the optional number of frets up the neck we want to look for notes:

<pre class='language-elixir'><code class='language-elixir'>
def all_notes(target_note, strings \\ [40, 45, 50, 55, 59, 64], frets \\ 12) do
end
</code></pre>

It then constructs a two dimensional list of [MIDI notes](http://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies) up the neck and across the fretboard:

<pre class='language-elixir'><code class='language-elixir'>
fretboard =
  for fret <- 0..frets,
    do: Enum.map(strings, &(&1 + fret))
</code></pre>

Once we've built up our `fretboard`{:.language-elixir}, we'll filter out all of the notes that aren't the specific note we're looking for. We loop over every row of frets, and every string:

<pre class='language-elixir'><code class='language-elixir'>
fretboard
|> Enum.with_index()
|> Enum.map(fn {row, index} ->
  row
  |> Enum.with_index()
  |> Enum.map(fn {note, string} ->
    ...
  end)
end)
</code></pre>

For each `note`{:.language-elixir} we encounter, we check if `rem(note, 12)`{:.language-elixir} equals our `target_note`{:.language-elixir}. If it does, we replace the current note value with a `string`{:.language-elixir}/`index`{:.language-elixir} tuple that can be used when building our guitar chord:

<pre class='language-elixir'><code class='language-elixir'>
if rem(note, 12) == target_note do
  {string, index}
else
  nil
end
</code></pre>

Otherwise, we replace the current note with `nil`{:.language-elixir}.

Next, we flatten our multidimensional fretboard representation and filter out all of the `nil`{:.language-elixir} values, leaving us with just the set of notes we're looking for, and where they can be found on the fretboard.

Perfect.

Let's try it out by listing the first three voicings of a Cmaj7 chord our new `voicings/1`{:.language-elixir} helper finds:

<pre class='language-elixir'><code class='language-elixir'>
Chord.voicings([0, 4, 7, 11])
|> Enum.take(3)
|> Enum.map(&Chord.Renderer.to_string/1)
|> Enum.map(&IO.puts/1)
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
 0 ││││●│   0 ││││●│   1 ││││●│ 
   ├┼┼┼┼┤     ├┼┼┼┼┤     ├┼┼┼┼┤
   ││││││     ││││││     │●●│││
   ├┼┼┼┼┤     ├┼┼┼┼┤     ├┼┼┼┼┤
   ││●│││     ││●│││     ●││││●
   ├┼┼┼┼┤     ├┼┼┼┼┤     ├┼┼┼┼┤
   ●●│││●     ●●│││●     │││●││
   ├┼┼┼┼┤     ├┼┼┼┼┤
   │││●││     │││●││
</code></pre>

Cool!

## Putting it all Together

Now that our `voicings/1`{:.language-elixir} helper is finished, we can put all of the pieces together.

Let's start by calculating all of the possible voicings of our Cmaj7 chord:

<pre class='language-elixir'><code class='language-elixir'>
[0, 4, 7, 11]
|> Chord.voicings()
</code></pre>

Next, let's map over each voicing and build a tuple who's first element is the distance from our G7 chord, and who's second element is the generated voicing itself:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.map(&{Chord.distance(&1, [nil, 10, 12, 10, 12, nil]), &1})
</code></pre>

Now let's sort that list. Because the distance from our G7 chord is the first element in each tuple, we're effectively sorting by distance:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.sort()
</code></pre>

Now the "best" options for Cmaj7 voicings should be at the top of our list. Let's take the first three:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.take(3)
</code></pre>

We'll map each voicing through our chord chart renderer:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.map(fn {distance, chord} -> Chord.to_string(chord, "Cmaj7") end)
</code></pre>

Finally, let's join each of our three charts together with newlines and print the result:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.join("\n\n")
|> IO.puts()
</code></pre>

<video style="width: 100%;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/voice-leading-with-elixir/Cmaj7+Voicings.webm" loop controls></video>

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/voice-leading-with-elixir/Cmaj7+Voicings.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our generated Cmaj7 voicings.</p>
</div>

Each of the voicings recommended by our software sound fairly nice. Much nicer than the first voicing we were using way down the neck. The third voicing definitely has an interesting flavor, and is something I never would have reached for without the help of this software, but I'm glad to know it's there.

## Final Thoughts and Future Work

I have many, many final thoughts about this project. If you can't tell, I'm incredibly excited about this kind of thing.

I'm currently working on improving the "distance" heuristic, which raises many interesting questions about what exactly voice leading is, and who it's for. Should I optimize for the player, or the listener? Thanks to how the guitar works, chords on wildly different sections of the neck may be very close musically, but my algorithm will filter these chords out as being "too far." In many ways, I'm conflating "voice leading" between chords with "playability" between chords. Is this what I want?

I'm also working on optimizing the voice leading over entire chord progressions.  As you might guess, this is a much more expansive problem.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/voice-leading-with-elixir/progression.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">A generated chord progression.</p>
</div>

Lastly, if you're interested in this kind of thing, I highly recommend you check out Ted Greene's guitar work. Ted is, in my opinion, one of the true masters of the guitar, and put some serious work into perfecting his voice leading skills.

Check out the [Ted Greene archive](http://www.tedgreene.com/), the archive's [Youtube page](http://www.youtube.com/user/TedGreeneArchives), and __definitely check out two of Ted's books: [Chord Chemistry](https://amzn.to/2uV6w1g), and [Modern Chord Progressions](https://www.amazon.com/Modern-Chord-Progressions-Classical-Voicings/dp/0898986982/ref=tmm_pap_swatch_0?_encoding=UTF8&qid=1532731370&sr=1-1)__.

I've uploaded this entire project [to Github](https://github.com/pcorey/chord), if you're curious the see the source in its entirety. Check it out!

Obviously, this kind of thing is just a tool, and the chord transitions and progressions generated by the `Chord`{:.language-elixir} module are just suggestions and starting places, not fully-fleshed out music. That being said, these tools have already given me many new ideas and shown me many interesting chords I never would have reached for without having them shown to me.
