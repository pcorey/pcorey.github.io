---
layout: post
title:  "Limiting Peers with DynamicSupervisor Options"
description: "We can simplify our Bitcoin node's peer management code by letting Elixir do the heavy lifting for us! Let's dive into the `:max_children`{:.language-elixir} option and see how it can help us."
author: "Pete Corey"
date:   2018-06-18
tags: ["Elixir", "Bitcoin"]
related: ["/blog/2018/05/21/spreading-through-the-bitcoin-network/"]
---

Last month [I posted an article](http://www.petecorey.com/blog/2018/05/21/spreading-through-the-bitcoin-network/) about using Elixir's `DynamicSupervisor`{:.language-elixir} behavior to recursively connect our Elixir-based node to peers throughout Bitcoin's peer-to-peer network.

The last part of that article talked about how we could limit the exponential growth of our set of connected peers by setting a hard cap on the number of processes supervised by our dynamic `Node.Supervisor`{:.language-elixir} process.

We went through the rigmarole of building this child process cap ourselves, but [it was pointed out to me](https://www.reddit.com/r/elixir/comments/8ljzr1/spreading_through_the_bitcoin_network/e0m2sv4/) that we could have used `DynamicSupervisor`{:.language-elixir}'s built in `:max_children`{:.language-elixir} option to accomplish the same thing!

## Our Hand-Rolled Solution

When we implemented our own restriction on the number of peers we allow our node to connect to, we did it within the `BitcoinNetwork.connect_to_node/2`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
def connect_to_node(ip, port) do
  if count_peers() < Application.get_env(:bitcoin_network, :max_peers) do
    DynamicSupervisor.start_child(BitcoinNetwork.Node.Supervisor, %{
      id: BitcoinNetwork.Node,
      start: {BitcoinNetwork.Node, :start_link, [{ip, port}]},
      restart: :transient
    })
  else
    {:error, :max_peers}
  end
end
</code></pre>

The `count_peers/0`{:.language-elixir} helper function simply calls out to `DynamicSupervisor.count_children/1`{:.language-elixir} to count the number of processes being supervised by our dynamic `Node.Supervisor`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
BitcoinNetwork.Node.Supervisor
|> DynamicSupervisor.count_children()
|> Map.get(:active)
</code></pre>

If the number of active peers is less than our specified number of `:max_peers`{:.language-elixir}, we allow the connection. Otherwise, we return an `:error`{:.language-elixir} tuple.

## Elixir's Solution

If we read through [the `DynamicSupervisor`{:.language-elixir} documentation](https://hexdocs.pm/elixir/DynamicSupervisor.html#t:init_option/0), we'll find that we can pass a `:max_children`{:.language-elixir} option to `DynamicSupervisor.start_link/2`{:.language-elixir}. Digging through Elixir's source, we can see that, when present, [the `:max_children`{:.language-elixir} option does literally exactly what we did in our hand-rolled solution](https://github.com/elixir-lang/elixir/blob/v1.6.5/lib/elixir/lib/dynamic_supervisor.ex#L627-L635):

<pre class='language-elixir'><code class='language-elixir'>
if dynamic < max_children do
  handle_start_child(child, %{state | dynamic: dynamic + 1})
else
  {:reply, {:error, :max_children}, state}
end
</code></pre>

If `dynamic`{:.language-elixir}, the number of processes currently being supervised by the supervisor, is less than the specified `max_children`{:.language-elixir}, add the child. Otherwise, return an `:error`{:.language-elixir} tuple.

## Refactoring

Refactoring our original solution to make use of the `:max_children`{:.language-elixir} option largely consists of removing our original solution. We'll start by gutting the guard in our `BitcoinNetwork.connect_to_node/2`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
def connect_to_node(ip, port) do
  DynamicSupervisor.start_child(BitcoinNetwork.Node.Supervisor, %{
    id: BitcoinNetwork.Node,
    start: {BitcoinNetwork.Node, :start_link, [{ip, port}]},
    restart: :transient
  })
end
</code></pre>

This means we can also remove our `count_peers/0`{:.language-elixir} helper function.

Now we simply need to add the `:max_children`{:.language-elixir} option to our dynamic supervisor when it starts up:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, pid} =
  Supervisor.start_link(
    [
      {DynamicSupervisor,
        name: BitcoinNetwork.Node.Supervisor,
        strategy: :one_for_one,
        max_children: Application.get_env(:bitcoin_network, :max_peers)}
    ],
    strategy: :one_for_one
  )
</code></pre>

That's all there is to it!

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/limiting-peers-with-dynamicsupervisor-options/01.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our limited set of peers.</p>
</div>

Spinning up our Bitcoin node with a low value for `:max_peers`{:.language-elixir} shows that our `Node.Supervisor`{:.language-elixir} is honoring our limit.


## Final Thoughts

My final thoughts are that I should really spend more time reading through the Elixir and Erlang documentation. There's quite a few gems hidden in plain sight that would do me quite a bit of good to know about.

I'd also like to thank the Redditor who pointed the `:max_children`{:.language-elixir} option out to me. Thanks, [ParticularHabit](https://www.reddit.com/r/elixir/comments/8ljzr1/spreading_through_the_bitcoin_network/e0m2sv4/)!
