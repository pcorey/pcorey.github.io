---
layout: post
title:  "Living the Simple Life with Recursive Parsing and Serialization"
description: "I've been working on a refactor of my Elixir-powered Bitcoin full node for weeks now. Let's dive into the solution I landed on."
author: "Pete Corey"
date:   2018-09-24
tags: ["Bitcoin", "Elixir"]
related: []
---

I just pushed [a massive refactor of my Elixir-powered Bitcoin full node project](https://github.com/pcorey/bitcoin_network/pull/2/files) that considerably simplifies the parsing and serialization of [Bitcoin network messages](https://en.bitcoin.it/wiki/Protocol_documentation).

I'm a big fan of the solution I landed on, and I wanted to share it with you. The key insight I had was to switch to a recursive solution where each sub-component of every messages handles its own parsing and serialization.

Obviously the devil is in the details, so let's dive in.

## What's the Problem?

Before I took on this refactor, I was handling the parsing and serialization of Bitcoin network messages entirely manually. For every message, I'd define a `parse/1`{:.language-elixir} function and implement a corresponding `serialize/1`{:.language-elixir} [protocol](https://elixir-lang.org/getting-started/protocols.html). Every field within the message was manually parsed and serialized using Elixir's various binary manipulation operations.

As an example, here's how a `NetAddr`{:.language-elixir} message would be parsed using this technique:

<pre class='language-elixir'><code class='language-elixir'>
def parse(binary) do
  with {:ok, time, rest} &lt;- parse_time(binary),
       {:ok, services, rest} &lt;- parse_services(rest),
       {:ok, ip, rest} &lt;- parse_ip(rest),
       {:ok, port, rest} &lt;- parse_port(rest) do
    {:ok, %NetAddr{time: time, services: services, ip: ip, port: port}, rest}
  end
end

defp parse_time(&lt;&lt;time::32-little, rest::binary>>),
  do: {:ok, time, rest}

defp parse_time(_binary),
  do: {:error, :bad_time}

defp parse_services(&lt;&lt;services::64-little, rest::binary>>),
  do: {:ok, services, rest}

defp parse_services(_binary),
  do: {:error, :bad_services}

defp parse_ip(&lt;&lt;ip::binary-size(16), rest::binary>>),
  do: {:ok, ip, rest}

defp parse_ip(_binary),
  do: {:error, :bad_ip}

defp parse_port(&lt;&lt;port::16-big, rest::binary>>),
  do: {:ok, port, rest}

defp parse_port(_binary),
  do: {:error, :bad_port}
</code></pre>

While this was fantastic practice at [manipulating binaries](http://www.petecorey.com/blog/2018/04/09/hex-dumping-with-elixir/) within Elixir, it wasn't a scalable solution. There are simply too many messages [in the Bitcoin protocol](https://en.bitcoin.it/wiki/Protocol_documentation) to implement in this time consuming way. Not only that, but many of the messages share [common sub-structures](https://en.bitcoin.it/wiki/Protocol_documentation#Common_structures) who's `parse/1`{:.language-elixir} and `serialize/1`{:.language-elixir} implementations would need to be repeated throughout the project.

Daunted with the task of implementing [a `parse/1`{:.language-elixir}](https://github.com/pcorey/bitcoin_network/blob/cdff290428ddec5d7861ae41be04964ca5a913fd/lib/bitcoin_network/protocol/version.ex#L18-L94) and [`serialize/1`{:.language-elixir} function](https://github.com/pcorey/bitcoin_network/blob/cdff290428ddec5d7861ae41be04964ca5a913fd/lib/bitcoin_network/protocol/version.ex#L101-L155) for every message in the protocol's peer-to-peer vocabulary, I decided I needed a better solution.

## Taking Advantage of Sub-Structures

As I mentioned up above, many Bitcoin messages share common sub-structures. Instead of dooming me to tedious repetition, I realized that these repeated structures were actually a blessing from the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) gods.

{% include newsletter.html %}

If we could architect our `parse/1`{:.language-elixir} and `serialize/1`{:.language-elixir} implementations in a way that offloads the responsibility of parsing and serializing these shared sub-structures, the parsing and serialization implementations of our top-level messages could be substantially simplified.

Not only that, but we could take the notion of "sub-structures" even further. In many ways, the _types_ of the primitives that compose together to build the protocol's messages and sub-structures are sub-structures in and of themselves. For example, a `uint32_t`{:.language-elixir}, [which is a C type](https://www.gnu.org/software/libc/manual/html_node/Integers.html) commonly used to define unsigned integers throughout the protocol's various messages, is actually a sub-structure that has a single field and specific parsing and serialization rules.

We could implement a `UInt32T`{:.language-elixir} struct with a corresponding `parse/1`{:.language-elixir} function like so:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Protocol.UInt32T do
  defstruct value: nil

  def parse(&lt;&lt;value::little-unsigned-integer-32, rest::binary>>),
    do: {:ok, %BitcoinNetwork.Protocol.UInt32T{value: value}, rest}
end
</code></pre>

Similarly, we could reverse the process and serialize our newly parsed `UInt32T`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defimpl BitcoinNetwork.Protocol.Serialize, for: BitcoinNetwork.Protocol.UInt32T do
  def serialize(%{value: value}),
    do: &lt;&lt;value::little-unsigned-integer-32>>
end
</code></pre>

## Composing Sub-Structures

Now we have parsing and serialization rules built for these base-level sub-structures like `UInt32T`{:.language-elixir} and other primitive types. We can build upon the work we've done by composing these sub-structures together into more complex structure.

For example, a `NetAddr`{:.language-elixir} is really just a `UInt32T`{:.language-elixir}, a `UInt64T`{:.language-elixir}, a sixteen byte `Binary`{:.language-elixir}, and a `UInt16T`{:.language-elixir} representing an addresses' `time`{:.language-elixir}, `services`{:.language-elixir}, `ip`{:.language-elixir}, and `port`{:.language-elixir}, respectively. We can write a `NetAddr`{:.language-elixir} struct complete with a `parse/1`{:.language-elixir} function that calls out to the `parse/1`{:.language-elixir} functions of these more primitive sub-structures:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Protocol.NetAddr do
  defstruct time: nil,
            services: nil,
            ip: nil,
            port: nil

  alias BitcoinNetwork.Protocol.{Binary, NetAddr, UInt32T, UInt64T, UInt16T}

  def parse(binary) do
    with {:ok, time, rest} &lt;- UInt32T.parse(binary),
         {:ok, services, rest} &lt;- UInt64T.parse(rest),
         {:ok, ip, rest} &lt;- Binary.parse(rest, 16),
         {:ok, port, rest} &lt;- UInt16T.parse(rest),
         do:
           {:ok,
            %NetAddr{
              time: time,
              services: services,
              ip: ip,
              port: port
            }, rest}
  end
end
</code></pre>

Serializing a `NetAddr`{:.language-elixir} structure is even easier. We simply build a list of the fields we want serialized, in the order we want them serialized, and then map over that list with our `serialize/1`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
defimpl BitcoinNetwork.Protocol.Serialize, for: BitcoinNetwork.Protocol.NetAddr do
  def serialize(net_addr),
    do:
      [
        net_addr.time,
        net_addr.services,
        net_addr.ip,
        net_addr.port
      ]
      |> BitcoinNetwork.Protocol.Serialize.serialize()
end
</code></pre>

We're left with an Elixir binary that represents the entire serialized `NetAddr`{:.language-elixir} structure, but we didn't have to do any of the heavy lifting ourselves.

The best part of this solution is that we can repeatedly build on top of our sub-structures. An `Addr`{:.language-elixir} message is composed of a `VarInt`{:.language-elixir} and a list of `NetAddr`{:.language-elixir} sub-structures. It's sub-structures all the way down.

## Special Cases and Rough Edges

While the general case for this solution works beautifully, there are a few special cases and rough edges we need to smooth over.

The first of these rough edges comes when parsing and serializing fixed-size binaries. For example, within the `NetAddr`{:.language-elixir} structure, we need to parse sixteen bytes off of the wire and interpret those bytes as an IP address. We instructed our `NetAddr`{:.language-elixir} parser to do this by calling `Binary.parse/2`{:.language-elixir} with `16`{:.language-elixir} as a second argument.

Our `Binary`{:.language-elixir} module's `parse/2`{:.language-elixir} function accepts an optional second argument that lets us specify exactly how many bytes we want to parse out of the incoming binary:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Protocol.Binary do
  def parse(binary, size \\ 1) do
    &lt;&lt;binary::binary-size(size), rest::binary>> = binary
    {:ok, binary, rest}
  end
end
</code></pre>

Notice that `Binary.parse/2`{:.language-elixir} returns a primitive Elixir binary, rather than a struct. This is an intentional decision and makes our serialization that much easier:

<pre class='language-elixir'><code class='language-elixir'>
defimpl BitcoinNetwork.Protocol.Serialize, for: BitString do
  def serialize(binary),
    do: binary
end
</code></pre>

---- 

Another special case we need to handle is made apparent when we need to parse and serialize lists of "things". A perfect example of this appears in our code when we need to parse an `Addr`{:.language-elixir} structure, which is composed of a `VarInt`{:.language-elixir} number of `NetAddr`{:.language-elixir} structures:

<pre class='language-elixir'><code class='language-elixir'>
with {:ok, count, rest} &lt;- VarInt.parse(binary),
     {:ok, addr_list, rest} &lt;- Array.parse(rest, value(count), &NetAddr.parse/1),
     do:
       {:ok,
        %Addr{
          count: count,
          addr_list: addr_list
        }, rest}
</code></pre>

Like `Binary.parse/2`{:.language-elixir}, `Array.parse/3`{:.language-elixir} has some special behavior associated with it. Our `Array`{:.language-elixir} module's `parse/3`{:.language-elixir} function takes our binary to parse, the number of "things" we want to parse out of it, and a function to parse each individual "thing":

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Protocol.Array do
  def parse(binary, count, parser),
    do: parse(binary, count, parser, [])
end
</code></pre>

Our `parse/3`{:.language-elixir} function calls out to a private `parse/4`{:.language-elixir} function that builds up an accumulator of our parsed "things". Once we've parsed a sufficient number of "things", we return our accumulated `list`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defp parse(rest, 0, parser, list),
  do: {:ok, Enum.reverse(list), rest}
</code></pre>

The non-base case of our `parse/4`{:.language-elixir} function simply applies our `parser/1`{:.language-elixir} function to our `binary`{:.language-elixir} and appends the resulting parsed "thing" to our `list`{:.language-elixir} of "things":

<pre class='language-elixir'><code class='language-elixir'>
defp parse(binary, count, parser, list) do
  with {:ok, parsed, rest} &lt;- parser.(binary),
       do: parse(rest, count - 1, parser, [parsed | list])
end
</code></pre>

Once again, the result of our `Array.parse/3`{:.language-elixir} function returns a primitive Elixir list, not a struct. This makes our serialization fairly straight forward:

<pre class='language-elixir'><code class='language-elixir'>
defimpl BitcoinNetwork.Protocol.Serialize, for: List do
  def serialize(list),
    do:
      list
      |> Enum.map(&BitcoinNetwork.Protocol.Serialize.serialize/1)
      |> join()

  def join(pieces),
    do: 
      pieces
      |> Enum.reduce(&lt;&lt;>>, fn piece, binary -> &lt;&lt;binary::binary, piece::binary>> end)
end
</code></pre>

We simply map `serialize/1`{:.language-elixir} over our `list`{:.language-elixir} of "things", and concatenate the newly serialized pieces together.

If you remember back to our `NetAddr`{:.language-elixir} serialization example, you'll notice that we've been using our `List`{:.language-elixir} primitive's serialization protocol this whole time.

Awesome!

## Final Thoughts

I struggled with this refactor on and off for a good few weeks. Ultimately, I'm happy with the solution I landed on. It's more complex than my original solution in terms of the number of moving parts, but it's a much more scalable and mentally manageable solution than the one I was originally working with.

Now that this is out of my system, I can turn my attention to the interesting pieces of building a Bitcoin full node: processing blocks!

Expect articles digging into that topic in the future. In the meantime, check out [the entire project on Github](https://github.com/pcorey/bitcoin_network) to get a more hands-on feel for the refactor and the recursive parsing and serialization solution I ultimately landed on.
