---
layout: post
title:  "Guitar Chord Voicings with Prolog"
excerpt: "Prolog is a language that excels at defining and exploring relationships. Let's take advantage of that and use Prolog to explore a few of the myriad of relationships that exist between chords and the guitar's fretboard."
author: "Pete Corey"
date:   2020-04-21
tags: ["Music", "Prolog"]
image: "/img/2020-04-21-guitar-chord-voicings-with-prolog/chord.png"
related: []
---

Generating guitar chords is [my thing](https://www.gloriousvoiceleader.com/). Over the years I've written [thousands](https://github.com/pcorey/glorious_voice_leader) of [lines](https://github.com/pcorey/chord) of [code](https://github.com/pcorey/chord_namer) and [even more words](http://www.petecorey.com/blog/tags/#music) all dedicated to the process of algorithmically generating and recommending guitar chords. In the spirit of generation, let's throw another language and another few hundred additional words onto that stack!

[Prolog](https://en.wikipedia.org/wiki/Prolog) is a logic-based programming language that, [as I'm learning](http://www.learnprolognow.org/) (disclaimer: I'm very new to Prolog), excels at representing logical relationships between data. The guitar fretboard is a never-ending landscape of interesting relationships ripe for exploration, so Prolog seems like a valuable tool to have at our arsenal as fretboard explorers.

Let's see how we can use it.

## The Magic of Prolog

One of the most mind blowing aspects of Prolog, from the perspective of someone new to the language, is the fluidity and ambiguity of inputs and outputs to "predicates" (think of them as functions).

For example, we can ask the built-in [`member/2`{:.language-prolog}](https://www.swi-prolog.org/pldoc/doc_for?object=member/2) predicate if `1`{:.language-prolog} is a member of the list `[1, 2, 3]`{:.language-prolog}:

<pre class='language-prolog'><code class='language-prolog'>
member(1, [1, 2, 3]).
</code></pre>

And Prolog will tell us that yes, `1`{:.language-prolog} is a member of `[1, 2, 3]`{:.language-prolog}:

<pre class='language-prolog'><code class='language-prolog'>
true.
</code></pre>

We can also bind the first argument of our call to `member/2`{:.language-prolog} to a variable, and Prolog will happily report all possible values of that variable for which the predicate holds true:

<pre class='language-prolog'><code class='language-prolog'>
member(X, [1, 2, 3]).
</code></pre>

<pre class='language-prolog'><code class='language-prolog'>
X = 1 ;
X = 2 ;
X = 3.
</code></pre>

When the second argument of `member/2`{:.language-prolog} is `[1, 2, 3]`{:.language-prolog}, the first argument can either be `1`{:.language-prolog}, `2`{:.language-prolog}, or `3`{:.language-prolog}.

But we can take things even further. We can bind the second argument of our call to the `member/2`{:.language-prolog} predicate to a variable and ask Prolog for all of the lists that contain our first argument, `1`{:.language-prolog}:

<pre class='language-prolog'><code class='language-prolog'>
member(1, X).
</code></pre>

<pre class='language-prolog'><code class='language-prolog'>
X = [1|_5982] ;
X = [_5980, 1|_5988] ;
X = [_5980, _5986, 1|_5994] ;
X = [_5980, _5986, _5992, 1|_6000] ...
</code></pre>

This implementation of the Prolog runtime ([SWI-Prolog 8.0.3](https://www.swi-prolog.org/)) represents unbound variables with leading underscores. So the first possible value of `X`{:.language-prolog} is `1`{:.language-prolog} prepended to any other list. Another possible value of `X`{:.language-prolog} is some value prepended to `1`{:.language-prolog}, prepended to any other list. And so on, _forever._

The `member/2`{:.language-prolog} predicate simply defines the relationship between it's two arguments. If one of those arguments is omitted, it can be recovered by applying or reversing that relationship appropriately.

Is your mind blown yet?

## Chordal Relationships

Let's write a predicate that accepts a few arguments that describes our guitar's fretboard in terms of [tuning](https://en.wikipedia.org/wiki/Guitar_tunings) and number of [frets](https://en.wikipedia.org/wiki/Fret), [the quality of the chord](https://en.wikipedia.org/wiki/Chord_letters#Chord_quality) we're looking for, and the notes of a specific chord voicing given as string/fret tuples. Our predicate will either confirm or deny that the notes given live within the bounds of the fretboard and accurately depict the desired chord quality.

For example, on a normal guitar tuned to standard tuning, we could ask if fret `3`{:.language-prolog} played on string `1`{:.language-prolog} (starting from the lowest string), fret `2`{:.language-prolog} played on string `2`{:.language-prolog} and the open fret played on string `3`{:.language-prolog} constitute a C major (`[0, 4, 7]`{:.language-prolog}) chord voicing:

<pre class='language-prolog'><code class='language-prolog'>
voicing([[0,40], [1,45], [2,50], [3,55], [4,59], [5,64]],
        18,
        [0, 4, 7],
        [[1, 3], [2, 2], [3, 0]]).
</code></pre>

And the answer is yes, they do:

<pre class='language-prolog'><code class='language-prolog'>
true.
</code></pre>

If we assume that both our `Tuning`{:.language-prolog} array and the final `Voicing`{:.language-prolog} array are sorted in terms of string number we can build our predicate with a simple walk across the strings, analyzing each note in the chord along the way.

For every string on the fretboard, we first check that a note in our `Voicing`{:.language-prolog} lives on that `String`{:.language-prolog}. If it does, we need to make sure that the `Fret`{:.language-prolog} being played on that `String`{:.language-prolog} is [`between/3`{:.language-prolog}](https://www.swi-prolog.org/pldoc/doc_for?object=between/3) `0`{:.language-prolog} and the number of `Frets`{:.language-prolog} on the fretboard. Next, we calculate the `Pitch`{:.language-prolog} of the fretted note and verify that it's a `member`{:.language-prolog} of the chord `Quality`{:.language-prolog} we're checking for. Lastly we remove that pitch from the set of qualities, and recurse to check the rest of the strings and remaining notes in our chord voicing:

<pre class='language-prolog'><code class='language-prolog'>
voicing([[String,Open]|Tuning], Frets, Quality, [[String,Fret]|Voicing]) :-
  between(0,Frets,Fret),
  Pitch is (Open + Fret) mod 12,
  member(Pitch, Quality),
  subtract(Quality, [Pitch], RemainingQuality),
  voicing(Tuning, Frets, RemainingQuality, Voicing).
</code></pre>

If a string isn't being played as part of the given chord voicing, we can simply move on to check the next string on the fretboard:

<pre class='language-prolog'><code class='language-prolog'>
voicing([_|Tuning], Frets, Quality, Voicing) :-
  voicing(Tuning, Frets, Quality, Voicing).
</code></pre>

Eventually, we'll run out of strings to check. In that case, if the remaining set of notes in the chord voicing and the remaining set of pitches in our chord quality are both empty, we can say with confidence that the given set of notes is a valid voicing of the specified chord quality:

<pre class='language-prolog'><code class='language-prolog'>
voicing([], _, [], []).
</code></pre>

If we run out of strings and we're still looking for either notes in the voicing, or pitches in the quality, we know that something has gone wrong, and the chord we're looking at isn't a valid voicing.

Altogether, our complete `voicing/4`{:.language-prolog} predicate looks like this:

<pre class='language-prolog'><code class='language-prolog'>
voicing([], _, [], []).

voicing([_|Tuning], Frets, Quality, Voicing) :-
  voicing(Tuning, Frets, Quality, Voicing).

voicing([[String,Open]|Tuning], Frets, Quality, [[String,Fret]|Voicing]) :-
  between(0,Frets,Fret),
  Pitch is (Open + Fret) mod 12,
  member(Pitch, Quality),
  subtract(Quality, [Pitch], RemainingQuality),
  voicing(Tuning, Frets, RemainingQuality, Voicing).
</code></pre>

We can write a helper predicate that assumes an eighteen fret guitar in standard tuning:

<pre class='language-prolog'><code class='language-prolog'>
voicing(Quality, Voicing) :-
  voicing([[0,40], [1,45], [2,50], [3,55], [4,59], [5,64]],
          18,
          Quality,
          Voicing).
</code></pre>

We can use our new `voicing/4`{:.language-prolog} or `voicing/2`{:.language-prolog} predicates to ask whether a certain set of notes played on the fretboard are a valid C major voicing:

<pre class='language-prolog'><code class='language-prolog'>
voicing([0, 4, 7], [[1, 3], [2, 2], [3, 0]]).
</code></pre>

And Prolog happily tells us that it is a valid voicing!

<pre class='language-prolog'><code class='language-prolog'>
true.
</code></pre>

Excellent.

## Reversing the Relationship

We've seen that we can use our `voicing/4`{:.language-prolog} or `voicing/2`{:.language-prolog} predicate to check if a given set of notes on the fretboard are a valid voicing for a given chord quality. For example, we can ask if the notes `[[1, 5], [2, 5], [4, 4], [5, 6]]`{:.language-prolog} represent a G7 (`[5, 9, 0, 3]`{:.language-prolog}) chord voicing, and our Prolog program will confirm that they do.

But what else can we do? We were promised exploration!

Our `voicing/4`{:.language-prolog} implementation didn't explicitly lay out the steps for constructing a chord voicing of a given quality, but it did define the relationships between a fretboard configuration, the quality of the chord we're looking for, and the notes in a given chord voicing. Just like we reversed the relationships in `member/2`{:.language-prolog} to construct all possible lists containing `1`{:.language-prolog}, we can reverse the relationships defined in `voicing/4`{:.language-prolog} and find all possible voicings of a given chord quality!

All we have to do is leave the `Voicing`{:.language-prolog} argument unbound when we call our `voicing/2`{:.language-prolog} predicate, and Prolog will reverse the relationship and spit out every possible voicing of our G7 chord spread across out fretboard:

<pre class='language-prolog'><code class='language-prolog'>
voicing([5, 9, 0, 3], Voicing).
</code></pre>

<pre class='language-prolog'><code class='language-prolog'>
Voicing = [[2, 1], [3, 2], [4, 1], [5, 1]] ;
Voicing = [[2, 1], [3, 2], [4, 1], [5, 13]] ;
Voicing = [[2, 1], [3, 2], [4, 6], [5, 8]] ...
</code></pre>

Awesome! This is basically the heart of [Glorious Voice Leader](https://www.gloriousvoiceleader.com/) compressed into ten lines of code.

## Future Work

We should be able to dig deeper into these relationships. In theory, we should be able to leave the `Quality`{:.language-prolog} off of our call to `voicing/2`{:.language-prolog} and Prolog should tell us all of the possible qualities a given set of notes could be interpreted as.

Similarly, we should be able to leave the `Tuning`{:.language-prolog} argument unbound, and Prolog should give us all of the possible tunings that would give us the given type of chord with the given voicing.

Both of these types of query sound extremely useful and interesting for someone exploring their fretboard and trying to deepen their understanding of the guitar, but they're infeasible with my current implementation of the `voicing/4`{:.language-prolog} predicate. If we try either of them, Prolog will think forever and never give us an answer. If we [trace](https://www.swi-prolog.org/pldoc/man?section=debugger) through the execution we'll see an enormous amount of time being wasted on inevitably doomed partial solutions.

If I were a better Prologger, I'm sure I could implement a version of the `voicing/4`{:.language-prolog} predicate that could give us these answers, but I'm just not there yet. Consider it future work.
