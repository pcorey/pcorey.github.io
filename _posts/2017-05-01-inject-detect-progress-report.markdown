---
layout: post
title:  "Inject Detect Progress Report"
date:   2017-05-01
tags: []
---

It’s been [almost two months](http://www.east5th.co/blog/2017/03/06/inject-detect-coming-soon/) since I announced I was working on a security focused SaaS application called [Inject Detect](http://www.injectdetect.com/).

For those that haven’t been following along, [Inject Detect](http://www.injectdetect.com/) is a service designed to detect [NoSQL Injection](http://www.east5th.co/blog/2016/03/21/nosql-injection-in-modern-web-applications/) attacks against your [Meteor](https://www.meteor.com/) applications. It does this by monitoring queries made against your application, looking for unexpected queries that may be the result of an injection attack.

I had [lots of ideas](http://www.east5th.co/blog/2017/03/20/how-am-i-building-inject-detect/) about how I wanted to build out [Inject Detect](http://www.injectdetect.com/). To keep myself accountable and in an effort to iterate in public, I’ve decided to put together a progress report.

Let’s dive into how my plans have played out, where I’m at in the project, and most importantly let’s talk about when [Inject Detect](http://www.injectdetect.com/) will be ready to use!

## Front-end Progress

Since it was announced, I’ve been making steady headway on both the front-end and back-end components of [Inject Detect](http://www.injectdetect.com/).

The front-end of [Inject Detect](http://www.injectdetect.com/) is being built as a React application, backed by [Create React App tooling](http://www.east5th.co/blog/2017/04/03/using-create-react-app-with-phoenix/). On top of vanilla React, I’m using [Apollo client to integrate with my Absinthe-powered GraphQL back-end](http://www.east5th.co/blog/2017/04/10/using-apollo-client-with-elixirs-absinthe/).

So far, this combination has been a dream to work with.

The productivity gains I’ve experienced working with React and Apollo is off the charts. After climbing over a few learning curves, I’ve found myself effortlessly cranking out feature after feature.

I’m addicted to the GraphQL workflow.

---- 

The front-end of [Inject Detect](http://www.injectdetect.com/) is still heavily under construction. I’ll be the first to say that I’m no designer. I’m using [Semantic UI](https://semantic-ui.com/) as the base for most of my designs and tweaking from there.

Overall, I’m very happy with the progress I’ve made so far on the front-end.

Check out a few screen shots to see where I’m at:

----

<img width="100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/inject-detect-1.png">

----

<img width="100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/inject-detect-2.png">

----

<img width="100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/inject-detect-3.png">

----

<img width="100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/inject-detect-4.png">

----

Since NoSQL Injection is a relatively unknown (but unbelievably common) vulnerability, I’m trying to incorporate healthy doses of education into its user interface.

I’m discovering that balancing education with brevity and clarity is a difficult thing to do.

## Back-end Progress

Most of the first month of development was spent building out the back-end infrastructure and business logic to handle all of the various use cases of [Inject Detect](http://www.injectdetect.com/).

In my post about the [high level design of Inject Detect](http://www.east5th.co/blog/2017/03/20/how-am-i-building-inject-detect/), I talked about implementing the core domain of the application using [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html).

So far, I’m very happy with this choice.

Let’s look a little closer at some of the design decisions I’ve made, and dive into what it means to be an “Event Sourced” system.

---- 

Interactions with the system are done through “commands”. A command is just an instruction for the system to do something. Based on the current state of the system, the processing of a command will either return a list of events representing the changes to the system, or an error.

Keep in mind that events don’t actually modify the system in any way (write to a database, etc…). They just return a list of events, side-effect free.

Diving into the code, a command is just an Elixir struct. For example, here’s a command to toggle “alerting” on an application in Inject Detect:

<pre class='language-elixir'><code class='language-elixir'>
defmodule InjectDetect.Command.ToggleAlerting do
  defstruct application_id: nil
end
</code></pre>

The struct holds all of the information we need to carry out the command. In this case, we just need the `application_id`{:.language-elixir} of the application in question.

Each command implements a `Command`{:.language-elixir} protocol, which means it defines a `handle`{:.language-elixir} function. `Command.handle`{:.language-elixir} takes in the command struct being handled and a “context” map, which in our case holds the currently signed in user.

Our `handle`{:.language-elixir} implementation for the `ToggleAlerting`{:.language-elixir} command looks like this:

<pre class='language-elixir'><code class='language-elixir'>
defimpl InjectDetect.Command, for: InjectDetect.Command.ToggleAlerting do

  alias InjectDetect.Event.TurnedOffAlerting
  alias InjectDetect.Event.TurnedOnAlerting
  alias InjectDetect.State.Application

  def toggle_alerting(application = %{user_id: user_id}, command, %{user_id: user_id}) do
    case application.alerting do
      true ->
        {:ok, [%TurnedOffAlerting{application_id: command.application_id}]}
      false ->
        {:ok, [%TurnedOnAlerting{application_id: command.application_id}]}
    end
  end

  def toggle_alerting(_, _, _) do
    {:error, %{code: :not_authorized,
               error: "Not authorized",
               message: "Not authorized"}}
  end

  def handle(command, context) do
    Application.find(command.application_id)
    |> toggle_alerting(command, context)
  end

end
</code></pre>

If the current user has permission to toggle alerting on the specified application, we return either a `TurnedOffAlerting`{:.language-elixir} event, or a `TurnedOnAlerting`{:.language-elixir} event.

Otherwise, we throw an authorization error.

---- 

Events, like commands, are just Elixir structs. The `TurnedOffAlerting`{:.language-elixir} event we mentioned earlier looks something like this:

<pre class='language-elixir'><code class='language-elixir'>
defmodule InjectDetect.Event.TurnedOffAlerting do
  defstruct application_id: nil
end
</code></pre>

Again, the only information we need to represent this event is the `application_id`{:.language-elixir} of the application in question.

Events implement a `Reducer`{:.language-elixir} protocol, which defines a `apply`{:.language-elixir} function. The `apply`{:.language-elixir} function takes in the system’s current state as its first argument, and the event being applied as the second argument. It’s purpose is to transform the current state according to the event being applied.

The `Reducer`{:.language-elixir} implementation for `TurnedOffAlerting`{:.language-elixir} looks like this:

<pre class='language-elixir'><code class='language-elixir'>
defimpl InjectDetect.State.Reducer,
   for: InjectDetect.Event.TurnedOffAlerting do

  def apply(event, state) do
    put_in(state, [Lens.key(:users),
                   Lens.all,
                   Lens.key(:applications),
                   Lens.filter(&(&1.id == event.application_id)),
                   Lens.key(:alerting)], false)
  end

end
</code></pre>

We basically just dig through our application’s `state`{:.language-elixir} structure, finding the application we care about and we set its `alerting`{:.language-elixir} key to `false`{:.language-elixir}.

---- 

You may have noticed that we’re passing the entire system’s state into each `Reducer.apply`{:.language-elixir} function call. Does this mean that the entire system’s state needs to exist in memory at all times?

Yes!

[Inject Detect](http://www.injectdetect.com/) is storing application state entirely in memory as a [Memory Image](https://martinfowler.com/bliki/MemoryImage.html).

This means that [Inject Detect](http://www.injectdetect.com/) isn’t using a database to hold information about the application’s users, applications, and queries. The only thing being stored in the database is a stream of events.

Instead, [Inject Detect](http://www.injectdetect.com/) stores this stateful information in a long-lived [GenServer](https://hexdocs.pm/elixir/GenServer.html) process. Every time we grab the application’s current state (`InjectDetect.State.get`{:.language-elixir}), it queries the database for any events that have happened since the last `get`{:.language-elixir}, applies them using `Reducer.apply`{:.language-elixir}, and then returns the resulting state.

This was definitely the most radical decision I made while building [Inject Detect](http://www.injectdetect.com/), but in my experience so far, it has proven to be incredibly powerful.

---- 

I definitely made some adventurous design decisions when implementing [Inject Detect’s](http://www.injectdetect.com/) back-end. So far, I’m incredibly satisfied with my decisions to date.

I’m eager to see how they perform under continued development, load testing, and real-world usage.

I’m planning on writing more articles outlining and detailing these design choices in the future. If you’re particularly interested in any one aspect of this system, reach out and let me know!

## What’s Next?

While I didn’t mention it in this post, the Meteor plugin component of [Inject Detect](http://www.injectdetect.com/) is essentially finished. The back-end portion of the projects is a few loose ends and a few missing features away from being completed. The front-end of the application represents the bulk of the remaining work, but it’s moving along at a steady pace.

I expect to be ready for beta testing for a small number of real-world users in the next one or two months.

If you haven’t yet, be sure to subscribe to the [Inject Detect newsletter](http://www.injectdetect.com/#sign-up) to get official news on the release as soon as it’s ready!
