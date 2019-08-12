---
layout: post
title:  "Ping, Pong, and Unresponsive Bitcoin Nodes"
excerpt: "The last step in maintaining our pool of Bitcoin peer nodes is to detect and remove unresponsive nodes from our network."
author: "Pete Corey"
date:   2018-07-09
tags: ["Elixir", "Bitcoin"]
related: []
---

The last piece of low-hanging fruit required to finish up the connectivity of our in-progress, [Elixir-powered](https://elixir-lang.org/) Bitcoin node is to implement a system to detect unresponsive peer connections and prune them from our list of active peers.

Once an inactive peer is removed, our current system will automatically connect to a new peer to take its place.

There are several potential solutions for building out this kind of timeout system, and I've been weighing their pros and cons in the back of my mind for several weeks. I think I've come to a relatively simple and elegant solution that tackles the problem with minimal technical and mental overhead.

Let's dive in!

## Who Cares About Unresponsive Nodes?

In its current state, our Bitcoin node will connect to [up to one hundred twenty five peer nodes](https://github.com/bitcoin/bitcoin/blob/23e7fe8be827cdcdcace2a77ecc683074b97f8a2/src/net.h#L70-L71). We assume that each of these nodes is a fully functioning and active part of the Bitcoin peer-to-peer network. If we don't receive any messages from them, or if messages dwindle over time, we just assume that the network doesn't have much to tell us.

This assumption can lead to trouble. If we continue to persist our connections to unresponsive nodes, it's conceivable that eventually every node we're connected to will become unresponsive for some reason or another.

At that point, our Bitcoin node is dead in the water. It's unable to send or receive any information, and it's unable to fetch any additional peers to reestablish its place in the peer-to-peer network. At this point our only course of action would be to restart the node and try again.

And that's not a very robust solution…

## Detecting Slow Connections

Instead, we should be proactive about pruning unresponsive nodes from our set of peers. The first piece of low hanging fruit was can go after is adding a timeout to our `:gen_tcp.connect/2`{:.language-elixir} call:

<pre class='language-elixir'><code class='language-elixir'>
:gen_tcp.connect(
  IP.to_tuple(state.ip),
  state.port,
  options,
  Application.get_env(:bitcoin_network, :timeout)
)
</code></pre>

If a node takes too long to respond to our initial connection request (in this case, `:timeout`{:.language-elixir} is set to thirty seconds), we'll retry the connection a few times and then ultimately remove the node from our set of peers.

## Detecting Unresponsive Nodes

The next step in aggressively pruning our peer list is to watch for unresponsive nodes. We'll do this by setting up a timeout between every message we receive from our peer. If we don't receive another message before a certain cutoff time, we deem the peer unresponsive and break our connection.

We'll start by adding a call to a new `refresh_timeout/1`{:.language-elixir} helper function in our `:tcp`{:.language-elixir} info handler:

<pre class='language-elixir'><code class='language-elixir'>
def handle_info({:tcp, _port, data}, state) do
  state = refresh_timeout(state)
  ...
end
</code></pre>

The first time `refresh_timeout/1`{:.language-elixir} is called, it schedules a `:timeout`{:.language-elixir} message to be sent to the current process after a certain amount of time. A reference to that timer is stored in the process' current state:

<pre class='language-elixir'><code class='language-elixir'>
defp refresh_timeout(state) do
  timer = Process.send_after(self(), :timeout, Application.get_env(:bitcoin_network, :timeout))
  Map.put_new(state, :timer, timer)
end
</code></pre>

Subsequent calls to `refresh_timeout/1`{:.language-elixir} cancel the existing timer, and create a new one:

<pre class='language-elixir'><code class='language-elixir'>
defp refresh_timeout(state = %{timer: timer}) do
  Process.cancel_timer(timer)
  refresh_timeout(Map.delete(state, :timer))
end
</code></pre>

Now we need to add a callback to handle the scheduled `:timeout`{:.language-elixir} message:

<pre class='language-elixir'><code class='language-elixir'>
def handle_info(:timeout, state) do
  {:disconnect, :timeout, state}
end
</code></pre>

Whenever we receive a `:timeout`{:.language-elixir} message, we simply kill the current process, effectively disconnecting the associated peer.

## Ensuring A Constant Stream of Messages

So now we're disconnecting peers if we don't receive a message from them within a certain period of time (thirty seconds in my case), but we have no way of guaranteeing that we _should_ receive messages this frequently. What if there are no new blocks or transactions on the network?

To guarantee what we receive regular periodic messages, we need to set up a ping/pong loop.

{% include newsletter.html %}

Every so often we'll send our peer node a "ping" message. If they're still responsive, they'll immediately respond with a "pong". The peer will ensure our responsiveness by sending their own "pings", which we're already responding to.

According to the woefully under-documented Bitcoin protocol, we can't send our first "ping" until we send back our "verack" message. Any messages sent prior to our "verack" will mark our node as "misbehaving" and risk a disconnection.

<pre class='language-elixir'><code class='language-elixir'>
defp handle_payload(%Version{}, state) do
  with :ok <- Message.serialize("verack") |> send_message(state.socket),
       :ok <- Message.serialize("getaddr") |> send_message(state.socket),
       :ok <-
         Message.serialize("ping", %Ping{
           nonce: :crypto.strong_rand_bytes(8)
         })
         |> send_message(state.socket) do
    {:ok, state}
  else
    {:error, reason} -> {:error, reason, state}
  end
end
</code></pre>

Now that we've sent our "ping", we can expect to receive a "pong" in reply. When we receive the peer's "pong" response, we want to schedule another "ping" to be sent a short time in the future. We do this by scheduling a `:send_ping`{:.language-elixir} message to be sent to the current process after a short interval:

<pre class='language-elixir'><code class='language-elixir'>
defp handle_payload(%Pong{}, state) do
  Process.send_after(self(), :send_ping, Application.get_env(:bitcoin_network, :ping_time))
  {:ok, state}
end
</code></pre>

Our `:send_ping`{:.language-elixir} handler sends another "ping" message, completing the ping/pong cycle:

<pre class='language-elixir'><code class='language-elixir'>
def handle_info(:send_ping, state) do
  with :ok <-
         Message.serialize("ping", %Ping{
           nonce: :crypto.strong_rand_bytes(8)
         })
         |> send_message(state.socket) do
    {:noreply, state}
  else
    {:error, reason} -> {:error, reason, state}
  end
end
</code></pre>

And that's all there is to it!

As long as `:ping_time`{:.language-elixir} is reasonably less than our `:timeout`{:.language-elixir}, we should always have a constant stream of "ping" messages to keep our timeout timer from firing. If one of our peers ever fails to send their "pong", we kill their corresponding `Node`{:.language-elixir} process.

## Final Thoughts

As far as I'm concerned, that wraps up the networking portion of our in-progress Elixir-based Bitcoin node project. In the future we'll turn our attention to the actual guts of a Bitcoin node: processing blocks and transactions.

At some point we might also slap a fancy user interface on top of our node. Everything's better with a great UI.

Stay tuned!
