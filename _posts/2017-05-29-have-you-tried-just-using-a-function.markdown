---
layout: post
title:  "Have You Tried Just Using a Function?"
date:   2017-05-29
tags: []
---

Last month I read Sasa Juric’s [To Spawn, or Not to Spawn](http://theerlangelist.com/article/spawn_or_not) article and its been lurking in my subconscious ever since.

I was recently working on [the command handler and event sourcing system](http://www.east5th.co/blog/2017/05/01/inject-detect-progress-report/#back-end-progress) that drives my new project, [Inject Detect](http://www.injectdetect.com/), and this exact topic reared its head. I realized that I had been overcomplicating the project with exessive usage of Elixir processes.

Refactoring my command handler from a process into simple functions hugely simplified the application, and opened the doors for a new set of functionality I wanted to implement.

## The Command Handler Process

For a high level overview, a “command” in Inject Detect represents something you want to do in the system, like requesting a new sign-in token for a user (`RequestSignInToken`{:.language-elixir}), or ingesting a batch of queries from a user’s application (`IngestQueries`{:.language-elixir}).

Commands are “handled” by passing them to the command handler:

<pre class='language-elixir'><code class='language-elixir'>
%IngestQueries{application_id: application.id, queries: queries}
|> CommandHandler.handle(command)
</code></pre>

The job of the command handler is to determine if the command is allowable based on the state of the system and the current user’s authorizations. If valid, the command being handled (`IngestQueries`{:.language-elixir} in this case) will produce a list of events (such as `IngestedQuery`{:.language-elixir} and `IngestedUnexpectedQuery`{:.language-elixir}). These events are saved to the database, and a handful of “event listeners” are notified.

## Command Handler as a Process

Originally, the `CommandHandler`{:.language-elixir} was implemented as a [GenServer](https://hexdocs.pm/elixir/GenServer.html)-based [Elixir](https://elixir-lang.org/) process. The call to `CommandHandler.handle`{:.language-elixir} triggered a `GenServer.call`{:.language-elixir} to the `CommandHandler`{:.language-elixir} process:

<pre class='language-elixir'><code class='language-elixir'>
def handle(command, context \\ %{}) do
  GenServer.call(__MODULE__, {:handle, command, context})
end
</code></pre>

The corresponding `handle_call`{:.language-elixir} callback would handle the command, store the resulting events, and synchronously notify any interested listeners:

<pre class='language-elixir'><code class='language-elixir'>
def handle_call({:handle, command, context}, _, []) do
  with {:ok, events, context} <- handle_command(command, context),
       {:ok, _}               <- store_events(events),
  do
    notify_listeners(events, context)
    {:reply, {:ok, context}, []}
  else
    error -> {:reply, error, []}
  end
end
</code></pre>

## Triggering Commands from Listeners

For several weeks, this solution worked just fine. It wasn’t until I started adding more complex event listeners that I ran into real issues.

I mentioned earlier that event listeners are notified whenever an event is produced by a command. In some cases, these listeners may want to fire off a new command. For instance, when an `IngestedUnexpectedQuery`{:.language-elixir} event is fired, a listener may want to execute a `SendUnexpectedEmail`{:.language-elixir} command.

Implementing this feature blew up in my face.

Because listeners are called synchronously from my `CommandHandler.handle`{:.language-elixir} function, another call to `CommandHandler.handle`{:.language-elixir} from within a listener would result in a GenServer timeout.

The first call to `CommandHandler.handle `{:.language-elixir} won’t reply until the second `CommandHandler.handle `{:.language-elixir} call is finished, but the second `CommandHandler.handle`{:.language-elixir} call won’t be processed until the first call finishes. The second call will wait until it hits its timeout threshold and eventually fail.

We’ve hit a deadlock.

The only way to handle this situation would be to execute either the second call to `CommandHandler.handle`{:.language-elixir}, or the entire listener function within an unsupervised, asynchronous process:

<pre class='language-elixir'><code class='language-elixir'>
Task.start(fn -> 
  %SendUnexpectedEmail{...}
  |> CommandHandler.handle
end)
</code></pre>

I wasn’t willing to go down this road due to testing difficulties and a general distrust of unsupervised children.

## Command Handler as a Function

After mulling over my deadlock problem, the solution slapped me in the face.

The functionality of the command handler could be entirely implemented as a module of simple functions. No process or GenServer required.

A quick refactor led me to this solution:

<pre class='language-elixir'><code class='language-elixir'>
def handle(command, context, listeners) do
  with {:ok, events, context} <- handle_command(command, context),
       {:ok, _}               <- store_events(events)
  do
    notify_listeners(events, context, listeners)
    {:ok, context}
  end
end
</code></pre>

After the refactor, a synchronously called event listener can recursively call `CommandHandler.handle`{:.language-elixir} to handle any follow-up commands it wants to execute.

Perfect.

## Have You Tried Just Using a Function?

In hindsight, I had no particular reason for implementing the `CommandHandler`{:.language-elixir} module as a GenServer. It managed no state and had no specific concurrency concerns that demanded the use of a process.

When given a hammer, everything starts to look like a nail.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Have you tried just using a function?</p>&mdash; Zach McCoy (@ZachAMcCoy) <a href="https://twitter.com/ZachAMcCoy/status/839980751529644033">March 9, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Remember to use the right tool for the job. In many cases, the right tool is the simplest tool. Often, the simplest tool for the job is to just use a function.
