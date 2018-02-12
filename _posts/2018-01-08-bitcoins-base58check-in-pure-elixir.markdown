---
layout: post
title:  "Bitcoin's Base58Check in Pure Elixir"
description: "Elixir ships out of the box with nearly all of the tools required to generate Bitcoin private keys and transform them into public addresses. All except one. In this article we implement the missing piece of the puzzle: Base58Check encoding."
author: "Pete Corey"
date:   2018-01-08
tags: ["Elixir", "Bitcoin", "Mastering Bitcoin"]
related: ["/blog/2018/01/22/generating-bitcoin-private-keys-and-public-addresses-with-elixir/", "/blog/2018/02/12/property-testing-our-base58check-encoder-with-an-external-oracle/"]
---

An important piece of the process of transforming a Bitcoin private key into a public address, as outlined in [the fantastic Mastering Bitcoin book](http://amzn.to/2E6gO0I), is the Base58Check encoding algorithm.

The Bitcoin wiki has a [great article](https://en.bitcoin.it/wiki/Base58Check_encoding) on Base58Check encoding, and even gives an [example implementation](https://en.bitcoin.it/wiki/Base58Check_encoding#Base58_symbol_chart) of the underlying Base58 encoding algorithm in C.

This algorithm seems especially well-suited to Elixir, so I thought it’d be a fun and useful exercise to build out `Base58`{:.language-elixir} and `Base58Check`{:.language-elixir} modules to use in future Bitcoin and Elixir experiments.

## Like Base64, but Less Confusing

Base58 is a binary-to-text encoding algorithm that's designed to encode a blob of arbitrary binary data into human readable text, much like the more well known [Base64 algorithm](https://hexdocs.pm/elixir/Base.html#encode64/2).

Unlike Base64 encoding, Bitcoin’s Base58 encoding algorithm omits characters that can be potentially confusing or ambiguous to a human reader. For example, the characters `O`{:.language-elixir} and `0`{:.language-elixir}, or `I`{:.language-elixir} and `l`{:.language-elixir} can look similar or identical to some readers or users of certain fonts.

To avoid that ambiguity, Base58 simply removes those characters from its alphabet.

Shrinking the length of the alphabet we map our binary data onto from sixty four characters down to fifty eight characters means that we can’t simply [group our binary into six-bit chunks](https://en.wikipedia.org/wiki/Base64#Examples) and map each chunk onto its corresponding letter in our alphabet.

Instead, our Base58 encoding algorithm works by treating our binary as a single large number. We repeatedly divide that number by the size of our alphabet (fifty eight), and use the remainder of that division to map onto a character in our alphabet.

## Implementing Base58 in Elixir

This kind of algorithm can neatly be expressed in Elixir. We’ll start by creating a `Base58`{:.language-elixir} module and adding our alphabet as a module attribute:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Base58 do
  @alphabet '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
end
</code></pre>

Inside our `Base58`{:.language-elixir} module, we’ll define an `encode/2`{:.language-elixir} function. If we pass `encode`{:.language-elixir} a binary, we want to convert it into a number using [Erlang’s `:binary.decode_unsigned`{:.language-elixir}](http://erlang.org/doc/man/binary.html#decode_unsigned-1):

<pre class='language-elixir'><code class='language-elixir'>
def encode(data, hash \\ "")
def encode(data, hash) when is_binary(data) do
  encode(:binary.decode_unsigned(data), hash)
end
</code></pre>

Once converted, we pass our binary-come-number into a recursive call to `encode/2`{:.language-elixir} along with the beginning of our hash, an empty string.

For each recursive call to `encode/2`{:.language-elixir}, we use `div`{:.language-elixir} and `rem`{:.language-elixir} to divide our number by `58`{:.language-elixir} and find the reminder. We use that remainder to map into our `@alphabet`{:.language-elixir}, and prepend the resulting character onto our `hash`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def encode(data, hash) do
  character = <<Enum.at(@alphabet, rem(data, 58))>>
  encode(div(data, 58), hash <> character)
end
</code></pre>

We’ll continue recursing until we’ve divided our `data`{:.language-elixir} down to `0`{:.language-elixir}. In that case, we’ll return the `hash`{:.language-elixir} string we’ve built up:

<pre class='language-elixir'><code class='language-elixir'>
def encode(0, hash), do: hash
</code></pre>

This implementation of our Base58 encoded _mostly_ works.  We can encode any text string and receive correct results:

<pre class='language-elixir'><code class='language-elixir'>
iex(1)> Base58.encode("hello")
"Cn8eVZg"
</code></pre>

{% include newsletter.html %}

## Encoding Leading Zeros

However when we try to encode binaries with leading zero bytes, those bytes vanish from our resulting hash:

<pre class='language-elixir'><code class='language-elixir'>
iex(1)> Base58.encode(<<0x00>> <> "hello")
"Cn8eVZg"
</code></pre>

That zero _should_ become a leading `"1"`{:.language-elixir} in our resulting hash, but our process of converting the initial binary into a number is truncating those leading bytes. We’ll need to count those leading zeros, encode them manually, and prepend them to our final hash.

Let’s start by writing a function that counts the number of leading zeros in our initial binary:

<pre class='language-elixir'><code class='language-elixir'>
defp leading_zeros(data) do
  :binary.bin_to_list(data)
  |> Enum.find_index(&(&1 != 0))
end
</code></pre>

We use [Erlang’s `:binary.bin_to_list`{:.language-elixir}](http://erlang.org/doc/man/erlang.html#binary_to_list-1) to convert our binary into a list of bytes, and [`Enum.find_index`{:.language-elixir}](https://hexdocs.pm/elixir/Enum.html#find_index/2) to find the first byte in our list that isn’t zero. This index value is equivalent to the number of leading zero bytes in our binary.

Next, we’ll write a function to manually encode those leading zeros:

<pre class='language-elixir'><code class='language-elixir'>
defp encode_zeros(data) do
  <<Enum.at(@alphabet, 0)>>
  |> String.duplicate(leading_zeros(data)) 
end
</code></pre>

We simply grab the character in our alphabet that maps to a zero byte (`"1"`{:.language-elixir}), and duplicate it as many times as we need.

Finally, we’ll update our initial `encode/2`{:.language-elixir} function to prepend these leading zeros onto our resulting hash:

<pre class='language-elixir'><code class='language-elixir'>
def encode(data, hash) when is_binary(data) do
  encode_zeros(data) <> encode(:binary.decode_unsigned(data), hash)
end
</code></pre>

Now we should be able to encode binaries with leading zero bytes and see their resulting `"1"`{:.language-elixir} values in our final hash:

<pre class='language-elixir'><code class='language-elixir'>
iex(1)> Base58.encode(<<0x00>> <> "hello")
"1Cn8eVZg"
</code></pre>

Great!

## Base58 + Checksum = Base58Check

Now that we have a working implementation of the Base58 encoding algorithm, we can implement our Base58Check algorithm!

Base58Check encoding is really just Base58 with an added checksum. This checksum is important to in the Bitcoin world to ensure that public addresses aren’t mistyped or corrupted before funds are exchanged.

At a high level, the process of Base58Check encoding a blob of binary data involves hashing that data, taking the first four bytes of the resulting hash and appending them to the end of the binary, and Base58 encoding the result.

We can implement Base58Check fairly easily using our newly written `Base58`{:.language-elixir} module. We’ll start by creating a new `Base58Check`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Base58Check do
end
</code></pre>

In our module, we’ll define a new `encode/2`{:.language-elixir} function that takes a version byte and the binary we want to encode:

<pre class='language-elixir'><code class='language-elixir'>
def encode(version, data)
</code></pre>

Bitcoin uses the `version`{:.language-elixir} byte to specify the type of address being encoded. A version byte of `0x00`{:.language-elixir} means that we’re encoding a regular Bitcoin address to be used on the live Bitcoin network.

The first thing we’ll need to do is generate our checksum from our `version`{:.language-elixir} and our `data`{:.language-elixir}. We’ll do that in a new function:

<pre class='language-elixir'><code class='language-elixir'>
defp checksum(version, data) do
  version <> data
  |> sha256
  |> sha256
  |> split
end
</code></pre>

We concatenate our `version`{:.language-elixir} and `data`{:.language-elixir} binaries together, hash them twice using a `sha256/1`{:.language-elixir} helper function, and then returning the first four bytes of the resulting hash with a call to `split/1`{:.language-elixir}.

`split/1`{:.language-elixir} is a helper function that pulls the first four bytes out of the resulting hash using binary pattern matching:

<pre class='language-elixir'><code class='language-elixir'>
defp split(<< hash :: bytes-size(4), _ :: bits >>), do: hash
</code></pre>

Our `sha256/1`{:.language-elixir} helper function uses [Erlang’s `:crypto.hash`{:.language-elixir}](http://erlang.org/doc/man/crypto.html#hash-2) function to [SHA-256 hash](https://en.wikipedia.org/wiki/SHA-2) its argument:

<pre class='language-elixir'><code class='language-elixir'>
defp sha256(data), do: :crypto.hash(:sha256, data)
</code></pre>

We've wrapped this in a helper function to facilitate Elixir-style piping.

---- 

Now that we have our four-byte checksum, we can flesh out our original `encode/2`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
def encode(version, data) do
  version <> data <> checksum(version, data)
  |> Base58.encode
end
</code></pre>

We concatenate our `version`{:.language-elixir}, `data`{:.language-elixir}, and the result of our `checksum`{:.language-elixir} function together, and Base58 encode the result. That’s it!

Base58Check encoding our `"hello"`{:.language-elixir} string with a `version`{:.language-elixir} of `<<0x00>>`{:.language-elixir} should give us a result of `"12L5B5yqsf7vwb"`{:.language-elixir}. We can go further and [verify our implementation with an example pulled from the Bitcoin wiki](https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses):

<pre class='language-elixir'><code class='language-elixir'>
iex(1)> Base58Check.encode(<<0x00>>, 
    <<0x01, 0x09, 0x66, 0x77, 0x60,
      0x06, 0x95, 0x3D, 0x55, 0x67,
      0x43, 0x9E, 0x5E, 0x39, 0xF8, 
      0x6A, 0x0D, 0x27, 0x3B, 0xEE>>)
"16UwLL9Risc3QfPqBUvKofHmBQ7wMtjvM"
</code></pre>

Perfect!

## Wrapping Up

If you’d like to see both modules in their full glory, I’ve included them in my [`hello_bitcoin`{:.language-elixir} repository on Github](https://github.com/pcorey/hello_bitcoin). Here’s a direct link to the [`Base58`{:.language-elixir} module](https://github.com/pcorey/hello_bitcoin/blob/master/lib/base58.ex), and the [`Base58Check`{:.language-elixir} module](https://github.com/pcorey/hello_bitcoin/blob/master/lib/base58check.ex), along with a [simple unit test](https://github.com/pcorey/hello_bitcoin/blob/master/test/base58check_test.exs). If that repository looks familiar, it’s because it was used in a previous article on [controlling a Bitcoin node with Elixir](http://www.petecorey.com/blog/2017/09/04/controlling-a-bitcoin-node-with-elixir/).

I highly suggest you read through [Andreas Antonopoulos’ Mastering Bitcoin book](http://amzn.to/2E6gO0I) if you’re at all interested in how the Bitcoin blockchain works, or Bitcoin development in general. His book has been my primary source of inspiration and information for every Bitcoin article I’ve written to date.
