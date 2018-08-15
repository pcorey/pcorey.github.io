---
layout: post
title:  "Algorithmically Fingering Guitar Chords with Elixir"
description: "Let's use Elixir and a sieving algorithm to recursively generate all possible fingerings for a given guitar chord voicing."
author: "Pete Corey"
date:   2018-08-13
tags: ["Elixir", "Music"]
related: ["/blog/2018/07/30/voice-leading-with-elixir/"]
image: "https://s3-us-west-1.amazonaws.com/www.east5th.co/img/algorithmically-fingering-guitar-chords-with-elixir/G-bad-voicing.png"
---


Last time we wrote about using Elixir to generate all possible voicings of a given guitar chord [to find the voicing with the best voice leading between another chord](http://www.petecorey.com/blog/2018/07/30/voice-leading-with-elixir/).

While this was great, there were several issues. We were conflating the idea of "musical distance" and "physical distance" when calculating optimal voice leading, and we weren't taking the playability of the progressions we were generating into account.

To address both of these issues, we need to know not only _which_ voicings are possible for a given chord, but also _how_ each of those voicings can be played. We need to generate all possible fingerings for a given guitar chord voicing.

This sounds like a fantastic excuse to flex our Elixir muscles!

## Calculating Fingerings

We'll start our journey into calculating all possible fingerings for a given guitar chord by creating a new Elixir module, `Chord.Fingering`{:.language-elixir}, and a new `fingerings/1`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Chord.Fingering do
  def fingerings(chord)
end
</code></pre>

Our high level plan of attack for computing possible fingerings is fairly straight forward. Given that each `chord`{:.language-elixir} is [a six-element array of frets being played](http://www.petecorey.com/blog/2018/07/30/voice-leading-with-elixir#rendering-chords), like `[nil, 5, 7, 7, 6, nil]`{:.language-elixir}, we want to:

1. Attach all possible fingerings that can be played on each fret.
2. Choose each possible finger in turn, sieve out all subsequent impossible fingers, and recursively repeat to get all possible fingerings.
3. Perform any necessary cleanup.

Our final `fingerings/1`{:.language-elixir} function makes these steps fairly explicit:

<pre class='language-elixir'><code class='language-elixir'>
def fingerings(chord),
  do:
    chord
    |> attach_possible_fingers()
    |> choose_and_sieve()
    |> cleanup()
</code></pre>

## Possible Fingers? Sieves?

Before we dive deeper into our solution, we should take a detour and talk about how we're computing fingerings.

Our solution takes inspiration from the ["Sieve of Eratosthenes"](https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes), which is a clever technique for calculating prime numbers. The basic idea of a "sieve" is that a choice made _now_ can be used to filter out _future_ unwanted results.

To bring it back to our situation, imagine we're trying to play a D minor chord on the fifth fret:

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/algorithmically-fingering-guitar-chords-with-elixir/Dm.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our D minor chord.</p>
</div>

If we were to start fingering this chord by placing our second finger on the low D note, we know that we couldn't use our first finger on any of the other notes in the chord. Our first finger would have to wrap over or sneak under our second finger to reach those notes, and that's essentially impossible:

<div style="width: 66%; margin: 4em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/algorithmically-fingering-guitar-chords-with-elixir/sieve.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">We can't use our first finger anywhere!</p>
</div>

So by choosing to use our second finger on the fifth string and fret, we can sieve out the possibility of using our first finger on any of the remaining notes.

If we think about it, we can also sieve out the possibility of re-using our second finger. A finger can't be re-used unless it's forming a bar or a double-stop on an adjacent fret.

Our remaining set of possible fingers for the remaining notes are fingers three and four.

By recursively picking another of our possible fingers on another string and applying our sieving rules, we can come up with our entire set of possible fingers.

## Choosing and Sieving

The meat of our algorithm lives in the `choose_and_sieve/2`{:.language-elixir} function, which takes an initial `chord`{:.language-elixir}, complete with "possible fingers", and a `fingerings`{:.language-elixir} argument that defaults to an empty list:

<pre class='language-elixir'><code class='language-elixir'>
defp choose_and_sieve(chord, fingerings \\ [])
</code></pre>

The `fingerings`{:.language-elixir} argument will be used to hold each finger choice for our `chord`{:.language-elixir}, as we choose them.

Our `choose_and_sieve/1`{:.language-elixir} function expects each element of `chord`{:.language-elixir} to be a two-element tuple, where the first element is the fret being played, and the second element is the set of possible fingers that could be chosen to play that fret.

Our `attach_possible_fingers/1`{:.language-elixir} helper function transforms our initial chord into that expected structure:

<pre class='language-elixir'><code class='language-elixir'>
defp attach_possible_fingers(chord),
  do: Enum.map(chord, &{&1, 1..4})
</code></pre>

---- 

Our implementation of `choose_and_sieve/2`{:.language-elixir} is recursive, so we should start our implementation by defining our base case. The base case for `choose_and_sieve/2`{:.language-elixir} is triggered when `chord`{:.language-elixir} is empty. At that point, we've handled every note in the chord, and need to return our fully constructed fingering:

<pre class='language-elixir'><code class='language-elixir'>
defp choose_and_sieve([], fingerings),
  do:
    fingerings
    |> Enum.reverse()
    |> List.to_tuple()
</code></pre>

As we'll soon see, chosen fingers are appended onto `fingerings`{:.language-elixir} in reverse order, so we `reverse/1`{:.language-elixir} our list to reorient our strings. Lastly we turn our `fingerings`{:.language-elixir} list into a tuple so that we can safely `flatten/1`{:.language-elixir} our resulting list of `fingerings`{:.language-elixir} without losing our groupings.

Once flattened, our `cleanup/1`{:.language-elixir} function maps over this final list and converts each tuple back into an array:

<pre class='language-elixir'><code class='language-elixir'>
defp cleanup(fingerings),
  do: Enum.map(fingerings, &Tuple.to_list/1)
</code></pre>

---- 

Moving on from our base case, it's time to start thinking of other simple to handle situations.

If the next element in our `chord`{:.language-elixir} list is an unplayed string (`nil`{:.language-elixir}), we add it to our `fingerings`{:.language-elixir} list and designate it to be played with no finger (`nil`{:.language-elixir}), and recursively call `choose_and_sieve/2`{:.language-elixir} on our remaining `chord`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defp choose_and_sieve([{nil, _possible_fingers} | chord], fingerings),
  do: choose_and_sieve(chord, [{nil, nil} | fingerings])
</code></pre>

Similarly, if the next element of our `chord`{:.language-elixir} is an open string, we're recursively call `chose_and_sieve/2`{:.language-elixir}, passing in our remaining `chord`{:.language-elixir}, and our set of fingers appended with the open string played with no finger (`nil`{:.language-elixir}):

<pre class='language-elixir'><code class='language-elixir'>
defp choose_and_sieve([{0, _possible_fingers} | chord], fingerings),
  do: choose_and_sieve(chord, [{0, nil} | fingerings])
</code></pre>

---- 

In the case of actually needing to finger a note, the situation becomes more complicated. In that case, the next element of our `chord`{:.language-elixir} is a fret and some set of `possible_fingers`{:.language-elixir}.

{% include newsletter.html %}

We'll map over each of the `possible_fingers`{:.language-elixir}, appending each `finger`{:.language-elixir} and `fret`{:.language-elixir} to our list of `fingerings`{:.language-elixir}, sieving out any now-impossible `possible_fingerings`{:.language-elixir} from the remaining notes in our `chord`{:.language-elixir}, and then recursively calling our `choose_and_sieve/2`{:.language-elixir} function with our newly sieved `chord`{:.language-elixir} and `new_fingerings`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defp choose_and_sieve([{fret, possible_fingers} | chord], fingerings),
  do:
    possible_fingers
    |> Enum.map(fn finger ->
      new_fingerings = [{fret, finger} | fingerings]

      chord
      |> sieve_chord(new_fingerings)
      |> choose_and_sieve(new_fingerings)
    end)
    |> List.flatten()
</code></pre>

The `sieve_chord/2`{:.language-elixir} helper function maps over each of the notes in what's left of our `chord`{:.language-elixir}, and updates the `possible_fingers`{:.language-elixir} tuple element to sieve any fingerings that are now deemed impossible to play after placing our most recent finger:

<pre class='language-elixir'><code class='language-elixir'>
defp sieve_chord(chord, fingerings),
  do:
    chord
    |> Enum.map(fn {fret, possible_fingers} ->
      {fret, sieve_fingers(possible_fingers, fret, fingerings)}
    end)
</code></pre>

---- 

The `sieve_fingers/3`{:.language-elixir} helper function is where we make real decisions about the behavior of our fingering algorithm. The `sieve_fingers/3`{:.language-elixir} function itself is fairly straight forward. It simply rejects and `possible_fingers`{:.language-elixir} that are considered "bad" by our `bad_finger?/3`{:.language-elixir} helper function:

<pre class='language-elixir'><code class='language-elixir'>
defp sieve_fingers(possible_fingers, fret, fingerings),
  do: Enum.reject(possible_fingers, &bad_finger?(fret, &1, fingerings))
</code></pre>

The `bad_finger?/3`{:.language-elixir} function runs each `finger`{:.language-elixir}/`fret`{:.language-elixir} combinations through four rules used by our algorithm to determine if a finger choice is "impossible", and should be culled from our `possible_fingers`{:.language-elixir} set:

<pre class='language-elixir'><code class='language-elixir'>
defp bad_finger?(fret, finger, fingerings),
  do:
    Enum.any?([
      fret_above_finger_below?(fret, finger, fingerings),
      fret_below_finger_above?(fret, finger, fingerings),
      same_finger?(fret, finger, fingerings),
      impossible_bar?(fret, finger, fingerings)
    ])
</code></pre>

If any of those rules are violated, the finger is rejected.

The first two rules check if a possible finger would need to stretch over or under an already placed finger, respectively:

<pre class='language-elixir'><code class='language-elixir'>
defp fret_above_finger_below?(fret, finger, [{new_fret, new_finger} | _]),
  do: fret > new_fret && finger < new_finger

defp fret_below_finger_above?(fret, finger, [{new_fret, new_finger} | _]),
  do: fret < new_fret && finger > new_finger
</code></pre>

The third rule verifies that no finger can be used twice, unless when performing a bar or double-stop over adjacent frets:

<pre class='language-elixir'><code class='language-elixir'>
defp same_finger?(fret, finger, [{new_fret, new_finger} | _]),
  do: finger == new_finger && fret != new_fret
</code></pre>

Finally, we need to prevent "impossible bars", or bars that would mute notes played on lower frets:

<pre class='language-elixir'><code class='language-elixir'>
defp impossible_bar?(_fret, finger, fingerings = [{new_fret, _} | _]),
  do:
    fingerings
    |> Enum.filter(fn {fret, _finger} -> fret > new_fret end)
    |> Enum.map(fn {_fret, finger} -> finger end)
    |> Enum.member?(finger)
</code></pre>

## The Results

Now that we've implemented our fingering algorithm, let's try a few examples.

We'll start by calculating the possible fingerings for the D minor chord we've been using as an example. Fingering suggestions are listed below each string:

<pre class='language-elixir'><code class='language-elixir'>
[nil, 5, 7, 7, 6, nil]
|> Chord.Fingering.fingerings()
|> Enum.map(&Chord.Renderer.to_string/1)
|> Enum.join("\n\n")
|> IO.puts
</code></pre>

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/algorithmically-fingering-guitar-chords-with-elixir/Dm-voicings.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Fingerings for our D minor chord.</p>
</div>

Awesome! The first suggested bar can be difficult to play, but with some practice doing [Ted Greene-style double-stops](http://forums.tedgreene.com/post/how-to-do-a-a-ted-greene-double-stop-8526262), it's manageable. The second and third suggestions are what I would normally reach for.

Another interesting example is an open G major shape:

<pre class='language-elixir'><code class='language-elixir'>
[3, 2, 0, 0, 3, 3]
|> Chord.Fingering.fingerings()
|> Enum.map(&Chord.Renderer.to_string/1)
|> Enum.join("\n\n")
|> IO.puts
</code></pre>

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/algorithmically-fingering-guitar-chords-with-elixir/G-voicings.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Fingerings for our G chord.</p>
</div>

The first few fingering suggestions make sense, but as we get closer to the end of the list, some of the suggestions are increasingly difficult to play. I don't think I'll ever be able to play this fingering:

<div style="width: 66%; margin: 4em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/algorithmically-fingering-guitar-chords-with-elixir/G-bad-voicing.png" style="display: block; margin:1em auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">An "impossible" to play fingering.</p>
</div>

As a human, I can explain to you why this is difficult to play, but I haven't been able to come up with a general rule to add to our rule set that would prevent these kinds of fingerings from being suggested. At this point, I'd rather have the algorithm present _potentially impossible_ fingerings, than have it over-aggressively prune _possible_ fingerings from the result set.

## What's Next?

In my previous article on ["Voice Leading with Elixir"](http://www.petecorey.com/blog/2018/07/30/voice-leading-with-elixir/), I mentioned that I was conflating the ideas of "musical distance" and "physical distance". In terms of voice leading, all I really care about is optimizing a chord progression for musical distance. But as a guitar player, I also want to consider "physical distance".

If a set of chords all have the same "musical distance" from a given starting chord, I want to choose the chord that has the lowest "physical distance". By "physical distance", I mean literally fret distance, but also how difficult it is to transition from one chord to another. Do I just need to slide one finger? That's easy! Do I need to lift and replace three fingers while sliding the fourth? That's not so easy…

We can't calculate the "physical distance" between chords unless we know the fingerings for the chords in question. Now that we know the potential fingerings for a given chord, we can compute a (modified) [levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) between the fingerings of two chords!

Why is that cool?

Once that's done, we'll be able to take a starting chord (optionally with a starting fingering), and find the best voicing of the landing chord in terms of voice leading and ease of playability!

Be sure to check out [the entire project on Github](https://github.com/pcorey/chord/), and stay tuned for more.
