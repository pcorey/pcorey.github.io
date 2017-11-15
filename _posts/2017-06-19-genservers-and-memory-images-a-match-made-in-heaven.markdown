---
layout: post
title:  "GenServers and Memory Images: A Match Made in Heaven"
description: "Elixir's GenServers are the perfect tool for implementing Memory Images — a powerful replacement for storing state in conventional databases."
author: "Pete Corey"
date:   2017-06-19
tags: ["Elixir", "Inject Detect", "Event Sourcing"]
---

My current project, [Inject Detect](http://www.injectdetect.com/), is being built with [Elixir](https://elixir-lang.org/) and makes heavy use of Martin Fowler-style [Memory Images](https://martinfowler.com/bliki/MemoryImage.html). After working with this setup for several months, I’ve come to realize that Elixir [GenServers](https://elixir-lang.org/getting-started/mix-otp/genserver.html) and a Memory Image architecture are a match made in heaven.

Let’s dive into what Memory Images are, and why GenServers are the perfect tool for building out a Memory Image in your application.

## What is a Memory Image?

In my opinion, the best introduction to the Memory Image concept is [Martin Fowler’s article on the subject](https://martinfowler.com/bliki/MemoryImage.html). If you haven’t, be sure to read through the article.

For brevity, I’ll try to summarize as quickly as possible. Martin comments that most developers’ first question when starting a new project is, “what database will I use?” Unfortunately, answering this question requires many upfront decisions about things like data shape and even usage patterns that are often unknowable upfront.

Martin flips the question on its head. Instead of asking which database you should use, he suggests you ask yourself, “do I need a database at all?”

Mind blown.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">&#39;But there&#39;s another question to consider: &quot;should we use a database at all?&quot;&#39; *mind blown* <a href="https://t.co/rXajpOjl60">https://t.co/rXajpOjl60</a></p>&mdash; Pete Corey (@petecorey) <a href="https://twitter.com/petecorey/status/843842120364544000">March 20, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

The idea of a Memory Image is to keep the entire state of your application entirely within your server’s memory, rather than keeping it in a database. At first, this seems absurd. In reality, it actually works very well for many projects.

I’ll defer an explanation of the pros, cons, and my experiences with Memory Images to a later post. Instead of going down that rabbit hole, let’s take a look at how we can efficiently implement a Memory Image in Elixir!

## Backed By an Event Log

The notion that a Memory Image architecture doesn’t use a database at all isn’t entirely true. In Inject Detect, I use a database to persist a log of events that describe all changes that have happened to the system since the beginning of time.

This event log isn’t particularly useful in its raw format. It can’t be queried in any meaningful way, and it can’t be used to make decisions about the current state of the system.

To get something more useful out of the system, the event log needs to be replayed. Each event effects the system’s state in some known way. By replaying these events and their corresponding effects in order, we can rebuild the current state of the system. We effectively reduce down all of the events in our event log into the current state of our system.

This is [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html).

---- 

We can implement this kind of simplified Event Sourced system fairly easily:

<pre class='language-elixir'><code class='language-elixir'>
defmodule State do

  def get do
    state = InjectDetect.Model.Event
    |> order_by([event], event.id)
    |> InjectDetect.Repo.all
    |> Enum.to_list
    |> Enum.map(&(struct(String.to_atom(&1.type), &1.data))
    |> Enum.reduce(%{}, &State.Reducer.apply/2)
  end

end
</code></pre>

Each event in our event log has a `type`{:.language-elixir} field that points to a specific event struct in our application (like `SignedUp`{:.language-elixir}), and a `data`{:.language-elixir} field that holds a map of all the information required to replay the effects of that event on the system.

For example, a `SignedUp`{:.language-elixir} event might look like this when saved to the database:

<pre class='language-elixir'><code class='language-elixir'>
%{id: 123, type: "SignedUp", data: %{"email" => "user@example.com"}}
</code></pre>

To get the current state of the system, we grab all events in our event log, convert them into structs, and then reduce them down into a single state object by applying their changes, one after the other, using our `State.Reducer.apply`{:.language-elixir}  [Elixir protocol](https://elixir-lang.org/getting-started/protocols.html) that all event structs are required to implement.

While this is a fairly simple concept, it’s obviously inefficient. Imagine having to process your entire event log every time you want to inspect the state of your system!

There has to be a better way.

## GenServer, Meet Memory Image

Memory Image, meet [GenServer](https://elixir-lang.org/getting-started/mix-otp/genserver.html).

Rather than reprocessing our entire event log every time we want to inspect our application’s state, what if we could just keep the application state in memory?

GenServers (and [Elixir processes](https://elixir-lang.org/getting-started/processes.html) in general) are excellent tools for persisting state in memory. Let’s refactor our previous solution to calculate our application’s state and then store it in memory for future use.

To manage this, our GenServer will need to store two pieces of information. It will need to store the current state of the system, and the `id`{:.language-elixir} of the last event that was processed. Initially, our current application state will be an empty map, and the last `id`{:.language-elixir} we’ve seen will be `0`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
  def start_link, do:
    GenServer.start_link(__MODULE__, { %{}, 0 }, name: __MODULE__)
</code></pre>

Next, rather than fetching all events from our event log, we want to fetch only the events that have happened after the last event `id`{:.language-elixir} that we’ve processed:

<pre class='language-elixir'><code class='language-elixir'>
  defp get_events_since(id) do
    events = InjectDetect.Model.Event
    |> where([event], event.id > ^id)
    |> order_by([event], event.id)
    |> InjectDetect.Repo.all
    |> Enum.to_list
    {convert_to_structs(events), get_last_event_id(events)}
  end
</code></pre>

This function returns a tuple of the fetched events, along with the `id`{:.language-elixir} of the last event in that list.

When `get_events_since`{:.language-elixir} is first called, it will return all events currently in the event log. Any subsequent calls will only return the events that have happened after the last event we’ve processed. Because we’re storing the system’s state in our GenServer, we can apply these new events to the old state to get the new current state of the system.

Tying these pieces together, we get something like this:

<pre class='language-elixir'><code class='language-elixir'>
defmodule State do
  use GenServer

  import Ecto.Query

  def start_link, do: 
    GenServer.start_link(__MODULE__, { %{}, 0 }, name: __MODULE__)
 
  def get, do: 
    GenServer.call(__MODULE__, :get)

  def convert_to_structs(events), do: 
    Enum.map(events, &(struct(String.to_atom(&1.type), &1.data))

  def get_last_event_id(id, events) do
    case List.last(events) do
      nil   -> id
      event -> event.id
    end
  end

  defp get_events_since(id) do
    events = InjectDetect.Model.Event
    |> where([event], event.id > ^id)
    |> order_by([event], event.id)
    |> InjectDetect.Repo.all
    |> Enum.to_list
    {convert_to_structs(events), get_last_event_id(id, events)}
  end

  def handle_call(:get, _, {state, last_id}) do
    {events, last_id} = get_events_since(last_id)
    state = Enum.reduce(events, state, &State.Reducer.apply/2)
    {:reply, {:ok, state}, {state, last_id}}
  end

end
</code></pre>

At first this solution may seem complicated, but when we break it down, there’s not a whole lot going on.

Our `State`{:.language-elixir} GenServer stores:
1. The current `state`{:.language-elixir} of the system.
2. The `id`{:.language-elixir} of the last event it has processed.

Whenever we call `State.get`{:.language-elixir}, it checks for new events in the event log and applies them, in order, to the current state. The GenServer saves this state and the `id`{:.language-elixir} of the last new event and then replies with the new state.

That’s it!

## Final Thoughts

Building a Memory Image in Elixir using GenServers is a match made in heaven. When working with these tools and techniques, it honestly feels like solutions effortlessly fall into place.

The Memory Image architecture, especially when combined with Event Sourcing, perfectly lends itself to a functional approach. Additionally, using GenServers to implement these ideas opens the doors to building fast, efficient, fault-tolerant, and consistent distributed systems with ease.

While Memory Images are an often overlooked solution to the problem of maintaining state, the flexibility and speed they bring to the table should make them serious contenders in your next project.
