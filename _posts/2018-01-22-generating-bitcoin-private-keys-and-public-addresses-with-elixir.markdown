---
layout: post
title:  "Generating Bitcoin Private Keys and Public Addresses with Elixir"
description: "Elixir ships with the tools required to generate a cryptographically secure private key and transform it into a public address. Check out this step-by-step walkthrough."
author: "Pete Corey"
date:   2018-01-22
tags: ["Elixir", "Bitcoin"]
related: ["/blog/2018/01/08/bitcoins-base58check-in-pure-elixir/"]
---

Lately I’ve been working my way through [Mastering Bitcoin](http://amzn.to/2DAbVy0), implementing as many of the examples in the book in Elixir as I can.

I’ve been amazed at how well Elixir has fared with implementing the algorithms involved in working with keys and addresses. Elixir ships with all the tools required to generate a cryptographically secure private key and transform it into a public address string.

Let’s walk through the process step by step and build our our own Elixir module to generate private keys and public addresses.

## What are Private Keys and Public Addresses?

A Bitcoin private key is really just a random two hundred fifty six bit number. As the name implies, this number is intended to be kept private. 

From each private key, a public-facing Bitcoin address can be generated. Bitcoin can be sent to this public address by anyone in the world. However, only the keeper of the private key can produce a signature that allows them to access the Bitcoin stored there.

Let’s use Elixir to generate a cryptographically secure private key and then generate its most basic corresponding public address so we can receive some Bitcoin!

## Pulling a Private Key Out of Thin Air

As I mentioned earlier, a Bitcoin private key is really just a random two hundred and fifty six bit number. In other words, a private key can be any number between `0`{:.language-elixir} and `2^256`{:.language-elixir}.

However, not all random numbers are created equally. We need to be sure that we’re generating our random number from a [cryptographically secure source of entropy](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator). Thankfully, Elixir exposes [Erlang’s `:crypto.strong_rand_bytes/1`{:.language-elixir}](http://erlang.org/doc/man/crypto.html#strong_rand_bytes-1) function which lets us easily generate a list of truly random bytes.

Let’s use `:crypto.strong_rand_bytes/1`{:.language-elixir} as the basis for our private key generator. We’ll start by creating a new `PrivateKey`{:.language-elixir} module and a `generate/0`{:.language-elixir} function that takes no arguments:

<pre class='language-elixir'><code class='language-elixir'>
defmodule PrivateKey do
  def generate
end
</code></pre>

Inside our `generate/0`{:.language-elixir} function, we’ll request `32`{:.language-elixir} random bytes (or `256`{:.language-elixir} bits) from `:crypto.strong_rand_bytes/1`{:.language-elixir}:
 
<pre class='language-elixir'><code class='language-elixir'>
def generate do
  :crypto.strong_rand_bytes(32)
end
</code></pre>

This gives us a random set of `32`{:.language-elixir} bytes that, when viewed as an unsigned integer, ranges between `0`{:.language-elixir} and `2^256 - 1`{:.language-elixir}. 

Unfortunately, we’re not quite done.

## Validating our Private Key

To ensure that our private key is difficult to guess, the [Standards for Efficient Cryptography Group](http://www.secg.org/) recommends that we pick a private key between the number `1`{:.language-elixir} and a number slightly smaller than `1.158e77`{:.language-elixir}:

<a href="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/secg.png" style="display: block; background-color: transparent; color: #ccc; text-align: center; line-height: 1; font-size: 0.8; margin: 2em auto;"><img style="display:block; width: 75%; margin: 0 auto 1em;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/secg.png"/>An excerpt of the SECG guidelines.</a>

We can add this validation check fairly easily by adding the SECG-provided upper bound as an attribute to our `PrivateKey`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
@n :binary.decode_unsigned(<<
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE,
  0xBA, 0xAE, 0xDC, 0xE6, 0xAF, 0x48, 0xA0, 0x3B,
  0xBF, 0xD2, 0x5E, 0x8C, 0xD0, 0x36, 0x41, 0x41
>>)
</code></pre>

Next, we’ll add a `valid?/1`{:.language-elixir} function to our module that returns `true`{:.language-elixir} if the provided secret key falls within this range, and `false`{:.language-elixir} if it does not:

<pre class='language-elixir'><code class='language-elixir'>
defp valid?(key) when key > 1 and key < @n, do: true
defp valid?(_), do: false
</code></pre>

Before we pass our private key into our `valid?/1`{:.language-elixir} function, we'll need to convert it from a thirty two byte binary into an unsigned integer. Let's add a third `valid?/1`{:.langauge-elixir} function head that does just that:

<pre class='language-elixir'><code class='language-elixir'>
defp valid?(key) when is_binary(key) do
  key
  |> :binary.decode_unsigned
  |> valid?
end
</code></pre>

We’ll finish off our validation by passing our generated private key into our new `valid?/1`{:.language-elixir} function. If the key is valid, we’ll return it. Otherwise, we’ll generate a new private key and try again:

<pre class='language-elixir'><code class='language-elixir'>
def generate do
  private_key = :crypto.strong_rand_bytes(32)
  case valid?(private_key) do
    true  -> private_key
    false -> generate
  end
end
</code></pre>

Now we can call `PrivateKey.generate`{:.language-elixir} to generate a new Bitcoin private key!

## From Private Key to Public Key …

The most basic process for turning a Bitcoin private key into a sharable public address involves three basic steps. The first step is to transform our private key into a public key with the help of [elliptic curve cryptography](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography).

We’ll start by adding a new `to_public_key/1`{:.language-elixir} function to our `PrivateKey`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
def to_public_key(private_key)
</code></pre>

In our `to_public_key/1`{:.language-elixir} function, we’ll use Erlang’s `:crypto.generate_key`{:.language-elixir} function to sign our `private_key`{:.language-elixir} using an elliptic curve. We’ll specifically use [the `:secp256k1`{:.language-elixir} curve](https://en.bitcoin.it/wiki/Secp256k1):

<pre class='language-elixir'><code class='language-elixir'>
:crypto.generate_key(:ecdh, :crypto.ec_curve(:secp256k1), private_key)
</code></pre>

We’re using the elliptic curve key generation as [a trapdoor function](https://en.wikipedia.org/wiki/Trapdoor_function) to ensure our private key’s secrecy. It’s easy for us to generate our public key from our private key, but reversing the computation and generating our private key from our public key is nearly impossible.

The `:crypto.generate_key`{:.language-elixir} function returns a two-element tuple. The first element in this tuple is our Bitcoin public key. We’ll pull it out using Elixir’s `elem/1`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
:crypto.generate_key(:ecdh, :crypto.ec_curve(:secp256k1), private_key)
|> elem(0)
</code></pre>

The returned value is a sixty five byte binary representing our public key!

## … Public Key to Public Hash …

Once we have our public key in memory, our next step in transforming it into a public address is to hash it. This gives us what’s called the “public hash” of our public key.

Let’s make a new function, `to_public_hash/1`{:.language-elixir} that takes our `private_key`{:.language-elixir} as an argument:

<pre class='language-elixir'><code class='language-elixir'>
def to_public_hash(private_key)
</code></pre>

We’ll start the hashing process by turning our `private_key`{:.language-elixir} into a public key with a call to `to_public_key`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
private_key
|> to_public_key
</code></pre>

Next, we pipe our public key through two hashing functions: [SHA-256](https://en.wikipedia.org/wiki/SHA-2), followed by [RIPEMD-160](https://en.wikipedia.org/wiki/RIPEMD):

<pre class='language-elixir'><code class='language-elixir'>
private_key
|> to_public_key
|> hash(:sha256)
|> hash(:ripemd160)
</code></pre>

Bitcoin uses the RIPEMD-160 hashing algorithm because it produces a short hash. The intermediate SHA-256 hashing is used [to prevent insecurities through unexpected interactions](https://bitcoin.stackexchange.com/a/9216) between our elliptic curve signing algorithm and the RIPEMD algorithm.

In this example, `hash/1`{:.language-elixir} is a helper function that wraps Erlang’s `:crypto.hash`{:.language-elixir}.

<pre class='language-elixir'><code class='language-elixir'>
defp hash(data, algorithm), do: :crypto.hash(algorithm, data)
</code></pre>

Flipping the arguments to `:crypto.hash`{:.language-elixir} in this way lets us easily pipe our data through the `hash/1`{:.language-elixir} helper.

## … And Public Hash to Public Address

Lastly, we can convert our public hash into a full-fledged Bitcoin address by [Base58Check encoding](http://www.petecorey.com/blog/2018/01/08/bitcoins-base58check-in-pure-elixir/) the hash with a version byte corresponding to [the network where we’re using the address](https://en.bitcoin.it/wiki/List_of_address_prefixes).

Let’s add a `to_public_address/2`{:.language-elixir} function to our `PrivateKey`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
def to_public_address(private_key, version \\ <<0x00>>)
</code></pre>

The `to_public_address/2`{:.language-elixir} function takes a `private_key`{:.language-elixir} and a `version`{:.language-elixir} byte as its arguments. The `version`{:.langauge-elixir} defaults to `<<0x00>>`{:.langauge-elixir}, indicating that this address will be used on the live Bitcoin network.

To create a Bitcoin address, we start by converting our `private_key`{:.language-elixir} into a public hash with a call to `to_public_hash/1`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
private_key
|> to_public_hash
</code></pre>

All that’s left to do is Base58Check encode the resulting hash with the provided `version`{:.language-elixir} byte:

<pre class='language-elixir'><code class='language-elixir'>
private_key
|> to_public_hash
|> Base58Check.encode(version)
</code></pre>

After laying the groundwork, the final pieces of the puzzle effortlessly fall into place.

## Putting Our Creation to Use

Now that we can generate cryptographically secure private keys and transform them into publishable public addresses, we’re in business.

Literally!

Let’s generate a new private key, transform it into its corresponding public address, and try out on [the Bitcoin testnet](https://en.bitcoin.it/wiki/Testnet). We’ll start by generating our private key:

<pre class='language-elixir'><code class='language-elixir'>
private_key = PrivateKey.generate
</code></pre>

This gives us a thirty two byte binary. If we wanted, we could Base58Check encode this with [a testnet `version`{:.language-elixir} byte of `0xEF`{:.language-elixir}](https://en.bitcoin.it/wiki/List_of_address_prefixes). This is known as the “Wallet Import Format”, or WIF, of our Bitcoin private key:

<pre class='language-elixir'><code class='language-elixir'>
Base58Check.encode(private_key, <<0xEF>>)
</code></pre>

As its name suggests, converting our private key into a WIF allows us to easily import it into most Bitcoin wallet software:

<a href="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/electrum-import.png" style="display: block; background-color: transparent; color: #ccc; text-align: center; line-height: 1; font-size: 0.8; margin: 2em auto;"><img style="display:block; width: 75%; margin: 0 auto 1em;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/electrum-import.png"/>Importing our test private key.</a>

Next, let’s convert our private key into a testnet public address using [a `version`{:.language-elixir} byte of `0x6F`{:.language-elixir}](https://en.bitcoin.it/wiki/List_of_address_prefixes):

<pre class='language-elixir'><code class='language-elixir'>
PrivateKey.to_public_address(private_key, <<0x6F>>)
</code></pre>

Now that we have our public address, let’s find [a testnet faucet](https://testnet.manu.backend.hamburg/faucet) and send a few tBTC to our newly generated address! After initiating the transaction with our faucet, we should see our Bitcoin arrive at our address on either [a blockchain explorer](https://www.blocktrail.com/tBTC/tx/d75b1080a0ad2343c6ad89d35a465d18a0c59a5848cfd773814792d19a4afd48), or within our wallet software.

<a href="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/electrum-confirm.png" style="display: block; background-color: transparent; color: #ccc; text-align: center; line-height: 1; font-size: 0.8; margin: 2em auto;"><img style="display:block; width: 75%; margin: 0 auto 1em;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/electrum-confirm.png"/>Our tBTC has arrived.</a>

Victory!

## Final Thoughts

Elixir, thanks to its Erlang heritage, ships with a wealth of tools that make this kind of hashing, signing, and byte mashing a walk in the park.

I encourage you to check our the `PrivateKey`{:.language-elixir} module on Github to get a better feel for the simplicity of the code we wrote today. Overall, I’m very happy with the result.

If you enjoyed this article, I highly recommend you check out [the Mastering Bitcoin book](http://amzn.to/2D5ARfK). If you _really enjoyed_ this article, feel free to send a few Bitcoin to this address I generated using our new `PrivateKey`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
1HKz4XU7ENT46ztEzsT83jRezyiDjvnBV8
</code></pre>

Stay tuned for more Bitcoin-related content as I work my way through [Mastering Bitcoin](http://amzn.to/2D5ARfK)!
