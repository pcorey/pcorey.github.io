---
layout: post
title:  "Spreading Through the Bitcoin Network"
excerpt: "Let's replace our Bitcoin node's supervisor with a dynamic supervisor and start recursively spreading through the Bitcoin peer-to-peer network!"
author: "Pete Corey"
date:   2018-05-21
tags: ["Elixir", "Bitcoin"]
related: []
---

Previously, we beefed up our Elixir-based Bitcoin-node-in-progress to use the Connection behavior to better manage our connection to our peer node. Now that we can robustly connect to a single peer node, let's broaden our horizons and connect to multiple peers!

Let's refactor our node to use a dynamic supervisor to manage our collection of connections, and start recursively connecting to nodes in the Bitcoin peer-to-peer network!

## Going Dynamic

Each of our connections to a Bitcoin peer node is currently managed through a `BitcoinNetwork.Node`{:.language-elixir} process. We'll manage this collection of processes with a new [dynamic supervisor](https://hexdocs.pm/elixir/DynamicSupervisor.html) called `Bitcoin.Node.Supervisor`{:.language-elixir}.

Let's create that new supervisor now:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Node.Supervisor do
  use DynamicSupervisor

  def start_link([]) do
    DynamicSupervisor.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init([]) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end
end
</code></pre>

The code here is largely boilerplate. Our `Node.Supervisor`{:.language-elixir} initiates itself with a `:one_for_one`{:.language-elixir} strategy (the only supervision strategy currently available to a dynamic supervisor). It's also important to note that like all dynamic supervisors, our `Node.Supervisor`{:.language-elixir} starts without children.

## Back to Where we Started

Next, we'll go into our `BitcoinNetwork.Application`{:.language-elixir} supervisor and replace our `BitcoinNetwork.Node`{:.language-elixir} child specification with a specification for our new dynamic supervisor:

<pre class='language-elixir'><code class='language-elixir'>
Supervisor.start_link(
  [
    {DynamicSupervisor, strategy: :one_for_one, name: BitcoinNetwork.Node.Supervisor}
  ],
  strategy: :one_for_one
)
</code></pre>

After our `Application`{:.language-elixir} has successfully started its `Node.Supervisor`{:.language-elixir} child, we'll go ahead and add our `Node`{:.language-elixir} process as a child of our new dynamic supervisor:

<pre class='language-elixir'><code class='language-elixir'>
DynamicSupervisor.start_child(BitcoinNetwork.Node.Supervisor, %{
  id: BitcoinNetwork.Node,
  start:
    {BitcoinNetwork.Node, :start_link,
     [
       {
         Application.get_env(:bitcoin_network, :ip),
         Application.get_env(:bitcoin_network, :port)
       }
     ]},
  restart: :transient
})
</code></pre>

We simply moved our `BitcoinNetwork.Node`{:.language-elixir} child specification out of our old supervisor's child list, and dropped it into our call to `DynamicSupervisor.start_child/2`{:.language-elixir}.

What we're really trying to do here is "connect to a node", but all of this boilerplate is confusing our intentions. Let's create a new function in our `BitcoinNetwork`{:.language-elixir} module called `connect_to_node/2`{:.language-elixir} that takes a node's IP address and a port, and adds a child to our `Node.Supervisor`{:.language-elixir} that manages the connection to that node:

<pre class='language-elixir'><code class='language-elixir'>
def connect_to_node(ip, port) do
  DynamicSupervisor.start_child(BitcoinNetwork.Node.Supervisor, %{
    id: BitcoinNetwork.Node,
    start: {BitcoinNetwork.Node, :start_link, [{ip, port}]},
    restart: :transient
  })
end
</code></pre>

Now we can replace the `start_child/2`{:.language-elixir} mess in the `start/2`{:.language-elixir} callback of our `Application`{:.language-elixir} module with a call to our new `connect_to_node/2`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
BitcoinNetwork.connect_to_node(
  Application.get_env(:bitcoin_network, :ip),
  Application.get_env(:bitcoin_network, :port)
)
</code></pre>

That's much nicer.

Now it's clear that when our application starts up, it creates a new dynamic supervisor, `Node.Supervisor`{:.language-elixir}, and then connects to the Bitcoin node specified in our application's configuration.

At this point, we're back up to feature parity with our original one-node solution. All we've really managed to do it add a supervisor layer into our supervision tree.

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/spreading-through-the-bitcoin-network/node_supervisor.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Our new supervision tree.</p>
</div>

## Adding Nodes

Now that we're equipped with our `connect_to_node/2`{:.language-elixir} function and our new dynamic node supervisor, we're ready rapidly expand our network of known Bitcoin nodes.

Our `Node`{:.language-elixir} process is currently listening for incoming node addresses in one of our `handle_payload/2`{:.language-elixir} functions:

<pre class='language-elixir'><code class='language-elixir'>
defp handle_payload(%Addr{addr_list: addr_list}, state) do
  log([:bright, "Received ", :green, "#{length(addr_list)}", :reset, :bright, " peers."])

  {:ok, state}
end
</code></pre>

We can connect to each of these additional peer nodes by mapping each node address in `addr_list`{:.language-elixir} over our new `connect_to_node/2`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
Enum.map(addr_list, &BitcoinNetwork.connect_to_node(&1.ip, &1.port))
</code></pre>

Let's clean this up a bit by adding another function head to our `connect_to_node/2`{:.language-elixir} function that accepts a single `NetAddr`{:.language-elixir} struct as a parameter:

<pre class='language-elixir'><code class='language-elixir'>
def connect_to_node(%NetAddr{ip: ip, port: port}), do: connect_to_node(ip, port)
</code></pre>

Now we can simply our map over the list of `NetAddr`{:.language-elixir} structures we receive in our `addr_list`{:.language-elixir} variable:

<pre class='language-elixir'><code class='language-elixir'>
Enum.map(addr_list, &BitcoinNetwork.connect_to_node/1)
</code></pre>

Beautiful.

Now our application fires up, connects to our initial Bitcoin peer node, receives that node's list of peers, and spawns a dynamically supervised process that attempts to connect to each of those peers. If any of those peers successfully connect and return their list of peers, we'll repeat the process.

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/spreading-through-the-bitcoin-network/many_connections.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">So many peers!</p>
</div>

## Uncontrolled Growth

At this point, our Bitcoin node will happily spreading itself through the Bitcoin peer-to-peer network, introducing itself as a peer to tens thousands of nodes. However, this level of connectivity might be overkill for our node.

We need some way of limiting the number of active peer connections to some configurable value.

{% include newsletter.html %}

We'll start implementing this limit by adding a `max_peers`{:.language-elixir} configuration value to our `config.exs`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
config :bitcoin_network, max_peers: 125
</code></pre>

Let's start with a limit of one hundred twenty five connections, [just like the default limit in the Bitcoin core client](https://github.com/bitcoin/bitcoin/blob/23e7fe8be827cdcdcace2a77ecc683074b97f8a2/src/net.h#L71).

Next, we'll make a new function in our `BitcoinNetwork`{:.language-elixir} module to count the number of active peer connections. This is fairly straight forward thanks to the `count_children/1`{:.language-elixir} function on the `DynamicSupervisor`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
def count_peers() do
  BitcoinNetwork.Node.Supervisor
  |> DynamicSupervisor.count_children()
  |> Map.get(:active)
end
</code></pre>

Next, in our `connect_to_node/2`{:.language-elixir} function, we'll wrap our call to `DynamicSupervisor.start_child/2`{:.language-elixir} with a check that we haven't reached our `max_peers`{:.language-elixir} limit:

<pre class='language-elixir'><code class='language-elixir'>
if count_peers() < Application.get_env(:bitcoin_network, :max_peers) do
  DynamicSupervisor.start_child(BitcoinNetwork.Node.Supervisor, %{
    ...
  })
else
  {:error, :max_peers}
end
</code></pre>

And that's all there is to it! Now, every time we receive a peer and try to connect to it, our `connect_to_node/2`{:.language-elixir} function will first check that we haven't exceeded the `max_peers`{:.language-elixir} limit defined in our application's configuration.

Our Bitcoin node will now limit its pool of peers to a maximum of one hundred twenty five connections.

## Final Thoughts

Elixir's dynamic supervisor is a breeze to work with and made it possible to easily and quickly scale up our pool of peers from one to tens of thousands of connections in the blink of an eye.

While our Bitcoin node is working its way through the Bitcoin peer-to-peer network, it doesn't actually do anything. We'll need to spend some time in the future figuring out how to process incoming blocks and transactions. Maybe at some point we'll even be able to send our own transactions and mine for new blocks!

It sounds like we'll have to dust off [Mastering Bitcoin](https://amzn.to/2rL5fse) and finish off the few remaining chapters.
