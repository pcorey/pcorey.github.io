---
layout: post
title:  "Mining for Mnemonic Haiku with Elixir"
description: "What are some interesting things we can do with the BIP-39 mnemonic generator we built in a previous article? How about mine for structurally sound mnemonic haiku?!"
author: "Pete Corey"
date:   2018-03-05
tags: ["Elixir", "Bitcoin", "Mastering Bitcoin"]
related: ["/blog/2018/02/19/from-bytes-to-mnemonic-using-elixir/"]
---

What are some interesting things we can do with [the BIP-39 mnemonic generator we built in a previous article](http://www.petecorey.com/blog/2018/02/19/from-bytes-to-mnemonic-using-elixir/)? The most obvious answer would be to create seeds for Bitcoin wallets, but I'm not looking for obvious today.

What if we sift through the generated mnemonics looking for [structurally sound haiku](https://en.wikipedia.org/wiki/Haiku#Syllables_or_on_in_haiku)? That sounds like a good time and a great excuse to play with [Elixir](https://elixir-lang.org/)!

Put on your lab coat and grab your Morty, we're going full mad scientist today!

## Mining for Haiku

If you're not familiar, [haiku](https://en.wikipedia.org/wiki/Haiku) are poems with a strictly defined structure. Haiku are three lines in length. The first and last lines are five syllables long, and the middle line is seven syllables in length.

Haiku traditionally focus on nature and the juxtaposition of two contrasting idea. Our haiku… will not.

> exhibit horror <br/> make obscure arrive unveil <br/> detail law pig prize

Thinking broadly, our process for generating mnemonic haiku will be very similar to [the process we used to mine for Bitcoin vanity addresses](http://www.petecorey.com/blog/2018/02/05/mining-for-bitcoin-vanity-addresses-with-elixir/). We'll repeatedly generate mnemonic sequences, filtering out those that don't satisfy the structural criteria of a haiku.

Let's create a new module to hold this functionality:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Bip39Haiku do
end
</code></pre>

Inside our new `Bip39Haiku`{:.language-elixir} module, we'll create a new `stream/0`{:.language-elixir} function that returns an Elixir stream of valid mnemonic haiku, sketching out helper functions as we go:

<pre class='language-elixir'><code class='language-elixir'>
def stream do
  fn ->
    Bip39Haiku.Mnemonic.generate()
  end
  |> Stream.repeatedly()
  |> Stream.filter(&Bip39Haiku.Haiku.is_valid?/1)
end
</code></pre>

We create an anonymous function that generates [a BIP-39 mnemonic](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) with a call to [our previously implemented `Bip39Haiku.Mnemonic.generate/0`{:.language-elixir}](http://www.petecorey.com/blog/2018/02/19/from-bytes-to-mnemonic-using-elixir/). Next, we pass our anonymous function into `Stream.repeatedly/1`{:.language-elixir} to create an infinite stream of mnemonic sequences. Lastly, we use `Stream.filter/2`{:.language-elixir} to filter out mnemonic sequences that aren't haiku.

All we have to do is implement `Bip39Haiku.Haiku.is_valid?/1`{:.language-elixir}!

## Validating Haiku

Our `Bip39Haiku.Haiku.is_valid?/1`{:.language-elixir} function will return `true`{:.language-elixir} when given a `wordlist`{:.language-elixir} that satisfies our structural criteria, and `false`{:.language-elixir} in all other cases. Let's start fleshing it out:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Bip39Haiku.Haiku do
  def is_valid?(wordlist) do
  end
end
</code></pre>

The first thing we need to do is associate each word in our `wordlist`{:.language-elixir} with its number of syllables. We'll do this with a call to a `attach_syllables/1`{:.language-elixir} helper function:

<pre class='language-elixir'><code class='language-elixir'>
wordlist = attach_syllables(wordlist)
</code></pre>

For now we'll wave our hands over the implementation of `attach_syllables/1`{:.language-elixir}, but let's assume the the result is a list of tuples:

<pre class='language-elixir'><code class='language-elixir'>
[{"cat", 1}, {"tomato", 3}, {"pizza", 2}]
</code></pre>

The first element of each tuple contains the original word in the wordlist, and the second element of the tuple is the number of syllables in that word.

## Filtering Unknown Words

Sometimes, our `attach_syllables/1`{:.language-elixir} function might be given a word it doesn't recognize. In that case, it'll claim the word has zero syllables. Since we don't know how many syllables are actually in the word, we can't use it to construct a haiku. In that case we'll have to assume the entire wordlist is invalid.

<pre class='language-elixir'><code class='language-elixir'>
with nil &lt;- Enum.find(wordlist, &zero_syllables?/1) do
  ...
else
  _ -> false
end
</code></pre>

We can use Elixir's `with`{:.language-elixir} special form to model our happy path. If we can't find any words with zero syllables, we're in the clear and are free to move on with our structural checks. Otherwise, we'll return `false`{:.language-elixir}.

The `zero_syllables?/1`{:.language-elixir} function is a simple helper to find words with `0`{:.language-elixir} syllables:

<pre class='language-elixir'><code class='language-elixir'>
defp zero_syllables?({_, 0}), do: true
defp zero_syllables?({_, _}), do: false
</code></pre>

## Dropping Syllables

In general, our plan of attack for validating that a given `wordlist`{:.language-elixir} is a haiku is to attempt to remove each line of syllables, one after the other. If we can successfully remove each line of syllables, and there are no words left in the wordlist, we have a haiku. If anything goes wrong along the way, we don't have a haiku.

We can update our happy path to express this strategy:

<pre class='language-elixir'><code class='language-elixir'>
with nil <- Enum.find(wordlist, &zero_syllables?/1),
     {:ok, wordlist} &lt;- drop_syllables(wordlist, 5),
     {:ok, wordlist} &lt;- drop_syllables(wordlist, 7),
     {:ok, wordlist} &lt;- drop_syllables(wordlist, 5) do
  Enum.empty?(wordlist)
else
  _ -> false
end
</code></pre>

Each call to `drop_syllables/2`{:.language-elixir} accepts a `wordlist`{:.language-elixir}, removes the specified number of syllables from the `wordlist`{:.language-elixir} (if possible), and returns the truncated list as a result.

The first step in writing `drop_syllables/2`{:.language-elixir} is to walk through our word list, accumulating the total number of syllables we've seen up until that point in the `wordlist`{:.language-elixir}. We can do this with a little help from [Elixir's `Enum.scan/3`{:.language-elixir}](https://hexdocs.pm/elixir/Enum.html#scan/2):

<pre class='language-elixir'><code class='language-elixir'>
total_syllables =
  wordlist
  |> Enum.scan(0, fn {word, syllables}, total ->
    total + syllables
  end)
</code></pre>

The `total_syllables`{:.language-elixir} list for our previous example of `["cat", "tomato", "pizza"]`{:.language-elixir} would look like this:

<pre class='language-elixir'><code class='language-elixir'>
[1, 4, 6]
</code></pre>

Now all we have to do is find the index of our `total_syllables`{:.language-elixir} list whose value, the total number of syllables seen up until that word, matches the number of syllables we're looking to remove from `wordlist`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
index =
  total_syllables
  |> Enum.find_index(&(&1 == syllables))
</code></pre>

If we can't find an `index`{:.language-elixir}, that means it's not possible to split off the desired number of syllables from the beginning of our `wordlist`{:.language-elixir}. In that case we return an error tuple:

<pre class='language-elixir'><code class='language-elixir'>
case index do
  nil ->
    {:error, :not_possible}

  index ->
    {:ok, Enum.drop(wordlist, index + 1)}
end
</code></pre>

Otherwise, we return our truncated `wordlist`{:.language-elixir}, [dropping every word](https://hexdocs.pm/elixir/Enum.html#drop/2) through our found `index`{:.language-elixir}.

{% include newsletter.html %}

## Attaching Syllables

Let's turn our attention to the previously glossed over `attach_syllables/1`{:.language-elixir} function.

Counting the number of syllables in a word is easy for us humans, but much more difficult for computers. To help out our computing allies, we'll be using [the Wordnik API](http://developer.wordnik.com/) to fetch the syllables in a given word.

Our `attach_syllables/1`{:.language-elixir} helper function will asynchronously look up the syllables in each of the words in `wordlist`{:.language-elixir} with a call to a new `Bip39Haiku.Wordnik.get_syllables/1`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
defp attach_syllables(wordlist) do
  wordlist
  |> Enum.map(
    &Task.async(fn ->
      {&1, Bip39Haiku.Wordnik.get_syllables(&1)}
    end)
  )
  |> Enum.map(&Task.await(&1, :infinity))
end
</code></pre>

Once we've fetched the syllables from Wordnik, `attach_syllables/1`{:.language-elixir} will pair the syllables with their associated words in a tuple, just as we expect.

## Fetching Syllables

Because this is a mad science experiment and not a serious software development project, we'll keep our `get_syllables/1`{:.language-elixir} function as simple as possible. To reiterate, `get_syllables/1`{:.language-elixir} should accept a `word`{:.language-elixir} and return the number of syllables in that word:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Bip39Haiku.Wordnik do
  def get_syllables(word) do
  end
end
</code></pre>

The first thing we need to do to fetch syllable information from Wordnik is to load our Wordnik API key:

<pre class='language-elixir'><code class='language-elixir'>
wordnik_api_key =
  Application.fetch_env!(
    :bip39_haiku,
    :wordnik_api_key
  )
</code></pre>

In our application's configuration, we'll pull the API key from the system's environment variables, falling back to Wordnik's demo API key if one isn't available:

<pre class='language-elixir'><code class='language-elixir'>
config :bip39_haiku,
  wordnik_api_key:
    System.get_env("WORDNIK_API_KEY") ||
      "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5"
</code></pre>

Next, we'll build the URL for the API endpoint we want to use. In this case, we'll be using [Wordnik's hyphenation endpoint](http://developer.wordnik.com/docs.html#!/word/getHyphenation_get_6):

<pre class='language-elixir'><code class='language-elixir'>
endpoint =
  "http://api.wordnik.com/v4/word.json/#{word}/hyphenation?api_key=#{
    wordnik_api_key
  }"
</code></pre>

Lastly, we'll make our request. If the request is successful, we'll parse the [HTTPotion](https://github.com/myfreeweb/httpotion) response object with a call to our `parse_response/1`{:.language-elixir} helper. Otherwise, we'll naively try to fetch the syllables again with a recursive call to `get_syllables/1`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
case HTTPotion.get(endpoint) do
  %HTTPotion.Response{
    status_code: 200,
    body: body
  } ->
    parse_response(body)

  _ ->
    get_syllables(word)
end
</code></pre>

Our `parse_response/1`{:.language-elixir} function decodes the resulting JSON string returned by the API and counts the number of unique syllables in the provided word:

<pre class='language-elixir'><code class='language-elixir'>
defp parse_response(body) do
  body
  |> Poison.decode!()
  |> Enum.map(& &1["seq"])
  |> Enum.uniq()
  |> length
end
</code></pre>

That's it!

Now that we've finished all of the components of our mnemonic haiku miner, let's put it to the test!

<video width="100%" style="margin: 2em 0;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/bip39_haiku.webm" autoplay loop controls></video>

## On Being a Respectful API Consumer

It's worth noting that in its current incarnation, our `get_syllables/1`{:.language-elixir} function is incredibly inefficient. It will hit the Wordnik API for every `word`{:.language-elixir} passed into it, even if its seen that word before. This isn't very respectful, and will surely result in our application running up against the API's rate limits.

An immediate and significant optimization for this haiku miner would be to add a database layer that stores each word along with its syllable count after receiving each result from the Wordnik API. Subsequent calls to `get_syllables/1`{:.language-elixir} could avoid calls to the Wordnik API by returning cached results from the database.

That said, this article is already too long, and the value of a BIP-39 mnemonic haiku generator is questionable at best, so I'll leave this improvement as an exercise for the reader.

## A Warning - Don't Use These Seeds!

Before I end this article, I feel that it's important to mention in big, bold letters that __the mnemonics generated with this tool should not be used to manage real Bitcoin wallets.__

By restricting your wallet's seed entropy to just the subset of random bytes that result in the generation of a structurally sound haiku, you're drastically reducing the practical security of your wallet.

This project is only intended to be an experiment and a learning exercise.

## Final Thoughts

Now that our haiku miner is finished, we can revel in the beauty of our cryptographically secure, randomly generated poetry.

> useless squeeze topic <br/> blind lawsuit quit tube hamster <br/> reason empower

Beauty is in the eye of the beholder, I guess.

This was definitely a weird tangent, but this idea has been rolling around in the back of my head for weeks now. Now that I've built my mnemonic haiku miner, maybe I'll find some peace. Be sure to check out [the whole project on Github](https://github.com/pcorey/bip39_haiku).

If you find this kind of Bitcoin development interesting, [I highly recommend you check out Andreas Antonopoulos' Mastering Bitcoin](http://amzn.to/2oIVDvt). Most of the examples in the book are written in Python and C, but as [my previous Master Bitcoin articles demonstrate](http://www.petecorey.com/blog/tags/#mastering-bitcoin), Bitcoin development is perfectly suited for Elixir.

If you have any other ideas for mad science experiments with anything Elixir or Bitcoin related, [let me know on Twitter](https://twitter.com/petecorey)!
