---
layout: post
title:  "Recurring Tasks in Elixir"
description: "Today we're digging into the details of how to program recurring tasks in Elixir using GenServers. Behold the Fruit Printer 🍉."
author: "Pete Corey"
date:   2017-07-17
tags: ["Elixir"]
---

Running periodic, or recurring tasks is a common undertaking for any web application. The stacks I’ve used in the past have all relied heavily on external databases and job queues to accomplish this task.

[Elixir](https://elixir-lang.org/) is a little different.

Thanks to Elixir’s [Erlang](https://www.erlang.org/) heritage and the power of OTP, we’re given the option to opt out of relying on an external database and manage our recurring tasks from entirely within our application.

## The Fruit Printer

Before we implement our recurring task runner, we should have a task that we want to repeat. Let’s pretend that we want to print out a random item from a list of `@fruits`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
@fruits ["🍉", "🍊", "🌽", "🍒", "🍇", "🌶"] # TODO: Is corn a fruit?

def print_fruit, do: IO.puts("fruit: #{Enum.fetch!(@fruits, :random.uniform(6))}")
</code></pre>

<video width="50%" style="margin-top: 3em; float: right;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/print_fruit.webm" autoplay loop controls></video>

To keep up with our voracious appetite for fruit, we want to print a fruit emoji to the console every two seconds. This is our recurring task.

How do we accomplish this?

The first thing we need to do is build our fruit printer into a GenServer process:

<pre class='language-elixir'><code class='language-elixir'>
defmodule HelloRecurring.FruitPrinter do
  use GenServer

  @fruits ["🍉", "🍊", "🌽", "🍒", "🍇", "🌶"] # TODO: Is corn a fruit?

  def start_link, do: GenServer.start_link(__MODULE__, [])

  def print_fruit, do: IO.puts("fruit: #{Enum.fetch!(@fruits, :rand.uniform(6))}")

end
</code></pre>

We’ll also want to supervise our new fruit printing operation:

<pre class='language-elixir'><code class='language-elixir'>
defmodule HelloRecurring do
  use Application

  import Supervisor.Spec

  def start(_type, _args) do
    Supervisor.start_link([worker(HelloRecurring.FruitPrinter, [])],
                          [strategy: :one_for_one, name: HelloRecurring.Supervisor])
  end

end
</code></pre>

Here we’re simply adding a `FruitPrinter`{:.language-elixir} as a child of our supervision tree and telling the supervisor to restart the `FruitPrinter`{:.language-elixir} child process if it ever dies for any reason.

At this point, our `FruitPrinter`{:.language-elixir} GenServer isn’t doing us much good. It’s running, but it’s not printing fruit. We can still manually print fruit by calling `FruitPrinter.print_fruit`{:.language-elixir}, but this would run the `print_fruit`{:.language-elixir} function within the current process, not the GenServer’s process.

Not good enough!

We want our `FruitPrinter`{:.language-elixir} to automatically print its own fruit every two seconds!

Our solution comes in the form of standard process messages. Let’s wire our `FruitPrinter`{:.language-elixir} up to `print_fruit`{:.language-elixir} whenever it receives a `:print_fruit`{:.language-elixir} message:

<pre class='language-elixir'><code class='language-elixir'>
def handle_info(:print_fruit, state) do
  print_fruit()
  {:noreply, state}
end
</code></pre>

Now we can send a `:print_fruit`{:.language-elixir} message to our `FruitPrinter`{:.language-elixir} process with either [`Process.send/3`{:.language-elixir}](https://hexdocs.pm/elixir/Process.html#send/3), or [`Process.send_after/4`{:.language-elixir}](https://hexdocs.pm/elixir/Process.html#send_after/4).

## Printing Fruit Forever and Ever

Sending delayed messages with `Process.send_after/4`{:.language-elixir} will be the key component to implementing our recurring task.

The general idea behind building out a recurring task runner in Elixir is that the task itself should be a GenServer process that schedules sending messages _to itself_ signaling it to carry out its task.

Putting that plan into action, once our `FruitPrinter`{:.language-elixir} is started, we can schedule a `:print_fruit`{:.language-elixir} message to be sent to itself in two seconds:

<pre class='language-elixir'><code class='language-elixir'>
def init(state) do
  schedule()
  {:ok, state}
end

def schedule, do: Process.send_after(self(), :print_fruit, 2000)
</code></pre>

It’s important to note that we need to schedule our `:print_fruit`{:.language-elixir} message in the GenServer’s `init`{:.language-elixir} callback, rather than the `start_link`{:.language-elixir} callback, because `start_link`{:.language-elixir} is called under the context of the supervising process. The `init`{:.language-elixir} callback is called once the process is created, and `self()`{:.language-elixir} will point to our `FruitPrinter`{:.language-elixir}, not the supervisor.

Next, we’ll add another call to `schedule()`{:.language-elixir} in our `handle_info`{:.language-elixir} callback. This will ensure that every handled `:print_fruit`{:.language-elixir} message will schedule another `:print_fruit`{:.language-elixir} message to be sent two seconds in the future:

<pre class='language-elixir'><code class='language-elixir'>
def handle_info(:print_fruit, state) do
  schedule()
  print_fruit()
  {:noreply, state}
end
</code></pre>

Spinning up the application, you’ll notice a constant stream of fruit being printed at a steady rate of once every two seconds.

<video width="100%" style="" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/fruit_printer.webm" autoplay loop controls></video>

Delicious victory.

{% include newsletter.html %}

## Even When Things Go Wrong

Astute readers may have noticed a bug in our initial `print_fruit`{:.language-elixir} function.

We’re using `:rand.uniform(6)`{:.language-elixir} to pick a random index out of our list of `@fruits`{:.language-elixir}. Unfortunately, `:rand.uniform/1`{:.language-elixir} produces a random number between `1`{:.language-elixir} and `n`{:.language-elixir}, not `0`{:.language-elixir} and `n - 1`{:.language-elixir}, as we assumed. This means that any given call to `print_fruit`{:.language-elixir} has a one in six chance of crashing with an `out of bounds error`{:.language-elixir}.

Whoops!

Interestingly, this bug hasn’t affected our recurring task. If we run our application for long enough to see this error raise its head, we’ll notice that two seconds after our `FruitPrinter`{:.language-elixir} process crashes, it’s up and running again trying to print another random fruit.

<video width="100%" style="" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/fruit_problems.webm" autoplay loop controls></video>

Because our `FruitPrinter`{:.language-elixir} is being supervised, any failures that result in a crash of the process will cause the supervising process to create a new `FruitPrinter`{:.language-elixir} in its place. This new `FruitPrinter`{:.language-elixir} will schedule a `:print_fruit`{:.language-elixir} message in its `init`{:.language-elixir} callback, and will continue working as expected.

Back to the problem at hand, the proper way to implement our `print_fruit`{:.language-elixir} function would be with Elixir’s [`Enum.random/1`{:.language-elixir} function](https://hexdocs.pm/elixir/Enum.html#random/1):

<pre class='language-elixir'><code class='language-elixir'>
def print_fruit, do: IO.puts("fruit: #{Enum.random(@fruits)}")
</code></pre>

That’s better. We certainly don’t want bugs in our fruit.

## Final Thoughts

While this type of entirely in-application recurring process may not be a solution for every problem out there, it’s a powerful option in the Elixir environment.

The robustness given to us by the concept of supervisors and the “let it crash” mentality gives us a clear advantage over similar patterns in other languages (i.e. `setTimeout`{:.language-elixir} in [Node.js](https://nodejs.org/en/)).

Before you go reaching for an external tool, I’ve found that it’s often beneficial to ask yourself, “can I do this with just Elixir?”
