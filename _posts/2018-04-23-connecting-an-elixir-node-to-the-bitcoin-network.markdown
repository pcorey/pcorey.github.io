---
layout: post
title:  "Connecting an Elixir Node to the Bitcoin Network"
excerpt: "Let's use the tools provided by the Elixir programming language to connect to a node on Bitcoin's peer-to-peer ad-hoc network. Hello, Bitcoin!"
author: "Pete Corey"
date:   2018-04-23
tags: ["Elixir", "Bitcoin"]
related: []
---

I've been writing about [implementing the nuts and bolts of the Bitcoin protocol in Elixir](http://www.petecorey.com/blog/tags/#bitcoin), and while I've developed a rough understanding of how Bitcoin works at a fundamental level, Bitcoin's peer-to-peer network, the thing that makes block propagation possible, has always felt like a mysterious black box.

The Bitcoin white paper waves its hands over the implementation of the network, and even [Andreas Antonopoulos' Mastering Bitcoin](https://amzn.to/2GGXdJH) skims over the implementation details of building a network-ready Bitcoin node.

While its true that the workings of this network are completely tangential to the workings of Bitcoin itself, I still find it extremely interesting. Since I first started diving into the world of Bitcoin development, I've wanted to build a simple node that connects to the network.

The [Elixir programming language](https://elixir-lang.org/) gives us some fantastic tools to implement a server in the peer-to-peer network. Let's see how far they can take us!

## Constructing our GenServer

Since this is our first foray into Bitcoin's peer-to-peer network, we'll stick to simple goals. Let's lay down a list of things we'd like to accomplish:

1. Create and maintain a connection to a single Bitcoin node.
2. Fetch and count the list of that node's peers.

These goals help inform us about the architecture of our final solution. Since we're only attempting to connect to a single Bitcoin node, we should be able to model our node nicely with a single [GenServer](https://hexdocs.pm/elixir/GenServer.html).

We'll start by creating a new module, `BitcoinNetwork.Node`{:.language-elixir}, to house our new GenServer:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Node do
  use GenServer
end
</code></pre>

Next, we'll tell our `Node`{:.language-elixir} which Bitcoin peer node we want to connect to by passing in a tuple of the target node's `ip`{:.language-elixir} and `port`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def start_link({ip, port}) do
  GenServer.start_link(__MODULE__, %{ip: ip, port: port})
end
</code></pre>

Lastly, we'll pass `ip`{:.language-elixir} and `port`{:.language-elixir} along to our `init/1`{:.language-elixir} function within a map. For now, we'll simply log our intentions to connect to the specified node:

<pre class='language-elixir'><code class='language-elixir'>
def init(state = %{ip: ip, port: port}) do
  [:bright, "Connecting to #{BitcoinNetwork.IP.to_string(ip)}:#{port}."]
  |> log()
end
</code></pre>

The `log/1`{:.language-elixir} helper function adds some extra debug information to our log output, and uses [`IO.ANSI.format/2`{:.language-elixir}](https://hexdocs.pm/elixir/IO.ANSI.html#format/2) to inject color into our logs:

<pre class='language-elixir'><code class='language-elixir'>
defp log(message) do
  [:bright, :black, "[#{inspect(self())}] ", :reset, message]
  |> IO.ANSI.format()
  |> IO.puts()
end
</code></pre>

## Supervising our GenServer

Now that we've sketched out its basic shape, we can spawn an instance of our `BitcoinNetwork.Node`{:.language-elixir} GenServer when our application starts up. We'll modify the `start/2`{:.language-elixir} callback in our application's entry point module, `BitcoinNetwork.Application`{:.language-elixir}, to create a `:one_for_one`{:.language-elixir} supervisor that supervises a single instance of our `BitcoinNetwork.Node`{:.language-elixir} GenServer:

<pre class='language-elixir'><code class='language-elixir'>
def start(_type, _args) do
  Supervisor.start_link(
    [
      {BitcoinNetwork.Node,
       {Application.get_env(:bitcoin_network, :ip),
        Application.get_env(:bitcoin_network, :port)}}
    ],
    strategy: :one_for_one
  )
end
</code></pre>

We're pulling the `ip`{:.language-elixir} and `port`{:.language-elixir} of the Bitcoin node we're trying to connect to from our application's configuration. We should set those values in our `config.exs`{:.language-elixir} file:

<pre class='language-elixir'><code class='language-elixir'>
config :bitcoin_network, ip: <<
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xFF, 0xFF, 
    127, 0, 0, 1
  >>
config :bitcoin_network, port: 18333
</code></pre>

For now, we'll assume that we're trying to connect to a testnet Bitcoin node running on `localhost:18333`{:.language-*}. This port and address can be changed to point to any node on the Bitcoin network.

## Working with IPs

You might have noticed that in our initial logging statement made a call out to the `BitcoinNetwork.IP.to_string/1`{:.language-elixir} function, and our application configuration specified the IP address of the node we're connecting to as a binary.

The Bitcoin network supports both IPv4 and IPv6 addresses, and expects these addresses to be represented in their binary form when sent across the network, so for convenience we'll represent all IP addresses in our application as sixteen-byte binaries. These binaries can be difficult to work with, so we'll create a few helper functions in the `BitcoinNetwork.IP`{:.language-elixir} module to make them easier to handle.

First, we'll need to see the IP address of the peer node we're connecting to, so we'll need some way of transforming the IP address binary into a string. See `BitcoinNetwork.IP.to_string/1`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def to_string(binary) do
  binary
  |> :binary.bin_to_list()
  |> Enum.chunk_every(4)
  |> Enum.map(&:binary.list_to_bin/1)
  |> Enum.map(&Base.encode16/1)
  |> Enum.join(":")
end
</code></pre>

The Erlang tools we'll use to manage our TCP connections will expect IP addresses in the form of eight-element tuples, rather than a binaries. `BitcoinNetwork.IP.to_tuple/1`{:.language-elixir} will handle that conversion for us:

<pre class='language-elixir'><code class='language-elixir'>
def to_tuple(binary) do
  binary
  |> :binary.bin_to_list()
  |> Enum.chunk_every(2)
  |> Enum.map(&:binary.list_to_bin/1)
  |> Enum.map(&:binary.decode_unsigned/1)
  |> List.to_tuple()
end
</code></pre>

Now we can freely shift between our base binary representation and the strings and tuple forms we'll need to log addresses and connect to our nodes.

## Hello, Bitcoin Network

If we were to spin up our application at this point, we'd see our log statement about how our `BitcoinNetwork.Node`{:.language-elixir} GenServer is attempting to connect to our local Bitcoin node.

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/connecting-an-elixir-node-to-the-bitcoin-network/01.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">The first run of our application.</p>
</div>

Unfortunately, nothing is actually happening. Let's fix that.

Our first step in communicating with a Bitcoin node is connecting to it. The Bitcoin protocol plays out over TCP, so we'll use [Erlang's `:gen_tcp`{:.language-elixir}](http://erlang.org/doc/man/gen_tcp.html) to manage our TCP connection to our peer node.

In our `init/1`{:.language-elixir} callback, let's add a call to [`:gen_tcp.connect/3`{:.language-elixir}](http://erlang.org/doc/man/gen_tcp.html#connect-3) that connect to our specified `ip`{:.language-elixir} and `port`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, socket} =
  :gen_tcp.connect(BitcoinNetwork.IP.to_tuple(ip), port, [:binary, active: true])
</code></pre>

We're specifying a `:binary`{:.language-elixir} option on our connection, which means that we want any incoming packets to be delivered as binaries, rather than lists of bytes. We're also specifying that our connection is `active`{:.language-elixir}, which means that incoming messages will be sent to the current processes as messages which we'll need to handle in `handle_info/2`{:.language-elixir} callbacks.

{% include newsletter.html %}

As an aside, pattern matching on an `:ok`{:.langauge-elixir} tuple works fine for now, but a more robust solution would more gracefully handle connection failures. Failing to connect to a Bitcoin node is a fairly common occurance.

Once connected to our node, we'll add the resulting `socket`{:.language-elixir} to our process' state and return from our `init/1`{:.language-elixir} callback:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, Map.put_new(state, :socket, socket)}
</code></pre>

Now if we spin up our application, if all goes well, we'll actually be connected to a Bitcoin node!

## Building a Version Message

Opening a TCP connection to a Bitcoin node doesn't get us far. Initially, the node we connect to won't acknowledge our presence until we send it [a "version" message](https://en.bitcoin.it/wiki/Protocol_documentation#version). This messages acts as a handshake and introduces ourselves to the new node.

Let's create a `BitcoinNetwork.Protocol.Version`{:.language-elixir} struct to represent our version message:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Protocol.Version do
  defstruct version: nil,
            services: nil,
            timestamp: nil,
            recv_ip: nil,
            recv_port: nil,
            from_ip: nil,
            from_port: nil,
            nonce: nil,
            user_agent: nil,
            start_height: nil
end
</code></pre>

Next, we'll create a `BitcoinNetwork.Protocol`{:.language-elixir} protocol that defines a `serialize/1`{:.language-elixir} function. We'll use this protocol to establish a serialization interface that will be implemented by all of our network structure representations:

<pre class='language-elixir'><code class='language-elixir'>
defprotocol BitcoinNetwork.Protocol do
  def serialize(_)
end
</code></pre>

We'll start by creating an implementation of that `serialize/1`{:.language-elixir} function for our `Version`{:.language-elixir} struct:

<pre class='language-elixir'><code class='language-elixir'>
defimpl BitcoinNetwork.Protocol, for: BitcoinNetwork.Protocol.Version do
  def serialize(version) do
    <<
      version.version::32-little,
      version.services::64-little,
      version.timestamp::64-little,
      Protocol.serialize(%VersionNetAddr{
        services: version.services,
        ip: version.recv_ip,
        port: version.recv_port
      })::binary,
      Protocol.serialize(%VersionNetAddr{
        services: version.services,
        ip: version.from_ip,
        port: version.from_port
      })::binary,
      version.nonce::64-little,
      Protocol.serialize(%VarStr{value: version.user_agent})::binary,
      version.start_height::32-little
    >>
  end
end
</code></pre>

We're using [the `little`{:.language-elixir} binary modifier](/blog/2018/03/19/building-mixed-endian-binaries-with-elixir/) to specify which fields should be encoded in little endian format, as specified by [the Bitcoin protocol specifications](https://en.bitcoin.it/wiki/Protocol_documentation#version).

We're also including the serialized binaries of sub-types, such as the ["version network addresses"](https://en.bitcoin.it/wiki/Protocol_documentation#Network_address) ([`VersionNetAddr`{:.language-elixir}](https://github.com/pcorey/bitcoin_network/blob/single-node/lib/bitcoin_network/protocol/version_net_addr.ex)), and the ["variable length string"](https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_string) ([`VarStr`{:.language-elixir}](https://github.com/pcorey/bitcoin_network/blob/single-node/lib/bitcoin_network/protocol/var_str.ex)). Those structures are implemented similarly to our `Version`{:.language-elixir} struct and corresponding `serialize/1`{:.language-elixir} implementation.

## Composing our Message

Now that we've fleshed out our `Version`{:.language-elixir} module and its corresponding `serialize/1`{:.language-elixir} implementation, we can generate a serialized version binary:

<pre class='language-elixir'><code class='language-elixir'>
Protocol.serialize(%Version{
  version: 31900,
  services: 1,
  ...
})
</code></pre>

However, this isn't quite ready to send across the network to our peer node. First, we need to wrap the serialized binary with [some additional metadata about the message being sent](https://en.bitcoin.it/wiki/Protocol_documentation#Message_structure).

Let's create a new struct called `BitcoinNetwork.Protocol.Message`{:.language-elixir} to represent this metadata:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Protocol.Message do
  defstruct magic: nil, command: nil, size: nil, checksum: nil, payload: nil
end
</code></pre>

Once again we'll define an implementation of our `serialize/1`{:.language-elixir} function that transforms this struct into a properly encoded binary:

<pre class='language-elixir'><code class='language-elixir'>
def serialize(%Message{command: command, payload: payload}) do
  <<
    Application.get_env(:bitcoin_network, :magic)::binary,
    String.pad_trailing(command, 12, <<0>>)::binary,
    byte_size(payload)::32-little,
    :binary.encode_unsigned(Message.checksum(payload))::binary,
    payload::binary
  >>
end
</code></pre>

The `magic`{:.language-elixir} field is a four-byte binary used to delineate packets send through the Bitcoin network. Since we're connecting to a testnet Bitcoin node, we'll need to use the byte sequence specific to the testnet:

<pre class='language-elixir'><code class='language-elixir'>
config :bitcoin_network, magic: <<0x0B, 0x11, 0x09, 0x07>>
</code></pre>

The `Message.checksum/1`{:.language-elixir} helper function double-hashes its input and returns the first four bytes of the resulting hash:

<pre class='language-elixir'><code class='language-elixir'>
def checksum(payload) do
  <<checksum::32, _::binary>> =
    payload
    |> hash(:sha256)
    |> hash(:sha256)

  checksum
end
</code></pre>

---- 

With the `Message`{:.language-elixir} module's implementation of `serialize/1`{:.language-elixir}, we have everything we need to construct a network-ready version message:

<pre class='language-elixir'><code class='language-elixir'>
Protocol.serialize(%Message{
  command: "version",
  payload: Protocol.serialize(%Version{
    version: 31900,
    services: 1,
    ...
  })
})
</code></pre>

This is fine, but there's some repetition here we can do without. Let's write a `serialize/2`{:.language-elixir} function on the `Message`{:.language-elixir} module that simplifies things a bit:

<pre class='language-elixir'><code class='language-elixir'>
def serialize(command, payload) do
  Protocol.serialize(%Message{
    command: command,
    payload: Protocol.serialize(payload)
  })
end
</code></pre>

This is where our `Protocol`{:.language-elixir} shines. Because we've defined an implementation of `serialize/1`{:.language-elixir} for every type of structure we'd send across the network, we can serialize it by passing it to `Protocol.serialize/1`{:.language-elixir} without needing to know its type.

Let's use our simpler interface to generate our network-ready, serialized version message:

<pre class='language-elixir'><code class='language-elixir'>
Message.serialize("version", %Version{
  version: 31900,
  services: 1,
  ...
})
</code></pre>

Beautiful.

## Sending Version

Now that we've constructed the version message we want to send to our peer node, all that's left to do is send it! In our `init/1`{:.language-elixir} callback in `Node`{:.language-elixir}, we'll construct our serialized message binary and send it to our peer node with a call to a `send_message/1`{:.language-elixir} helper function:

<pre class='language-elixir'><code class='language-elixir'>
:ok =
  Message.serialize("version", %Version{
    version: 31900,
    services: 1,
    timestamp: :os.system_time(:seconds),
    recv_ip: ip,
    recv_port: port,
    from_ip: <<>>,
    from_port: 0,
    nonce: :binary.decode_unsigned(:crypto.strong_rand_bytes(8)),
    user_agent: "Elixir rules!",
    start_height: 1
  })
  |> send_message(socket)
</code></pre>

The `send_message/2`{:.language-elixir} function simply prints the `message`{:.language-elixir} being sent and uses [`:gen_tcp.send/2`{:.language-elixir}](http://erlang.org/doc/man/gen_tcp.html#send-2) to send it to our peer node through the provided `socket`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defp send_message(message, socket) do
  print_message(message, [:bright, :yellow])
  :gen_tcp.send(socket, message)
end
</code></pre>

Lastly, `print_message/2`{:.language-elixir} uses [our previously implemented `Hexdump`{:.language-elixir} module](/blog/2018/04/09/hex-dumping-with-elixir/) to print a hex dump of the message being sent:

<pre class='language-elixir'><code class='language-elixir'>
defp print_message(data, colors) do
  output =
    data
    |> Hexdump.to_string()

  (colors ++ ("\n" <> output <> "\n"))
  |> IO.ANSI.format()
  |> IO.puts()

  data
end
</code></pre>

Now if we start up our application, our `Node`{:.language-elixir} GenServer will connect to our peer Bitcoin node and send our version message.

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/connecting-an-elixir-node-to-the-bitcoin-network/02.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Inspecting our sent version message.</p>
</div>

## Processing Responses

If everything goes well, once our peer node receives our initial version message, it will send a message in response. In order to receive these responses from our peer node, we'll have to implement a `handle_info/2`{:.language-elixir} callback on our `Node`{:.language-elixir} GenServer that listens for `:tcp`{:.language-elixir} messages and processes the incoming binary.

Unfortunately, processing incoming TCP messages is sightly more complicated that it seems. Because TCP is a streaming protocol, no guarantees are made that a single message will be delivered per packet, or that an entire message will be delivered in a single packet. Multiple messages may arrive smooshed into a single packet, a single message may be spread across multiple packets, or any combination of the two might occur.

To accommodate this, we'll need to build up a buffer of every packet we receive from our peer node and parse full messages out of this running buffer as they're completed.

We'll use a field called `rest`{:.language-elixir} in our GenServer's state to represent our message buffer. We'll initially set this to `""`{:.language-elixir} in our `init/1`{:.language-elixir} callback:

<pre class='language-elixir'><code class='language-elixir'>
{:ok,
 state
 |> Map.put_new(:socket, socket)
 |> Map.put_new(:rest, "")}
</code></pre>

Next, we'll add a `handle_info/2`{:.language-elixir} callback that processes incoming packets sent by our peer Bitcoin node:

<pre class='language-elixir'><code class='language-elixir'>
def handle_info({:tcp, _port, data}, state = %{rest: rest}) do
end
</code></pre>

To process incoming messages, we first prepend `rest`{:.language-elixir} to the `data`{:.language-elixir} received from our peer node and pass this binary data into a function called `chunk/2`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
{messages, rest} = chunk(rest <> data)
</code></pre>

Our `chunk/2`{:.language-elixir} helper function recursively parses fully-formed messages from our buffer and returns those messages along with the remaining, unparsed binary.

<pre class='language-elixir'><code class='language-elixir'>
defp chunk(binary, messages \\ []) do
  case Message.parse(binary) do
    {:ok, message, rest} ->
      chunk(rest, messages ++ [message])

    nil ->
      {messages, binary}
  end
end
</code></pre>

The `Message.parse/1`{:.language-elixir} function is essentially the opposite of the `Message`{:.language-elixir} module's implementation of `serialize/1`{:.language-elixir}. Given a properly formed binary, `parse/1`{:.language-elixir} returns a fully populated `Message`{:.language-elixir} struct, along with any unparsed trailing binary data.

<pre class='language-elixir'><code class='language-elixir'>
def parse(binary) do
  with <<
         magic::32-little,
         command::binary-size(12),
         size::32-little,
         checksum::32-big,
         payload::binary-size(size),
         rest::binary
       >> <- binary do
    {:ok,
     %Message{
       magic: magic,
       command:
         command
         |> :binary.bin_to_list()
         |> Enum.reject(&(&1 == 0))
         |> :binary.list_to_bin(),
       size: size,
       checksum: checksum,
       payload: parse_payload(command, payload)
     }, rest}
  else
    _ -> nil
  end
end
</code></pre>

If the message's binary is incomplete, `Message.parse/1`{:.language-elixir} will return `nil`{:.language-elixir}, and our `chunk/1`{:.language-elixir} function will return the accumulated list of `messages`{:.language-elixir}.

Once we have a list of received `Message`{:.language-elixir} structs, we'll filter our any that have incorrect checksums using [a `Message.verify_checksum/1`{:.language-elixir} helper](https://github.com/pcorey/bitcoin_network/blob/single-node/lib/bitcoin_network/protocol/message.ex#L55-L59), and asynchronously cast the rest to ourselves for further processing:

<pre class='language-elixir'><code class='language-elixir'>
messages
|> Enum.filter(&Message.verify_checksum/1)
|> Enum.map(&GenServer.cast(self(), &1))
</code></pre>

Finally, we'll return from our `handle_info/2`{:.language-elixir} callback, updating `rest`{:.language-elixir} with the unused trailing binary data we've accumulated:

<pre class='language-elixir'><code class='language-elixir'>
{:noreply, %{state | rest: rest}}
</code></pre>

## Receiving Verack

Now that we've got a system in place to receive and parse messages sent by our peer node, we're in a good position to handle the reply to our initial version message.

Whenever a Bitcoin node receives a version message, it'll send [a "verack" message](https://en.bitcoin.it/wiki/Protocol_documentation#verack) in response. When our `Node`{:.language-elixir} processes this response, it'll parse the verack message into a `Message`{:.language-elixir} struct with a `command`{:.language-elixir} value of `"verack"`{:.language-elixir}, and asynchronously cast that `Message`{:.language-elixir} to itself.

We'll need to set up a `handle_cast/2`{:.language-elixir} callback to listen for it:

<pre class='language-elixir'><code class='language-elixir'>
def handle_cast(%Message{command: "verack"}, state) do
  [:bright, "Got ", :green, "verack", :reset, :bright, "."]
  |> log()

  {:noreply, state}
end
</code></pre>

When we receive our `"verack"`{:.language-elixir} message, we'll simply log that it was received.

If we spin up our application, we should see our node connect to its peer node, send a version message, and receive a verack response.

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/connecting-an-elixir-node-to-the-bitcoin-network/03.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our verack response.</p>
</div>

## Receiving Version

In the same way that we sent a version message to our peer node, our peer node will send a version message to our node. If we want to confirm our connection, we'll have to send back a verack message as a reply.

Just like our version message, we can listen for a verack message by adding a new `handle_cast/2`{:.language-elixir} callback and pattern matching on `commnand`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def handle_cast(%Message{command: "version"}, state) do
  :ok =
    Message.serialize("verack")
    |> send_message(state.socket)

  :ok =
    Message.serialize("getaddr")
    |> send_message(state.socket)

  {:noreply, state}
end
</code></pre>

This time, rather than just logging that we received the message, we'll two two things. First, we'll construct and send a verack message. Next, we'll send a followup ["getaddr" message](https://en.bitcoin.it/wiki/Protocol_documentation#getaddr) that instructs our peer node to send us all of the peers it's connected to.

Neither the verack message nor the getaddr message contains any actual content, so our call to `Message.serialize/1`{:.language-elixir} will simply set the command on the message and send an empty `payload`{:.language-elixir}.

## Receiving Addresses

Finally, once our peer node receives our request for addresses it'll start sending back collection of ["network address"](https://en.bitcoin.it/wiki/Protocol_documentation#Network_address) blocks wrapped in [an "addr" message](https://en.bitcoin.it/wiki/Protocol_documentation#addr).

Once again, we'll add a `handle_cast/2`{:.language-elixir} callback to listen for this message. This time, we'll pull the binary `payload`{:.language-elixir} our of the parsed message struct:

<pre class='language-elixir'><code class='language-elixir'>
def handle_cast(%Message{command: "addr", payload: payload}, state) do
end
</code></pre>

We know that the payload represents an addr message. We'll need to write a `parse/1`{:.language-elixir} method in our `BitcoinNetwork.Protocol.Addr`{:.language-elixir} module to transform this binary into an `Addr`{:.language-elixir} struct:

<pre class='language-elixir'><code class='language-elixir'>
def parse(binary) do
  with {:ok, %VarInt{value: count}, rest} <- VarInt.parse(binary) do
    {:ok,
     %Addr{
       count: count,
       addr_list:
         for <<binary::binary-size(30) <- rest>> do
           {:ok, net_addr, _rest} = NetAddr.parse(binary)
           net_addr
         end
     }}
  else
    _ -> nil
  end
end
</code></pre>

We first parse the `count`{:.language-elixir} ["variable integer"](https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer) out of the message, and then use a binary list comprehension to transform every thirty bytes of the remaining binary into network address structs. Once we're finished, we return our final `Addr`{:.language-elixir} struct, fully populated with `count`{:.language-elixir} and `addr_list`{:.language-elixir}.

Now that we can parse the addr message sent by our peer node, we can fulfill our second goal. Back in our `handle_cast/2`{:.language-elixir} callback we'll print how many peer nodes we received from our current peer node:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, addr} = Addr.parse(payload)

[:bright, "Received ", :green, "#{length(addr.addr_list)}", :reset, :bright, " peers."]
|> log()

{:noreply, state}
</code></pre>

If we fire up our application, both nodes will exchange version/verack handshakes, our node will ask for a list of peer addresses with a getaddr message, and our peer node will respond with up to one thousand known peers.

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/connecting-an-elixir-node-to-the-bitcoin-network/04.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Receiving peer addresses.</p>
</div>

Awesome!

## Staying Alive

While we've accomplished our second goal, we still haven't completely satisfied our first. In order for our node to stay connected to our peer node, we need to respond to "ping" messages to prove that we're still alive and able to receive messages.

Let's add one last `handle_cast/2`{:.language-elixir} callback to listen for pings:

<pre class='language-elixir'><code class='language-elixir'>
  def handle_cast(%Message{command: "ping"}, state) do
    [:bright, "Got ", :green, "ping", :reset, :bright, ", sending ", :yellow, "pong", :reset, :bright, "."]
    |> log()

    :ok =
      Message.serialize("pong")
      |> send_message(state.socket)

    {:noreply, state}
  end
</code></pre>

This should be familiar by now. When we receive a ping message from our peer, we log that we received the message and send an empty "pong" message as our response.

That's all there is to it.

Our "Bitcoin node" should now stay connected to our peer node indefinitely, responding to occasional pings and receiving occasional collections of peer addresses.

## Final Thoughts and Future Work

This was a behemoth of a post, but I hope the ideas and techniques are simple enough to follow along with. I tried to break things down by splitting related topics into prior articles, but there's still quite a bit of ground to cover to get a node up and running.

I've got several follow-up articles planned for the near future, including extending our node to map the Bitcoin network by recursively connecting to every node it discovers, and more distant plans of building a fully operational Bitcoin node that verifies incoming blocks and potentially mines for new blocks.

If you haven't guessed yet, I'm incredibly excited about this project. If you're interested in exploring Bitcoin through Elixir, [let me know](https://twitter.com/petecorey)!
