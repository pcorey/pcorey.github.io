---
layout: post
title:  "Using Facades to Simplify Elixir Modules"
description: "Let's use facades to separate our module's interface from our implementation, simplifying our overall application!"
author: "Pete Corey"
date:   2018-09-03
tags: ["Elixir"]
related: []
---

A common trend I see in Elixir projects is that modules tend to become large. [Sometimes _very large_](https://github.com/elixir-ecto/ecto/blob/master/lib/ecto/query.ex). This isn't necessarily an issue, but it goes against some deep seated heuristics I have for building software.

As [my `Chord`{:.language-elixir} project](https://github.com/pcorey/chord/) started to get complex, I repeatedly found myself reaching for a pattern to keep my module size and complexity down, while still maintaining a friendly and approachable API.

Let's dig into some examples.

## What's the problem?

The `Chord`{:.language-elixir} module is the heart of [my `Chord`{:.language-elixir} project](https://github.com/pcorey/chord/). Using `Chord`{:.language-elixir} you can generate guitar chord voicings, generate possible fingerings for a given voicing, and even calculate the distances between various chord voicings and fingerings.

It's conceivable that lots of this functionality should live directly under the `Chord`{:.language-elixir} module. For example, we'd want to be able to ask for `Chord.voicings/1`{:.language-elixir},  or `Chord.fingerings/1`{:.language-elixir}, or even convert a chord into a chord chart with `Chord.to_string/1`{:.language-elixir}.

The problem is that each of these pieces of functionality comes along with a non-trivial implementation. If we put our `voicings/1`{:.language-elixir}, `fingerings/1`{:.language-elixir}, and `to_string/1`{:.language-elixir} functions in the `Chord`{:.language-elixir} module, their implementations would likely live in the `Chord`{:.language-elixir} module as well. In my mind, this would quickly turn `Chord`{:.language-elixir} into an unmaintainable mess.

There has to be a better way.

## What's the solution?

It turns out there is a better way. And, like most better ways, it turns out that the solution to our problem is obviously simple.

Let's use our `voicings/1`{:.language-elixir} function as an example. Rather than defining our `voicings/1`{:.language-elixir} function and implementation within our `Chord`{:.language-elixir} module, we'll create a `Chord.Voicing`{:.language-elixir} module and [define our `voicings/1`{:.language-elixir} function there](https://github.com/pcorey/chord/blob/55ec2d6069366e0d78a6cf4a9bde59c589171c08/lib/chord/voicing.ex#L2-L9).

<pre class='language-elixir'><code class='language-elixir'>
defmodule Chord.Voicing do
  def voicings(notes, notes_in_chord \\ nil),
    do: ...
end
</code></pre>

Now our `Chord.Voicing`{:.language-elixir} module is entirely concerned with the act of generating chord voicings for a given set of notes.

However, we still want this functionality available through our `Chord`{:.language-elixir} module. To accomplish this, we simply need to write a `Chord.voicings/1`{:.language-elixir} function that matches the signature of our `Chord.Voicing.voicings/1`{:.language-elixir} module and passes the call straight through to [our `Chord.Voicing`{:.language-elixir} module](https://github.com/pcorey/chord/blob/55ec2d6069366e0d78a6cf4a9bde59c589171c08/lib/chord.ex):

<pre class='language-elixir'><code class='language-elixir'>
defmodule Chord do
  def voicings(notes, notes_in_chord \\ nil),
    do: Chord.Voicing.voicings(notes, notes_in_chord)
end
</code></pre>

We can continue on with this pattern by creating a new module to implement each of our features: `Chord.Fingering`{:.language-elixir}, `Chord.Renderer`{:.language-elixir}. From there we can flesh our our `Chord`{:.language-elixir} module to wire our convince functions up to their actual implementations:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Chord do
  def voicings(notes, notes_in_chord \\ nil),
    do: Chord.Voicing.voicings(notes, notes_in_chord)

  def to_string(chord, chord_name \\ nil),
    do: Chord.Renderer.to_string(chord, chord_name)

  def fingerings(chord),
    do: Chord.Fingering.fingerings(chord)
end
</code></pre>

Beautiful.

## What's in a name?

In the previous example, the `Chord`{:.language-elixir} module is essentially acting as a ["facade"](https://en.wikipedia.org/wiki/Facade_pattern) that wraps and hides the complexity of our `Chord.Voicing`{:.language-elixir}, `Chord.Fingering`{:.language-elixir}, and `Chord.Renderer`{:.language-elixir} modules.

I use the term "facade" loosely, and in real-life, I don't use it at all. The "facade pattern", and honestly all classic [Gang of Four design patterns](https://amzn.to/2BVHHIo), carry  baggage that I like to think I've let go of in my transition into the world of functional programming.

Another less weighty way to thing of `Chord`{:.language-elixir} is as an "API module". It's sole purpose is to act as an "application programming interface" within our application.

What would you call this kind of pattern?
