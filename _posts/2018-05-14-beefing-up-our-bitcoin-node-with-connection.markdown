---
layout: post
title:  "Beefing Up our Bitcoin Node with Connection"
description: "Let's beef up the resiliency of our Elixir-based Bitcoin node by incorporating some connection retry behavior."
author: "Pete Corey"
date:   2018-05-14
tags: ["Elixir", "Bitcoin"]
related: ["/blog/2018/04/23/connecting-an-elixir-node-to-the-bitcoin-network/"]
---

We left off in our Bitcoin adventure by building a bare-bones Bitcoin node that connects to another peer node on the network. While our Elixir-based node was able to connect to a peer, that connection was fragile at best. Any problems with the initial connection or version messaging would leave our application dead in the water.

Thankfully, there are ways of beefing our the resilience of our Elixir node. Today we'll be refactoring our Bitcoin node to use James Fish's [Connection behavior](https://github.com/fishcakez/connection), rather than the basic GenServer behavior that ships with Elixir. Implementing this behavior in our node will give us more robustness in our connection process, along with the option to reconnect to a peer node in the case of failure.

Let's get to it!

## Our Starting Point

Before we dive into refactoring our Bitcoin node to use the new Connection behavior, we should go over some changes I made to simplify [the `BitcoinNetwork.Node`{:.language-elixir} module](https://github.com/pcorey/bitcoin_network/blob/6072b3c71a4eef81540464f7ff2fda5951a331cf/lib/bitcoin_network/node.ex).

Previously, every message parsed out of incoming TCP packets was assembled into a `BitcoinNetowkr.Protocol.Message`{:.language-elixir} struct and cast back to the current node process as a process message. In hindsight, this solution is overly complicated and weighted down with boilerplate and message passing overhead. Instead, [I opted to take my own advice and "just use a function"](http://www.petecorey.com/blog/2017/05/29/have-you-tried-just-using-a-function/) to handle my incoming messages.

<pre class='language-elixir'><code class='language-elixir'>
def handle_info({:tcp, _port, data}, state) do
  {messages, rest} = chunk(state.rest <> data)

  case handle_messages(messages, state) do
    {:error, reason, _state} -> {:stop, reason}
    {:ok, state} -> {:noreply, %{state | rest: rest}}
  end
end
</code></pre>

Now the assembled `Message`{:.language-elixir} structs are passed off to a `handle_messages/2`{:.language-elixir} helper function, which returns either an `:error`{:.language-elixir} tuple, or an `:ok`{:.language-elixir} tuple with the current node's updated state after processing each of the received messages.

The `handle_messages/2`{:.language-elixir} filters out invalid messages, and runs each of the remaining messages through a `handle_payload/2`{:.language-elixir} helper function. We pass this function a new `parsed_payload`{:.language-elixir} field, which holds the parsed struct-based representation of the inbound Bitcoin message:

<pre class='language-elixir'><code class='language-elixir'>
defp handle_messages(messages, state) do
  messages
  |> Enum.filter(&Message.verify_checksum/1)
  |> Enum.reduce_while({:ok, state}, fn message, state ->
    case handle_payload(message.parsed_payload, state) do
      {:error, reason, state} -> {:halt, {:error, reason, state}}
      {:ok, state} -> {:cont, {:ok, state}}
    end
  end)
end
</code></pre>

Notice that we're using `Enum.reduce_while/3`{:.language-elixir} to give our `handle_payload/2`{:.language-elixir} calls the opportunity to modify the state of the node before the next message is processed.

If we run into a problem handling a parsed payload, we immediately exit our reduction by returning a `:halt`{:.language-elixir} tuple.

The main benefit of this refactor comes from the simplicity of our `handle_payload/2`{:.language-elixir} methods. Here's what our "ping" handler looks like after the refactor:

<pre class='language-elixir'><code class='language-elixir'>
defp handle_payload(%Ping{}, state) do
  with :ok <- Message.serialize("pong") |> send_message(state.socket) do
    {:ok, state}
  else
    {:error, reason} -> {:error, reason, state}
  end
end
</code></pre>

We use pattern matching to listen for `BitcoinNetwork.Protocol.Ping`{:.language-elixir} messages. When we receive a `Ping`{:.language-elixir}, we serialize and send a "pong" back to our peer node. If anything goes wrong with sending the response, we return an `:error`{:.language-elixir} tuple.

Beautiful.

## Connection without Connecting

The Connection behavior is a specialization of the GenServer behavior, and is intended to be used to represent connections to external resources. It mirrors the entire API of a standard GenServer, and adds two additional callbacks for us to implement: `connect/2`{:.language-elixir} and `disconnect/2`{:.language-elixir}. As you've probably guessed, these two callbacks are used to connect and disconnect from our external resource.

Before we start using the Connection behavior in our application, we'll need to add it as a dependency in our `mix.exs`{:.language-elixir} file:

<pre class='language-elixir'><code class='language-elixir'>
defp deps do
  [
    {:connection, "~> 1.0"}
  ]
end
</code></pre>

Next, we'll start our GenServer to Connection conversion by replacing our `use`{:.language-elixir} of the `GenServer`{:.language-elixir} behavior with the new `Connection`{:.language-elixir} behavior, and wholesale replacing `GenServer`{:.language-elixir} with `Connection`{:.language-elixir} throughout our `BitcoinNetwork.Node`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
defmodule BitcoinNetwork.Node do
  use Connection

  def start_link({ip, port}) do
    Connection.start_link(__MODULE__, %{ip: ip, port: port, rest: ""})
  end

  ...
</code></pre>

Because the Connection behavior is a superset of the GenServer behavior, our node should still run like it used to given these changes. Let's try it out.

<pre class='language-elixir'><code class='language-elixir'>
** (Mix) Could not start application bitcoin_network: exited in: BitcoinNetwork.Application.start(:normal, [])
    ** (EXIT) an exception was raised:
        ** (ArgumentError) The module BitcoinNetwork.Node was given as
        a child to a supervisor but it does not implement child_spec/1.
</code></pre>

Uh oh.

The Connection behavior doesn't implement a `child_spec/1`{:.language-elixir} callback like our old GenServer behavior did, and our application no longer likes the child specification shorthand we're using in our `BitcoinNetwork.Application`{:.language-elixir} supervisor:

<pre class='language-elixir'><code class='language-elixir'>
{BitcoinNetwork.Node,
 {Application.get_env(:bitcoin_network, :ip),
  Application.get_env(:bitcoin_network, :port)}}
</code></pre>

We'll fix this by fleshing out our child specification into [a full specification map](https://hexdocs.pm/elixir/Supervisor.html#module-child_spec-1) in our `BitcoinNetwork.Application`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
%{
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
}
</code></pre>

With those changes, our Bitcoin node runs just like it used to.

## Connecting with Connect

So far our refactor isn't very exciting. While our Bitcoin node still works, we haven't added any new functionality. Let's change that by fleshing out the `connect/2`{:.language-elixir} callback provided by the Connection behavior.

We'll start by sketching out the `connect/2`{:.language-elixir} callback within our module:

<pre class='language-elixir'><code class='language-elixir'>
def connect(_info, state) do
end
</code></pre>

Within our `connect/2`{:.language-elixir} callback, we should handle all of the behavior associated with connecting to our external resource. You may remember that this was previously being handled in our `init/1`{:.language-elixir} callback. Let's start migrating that code into our `connect/2`{:.language-elixir} function.

{% include newsletter.html %}

The first step in connecting to our peer node is to establish a TCP connection:

<pre class='language-elixir'><code class='language-elixir'>
:gen_tcp.connect(IP.to_tuple(state.ip), state.port, options)
</code></pre>

The next step is sending our initial "version" message and establishing communication with the peer:

<pre class='language-elixir'><code class='language-elixir'>
send_message(message, socket)
</code></pre>

If both of these things go well, we can say that we've successfully connected to our peer Bitcoin node. In that case, the Connection behavior dictates that we should return an `:ok`{:.language-elixir} tuple with the new state of the process.

<pre class='language-elixir'><code class='language-elixir'>
with {:ok, socket} <- :gen_tcp.connect(IP.to_tuple(state.ip), state.port, options),
     :ok <- send_message(message, socket) do
  {:ok, Map.put_new(state, :socket, socket)}
end
</code></pre>

However, if something goes wrong, [we have a couple options](https://hexdocs.pm/connection/Connection.html#c:connect/2). We can either return  a `:stop`{:.language-elixir} tuple to kill the current process. That's similar to the previous functionality of our node. Alternatively, we can return a `:backoff`{:.language-elixir} tuple which instructs the Connection behavior to retry our connection behavior after the specified `timeout`{:.language-elixir}.

Let's try reconnecting to our peer node if something goes wrong. To do this, all we need to do is add an `else`{:.language-elixir} block to our `with`{:.language-elixir} that returns our `:backoff`{:.language-elixir} tuple:

<pre class='language-elixir'><code class='language-elixir'>
else
  _ -> {:backoff, 1000, state}
</code></pre>

Now, after a failed connection attempt our Bitcoin node will retry the connection after one thousand milliseconds.

## Limiting Retries

Our new connection retry logic works beautifully. It almost works too well, in fact. If we try to connect to a non-existent Bitcoin peer node, we can see that our node will attempt to reconnect until the end of time. Let's limit the number of retry attempt our node can make before it gives up.

We'll do this by adding a `retries`{:.language-elixir} field to our initial state with an initial value of `0`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def start_link({ip, port}) do
  Connection.start_link(__MODULE__, %{
    ...
    retries: 0
  })
end
</code></pre>

We'll also add a `@max_retries`{:.language-elixir} module attribute to indicate how many retries we want our node to attempt:

<pre class='language-elixir'><code class='language-elixir'>
@max_retries 3
</code></pre>

Next, we'll modify the `:backoff`{:.language-elixir} tuple returned by our `connection/2`{:.language-elixir} callback to increment `retries`{:.language-elixir} in the returned `state`{:.language-elixir} map:

<pre class='language-elixir'><code class='language-elixir'>
{:backoff, 1000, Map.put(state, :retries, state.retries + 1)}
</code></pre>

Lastly, we'll add a new `connect/2`{:.language-elixir} function head that detects when we've reached the maximum number of allowed retries. When we reach that limit, we want to return a `:stop`{:.language-elixir} tuple to kill the current process:

<pre class='language-elixir'><code class='language-elixir'>
def connect(_info, state = %{retries: @max_retries}) do
  {:stop, :normal, state}
end
</code></pre>

Beautiful. Now our Bitcoin node will stop attempting to connect to its peer node after three failed attempts, waiting one second between each.

## Disconnecting with Connect

Now that we've revamped how we connect to our peer node, we need to consider what should happen in the event that we disconnect from that node.

If our `handle_call/3`{:.language-elixir}, `handle_cast/2`{:.language-elixir}, or `handle_info/2`{:.language-elixir} callbacks return a `:disconnect`{:.language-elixir} tuple, our Connection behavior will call our `disconnect/2`{:.language-elixir} callback, which will decide the next course of action.

We have several options for handling the disconnection in our `disconnect/2`{:.language-elixir} callback. We can return a `:connect`{:.language-elixir} tuple to attempt a reconnection immediately. Similarly, we can return a `:backoff`{:.language-elixir} tuple to delay the reconnection by the specified `timestamp`{:.language-elixir}. Alternatively, we can return a `:noconnect`{:.language-elixir} tuple to keep the current process alive, but not attempt to reconnect to our peer node. Lastly, our `disconnect/2`{:.language-elixir} callback can return a `:stop`{:.language-elixir} tuple to immediately terminate our Bitcoin node process.

When we start connecting to more nodes in the future, the loss of a single node it's a big deal. Losing peers is just a part of life, unfortunately. With that in mind, if we detect a disconnect, we'll simply close our TCP connection return a `:stop`{:.language-elixir} tuple from our `disconnect/2`{:.language-elixir} callback:

<pre class='language-elixir'><code class='language-elixir'>
def disconnect(_, state) do
  :ok = :gen_tcp.close(state.socket)
  {:stop, :normal, state}
end
</code></pre>

Next, when handling the result of our call to `handle_messages/2`{:.language-elixir}, we'll deal with errors slightly differently. Instead of returning a `:stop`{:.language-elixir} tuple when we receive an `:error`{:.language-elixir} while handling one of our messages, we'll instead return a `:disconnect`{:.language-elixir} tuple:

<pre class='language-elixir'><code class='language-elixir'>
case handle_messages(messages, state) do
  {:error, reason, state} -> {:disconnect, reason, %{state | rest: rest}}
  state -> {:noreply, %{state | rest: rest}}
end
</code></pre>

This will drop us into our `disconnect/2`{:.language-elixir} callback with the given `reason`{:.language-elixir} for the disconnect.

That's all there is to it!

## Final Thoughts

This refactor involved quite a few moving pieces, but in the end the final product is a cleaner, simpler, and more robust piece of software. With these changes we've positioned ourselves very nicely to move forward and expand on the Bitcoin node project we've found ourselves in.

Be sure to [check out the complete code on Github](https://github.com/pcorey/bitcoin_network/tree/5cd3ab405207f39ff0b4b757ecd1b6ad3cf556a2) to get a cohesive view of what we've done.

Next time we'll start expanding our network of nodes by recursively connecting with the neighboring nodes we receive from our peer node. Stay tuned!
