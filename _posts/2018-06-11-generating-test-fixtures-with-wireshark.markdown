---
layout: post
title:  "Generating Test Fixtures with Wireshark"
description: "Wireshark can be an invaluable tool for testing the parsing and serializing of a well-known binary protocol. Check out how we can use binary fixtures exported from Wireshark to test our Elixir-based Bitcoin protocol parser and serializer."
author: "Pete Corey"
date:   2018-06-11
tags: ["Elixir", "Testing", "Bitcoin"]
related: []
---

My [in-progress Elixir-based Bitcoin node](https://github.com/pcorey/bitcoin_network/) is woefully lacking on the test front. This is especially problematic considering how finicky [the Bitcoin protocol parsing and serialization process can be](https://en.bitcoin.it/wiki/Protocol_documentation).

But how can we test this functionality without going through the mind-numbing process of manually constructing each packet under test and asserting that it parses and serializes as expected?

Thankfully, Wireshark's support of the Bitcoin protocol turns this into a simple task. Let's dig into how we can use [Wireshark](https://www.wireshark.org/) to generate binary fixtures for each of our Bitcoin packets under test, and explore how we can test against them using Elixir.

## Generating Our Fixtures

Wireshark supports the Bitcoin protocol out of the box. That makes the process of generating test fixtures incredibly simple. To create a binary fixture for a given Bitcoin packet, we just need to follow these three steps:

Step one: Fire up Wireshark, start capturing on your network interface, and set `bitcoin`{:.language-elixir} as your display filter:

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/generating-test-fixtures-with-wireshark/01.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Filtering for bitcoin packets.</p>
</div>

Step two: Start `bitcoind`{:.language-elixir}, and watch the packets roll in:

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/generating-test-fixtures-with-wireshark/02.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Bitcoin packets on the wire.</p>
</div>

Step three: Notice that Wireshark teases out the Bitcoin-specific portion of every matching TCP packet it receives. Each packet can be exported by right clicking on the "Bitcoin protocol" breakdown, and choosing "Export Packet Bytes."

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/generating-test-fixtures-with-wireshark/03.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">High level packet information.</p>
</div>

The bytes we're exporting represent the entire packet, as it comes in over the wire.

## Parsing Our Fixtures

Now that we've saved a handful of packets we'd like to test against, we can start the process of incorporating them into our test suite.

Let's assume that we've saved all of our exported packets into a `test/fixtures`{:.language-elixir} folder within our project. Let's also assume that we want to start by testing our "version" packet (the most interesting packet we're able to parse, so far).

Let's make a new `VersionTest`{:.language-elixir} test module and lay down some boilerplate:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Protocol.VersionTest do
  use ExUnit.Case

  alias BitcoinNetwork.Protocol
  alias BitcoinNetwork.Protocol.{Message, Version}
end
</code></pre>

Next, we'll add our test:

<pre class='language-elixir'><code class='language-elixir'>
test "parses a version payload" do
end
</code></pre>

The first thing we'll need to do is load the data from our exported version packet binary:

<pre class='language-elixir'><code class='language-elixir'>
assert {:ok, packet} = File.read("test/fixtures/version.bin")
</code></pre>

We use Elixir's [`File.read/1`{:.language-elixir}](https://hexdocs.pm/elixir/File.html#read/1) to read the contents of our `version.bin`{:.language-elixir} file, and assert that we'll receive an `:ok`{:.language-elixir} tuple containing the binary contents of our file in our new `packet`{:.language-elixir} assignment.

Next, we'll parse the binary, just like we do within our `Node`{:.language-elixir} with a call to `Message.parse/1`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
assert {:ok, message, <<>>} = Message.parse(packet)
</code></pre>

Once again, we assert that we'll receive an `:ok`{:.language-elixir} tuple with our resulting `message`{:.language-elixir}. Because the data we exported from Wireshark relates specifically to our version packet, we expect the list of remaining, unparsed binary data to be empty (`<<>>`{:.language-elixir}).

Now that we've parsed the message, we can compare the resulting `Version`{:.language-elixir} struct found in `message.parsed_payload`{:.language-elixir} with a pre-defined, expected `version`{:.language-elixir} struct and assert that they're equal:

<pre class='language-elixir'><code class='language-elixir'>
assert message.parsed_payload == version
</code></pre>

But where does `version`{:.language-elixir} come from? How can we know the contents of our `version.bin`{:.language-elixir} packet without manually parsing it ourselves, byte by byte?

## Interpreting Our Fixtures

Once again, Wireshark comes to the rescue. In addition to letting us export our Bitcoin packets as raw binaries, Wireshark also lets us inspect the parsed contents of each of our Bitcoin packets.

If we go back to our version packet in our Wireshark capture file, we can open up the "Bitcoin protocol" section and see a complete breakdown of not only the high level message metadata, but also the specific information sent along in the version message:

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/generating-test-fixtures-with-wireshark/04.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Filtering for bitcoin packets.</p>
</div>

We can use this information to construct our pre-defined `version`{:.language-elixir} struct at the top of our test:

<pre class='language-elixir'><code class='language-elixir'>
version = %Version{
  version: 70015,
  services: 13,
  timestamp: 1_528_146_756,
  recv_ip: <<0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 160, 16, 233, 215>>,
  recv_port: 18333,
  recv_services: 9,
  from_ip: <<0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0>>,
  from_port: 0,
  from_services: 13,
  nonce: 15_116_783_876_185_394_608,
  user_agent: "/Satoshi:0.14.2/",
  start_height: 1_322_730
}
</code></pre>

And with that, we have a solid test of our version parsing functionality.

## Testing Serialization

We can test the serialization of our version packet much like we tested the parsing functionality.

Let's start off by adding a new test to our `VersionTest`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
test "serializes a version struct" do
end
</code></pre>

Once again, we'll start off by using `File.read/1`{:.language-elixir} to load our binary fixture, and using `Message.parse/1`{:.language-elixir} to parse the resulting binary:

<pre class='language-elixir'><code class='language-elixir'>
assert {:ok, packet} = File.read("test/fixtures/version.bin")
assert {:ok, message, <<>>} = Message.parse(packet)
</code></pre>

Rather than comparing the `message.parsed_payload`{:.language-elixir} to some pre-defined `Version`{:.language-elixir} struct, we'll instead serialize it with a call to `Protocol.serialize/1`{:.language-elixir} and compare the newly serialized version against the message's `payload`{:.language-elixir} binary:

<pre class='language-elixir'><code class='language-elixir'>
assert Protocol.serialize(message.parsed_payload) == message.payload
</code></pre>

And that's it!

If our version serialization code is working correctly, it should return a binary identical to the version portion of the packet exported from Wireshark.

## Final Thoughts

I'd like to give a huge shout out to [Lucid Simple's article on "Binary Fixtures with Wireshark"](http://blog.lucidsimple.com/2014/08/14/binary-fixtures-with-wireshark.html). It was a huge inspiration for me and a very well written article. I highly recommend you check it out if you'd like a more in-depth exploration of using Wireshark-generated binary fixtures.

For what it's worth, this kind of testing has already resulted in a positive return on investment. Shortly after implementing these tests, I noticed that my version struct was incorrectly serializing messages, resulting in some strange behavior I'd been noticing with my node. Using the tests as a guide, I was able to quickly fix my implementation.

Three cheers for testing!
