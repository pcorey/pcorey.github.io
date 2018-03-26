---
layout: post
title:  "Building Mixed Endian Binaries with Elixir"
description: "Working with mixed-endian binaries is something we rarely have to think about as web developers. When it does come up, Elixir thankfully ships with the perfect tools for the job."
author: "Pete Corey"
date:   2018-03-19
tags: ["Elixir", "Bitcoin"]
related: []
---

I've never had much of a reason to worry about the "endianness" of my binary data when working on Elixir projects. For the most part, everything within an application will be internally consistent, and everything pulled in from external sources will be converted to the machine's native ordering several layers of abstraction below where I tend to work.

That blissful ignorance came to an end when I found myself using Elixir to construct packets conforming to the Bitcoin peer-to-peer network protocol.

## The Bitcoin Protocol

The Bitcoin protocol is a TCP-based protocol used by Bitcoin nodes to communicate over a peer-to-peer ad hoc network.

The real-world specifications of the protocol are defined to be "whatever the [reference client does](https://github.com/bitcoin/bitcoin/)," but this can be difficult to tease out from the code. Thankfully, the Bitcoin wiki maintains [a fantastic technical description of the protocol](https://en.bitcoin.it/wiki/Protocol_documentation).

The structures used throughout the protocol are a mishmash of endianness. As the wiki explains, "almost all integers are encoded in little endian," but many other fields like checksums, strings, network addresses, and ports are expected to be big endian.

The [`net_addr`{:.language-elixir} structure](https://en.bitcoin.it/wiki/Protocol_documentation#Network_address) is an excellent example of this endianness confusion. Both `time`{:.language-elixir} and `services`{:.language-elixir} are expected to be little endian encoded, but the `IPv6/4`{:.language-elixir} and `port`{:.language-elixir} fields are expected to be big endian encoded.

How will we build this with Elixir?

## First Attempt

My first attempt at constructing this `net_addr`{:.language-elixir} binary structure was to create a `net_addr`{:.language-elixir} function that accepts `time`{:.language-elixir}, `services`{:.language-elixir}, `ip`{:.language-elixir}, and `port`{:.language-elixir} arguments and returns a binary of the final structure in correct mixed-endian order.

<pre class='language-elixir'><code class='language-elixir'>
def net_addr(time, services, ip, port) do
end
</code></pre>

When manually constructing binaries, [Elixir defaults to a big endian byte order](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#%3C%3C%3E%3E/1-endianness). This means that I'd need to convert `time`{:.language-elixir} and `services`{:.language-elixir} into little endian byte order before adding them to the final binary.

My first attempt at endian conversion was to create a `reverse/1`{:.language-elixir} helper function that would take a binary, transform it into a list of bytes using [`:binary.bin_to_list`{:.language-elixir}](http://erlang.org/doc/man/binary.html#bin_to_list-1), reverse that list of bytes, transform it back into a binary using [`:binary.list_to_bin`{:.language-elixir}](http://erlang.org/doc/man/binary.html#list_to_bin-1), and return the result:

<pre class='language-elixir'><code class='language-elixir'>
def reverse(binary) do
  binary
  |> :binary.bin_to_list
  |> Enum.reverse
  |> :binary.list_to_bin
end
</code></pre>

Before I could pass `time`{:.language-elixir} and `services`{:.language-elixir} into `reverse/1`{:.language-elixir}, I needed to transform them into binaries first. Thankfully, this is easy with [Elixir's binary special form](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#%3C%3C%3E%3E/1).

For example, we can convert `time`{:.language-elixir} into a four byte (`32`{:.language-elixir} bit) big endian binary and then reverse it to create its corresponding little endian representation:

<pre class='language-elixir'><code class='language-elixir'>
reverse(&lt;&lt;time::32>>)
</code></pre>

Using our helper, we can create out final `net_addr`{:.language-elixir} binary:

<pre class='language-elixir'><code class='language-elixir'>
&lt;&lt;
  &lt;&lt;time::32>> |> reverse::binary,
  &lt;&lt;services::64>> |> reverse::binary,
  :binary.decode_unsigned(ip)::128,
  port::16
>>
</code></pre>

This works, but there's some room for improvement.

## A Faster Second Attempt

After doing some research, I discovered [this set of benchmarks](https://gist.github.com/evadne/33805e13f1d84eb2e32f0d1e1a376899) for several different techniques of reversing a binary in Elixir (thanks [Evadne Wu](https://twitter.com/evadne)!).

I realized that I could significantly improve the performance of my packet construction process by replacing my slow list-based solution with a solution that leverages the optional `Endianness`{:.language-elixir} argument of [`:binary.decode_unsigned/2`{:.language-elixir}](http://erlang.org/doc/man/binary.html#decode_unsigned-2) and [`:binary.encode_unsigned/2`{:.language-elixir}](http://erlang.org/doc/man/binary.html#encode_unsigned-2):

<pre class='language-elixir'><code class='language-elixir'>
def reverse(binary) do
  binary
  |> :binary.decode_unsigned(:little)
  |> :binary.encode_unsigned(:big)
end
</code></pre>

While this was an improvement, I still wasn't happy with my solution. Using my `reverse/1`{:.language-elixir} function meant that I had to transform my numbers into a binary before reversing them and ultimately concatenating them into the final binary. This nested binary structure was awkward and confusing.

After asking for guidance on Twitter, the ElixirLang account reached out with some sage advice:

<div style="width: 66%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/building-mixed-endian-binaries-with-elixir/elixir-tweet.png" style=" width: 100%;"/>
</div>

## Using Big and Little Modifiers

The [`big`{:.language-elixir} and `little`{:.language-elixir} modifiers](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#%3C%3C%3E%3E/1-modifiers) are binary special form modifiers, much like the [`bitstring`{:.language-elixir} and `binary`{:.language-elixir} types](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#%3C%3C%3E%3E/1-types). They can be used to specify the resulting endianness when coercing an `integer`{:.language-elixir}, `float`{:.language-elixir}, `utf16`{:.language-elixir} or `utf32`{:.language-elixir} value into a binary.

For example, we can replace our calls reversing the `time`{:.language-elixir} and `services`{:.language-elixir} binaries in our final binary concatenation by simply appending `big`{:.language-elixir} to the final size of each:

<pre class='language-elixir'><code class='language-elixir'>
&lt;&lt;
  time::32-little,
  services::64-little,
  :binary.decode_unsigned(ip)::128,
  port::16
>>
</code></pre>

Awesome! That's much easier to understand.

While Elixir defaults to a big endian format for manually constructed binaries, it doesn't hurt to be explicit. We know that our `ip`{:.language-elixir} and `port`{:.language-elixir} should be big endian encoded, so let's mark them that way:

<pre class='language-elixir'><code class='language-elixir'>
&lt;&lt;
  time::32-little,
  services::64-little,
  :binary.decode_unsigned(ip)::128-big,
  port::16-big
>>
</code></pre>

Beautiful.

## Final Thoughts

I'm continually amazed by the quantity, diversity, and quality of the tooling that ships out of the box with Elixir and Elixir. Even when it comes to something as niche as low-level binary manipulation, Elixir's tools are top notch.

If you want to see complete examples of the endian conversion code shown in this article, check out [the `BitcoinNetwork.Protocol.NetAddr`{:.language-elixir} module](https://github.com/pcorey/bitcoin_network/blob/master/lib/bitcoin_network/protocol/net_addr.ex) in my new `bitcoin_network`{:.language-elixir} project on Github.
