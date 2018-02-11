---
layout: post
title:  "Mining for Bitcoin Vanity Addresses with Elixir"
description: "In this article we'll our Bitcoin private key generator to mine for vanity addresses. Once we've built our naive solution, we'll add a drop of Elixir and parallelize the implementation."
author: "Pete Corey"
date:   2018-02-05
tags: ["Elixir", "Bitcoin", "Mastering Bitcoin"]
related: ["/blog/2018/01/22/generating-bitcoin-private-keys-and-public-addresses-with-elixir/"]
---

We previously worked through the process of [generating a Bitcoin private address and translating it into a shareable public address](http://www.petecorey.com/blog/2018/01/22/generating-bitcoin-private-keys-and-public-addresses-with-elixir/) using only the tools and libraries shipped with Elixir and Erlang.

The guiding force behind that article was Andreas Antonopoulos’ excellent [Mastering Bitcoin](http://amzn.to/2Eqcvi9) book.

Let’s take another bite out of [Mastering Bitcoin](http://amzn.to/2Eqcvi9) and implement the algorithm Andreas describes for “mining for vanity addresses” at the end of chapter four. After we implement the basic algorithm, we’ll add our Elixir special sauce and turn it into a fully parallelized procedure.

## What is a Vanity Address?

The concept of a vanity address is simple. It’s a normal Bitcoin [public address](http://www.petecorey.com/blog/2018/01/22/generating-bitcoin-private-keys-and-public-addresses-with-elixir/#what-are-private-keys-and-public-addresses) that contains some sequence of desired characters.

For example, a random Bitcoin public address might look like the following:

<pre class='language-elixir'><code class='language-elixir'>
1HKz4XU7ENT46ztEzsT83jRezyiDjvnBV8
</code></pre>

On the live network, Bitcoin addresses always begin with `1`{:.language-elixir}, but the remaining characters are entirely random.

A vanity address might look like this:

<pre class='language-elixir'><code class='language-elixir'>
1pete7qrCiembh8AEf1zRP2zn6nDsLoHC
</code></pre>

You’ll notice that the first five characters of this address are `1pete`{:.language-elixir}. This isn’t an accident! I’ve intentionally sought out a public address that begins with my name, Pete, so people know who they’re sending their large sums of Bitcoin to.

While the term “mining” sounds intimidating, the actual process of generating these vanity addresses is laughably simple.

## How do you Mine Vanity Addresses?

“Mining,” in this context, is just another term for repeatedly doing something until some condition is met. As in, "keep digging until you find gold!"

We’ll mine our vanity public address by repeatedly generating a private key, transforming it into a public address, and checking if the resulting address matches our desired pattern.

That’s it!

Building that in Elixir should be a walk in the park. We’ll start off by creating a new `VanityAddress`{:.language-elixir} module and stubbing out a `generate_private_key/2`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
defmodule VanityAddress do
  def generate_private_key(regex, version \\ <<0x00>>)
end
</code></pre>

Our `generate_private_key/2`{:.language-elixir} function expects a `regex`{:.language-elixir} which represents the pattern we’re trying to find in a vanity address (like `~r/^1pete/`{:.language-elixir}), and a `version`{:.language-elixir} byte that will used to indicate [where this Bitcoin address will be used](https://en.bitcoin.it/wiki/List_of_address_prefixes).

Within our `generate_private_key/2`{:.language-elixir} function, we’ll kick off the mining process by generating a random private key and transforming it into a public address:

<pre class='language-elixir'><code class='language-elixir'>
private_key = PrivateKey.generate
public_address = PrivateKey.to_public_address(private_key)
</code></pre>

If the `public_address`{:.language-elixir} we generated matches the pattern we provided in our `regex`{:.language-elixir}, we’ve successfully mined a vanity address! In that case, we’ll return the `private_key`{:.language-elixir}. Otherwise, we’ll repeat the entire process with a recursive call to `generate_private_key/2`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
case public_address =~ regex do
  true -> private_key
  false -> generate_private_key(regex, version)
end
</code></pre>

That’s all there is to it.

We can use our new `generate_private_key/2`{:.language-elixir} function in conjunction with the `PrivateKey.to_public_address/2`{:.language-elixir} function we built last time to view our newly mined vanity key:

<pre class='language-elixir'><code class='language-elixir'>
VanityAddress.generate_private_key(~r/^1pete/)
|> PrivateKey.to_public_address
</code></pre>

Congratulations; we’re miners!

## Thinking in Parallel

The problem with our simple implementation of `generate_private_key/2`{:.language-elixir} is that _it’s slow_.

While it’s true that the mining algorithm is inherently slow, there are many optimizations we could make to the code we’ve written. The most obvious improvement that comes to mind when using a “process-oriented” programming language like Elixir is to parallelize the mining algorithm across multiple processes.

However, parallelizing our mining algorithm presents an interesting set of challenges.

Each individual call to `generate_private_key/2`{:.language-elixir} is completely synchronous and sequential. We won’t see much of a benefit by queuing up multiple concurrent calls to `generate_private_key/2`{:.language-elixir} on the same CPU core. That said, while we’re running `generate_private_key/2`{:.language-elixir} within a single process bound to a single CPU core, any other cores available to us are sitting idle.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/mining-for-bitcoin-vanity-addresses-with-elixir/sequential.png" style="display: block; margin:1em auto; width: 60%;"/>
</div>

Ideally, we could simultaneously run as many instances of our `generate_private_key/2`{:.language-elixir} execution as we have cores. The moment any of our parallel executions find a matching key, it would be returned to the caller.

## Creating a Stream of Parallel Tasks

Elixir’s little known (to me) [`Task.async_stream/3`{:.language-elixir} function](https://hexdocs.pm/elixir/Task.html#async_stream/3) is the tool we need to implement this functionality.

`Task.async_stream/3`{:.language-elixir} expects an enumerable as its first argument and a function to be applied concurrently to each element in the enumerable. Each element in the enumerable will have the provided function applied to it _in a new process._

If we squint our eyes a little, we can see that this gives us what we need. The “enumerable” we pass into `Task.async_stream/3`{:.language-elixir} will really be an infinite stream of zero-argument anonymous functions. Each of those anonymous functions simply calls `generate_private_key/2`{:.language-elixir}.

We’ll use `Stream.cycle/2`{:.language-elixir} to create an infinite stream of these functions:

<pre class='language-elixir'><code class='language-elixir'>
[fn -> generate_private_key(regex, version) end]
|> Stream.cycle
</code></pre>

The function that we want to run in parallel simply executes each of those passed in anonymous functions, one at a time, each in its own process:

<pre class='language-elixir'><code class='language-elixir'>
|> Task.async_stream(fn f -> f.() end)
</code></pre>

This is where our parallelization happens. Each call to `generate_private_key/2`{:.language-elixir} is happening in a new process, and Elixir’s scheduler will spread each new process out over the available cores in the system.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/mining-for-bitcoin-vanity-addresses-with-elixir/parallel.png" style="display: block; margin:1em auto; width: 60%;"/>
</div>

By default, `Task.async_stream/3`{:.language-elixir} will run up to `System.schedulers_online/0`{:.language-elixir} parallel instances of our `generate_private_key/2`{:.language-elixir} execution, and `System.schedulers_online/0`{:.language-elixir} defaults to [the number of available CPU cores in the system](https://stackoverflow.com/a/38701174/96048). This means we’ll always have one instance of `generate_private_key/2`{:.language-elixir} running on each of our cores.

Perfect!

## Filtering Our Stream

`Task.async_stream/3`{:.language-elixir} returns a stream that produces either an `{:ok, value}`{:.language-elixir} tuple on success, or an `{:exit, reason}`{:.language-elixir} tuple on failure. We don’t anticipate or care about failures in this situation, so we’ll `nil`{:.language-elixir} them out with `Stream.map/2`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
|> Stream.map(fn
  {:ok, thing} -> thing
  _ -> nil
end)
</code></pre>

Now we can use `Stream.reject/2`{:.language-elixir} to filter out any `nil`{:.language-elixir} values from our mapped stream:

<pre class='language-elixir'><code class='language-elixir'>
|> Stream.reject(&(&1 == nil))
</code></pre>

Let's wrap what we've done in a function called `stream_private_keys/2`{:.language-elixir} that accepts a `regex`{:.language-elixir} and a `version`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def stream_private_keys(regex, version \\ <<0x00>>) do
  [fn -> generate_private_key(regex, version) end]
  |> Stream.cycle
  |> Task.async_stream(fn f -> f.() end)
  |> Stream.map(fn
    {:ok, thing} -> thing
    _ -> nil
  end)
  |> Stream.reject(&(&1 == nil))
end
</code></pre>

What we’re left with is a stream that will produce any number of valid Bitcoin vanity addresses for a given `regex`{:.language-elixir} and `version`{:.language-elixir}, using all of the available CPU cores on our system.

<div style="width: 100%; margin: 4em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/mining-for-bitcoin-vanity-addresses-with-elixir/stream.png" style="display: block; margin:1em auto; width: 60%;"/>
</div>

## Putting Our Stream to Use

Our stream [doesn’t actually do anything](https://hexdocs.pm/elixir/Stream.html#content) until we try to pull values out of it using a function from the [`Enum`{:.language-elixir} module](https://hexdocs.pm/elixir/Enum.html#content). Let’s use `Enum.take/2`{:.language-elixir} to pull out three vanity Bitcoin addresses that match our desired pattern (`123`{:.language-elixir}):

<pre class='language-elixir'><code class='language-elixir'>
VanityAddress.stream_private_keys(~r/^123/)
|> Enum.take(3)
|> Enum.map(&PrivateKey.to_public_address/1)
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
["123avbA76Zk98jik3ymTHkjbjKKftAhJiZ",
 "123aGknGk5F2NPkB6e4e6pehVGL7gBR8az",
 "123hzDB1CxcyDwusfsb8Pfh3Ti2i4NQLGR"]
</code></pre>

If we take a look at our CPU usage while our mining pipeline is chugging away, we’ll see that all of the CPUs on our machine are being fully utilized.

Success!

## Final Thoughts

Spoiler alert: the process of mining for Bitcoin is nearly identical to mining for vanity addresses. Instead of hashing private keys and looking for a random leading string like `1pete`{:.language-elixir}, Bitcoin miners hash transaction data, looking for hashes that begin with some number of leading zeros corresponding to [the current block difficulty](https://en.bitcoin.it/wiki/Difficulty).

There’s a huge amount of pomp and circumstance around the term “mining”, but at its core, it’s an incredibly simple and approachable idea.

Be sure to check out [the `VanityAddress`{:.language-elixir} module](https://github.com/pcorey/hello_bitcoin/blob/master/lib/vanity_address.ex) in [my `hello_bitcoin`{:.language-elixir} project](https://github.com/pcorey/hello_bitcoin) on Github, and if this kind of thing is at all interesting to you, I highly recommend you pick up a copy of Andreas Antonopoulos’ [Mastering Bitcoin](http://amzn.to/2Eqcvi9).
