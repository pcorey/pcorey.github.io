---
layout: post
title:  "Rendering Life on a Canvas with Phoenix Channels"
description: "Watch Conway's Game of Life come to life on an HTML5 canvas using an Elixir umbrella application and Phoenix channels."
author: "Pete Corey"
date:   2017-02-20
tags: ["Elixir", "Phoenix", "Channels", "Game of Life", "Experiments"]
---

In a [recent article](http://www.east5th.co/blog/2017/02/06/playing-the-game-of-life-with-elixir-processes/), we wrote an Elixir application to play [Conway’s Game of Life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life) with Elixir processes. While this was an excellent exercise in “thinking with processes”, the final result wasn’t visually impressive.

Usually when you implement the Game of Life, you expect some kind of graphical interface to view the results of the simulation.

Let’s fix that shortcoming by building out a Phoenix based front-end for our Game of Life application and render our living processes to the screen using an HTML5 canvas.

## Creating an Umbrella Project

Our game of life simulation already exists as a server-side Elixir application. We somehow need to painlessly incorporate Phoenix into our application stack so we can build out our web-based front-end.

Thankfully, Elixir [umbrella projects](https://elixirschool.com/lessons/advanced/umbrella-projects/) let us do exactly this.

Using an umbrella project, we’ll be able to run our life application and a Phoenix server simultaneously in a single Elixir instance. Not only that, but these two applications will be able to seamlessly reference and communicate with each other.

To turn our Life project into an umbrella project, we’ll create a new folder in the root of our project called `apps/life/`{:.language-elixir}, and move everything from our Life project into that folder.

Next, we’ll recreate the `mix.exs`{:.language-elixir} file and the `config`{:.language-elixir} folder and corresponding files needed by our umbrella application in our project root. If everything has gone well, we’ll still be able to run our tests from our project root:

<pre class='language-elixir'><code class='language-elixir'>
mix test
</code></pre>

And we can still run our life application through the project root:

<pre class='language-elixir'><code class='language-elixir'>
iex -S mix
</code></pre>

Now we can go into our new `apps`{:.language-elixir} folder and create a new Phoenix application:

<pre class='language-elixir'><code class='language-elixir'>
cd apps/
mix phoenix.new interface --no-ecto
</code></pre>

Notice that we’re forgoing Ecto here. If you remember from last time, our Game of Life simulation lives entirely in memory, so we won’t need a persistence layer.

Once we’ve created our Phoenix application, our umbrella project’s folder structure should look something like this:

<pre class='language-elixir'><code class='language-elixir'>
.
├── README.md
├── apps
│   ├── interface
│   │   └── ...
│   └── life
│       └── ...
├── config
│   └── config.exs
└── mix.exs

</code></pre>

Notice that `interface`{:.language-elixir} and `life`{:.language-elixir} are complete, stand-alone Elixir applications. By organizing them within an umbrella project, we can coordinate and run them all within a single Elixir environment.

To make sure that everything is working correctly, let’s start our project with an interactive shell, and fire up the Erlang observer:

<pre class='language-elixir'><code class='language-elixir'>
iex -S mix phoenix.server
:observer.start
</code></pre>

If we navigate to `http://localhost:4000/`{:.language-http}, we should see our Phoenix framework hello world page. Not only that, but the observer shows us that in addition to our Phoenix application, our life application is alive and kicking on the server as well.

<img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/gol-umbrella.png" style="width: 100%; margin: 1em auto; display: block;" title="Our umbrella project as seen from Observer">

## Channeling Life

Now that our Phoenix server is set up, we can get to the interesting bits of the project.

<video style="width: 50%; float: right;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/r-pimento.webm" autoplay loop></video>

If you remember from last time, every time we call `Universe.tick`{:.language-elixir}, our Game of Life simulation progresses to the next generation. We’ll be using [Phoenix Channels](http://www.phoenixframework.org/docs/channels) to receive “tick” requests from the client and to broadcast cell information to all interested users.

Let’s start the process of wiring up our socket communication by registering a `"life"`{:.language-elixir} channel in our `UserSocket`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
channel "life", Interface.LifeChannel
</code></pre>

Within our `Interface.LifeChannel`{:.language-elixir} module, we’ll define a join handler:

<pre class='language-elixir'><code class='language-elixir'>
def join("life", _, socket) do
  ...
end
</code></pre>

In our join handler, we’ll do several things. First, we’ll “restart” our simulation by clearing out any currently living cells:

<pre class='language-elixir'><code class='language-elixir'>
Cell.Supervisor.children
|> Enum.map(&Cell.reap/1)
</code></pre>

Next, we’ll spawn our initial cells. In this case, let’s spawn a [diehard methuselah](http://conwaylife.appspot.com/pattern/diehard) at the coordinates `{20, 20}`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
  Pattern.diehard(20, 20)
  |> Enum.map(&Cell.sow/1)
</code></pre>

Lastly, we’ll return a list positions of all living cells in our system:

<pre class='language-elixir'><code class='language-elixir'>
  {:ok, %{positions: Cell.Supervisor.positions}, socket}
</code></pre>

`Cell.Supervisor.positions`{:.language-elixir} is a helper function written specifically for our interface. It returns the positions of all living cells in a list of structs:

<pre class='language-elixir'><code class='language-elixir'>
def positions do
  children()
  |> Enum.map(&Cell.position/1)
  |> Enum.map(fn {x, y} -> %{x: x, y: y} end)
end
</code></pre>

---- 

Now that our join handler is finished up, we need to write our “tick” handler:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("tick", _, socket) do
  ...
end
</code></pre>

In our tick handler, we’ll call `Universe.tick`{:.language-elixir} to run our simulation through to the next generation:

<pre class='language-elixir'><code class='language-elixir'>
Universe.tick
</code></pre>

Next, we’ll broadcast the positions of all living cells over our socket:

<pre class='language-elixir'><code class='language-elixir'>
broadcast!(socket, "tick", %{positions: Cell.Supervisor.positions})
</code></pre>

And finally, we return from our tick handler with no reply:

<pre class='language-elixir'><code class='language-elixir'>
{:noreply, socket}
</code></pre>

## Rendering Life

Now that our `"life"`{:.language-elixir} channel is wired up to our Game of Life simulator, we can build the front-end pieces of our interface.

The first thing we’ll do is strip down our `index.html.eex`{:.language-elixir} template and replace the markup in our `app.html.eex`{:.language-elixir} template with a simple canvas:

<pre class='language-markup'><code class='language-markup'>
&lt;canvas id="canvas">&lt;/canvas>
</code></pre>

Next, we’ll start working on our `app.js`{:.language-elixir} file.

We’ll need to set up our canvas context and prepare it for rendering. We want our canvas to fill the entire browser window, so we’ll do some hacking with `backingStorePixelRatio`{:.language-javascript} and `devicePixelRatio`{:.language-javascript} to set the scale, height and width of our canvas equal to `window.innerWidth`{:.language-javascript} and `window.innerHeight`{:.language-javascript} respectively. Check out [the source](https://github.com/pcorey/life/blob/canvas/apps/interface/web/static/js/app.js#L7-L28) for specifics.

Now we’ll need a render function. Our render function will be called with an array of cell position objects. Its job is to clear the screen of the last render and draw a square at every cell’s given `{x, y}`{:.language-javascript} position:

<pre class='language-javascript'><code class='language-javascript'>
function render(positions) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    positions.forEach(({x, y}) => {
        context.fillRect(x * scale, y * scale, scale, scale);
    });
}
</code></pre>

---- 

Now that our canvas is set up and ready to render, we need to open a channel to our Phoenix server.

We’ll start by establishing a socket connection:

<pre class='language-javascript'><code class='language-javascript'>
let socket = new Socket("/socket");
socket.connect();
</code></pre>

Next, we’ll set up to our `"life"`{:.language-javascript} channel:

<pre class='language-javascript'><code class='language-javascript'>
let channel = socket.channel("life", {});
</code></pre>

When we join the channel, we’ll wait for a successful response. This response will contain the initial set of living cells from the server. We’ll pass those cells’ positions into our `render`{:.language-javascript} function:

<pre class='language-javascript'><code class='language-javascript'>
channel.join()
  .receive("ok", cells => render(cells.positions));
</code></pre>

We’ll also periodically request ticks from the server:

<pre class='language-javascript'><code class='language-javascript'>
setTimeout(function tick() {
  channel.push("tick");
  setTimeout(tick, 100);
}, 100);
</code></pre>

<img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/gol-animated.gif" style="width: 45%; margin: 0 0 0 1em; display: block; float:right;" title="An animation of the Game of Life">

Every tick will result in a `"tick"`{:.language-javascript} event being broadcast down to our client. We should set up a handler for this event:

<pre class='language-javascript'><code class='language-javascript'>
channel.on("tick", cells => {
  render(cells.positions);
});
</code></pre>

Once again, we simple pass the cells’ `positions`{:.language-javascript} into our `render`{:.language-javascript} function.

That’s it! After loading up our Phoenix application, we should see life unfold before our eyes!

## Phoenix as an Afterthought

While Conway’s Game of Life is interesting, and “thinking in processes” is an important concept to grasp, there’s a bigger point here that I want to drive home.

In our [first article](http://www.east5th.co/blog/2017/02/06/playing-the-game-of-life-with-elixir-processes/), we implemented our Game of Life simulation as a standalone, vanilla Elixir application. It wasn’t until later that we decided to bring the Phoenix framework into the picture.

___Using Phoenix was an afterthought, not a driving force, in the creation of our application.___

Should we choose to, we could easily swap out Phoenix with another front-end framework with no fears about effecting the core domain of the project.

---- 

Throughout my career as a software developer I’ve worked on many software projects. Without fail, the most painful of these projects have been the those tightly coupled to their surrounding frameworks or libraries.

Loosely coupled applications, or applications with a clear distinction between what is core application code and what is _everything else_, are easier to understand, test, and maintain.

Some languages and frameworks lend themselves more easily to this kind of decoupling. Thankfully, Elixir’s process model, the concept of Elixir “applications”, and  umbrella projects make this kind of decoupling a walk in the park.

Taken this as a reminder to build your framework around your application. ___Don’t build your application around your framework.___

