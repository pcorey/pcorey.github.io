---
layout: post
title:  "Reversing BIP-39 and the Power of Property Testing"
description: "In which an attempt to reverse the BIP-39 encoding algorithm sends me down a debugging rabbit hole, and the power of property testing shows me the light."
author: "Pete Corey"
date:   2018-05-07
tags: ["Elixir", "Bitcoin"]
related: ["/blog/2018/02/19/from-bytes-to-mnemonic-using-elixir/"]
---


I was recently asked how I would go about reversing the BIP-39 encoding algorithm we [implemented previous](http://www.petecorey.com/blog/2018/02/19/from-bytes-to-mnemonic-using-elixir/) and used to build [our BIP-39 haiku miner](http://www.petecorey.com/blog/2018/03/05/mining-for-mnemonic-haiku-with-elixir/).

Implementing the reverse of this algorithm seemed straight-forward at first, but it quickly led me down a rabbit hole that showed me just how powerful property-based testing can be.

Read on!

## What is BIP-39 Again?

If you're asking yourself, "what is BIP-39 again?", I highly recommend you check out the first article in this series, ["From Bytes to Mnemonic using Elixir"](http://www.petecorey.com/blog/2018/02/19/from-bytes-to-mnemonic-using-elixir/), for a full rundown of [the BIP-39 encoding algorithm](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki).

As a quick summary, the BIP-39 encoding algorithm is intended to convert an arbitrary set of bytes into an easily memorizable sequence of words. The algorithm goes something like this:

1. Have bytes you want to encode.
2. Append a partial checksum to the end of your bytes.
3. Map every eleven bit chunk of the resulting binary onto [a wordlist of your choice](https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md).

The devil is in the detail, as we'll see.

## Laying the Groundwork

Before we write the reverse of our BIP-39 encoding algorithm, we need to lay some initial groundwork.

The [`Bip39.Mnemonic`{:.language-elixir} module](https://github.com/pcorey/bip39/blob/f0ca6ed451b7a629a87649d7a72e3725966b258d/lib/bip39/mnemonic.ex) we built in [the previous article](http://www.petecorey.com/blog/2018/02/19/from-bytes-to-mnemonic-using-elixir/) only had a single public function: `generate/0`{:.language-elixir}. The `generate/0`{:.language-elixir} function generated a random set of bytes and converted it into a BIP-39-style mnemonic.

<pre class='language-elixir'><code class='language-elixir'>
def generate do
  entropy
  |> attach_checksum
  |> map_onto_wordlist
end
</code></pre>

Moving forward, we should separate the encoding functionality from the entropy generation so we can test the encoding algorithm independently, with our own data. This will simplify the testing of our final solution.

<pre class='language-elixir'><code class='language-elixir'>
def generate do
  encode(generate_entropy)
end

def encode(data) do
  data
  |> attach_checksum
  |> map_onto_wordlist
end
</code></pre>

For clarity's sake, we've also renamed the `entropy/0`{:.language-elixir} function to `generate_entropy`{:.language-elixir}.

Great. Now that we have an `encode/1`{:.language-elixir} function that encodes a given binary, we're set up to add a new function, `decode/1`{:.language-elixir}, that reverses the process and returns the binary data decoded from a given mnemonic.

<pre class='language-elixir'><code class='language-elixir'>
def decode(mnemonic) do
  ...
end
</code></pre>

## Decoding the Mnemonic

The high-level process for reversing our BIP-39 algorithm and decoding our mnemonic into a binary looks something like this:

1. Maps the words in the mnemonic back into a binary.
2. Separate the appended partial checksum from the encoded data.
3. Verify that the appended checksum matches the actual checksum of the data.

Sounds like a plan.

The first step of decoding our mnemonic in our `decode/1`{:.language-elixir} function is to convert our encoded mnemonic wordlist back into a binary.

First, we'll map each word onto its index in our `@wordlist`{:.language-elixir}. Next, we'll convert each index into an eleven-bit binary and reduce that list of binaries down into a single concatenated binary:

<pre class='language-elixir'><code class='language-elixir'>
data_and_checksum =
  mnemonic
  |> Enum.map(&Enum.find_index(@wordlist, fn w -> w == &1 end))
  |> Enum.reduce(<<>>, fn n, acc -> <<acc::bits, n::11>> end)
</code></pre>

What we're left with is our originally encoded data concatenated with a variable-length partial checksum.

We know that the variable-length checksum is `1/32`{:.language-elixir} the length of our originally encoded data. Given that, we also know that the length of our originally encoded data is `32/33`{:.language-elixir} the length of `data_and_checksum`{:.language-elixir}. The concatenated checksum will fill the remaining space:

<pre class='language-elixir'><code class='language-elixir'>
total_size = bit_size(data_and_checksum)
data_size = div(total_size * 32, 33)
checksum_size = total_size - data_size
</code></pre>

Now that we know the structure of `data_and_checksum`{:.language-elixir}, we can pull out the individual pieces we care about using binary pattern matching:

<pre class='language-elixir'><code class='language-elixir'>
<<data::bits-size(data_size), partial_checksum::bits-size(checksum_size)>> =
  data_and_checksum
</code></pre>

Fantastic.

Now all that's left to do is verify that the `partial_checksum`{:.language-elixir} provided matches the calculated checksum of the provided `data`{:.language-elixir} binary. If the checksums match, we'll return an `:ok`{:.language-elixir} tuple containing the decoded `data`{:.language-elixir}. Otherwise, we'll return an `:error`{:.language-elixir} tuple explaining the situation:

<pre class='language-elixir'><code class='language-elixir'>
if <<data::bits, partial_checksum::bits>> == attach_checksum(data) do
  {:ok, data}
else
  {:error, :bad_checksum}
end
</code></pre>

That's it!

We can now `encode/1`{:.language-elixir} a given binary into a mnemonic wordlist, and then `decode/1`{:.language-elixir} it to retrieve the original binary.

## Putting our Solution to the Test

Now that we've built our `Bip39.Mnemonic.encode/1`{:.language-elixir} and `Bip39.Mnemonic.decode/1`{:.language-elixir} functions, we need to test that our encoding and decoding process is working as expected.

Testing an encoder/decoder pair is perfectly suited to property-based testing, so we'll use [the StreamData library](https://hexdocs.pm/stream_data/StreamData.html) to test our solution. We'll set up a new test module, `Bip39MnemonicTest`{:.language-elixir}, that scaffolds out a new property test for our mnemonic encoder:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Bip39MnemonicTest do
  use ExUnit.Case
  use ExUnitProperties

  property "encodes and decodes mnemonics" do
  end
end
</code></pre>

The property that we're trying to test is that a given binary is equal to its encoded mnemonic, decoded back into a binary. We can test this fairly easily with StreamData.

We know that the BIP-39 algorithm [only supports encoding data between sixteen and thirty two bits](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#generating-the-mnemonic):

> The allowed size of ENT is 128-256 bits.

Given that, we'll generate a stream of random binaries that fall within that size range:

<pre class='language-elixir'><code class='language-elixir'>
check all data <- binary(min_length: 16, max_length: 32) do
end
</code></pre>

Next, we'll generate the `mnemonic`{:.language-elixir} for our randomly generated `data`{:.language-elixir} binary, and `assert`{:.language-elixir} that the decoded `mnemonic`{:.language-elixir} matches our original `data`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
mnemonic = Bip39.Mnemonic.encode(data)
assert Bip39.Mnemonic.decode(mnemonic) == {:ok, data}
</code></pre>

If all goes well, our test should pass.

## An Under-Specified Encoder

Unfortunately, things rarely go as planned.

Our new test seems to run through several successful iterations of the encode/decode assertion, but ultimately fails. Thankfully, StreamData shrinks the failing test as much as possible and gives us the failing input:

<pre class='language-elixir'><code class='language-elixir'>
1) property encodes and decodes mnemonics (Bip39MnemonicTest)
   test/bip39_mnemonic_test.exs:5
   Failed with generated values (after 20 successful runs):
     
       * Clause:    data <- binary(min_length: 16, max_length: 32)
         Generated: <<0, 0, 0, 0, 55, 157, 129, 190, 93, 189, 119, 124, 164, 131, 5, 67, 23, 225, 251, 162, 200>>
     
   Assertion with == failed
   code:  assert Bip39.Mnemonic.decode(mnemonic) == {:ok, data}
   left:  {:error, :bad_checksum}
   right: {:ok, <<0, 0, 0, 0, 55, 157, 129, 190, 93, 189, 119, 124, 164, 131, 5, 67, 23, 225, 251, 162, 200>>}
</code></pre>

After an intense debugging session, I realized that there was nothing wrong with my `Bip39.Mnemonic.decode/1`{:.language-elixir} function. Instead, the problem was with my encoder.

{% include newsletter.html %}

The [BIP-39 specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#generating-the-mnemonic) clearly states that in addition to being "128-256 bits" in length, the length of the binary data being encoded must also be a multiple of thirty two bits:

> The mnemonic must encode entropy in a multiple of 32 bits.

Ignoring this requirement results in issues when generating and appending the partial checksum, and results in data loss during the decoding procedure.

To accommodate this requirement, let's update our property test to truncate all generated binaries to the nearest thirty two bits:

<pre class='language-elixir'><code class='language-elixir'>
check all bytes <- binary(min_length: 16, max_length: 32),
          bits_to_truncate = bytes |> bit_size |> rem(32),
          <<_::size(bits_to_truncate), data::bits>> = bytes do
  mnemonic = Bip39.Mnemonic.encode(data)
  assert Bip39.Mnemonic.decode(mnemonic) == {:ok, data}
end
</code></pre>

Now our test passes, as expected!

## Tightening Up our Encoding Process

While our `Bip39.Mnemonic.encode/1`{:.language-elixir} functions works when passed the correct data, it's probably not a good idea to assume that the developer knows what constitutes "good data".

Instead, let's refactor `Bip39.Mnemonic.encode/1`{:.language-elixir} to enforce the length requirements outlined in the BIP-39 specification.

Let's update the function head to assert that `data`{:.language-elixir} is a binary, assert that its length falls between one hundred twenty eight and two hundred fifty six bits, and assert that its length in bits is a multiple of thirty two:

<pre class='language-elixir'><code class='language-elixir'>
def encode(data)
    when is_binary(data) and bit_size(data) >= 128 and bit_size(data) <= 256 and
           rem(bit_size(data), 32) == 0 do
  {:ok,
   data
   |> attach_checksum
   |> map_onto_wordlist}
end
</code></pre>

If all of these requirements hold, we'll return the encoded `data`{:.language-elixir} wrapped in an `:ok`{:.language-elixir} tuple. Otherwise, we need to return an `:error`{:.language-elixir} tuple. We can do this with a second `encode/1`{:.language-elixir} function head:

<pre class='language-elixir'><code class='language-elixir'>
def encode(_), do: {:error, :invalid_data}
</code></pre>

Wrapping our `Bip39.Mnemonic.encode/1`{:.language-elixir} result in an `:ok`{:.language-elixir} tuple breaks our test. We'll need to fix that:

<pre class='language-elixir'><code class='language-elixir'>
check all bytes <- binary(min_length: 16, max_length: 32),
          bits_to_truncate = bytes |> bit_size |> rem(32),
          <<_::size(bits_to_truncate), data::bits>> = bytes do
  {:ok, mnemonic} = Bip39.Mnemonic.encode(data)
  assert Bip39.Mnemonic.decode(mnemonic) == {:ok, data}
end
</code></pre>

We should also add property tests to ensure that invalid binaries can't be encoded by mistake:

First we'll test that short binaries are rejected:

<pre class='language-elixir'><code class='language-elixir'>
property "rejects short binaries" do
  check all bits <- integer(1..8),
            <<_::size(bits), data::bits>> <- binary(max_length: 16) do
    assert Bip39.Mnemonic.encode(data) == {:error, :invalid_data}
  end
end
</code></pre>

Next, we'll test that long binaries are rejected:

<pre class='language-elixir'><code class='language-elixir'>
property "rejects long binaries" do
  check all bits <- integer(1..8),
            bytes <- binary(min_length: 32),
            data = <<bytes::binary, 0::size(bits)>> do
    assert Bip39.Mnemonic.encode(data) == {:error, :invalid_data}
  end
end
</code></pre>

And finally, we'll test that all "misaligned" binaries, or binaries who's lengths don't align to thirty two bits, are rejected:

<pre class='language-elixir'><code class='language-elixir'>
property "rejects misaligned binaries" do
  check all data <- bitstring(min_length: 129, max_length: 256),
            data |> bit_size |> rem(32) != 0 do
    assert Bip39.Mnemonic.encode(data) == {:error, :invalid_data}
  end
end
</code></pre>

Perfect. Now I'm fully confident in our BIP-39 encode/decode solution.

## Final Thoughts

While this seemingly simple task threw me down a rabbit hole I definitely didn't expect, I'm grateful for the experience. This showed me in a very hands-on way just how powerful property-based testing can be. Without randomly generated test cases, I don't think I would have recognized the issues with my `encode`{:.language-elixir} function.

If you'd like to see the BIP-39 encoder/decoder's source in its entirity, be sure to [check out the entire `Bip39`{:.language-elixir} project on Github](https://github.com/pcorey/bip39/).

I'd like to thank [Pierre Martin](https://github.com/hickscorp) for bringing up the topic of reversing our BIP-39 algorithm. After talking with me on [the Elixir Slack group](https://elixir-slackin.herokuapp.com/), he filed [a Github issue with his solution to the problem](https://github.com/pcorey/bip39/issues/1). I highly recommend you check out his approach for a more fleshed out solution.
