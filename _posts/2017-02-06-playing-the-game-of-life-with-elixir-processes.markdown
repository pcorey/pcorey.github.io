---
layout: post
title:  "Playing the Game of Life with Elixir Processes"
description: "Explore the concept of life and death with Elixir processes by implementing Conway's Game of Life where each cell is a living Elixir process."
author: "Pete Corey"
date:   2017-02-06
tags: ["Elixir", "Game of Life", "Experiments"]
---

I’ve always been fascinated with [Conway’s Game of Life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life), and I’ve always wondered what the Game of Life is like from an individual cell’s perspective.

The constant threat of dying of loneliness, three person mating rituals, and the potential to achieve immortality! What a strange and beautiful world…

In this article, we’ll use [Elixir processes](http://elixir-lang.org/getting-started/processes.html), [supervision trees](http://elixir-lang.org/getting-started/mix-otp/supervisor-and-application.html), and the [Registry](https://hexdocs.pm/elixir/master/Registry.html) to implement Conway’s Game of Life from this interesting perspective.

## The Game of Life

Most basic implementations of the Game of Life represent the universe as a large two-dimensional grid. Each spot in the grid is either “alive”, or “dead”.

<img class="pull-left" style="width: 21%; margin: 0 1em 0em 0;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/gol-grid.png" title="A typical Game of Life representation.">

Once every “tick”, the simulation will loop over each cell in the universe. If the cell is dead and has exactly three living neighbors, it will be born into the next generation. If the cell is living and has two or three neighbors, it will live on during the next generation. Otherwise, the cell will die or remain dead.

When let loose on an initial configuration of living cells, the continuous application of these rules can create an incredibly complex, seemingly organic system.

## The Architecture

Rather than following the standard approach of using a finite two-dimensional array to represent our universe, let’s flip this problem upside down.

Let’s represent each living cell as an active Elixir process living somewhere on on our server. Each cell process will hold it’s location as an `{x, y}`{:.language-elixir} tuple as its state.

We’ll need some way of finding a cell’s neighbors, which means we’ll need to be able to look up a cell based on its given `{x, y}`{:.language-elixir} location. This sounds like a classic [process discovery problem](https://www.youtube.com/watch?v=y_b6RTes83c) and it gives us an excellent excuse to try out [Elixir’s new `Registry`{:.language-elixir} module](https://hexdocs.pm/elixir/master/Registry.html).

Our cells will be fairly independent; they’ll manage their own position, and determine when it’s time to die or give birth to another cell. However, we’ll need some additional outside process to tell each cell in the universe when to “tick”. We’ll call this controller process the “Universe”.

> “Life calls the tune, we dance.”

Given those basic components, we can draw up a basic dependency tree of our application. We’ll need a top level supervisor managing our universe and cell registry, along with a supervisor to dynamically manage each cell process.

## The Supervisors

Before we dive into the meat of our application, let’s take a quick look at how we’ll implement our application’s supervisors.

Our top level supervisor will be called `Universe.Supervisor`{:.language-elixir}. It simply spins up a single instance of the `Universe`{:.language-elixir} worker, the `Cell.Supervisor`{:.language-elixir} supervisor, and the `Cell.Registry`{:.language-elixir} which is an instance of Elixir’s `Registry`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
children = [
  worker(Universe, []),
  supervisor(Cell.Supervisor, []),
  supervisor(Registry, [:unique, Cell.Registry])
]
supervise(children, strategy: :one_for_one)
</code></pre>

Notice were’s using a `:one_for_one`{:.language-elixir} supervision strategy here. This means that all of our children will be immediately started, and if a child ever fails, that process (and only that process) will be restarted.

---- 

Our `Cell.Supervisor`{:.language-elixir}, the supervisor that manages all dynamically added cell processes, is a little more interesting.

Instead of immediately spinning up child processes, we create a template describing the the type of process we’ll be supervising in the future:

<pre class='language-elixir'><code class='language-elixir'>
children = [
  worker(Cell, [])
]
supervise(children, strategy: :simple_one_for_one, restart: :transient)
</code></pre>

<img class="pull-right" style="width: 40%; margin: 1em 0 1em 1em;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/gol-structure.png" title="A high level view of our application's structure.">

The [`:simple_one_for_one`{:.language-elixir} strategy](https://hexdocs.pm/elixir/Supervisor.html#module-simple-one-for-one) informs the system that we’ll be dynamically adding and removing children from this supervision tree. Those children will be `Cell`{:.language-elixir} worker processes.

The `:transient`{:.language-elixir} restart strategy means that if the `Cell`{:.language-elixir} process is killed with a `:normal`{:.language-elixir} or `:shutdown`{:.language-elixir} message, it will not be restarted. However, if the `Cell`{:.language-elixir} processes experiences a problem and dies with any other message, it will be restarted by the `Cell.Supervisor`{:.language-elixir}.

---- 

Our `Cell.Supervisor`{:.language-elixir} module also has a function called `children`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def children do
  Cell.Supervisor
  |> Supervisor.which_children
  |> Enum.map(fn
    {_, pid, _, _} -> pid
  end)
end
</code></pre>

The `children`{:.language-elixir} function returns all living cell processes currently being supervised by `Cell.Supervisor`{:.language-elixir}. This will be useful when we need to tick each cell in our `Universe`{:.language-elixir} module.

## The Universe

Our `Universe`{:.language-elixir} module is the [driving force](https://en.wikipedia.org/wiki/Tao) in our Game of Life simulation. It’s literally what makes the cells tick.

If we had to tell `Universe`{:.language-elixir} what to do in plain English, we might say:

> Get all living cells. Asynchronously call tick on each one. Wait for all of the ticks to finish. Kill, or reap, all cells that will die from loneliness, and create, or sow, all of the cells that will be born.

Now let’s compare those instructions with our the code in our `tick`{:.language-elixir} handler:

<pre class='language-elixir'><code class='language-elixir'>
get_cells()
|> tick_each_process
|> wait_for_ticks
|> reduce_ticks
|> reap_and_sow
</code></pre>

Perfect. I might even go so far as to say that _the Elixir code is more readable than plain English._

As we dig into each of these functions, we’ll find that they’re still very descriptive and understandable. The `get_cells`{:.language-elixir} function simply calls the `Cell.Supervisor.children`{:.language-elixir} function we defined earlier:

<pre class='language-elixir'><code class='language-elixir'>
defp get_cells, do: Cell.Supervisor.children
</code></pre>

The `tick_each_process`{:.language-elixir} function maps over each cell process and calls `Cell.tick`{:.language-elixir} as an [asynchronous `Task`{:.language-elixir}](https://hexdocs.pm/elixir/Task.html):

<pre class='language-elixir'><code class='language-elixir'>
defp tick_each_process(processes) do
  map(processes, &(Task.async(fn -> Cell.tick(&1) end)))
end
</code></pre>

Similarly, `wait_for_ticks`{:.language-elixir} maps over each asynchronous process, waiting for a reply:

<pre class='language-elixir'><code class='language-elixir'>
defp wait_for_ticks(asyncs) do
  map(asyncs, &Task.await/1)
end
</code></pre>

`reduce_ticks`{:.language-elixir}, along with the helper function `accumulate_ticks`{:.language-elixir}, reduces the response from each call to `Cell.tick`{:.language-elixir} into a tuple holding a list of cells to be reaped, and a list of cells to be sown:

<pre class='language-elixir'><code class='language-elixir'>
defp reduce_ticks(ticks), do: reduce(ticks, {[], []}, &accumulate_ticks/2)

defp accumulate_ticks({reap, sow}, {acc_reap, acc_sow}) do
  {acc_reap ++ reap, acc_sow ++ sow}
end
</code></pre>

Lastly, `reap_and_sow`{:.language-elixir} does exactly that: it kills cells marked for death, and create cells queued up to be born:

<pre class='language-elixir'><code class='language-elixir'>
defp reap_and_sow({to_reap, to_sow}) do
  map(to_reap, &Cell.reap/1)
  map(to_sow,  &Cell.sow/1)
end
</code></pre>

Take a look at the entire [`Universe`{:.language-elixir} module on Github](https://github.com/pcorey/life/blob/master/lib/universe.ex).

## The Cell

We’ve seen that while `Universe`{:.language-elixir} is the driver of our simulation, it defers most of the computational work and decision making to individual cells. Let’s dive into our `Cell`{:.language-elixir} module and see what’s going on.

The `Cell.reap`{:.language-elixir} and `Cell.sow`{:.language-elixir} methods we saw in `Universe`{:.language-elixir} are fairly straight-forward:

The `reap`{:.language-elixir} function simply calls `Supervisor.terminate_child`{:.language-elixir} to remove the given cell `process`{:.language-elixir} from the `Cell.Supervisor`{:.language-elixir} tree.

<pre class='language-elixir'><code class='language-elixir'>
def reap(process) do
  Supervisor.terminate_child(Cell.Supervisor, process)
end
</code></pre>

Similarly, `sow`{:.language-elixir} calls `Supervisor.start_child`{:.language-elixir} to create a new process under the `Cell.Supervisor`{:.language-elixir} tree, passing in the cell’s `position`{:.language-elixir} as its initial state:

<pre class='language-elixir'><code class='language-elixir'>
def sow(position) do
  Supervisor.start_child(Cell.Supervisor, [position])
end
</code></pre>

---- 

The real magic of our Game of Life simulation happens in the cell’s `tick`{:.language-elixir} function.

During each tick, a cell needs to generate a list of cells to reap (which will either be an empty list, or a list containing only itself), and a list of cells to sow.

Generating the `to_reap`{:.language-elixir} list is easy enough:

<pre class='language-elixir'><code class='language-elixir'>
to_reap = position
|> do_count_neighbors
|> case do
     2 -> []
     3 -> []
     _ -> [self()]
   end
</code></pre>

We count the number of living neighbors around the cell. If the cell has two or three neighbors, it lives on to the next generation (`to_reap = []`{:.language-elixir}). Otherwise, it dies from loneliness (`to_reap = [self()]`{:.language-elixir}).

The `do_count_neighbors`{:.language-elixir} functions does what you might expect. Given a cell’s `position`{:.language-elixir}, it finds all eight neighboring positions, filters out all dead neighbors, and then returns the length of the resulting list of living neighbors:

<pre class='language-elixir'><code class='language-elixir'>
defp do_count_neighbors(position) do
  position
  |> neighboring_positions
  |> keep_live
  |> length
end
</code></pre>

---- 

After we’ve generated our `to_reap`{:.language-elixir} list, our cell needs to generate a list of cells to be born.

From an individual cell’s perspective, this is a process of looking for any dead (unoccupied) neighboring positions and filtering out those that do not have enough living neighbors to be born into the next generation:

<pre class='language-elixir'><code class='language-elixir'>
to_sow = position
|> neighboring_positions
|> keep_dead
|> keep_valid_children
</code></pre>

The `keep_valid_children`{:.language-elixir} function goes through the provided list of unoccupied `positions`{:.language-elixir}, filtering out positions with a neighbor count not equal to three:

<pre class='language-elixir'><code class='language-elixir'>
defp keep_valid_children(positions) do
  positions
  |> filter(&(do_count_neighbors(&1) == 3))
end
</code></pre>

This means that only dead cells with exactly three neighbors (one of which is the current ticking cell) will be born into the next generation.

---- 

Now that we’ve generated out `to_reap`{:.language-elixir} and `to_sow`{:.language-elixir} lists, our cell process is finished ticking.

We can send our reply back to the universe, being sure to preserve `position`{:.language-elixir} as our current state:

<pre class='language-elixir'><code class='language-elixir'>
{:reply, {to_reap, to_sow}, position}
</code></pre>

Take a look at the entire [`Cell`{:.language-elixir} module on Github](https://github.com/pcorey/life/blob/master/lib/cell.ex).

## Finding Neighbors with Registry

When generating both the `to_reap`{:.language-elixir} and `to_sow`{:.language-elixir} lists, cells were required to determine if neighboring cells were living or dead.

This was done with the `keep_live`{:.language-elixir} and `keep_dead`{:.language-elixir} functions, respectively:

<pre class='language-elixir'><code class='language-elixir'>
defp keep_live(positions), do: filter(positions, &(lookup(&1) != nil))
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
defp keep_dead(positions), do: filter(positions, &(lookup(&1) == nil))
</code></pre>

The key here is that we’re calling `lookup`{:.language-elixir} on each position. The `lookup`{:.language-elixir} function translates a cell’s position into a PID for that cell’s active process.

<pre class='language-elixir'><code class='language-elixir'>
def lookup(position) do
  Cell.Registry
  |> Registry.lookup(position)
  |> Enum.map(fn
    {pid, _valid} -> pid
    nil -> nil
  end)
  |> Enum.filter(&Process.alive?/1)
  |> List.first
end
</code></pre>

Here is where the Registry shines.

We’re using `Registry.lookup`{:.language-elixir} to find a process in our `Cell.Registry`{:.language-elixir} based on a given `{x, y}`{:.language-elixir} position.

`Registry.lookup`{:.language-elixir} will give us a list of `{pid, value}`{:.language-elixir} tuples (or an empty list). Since we only want the `pid`{:.language-elixir}, we can pull it out of the tuple.

Next, we filter the resulting PIDs with `Process.alive?`{:.language-elixir}. After reaping a cell with `Supervisor.terminate_child`{:.language-elixir}, the cell’s process will be removed from the `Cell.Supervisor`{:.language-elixir} supervisor, but the process may not be fully removed from the `Cell.Registry`{:.language-elixir}.

This means our cells can potentially interact with “ghost neighbors”; neighboring cells who are in the process of dying, but are not quite completely dead.

Adding a `Process.alive?`{:.language-elixir} filter prevents our cell from interacting with this ghost neighbors (and prevents a very frustrating, subtle bug).

## Running the Simulation

Now that we’ve built our process-driven simulation, it’s time to test it out.

We can fire up our Game of Life environment by starting an interactive Elixir shell:

<pre class='language-elixir'><code class='language-elixir'>
iex -S mix
</code></pre>

Next, let’s spawn three cells in a row. This will create a [“blinker” pattern](https://en.wikipedia.org/wiki/Conway's_Game_of_Life#Examples_of_patterns):

<pre class='language-elixir'><code class='language-elixir'>
Cell.sow({0, 0})
Cell.sow({1, 0})
Cell.sow({2, 0})
</code></pre>

Now let’s fire up [Erlang’s observer](http://erlang.org/doc/apps/observer/observer_ug.html) to get a high level view of our universe:

<pre class='language-elixir'><code class='language-elixir'>
:observer.start
</code></pre>

We can see the three cells we just added to the universe below the `Cell.Supervisor`{:.language-elixir} supervision tree. Also notice that those processes are linked to the `Cell.Registry`{:.language-elixir} process.

<img style="display: block; width: 100%; margin: 2em auto;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/gol-observer-structure.png" title="Our application structure as it exists in the Erlang observer.">

To test out our `Cell.Supervisor`{:.language-elixir}, let’s manually kill one of our cell processes. Send a `kill`{:.language-elixir} exit message to one of the cells, and notice that after the process dies, another process immediately takes its place.

<video width="100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/GoL+-+Resilient.webm" controls></video>

This means that any unintended errors in a `Cell`{:.language-elixir} process won’t bring down our entire life simulation. Awesome!

---- 

Now that our initial conditions are set up, let’s tick our universe:

<pre class='language-elixir'><code class='language-elixir'>
Universe.tick
</code></pre>

Switching back to our observer, we can see that two of the three cell processes have been removed and two new processes have been added. If we look at the state of these new processes, we’ll see that they live at positions `{1, 1}`{:.language-elixir}, and `{1, -1}`{:.language-elixir}, as expected.

If we tick our universe again, we would see that those two processes would be killed, and two new processes would be added in their place. Their positions would oscillate back to `{0, 0}`{:.language-elixir} and `{2, 0}`{:.language-elixir}. Notice that the process for the cell living at position `{0, 1}`{:.language-elixir} is still alive and well.

We can tick our universe as many times as we want:

<pre class='language-elixir'><code class='language-elixir'>
1..10_000
|> Enum.map(fn n -> Universe.tick end)
</code></pre>

After all of the ticks are processed, we can switch back to our observer and see that we still have three living cells, as expected.

<img class="pull-right" style="width: 20%; margin: 0 0 0em 1em;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/gol-observer-cells.png" title="Cells living as processes in the Erlang observer.">

Let’s restart our universe and try again with a more interesting pattern. Let’s try a [“diehard” pattern](http://conwaylife.appspot.com/pattern/diehard), which is a [methuselah](https://en.wikipedia.org/wiki/Methuselah_(cellular_automaton)) that dies after 130 generations:

<pre class='language-elixir'><code class='language-elixir'>
[
                                                  {6, 2},
  {0, 1}, {1, 1},
          {1, 0},                         {5, 0}, {6, 0}, {7, 0},
]
|> Enum.map(&Cell.sow/1)
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
1..130
|> Enum.map(fn
              n -> Universe.tick
                   :timer.sleep(500)
            end)
</code></pre>

If you watch your observer as it slowly runs through the each tick, you’ll see that the number of active processes skyrockets and then eventually fades to zero.

<video width="100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/GoL+-+Diehard.webm" controls></video>

## Final Thoughts

Truth be told, the goal of this project was to get deeper hands-on experience with Elixir processes, supervision trees, and the new Registry functionality.

At the end of the day it was an excellent experience. I learned quite a few important lessons the hard way. If you’re interested in learning Elixir or how to “think in processes”, I highly recommend you take on a similar project.

While this Game of Life implementation isn’t the fastest or most efficient, it does come with its interesting benefits.

It’s incredibly resilient. Every cell process, and the universe process can fail and restart seamlessly. Catastrophic failure can only take place if either the `Universe.Supervisor`{:.language-elixir}, or the `Cell.Supervisor`{:.language-elixir} fail, which is unlikely to happen.

<img style="display: block; width: 100%; margin: 2em auto;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/gol-utilization.png" title="Four Erlang schedulers running our Game of Life simulation on a quad-core processor.">

It’s concurrent and parallel out of the box. Our asynchronous calls to `Cell.tick`{:.language-elixir} are distributed across every CPU on our node. The Erlang VM automatically takes full advantage of its environment and orchestrates the running of these parallel processes.

---- 

As far as future work for this project, I have lots of ideas.

I’d like to give cells more independence, and remove the need for the `Universe`{:.language-elixir} driver module. I imagine each cell automatically trying to progress into future generations as soon as all of its neighboring cells have all necessary information to do so.

I’d also like to spread the simulation across multiple nodes. I imagine a massive Game of Life simulation running on dozens of EC2 instances, orchestrated through an [edeliver powered release](http://www.east5th.co/blog/2017/01/16/simplifying-elixir-releases-with-edeliver/).

Lastly, I’d like to give the simulation a simple web-based user interface, and potentially the ability to run multiple simulations at once.

If you’d like to take this project out for a test run, or get a better look at the source, be sure to [check it out on Github](https://github.com/pcorey/life)!
