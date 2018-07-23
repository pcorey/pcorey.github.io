---
layout: post
title:  "Building a Better Receive Loop"
description: ""
author: "Pete Corey"
date:   2018-07-23
tags: ["Elixir", "Bitcoin", "Erlang"]
related: []
---

I've been putting quite a bit of time this past week into overhauling and refactoring [my in-progress Elixir-based Bitcoin node](https://github.com/pcorey/bitcoin_network/).

As a part of that overhaul, I turned my attention to how we're receiving packets from connected peers. The way we've been handling incoming packets is overly complicated and can be greatly simplified by taking advantage of the Bitcoin protocol's packet structure.

Let's go over our old solution and dig into how it can be improved.

## The Original Receive Loop

Our Bitcoin node uses [Erlang's `:gen_tcp`{:.language-elixir} module](http://erlang.org/doc/man/gen_tcp.html) to manage peer to peer communications. Originally, we were using `:gen_tcp`{:.language-elixir} in "active mode", which means that incoming packets are delivered to our node's Elixir process in the form of `:tcp`{:.language-elixir} messages:

<pre class='language-elixir'><code class='language-elixir'>
def handle_info({:tcp, _port, data}, state) do
  ...
end
</code></pre>

Because TCP is a streaming protocol, no guarantees can be made about the contents of these messages. A single message may contain a complete Bitcoin packet, a partial packet, multiple packets, or any combination of the above. To handle this ambiguity, the Bitcoin protocol deliminates each packet with a sequence of "magic bytes". Once we reach this magic sequence, we know that everything we've received up until that point constitutes a single packet.

My previous receive loop worked by maintaining a backlog of all incoming bytes up until the most recently received sequence of magic bytes. Every time a new message was received, it would append those incoming bytes to the backlog and chunk that binary into a sequence of packets, which could then be handled individually:

<pre class='language-elixir'><code class='language-elixir'>
{messages, rest} = chunk(state.rest <> data)

case handle_messages(messages, state) do
  {:error, reason, state} -> {:disconnect, reason, %{state | rest: rest}}
  state -> {:noreply, %{state | rest: rest}}
end
</code></pre>

This solution works, but there are quite a few moving pieces. Not only do we have to maintain a backlog of all recently received bytes, we also have to build out the functionality to split that stream of bytes into individual packets:

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

Thankfully, there's a better way.

## Taking Advantage of Payload Length

Every message sent through the Bitcoin protocol [follows a specific format](https://en.bitcoin.it/wiki/Protocol_documentation#Message_structure).

The first four bytes of every packet are reserved for the network's magic bytes. Next, twelve bytes are reserved for the name of the command being sent across the network. The next four bytes hold the length of the payload being sent, followed by a four byte partial checksum of that payload.

These twenty four bytes can be found at the head of every message sent across the Bitcoin peer-to-peer network, followed by the variable length binary payload representing the meat and potatoes of the command being carried out. Relying on this structure can greatly simplify our receive loop.

By using `:gen_tcp`{:.language-elixir} in "passive mode" (setting `active: false`{:.language-elixir}), incoming TCP packets won't be delivered to our current process as messages. Instead, we can ask for packets using a blocking call to [`:gen_tcp.recv/2`{:.language-elixir}](http://erlang.org/doc/man/gen_tcp.html#recv-2). When requesting packets, we can even specify the number of bytes we want to receive from the incoming TCP stream.

Instead of receiving partial messages of unknown size, we can ask `:gen_tcp`{:.language-elixir} for the next `24`{:.language-elixir} bytes in the stream:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, message} <- :gen_tcp.recv(socket, 24)
</code></pre>

Next, we can parse the received `message`{:.language-elixir} bytes and request the payload's `size`{:.language-elixir} in bytes from our socket:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, %{size: size}} <- Message.parse(message),
{:ok, payload} <- :gen_tcp.recv(socket, size)
</code></pre>

And now we can parse and handle our `payload`{:.language-elixir}, knowing that it's guaranteed to be a single, complete Bitcoin command sent across the peer-to-peer network.

## Final Thoughts

There's more than goes into the solution that I outlined above. For example, if we're receiving a command like `"verack"`{:.language-elixir}, which has a zero byte payload, asking for zero bytes from `:gen_tcp.recv/2`{:.language-elixir} will actually return all of the available bytes it has in its TCP stream.

Complications included, I still think this new solution is superior to our old solution of maintaining and continually chunking an ongoing stream of bytes pulled off the network.

If you're eager to see the full details of the new receive loop, [check it out on Github](https://github.com/pcorey/bitcoin_network/blob/master/lib/bitcoin_network/peer/connection.ex#L80-L98)!

I'd also like to thank [Karl Seguin](https://github.com/karlseguin) for inspiring me to improve our Bitcoin node using this technique. He posted a message on [the Elixir Slack group](https://elixir-slackin.herokuapp.com/) about prefixing TCP messages with their length to easily determine how many bytes to receive:

> I'd length prefix every message with 4 bytes and do two recvs, 
> `{:ok, <<length::big-32>>} = recv(socket, 4, TIMEOUT)`{:.language-elixir}
> `{:ok, message} = recv(socket, length, TIMEOUT)`{:.language-elixir}

This one line comment opened my mind to the realization that the Bitcoin protocol was already doing this, and that I was overcomplicating the process of receiving messages.

Thanks Karl!
