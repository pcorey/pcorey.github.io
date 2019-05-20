---
layout: post
title:  "Minimum Viable Phoenix"
description: "Let's walk through the process of building a dead simple Phoenix application from the ground up."
author: "Pete Corey"
date:   2019-05-20
tags: ["Literate Commits", "Elixir", "Phoenix"]
related: []
repo: "https://github.com/pcorey/minimum_viable_phoenix"
literate: true
---


## [Starting at the Beginning]({{page.repo}}/commit/6f8c9d84ea05d8dd4e137ae6133db4ad06fb6498)

Phoenix ships with quite a few bells and whistles. Whenever you fire up `mix phx.new`{:.language-elixir} to create a new web application, fourty six files are created and spread across thirty directories!

This can be overwhelming to developers new to Phoenix.

To build a better understanding of the framework and how all of its moving pieces interact, let’s strip Phoenix down to its bare bones. Let’s start from zero and slowly build up to a __minimum viable Phoenix application__.

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">.gitignore</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
+.DS_Store
</code></pre>



## [Minimum Viable Elixir]({{page.repo}}/commit/4e2e319595415ff66fdc18679547ac49247979e7)

Starting at the beginning, we need to recognize that all Phoenix applications are Elixir applications. Our first step in the process of building a minimum viable Phoenix application is really to build a minimum viable Elixir application.

Interestingly, the simplest possible Elixir application is simply an `*.ex`{:.language-elixir} file that contains some source code. To set ourselves up for success later, let’s place our code in `lib/minimal/application.ex`{:.language-elixir}. We’ll start by simply printing `"Hello."`{:.language-elixir} to the console.

<pre class='language-elixir'><code class='language-elixir'>
IO.puts("Hello.")
</code></pre>

Surprisingly, we can execute our newly written Elixir application by compiling it:

<pre class='language-elixir'><code class='language-elixir'>
➜ elixirc lib/minimal.ex
Hello.
</code></pre>

This [confused me at first](https://twitter.com/petecorey/status/1122629600800989184), but it was explained to me that in the Elixir world, [compilation is also evaluation](https://stackoverflow.com/a/41235949).

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal/application.ex</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
+IO.puts("Hello.")
</code></pre>



## [Generating Artifacts]({{page.repo}}/commit/f36703771756c1d149a58584e242c0e4d6ce607e)

While our execution-by-compilation works, it’s really nothing more than an on-the-fly evaluation. We’re not generating any compilation artifacts that can be re-used later, or deployed elsewhere.

We can fix that by moving our code into a module. Once we compile our newly modularized `application.ex`{:.language-elixir}, a new `Elixir.Minimal.Application.beam`{:.language-elixir} file will appear in the root of our project.

We can run our compiled Elixir program by running `elixir`{:.language-elixir} in the directory that contains our `*.beam`{:.language-elixir} file and specifying an expression to evaluate using the `-e`{:.language-elixir} flag:

<pre class='language-elixir'><code class='language-elixir'>
➜ elixir -e "Minimal.Application.start()"
Hello.
</code></pre>

Similarly, we could spin up an interactive shell (`iex`{:.language-elixir}) in the same directory and evaluate the expression ourselves:

<pre class='language-elixir'><code class='language-elixir'>
iex(1)> Minimal.Application.start()
Hello.
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">.gitignore</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
+*.beam
.DS_Store
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal/application.ex</p>
 <pre class='language-elixirDiff'><code class='language-elixirDiff'>
-IO.puts("Hello.")
+defmodule Minimal.Application do
+  def start do
+    IO.puts("Hello.")
+  end
+end
</code></pre>



## [Incorporating Mix]({{page.repo}}/commit/7c2fcd8300e13f04dd0c20a9ae2153b9c21ecebe)

This is great, but manually managing our `*.beam`{:.language-elixir} files and bootstrap expressions is a little cumbersome. Not to mention the fact that we haven’t even started working with dependencies yet.

Let’s make our lives easier by incorporating [the Mix build tool](https://hexdocs.pm/mix/Mix.html) into our application development process.

We can do that by creating a `mix.exs`{:.language-elixir} Elixir script file in the root of our project that defines a module that uses `Mix.Project`{:.language-elixir} and describes our application. We write a `project/0`{:.language-elixir} callback in our new `MixProject`{:.language-elixir} module who’s only requirement is to return our application’s name (`:minimal`{:.language-elixir}) and version (`"0.1.0"`{:.language-elixir}).

<pre class='language-elixir'><code class='language-elixir'>
def project do
  [
    app: :minimal,
    version: "0.1.0"
  ]
end
</code></pre>

While Mix only requires that we return the `:app`{:.language-elixir} and `:version`{:.language-elixir} configuration values, it’s worth taking a look at the other configuration options available to us, especially [`:elixir`{:.language-elixir} and `:start_permanent`{:.language-elixir}](https://hexdocs.pm/mix/Mix.html), [`:build_path`{:.language-elixir}](https://hexdocs.pm/mix/Mix.Tasks.Compile.html#module-configuration), [`:elixirc_paths`{:.language-elixir}](https://hexdocs.pm/mix/Mix.Tasks.Compile.Elixir.html#module-configuration), and others.

Next, we need to specify an `application/0`{:.language-elixir} callback in our `MixProject`{:.language-elixir} module that tells Mix which module we want to run when our application fires up.

<pre class='language-elixir'><code class='language-elixir'>
def application do
  [
    mod: {Minimal.Application, []}
  ]
end
</code></pre>

Here we’re pointing it to the `Minimal.Application`{:.language-elixir} module we wrote previously.

During the normal application startup process, Elixir will call the `start/2`{:.language-elixir} function of the module we specify with `:normal`{:.language-elixir} as the first argument, and whatever we specify (`[]`{:.language-elixir} in this case) as the second. With that in mind, let’s modify our `Minimal.Application.start/2`{:.language-elixir} function to accept those parameters:

<pre class='language-elixir'><code class='language-elixir'>
def start(:normal, []) do
  IO.puts("Hello.")
  {:ok, self()}
end
</code></pre>

Notice that we also changed the return value of `start/2`{:.language-elixir} to be an `:ok`{:.language-elixir} tuple who’s second value is a PID. Normally, an application would spin up a supervisor process as its first act of life and return its PID. We’re not doing that yet, so we simply return the current process’ PID.

Once these changes are done, we can run our application with `mix`{:.language-elixir} or `mix run`{:.language-elixir}, or fire up an interactive elixir shell with `iex -S mix`{:.language-elixir}. No bootstrap expression required!


<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">.gitignore</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
 *.beam
-.DS_Store
+.DS_Store
+/_build/
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal/application.ex</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
 defmodule Minimal.Application do
-  def start do
+  def start(:normal, []) do
     IO.puts("Hello.")
+    {:ok, self()}
   end
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">mix.exs</p>
   <pre class='language-elixirDiff'><code class='language-elixirDiff'>
+defmodule Minimal.MixProject do
+  use Mix.Project
+
+  def project do
+    [
+      app: :minimal,
+      version: "0.1.0"
+    ]
+  end
+
+  def application do
+    [
+      mod: {Minimal.Application, []}
+    ]
+  end
+end
</code></pre>



## [Pulling in Dependencies]({{page.repo}}/commit/b5dd4d3ffeea0cc136004e762576b873a6ca1d4d)

Now that we’ve built a minimum viable Elixir project, let’s turn our attention to the Phoenix framework. The first thing we need to do to incorporate Phoenix into our Elixir project is to install a few dependencies.

We’ll start by adding a `deps`{:.language-elixir} array to the `project/0`{:.language-elixir} callback in our `mix.exs`{:.language-elixir} file. In `deps`{:.language-elixir} we’ll list `:phoenix`{:.language-elixir}, `:plug_cowboy`{:.language-elixir}, and `:jason`{:.language-elixir} as dependencies.

By default, Mix stores downloaded dependencies in the `deps/`{:.language-elixir} folder at the root of our project. Let’s be sure to add that folder to our `.gitignore`{:.language-elixir}. Once we’ve done that, we can install our dependencies with `mix deps.get`{:.language-elixir}.

The reliance on `:phoenix`{:.language-elixir} makes sense, but why are we already pulling in `:plug_cowboy`{:.language-elixir} and `:jason`{:.language-elixir}?

Under the hood, Phoenix uses the [Cowboy](https://github.com/ninenines/cowboy) web server, and [Plug](https://github.com/elixir-plug/plug) to compose functionality on top of our web server. It would make sense that Phoenix relies on `:plug_cowboy`{:.language-elixir} to bring these two components into our application. If we try to go on with building our application without installing `:plug_cowboy`{:.language-elixir}, we’ll be greeted with the following errors:

<pre class='language-*'><code class='language-*'>** (UndefinedFunctionError) function Plug.Cowboy.child_spec/1 is undefined (module Plug.Cowboy is not available)
    Plug.Cowboy.child_spec([scheme: :http, plug: {MinimalWeb.Endpoint, []}
    ...</code></pre>

Similarly, Phoenix relies on a JSON serialization library to be installed and configured. Without either `:jason`{:.language-elixir} or `:poison`{:.language-elixir} installed, we’d receive the following warning when trying to run our application:

<pre class='language-*'><code class='language-*'>warning: failed to load Jason for Phoenix JSON encoding
(module Jason is not available).

Ensure Jason exists in your deps in mix.exs,
and you have configured Phoenix to use it for JSON encoding by
verifying the following exists in your config/config.exs:

config :phoenix, :json_library, Jason</code></pre>

Heeding that advice, we’ll install `:jason`{:.language-elixir} and add that configuration line to a new file in our project, `config/config.exs`{:.language-elixir}.


<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">.gitignore</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
 /_build/
+/deps/
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">config/config.exs</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
+use Mix.Config
+
+config :phoenix, :json_library, Jason
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">mix.exs</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
   app: :minimal,
-  version: "0.1.0"
+  version: "0.1.0",
+  deps: [
+    {:jason, "~> 1.0"},
+    {:phoenix, "~> 1.4"},
+    {:plug_cowboy, "~> 2.0"}
+  ]
 ]
 </code></pre>



## [Introducing the Endpoint]({{page.repo}}/commit/6e654aa2b5ea693e3cd28fbb4cfd46049a6cf852)

Now that we’ve installed our dependencies on the Phoenix framework and the web server it uses under the hood, it’s time to define how that web server incorporates into our application.

We do this by defining an “endpoint”, which is our application’s interface into the underlying HTTP web server, and our clients’ interface into our web application.

Following Phoenix conventions, we define our endpoint by creating a `MinimalWeb.Endpoint`{:.language-elixir} module that uses `Phoenix.Endpoint`{:.language-elixir} and specifies the `:name`{:.language-elixir} of our OTP application (`:minimal`{:.language-elixir}):

<pre class='language-elixir'><code class='language-elixir'>
defmodule MinimalWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :minimal
end
</code></pre>

The [`__using__/1`{:.language-elixir} macro](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/endpoint.ex#L488-L497) in `Phoenix.Endpoint`{:.language-elixir} does quite a bit of heaving lifting. Among many other things, it loads the endpoint’s [initial configuration](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/endpoint.ex#L499-L515), sets up a [plug pipeline](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/endpoint.ex#L588-L613) using [`Plug.Builder`{:.language-elixir}](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/endpoint.ex#L590), and [defines helper functions](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/endpoint.ex#L621-L634) to describe our endpoint as an OTP process. If you’re curious about how Phoenix works at a low level, start your search here.

`Phoenix.Endpoint`{:.language-elixir} uses the value we provide in `:otp_app`{:.language-elixir} to look up configuration values for our application. Phoenix will complain if we don’t provide a bare minimum configuration entry for our endpoint, so we’ll add that to our `config/config.exs`{:.language-elixir} file:

<pre class='language-elixir'><code class='language-elixir'>
config :minimal, MinimalWeb.Endpoint, []
</code></pre>

But there are a few configuration values we want to pass to our endpoint, like the host and port we want to serve from. These values are usually environment-dependent, so we’ll add a line at the bottom of our `config/config.exs`{:.language-elixir} to load another configuration file based on our current environment:

<pre class='language-elixir'><code class='language-elixir'>
import_config "#{Mix.env()}.exs"
</code></pre>

Next, we’ll create a new `config/dev.exs`{:.language-elixir} file that specifies the `:host`{:.language-elixir} and `:port`{:.language-elixir} we’ll serve from during development:

<pre class='language-elixir'><code class='language-elixir'>
use Mix.Config
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
config :minimal, MinimalWeb.Endpoint,
  url: [host: "localhost"],
  http: [port: 4000]
</code></pre>

If we were to start our application at this point, we’d still be greeted with `Hello.`{:.language-elixir} printed to the console, rather than a running Phoenix server. We still need to incorporate our Phoenix endpoint into our application.

We do this by turning our `Minimal.Application`{:.language-elixir} into a proper supervisor and instructing it to load our endpoint as a supervised child:

<pre class='language-elixir'><code class='language-elixir'>
use Application
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
def start(:normal, []) do
  Supervisor.start_link(
    [
      MinimalWeb.Endpoint
    ],
    strategy: :one_for_one
  )
end
</code></pre>

Once we’ve done that, we can fire up our application using `mix phx.server`{:.language-elixir} or `iex -S mix phx.server`{:.language-elixir} and see that our endpoint is listening on `localhost`{:.language-elixir} port `4000`{:.language-elixir}.

Alternatively, if you want to use our old standby of `mix run`{:.language-elixir}, either configure Phoenix to serve all endpoints on startup, [which is what `mix phx.server`{:.language-elixir} does under the hood](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/mix/tasks/phx.server.ex#L31):

<pre class='language-elixir'><code class='language-elixir'>
config :phoenix, :serve_endpoints, true
</code></pre>

Or configure your application’s endpoint specifically:

<pre class='language-elixir'><code class='language-elixir'>
config :minimal, MinimalWeb.Endpoint, server: true
</code></pre>


<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">config/config.exs</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
+config :minimal, MinimalWeb.Endpoint, []
+
 config :phoenix, :json_library, Jason
+
+import_config "#{Mix.env()}.exs"
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">config/dev.exs</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
+use Mix.Config
+
+config :minimal, MinimalWeb.Endpoint,
+  url: [host: "localhost"],
+  http: [port: 4000]
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal/application.ex</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
 defmodule Minimal.Application do
+  use Application
+
   def start(:normal, []) do
-    IO.puts("Hello.")
-    {:ok, self()}
+    Supervisor.start_link(
+      [
+        MinimalWeb.Endpoint
+      ],
+      strategy: :one_for_one
+    )
   end
 </code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal_web/endpoint.ex</p>
   <pre class='language-elixirDiff'><code class='language-elixirDiff'>
+defmodule MinimalWeb.Endpoint do
+  use Phoenix.Endpoint, otp_app: :minimal
+end
</code></pre>



## [Adding a Route]({{page.repo}}/commit/5350b88a121c6c01c3df9ad3345bd8ce350049aa)

Our Phoenix endpoint is now listening for inbound HTTP requests, but this doesn’t do us much good if we’re not serving any content!

The first step in serving content from a Phoenix application is to configure our router. A router maps requests sent to a route, or path on your web server, to a specific module and function. That function’s job is to handle the request and return a response.

We can add a route to our application by making a new module, `MinimalWeb.Router`{:.language-elixir}, that uses `Phoenix.Router`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defmodule MinimalWeb.Router do
  use Phoenix.Router
end
</code></pre>

And we can instruct our `MinimalWeb.Endpoint`{:.language-elixir} to use our new router:

<pre class='language-elixir'><code class='language-elixir'>
plug(MinimalWeb.Router)
</code></pre>

The `Phoenix.Router`{:.language-elixir} module [generates a handful of helpful macros](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/router.ex#L216), like [`match`{:.language-elixir}](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/router.ex#L433-L435), [`get`{:.language-elixir}, `post`{:.language-elixir}, etc…](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/router.ex#L437-L444) and configures itself to a [module-based plug](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/router.ex#L288). This is the reason we can seamlessly incorporate it in our endpoint using the `plug`{:.language-elixir} macro.

Now that our router is wired into our endpoint, let’s add a route to our application:

<pre class='language-elixir'><code class='language-elixir'>
get("/", MinimalWeb.HomeController, :index)
</code></pre>

Here we’re instructing Phoenix to send any HTTP `GET`{:.language-elixir} requests for `/`{:.language-elixir} to the `index/2`{:.language-elixir} function in our `MinimalWeb.HomeController`{:.language-elixir} “controller” module.

Our `MinimalWeb.HomeController`{:.language-elixir} module needs to `use`{:.language-elixir} `Phoenix.Controller`{:.language-elixir} and provide our `MinimalWeb`{:.language-elixir} module as a `:namespace`{:.language-elixir} configuration option:

<pre class='language-elixir'><code class='language-elixir'>
defmodule MinimalWeb.HomeController do
  use Phoenix.Controller, namespace: MinimalWeb
end
</code></pre>

`Phoenix.Controller`{:.language-elixir}, like `Phoenix.Endpoint`{:.language-elixir} and `Phoenix.Router`{:.language-elixir} does quite a bit. It [establishes itself as a plug](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/controller/pipeline.ex#L7-L37) and by using [`Phoenix.Controller.Pipeline`{:.language-elixir}](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/controller.ex#L168), and it uses the `:namespace`{:.language-elixir} module we provide to do some [automatic layout and view module detection](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/controller.ex#L170-L171).

 Because our controller module is essentially a glorified plug, we can expect Phoenix to pass `conn`{:.language-elixir} as the first argument to our specified controller function, and any user-provided parameters as the second argument. Just like any other plug’s `call/2`{:.language-elixir} function, our `index/2`{:.language-elixir} should return our (potentially modified) `conn`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def index(conn, _params) do
  conn
end
</code></pre>

But returning an unmodified `conn`{:.language-elixir} like this is essentially a no-op.

Let’s spice things up a bit and return a simple HTML response to the requester. The simplest way of doing that is to use Phoenix’s built-in `Phoenix.Controller.html/2`{:.language-elixir} function, which takes our `conn`{:.language-elixir} as its first argument, and the HTML we want to send back to the client as the second:

<pre class='language-elixir'><code class='language-elixir'>
Phoenix.Controller.html(conn, """
  <p>Hello.</p>
""")
</code></pre>

If we dig into [`html/2`{:.language-elixir}](https://github.com/phoenixframework/phoenix/blob/v1.4/lib/phoenix/controller.ex#L375-L377), we’ll find that it’s using Plug’s built-in `Plug.Conn.send_resp/3`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
Plug.Conn.send_resp(conn, 200, """
  <p>Hello.</p>
""")
</code></pre>

And ultimately `send_resp/3`{:.language-elixir} is just modifying our `conn`{:.language-elixir} structure directly:

<pre class='language-elixir'><code class='language-elixir'>
%{
  conn
  | status: 200,
    resp_body: """
      <p>Hello.</p>
    """,
    state: :set
}
</code></pre>

These three expressions are identical, and we can use whichever one we choose to return our HTML fragment from our controller. For now, we’ll follow best practices and stick with Phoenix’s `html/2`{:.language-elixir} helper function.


<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal_web/controllers/home_controller.ex</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
+defmodule MinimalWeb.HomeController do
+  use Phoenix.Controller, namespace: MinimalWeb
+
+  def index(conn, _params) do
+    Phoenix.Controller.html(conn, """
+      <p>Hello.</p>
+    """)
+  end
+end
</code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal_web/endpoint.ex</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
   use Phoenix.Endpoint, otp_app: :minimal
+
+  plug(MinimalWeb.Router)
 end
 </code></pre>

<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal_web/router.ex</p>
 <pre class='language-elixirDiff'><code class='language-elixirDiff'>
+defmodule MinimalWeb.Router do
+  use Phoenix.Router
+
+  get("/", MinimalWeb.HomeController, :index)
+end
</code></pre>



## [Handling Errors]({{page.repo}}/commit/3dbd3c3b59281589f500c84c320db874959cb3fe)

Our Phoenix-based web application is now successfully serving content from the `/`{:.language-elixir} route. If we navigate to `http://localhost:4000/`{:.language-elixir}, we’ll be greeted by our friendly `HomeController`{:.language-elixir}:

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/minimum-viable-phoenix/minimal-1.png" style=" width: 100%;"/>
</div>

But behind the scenes, we’re having issues. Our browser automatically requests the `/facicon.ico`{:.language-elixir} asset from our server, and having no idea how to respond to a request for an asset that doesn’t exist, Phoenix kills the request process and automatically returns a `500`{:.language-elixir} HTTP status code.

<div style="width: 100%; margin: 2em auto;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/minimum-viable-phoenix/minimal-2.png" style=" width: 100%;"/>
</div>

We need a way of handing requests for missing content.

Thankfully, the stack trace Phoenix gave us when it killed the request process gives us a hint for how to do this:

<pre class='language-*'><code class='language-*'>Request: GET /favicon.ico
  ** (exit) an exception was raised:
    ** (UndefinedFunctionError) function MinimalWeb.ErrorView.render/2 is undefined (module MinimalWeb.ErrorView is not available)
        MinimalWeb.ErrorView.render("404.html", %{conn: ...
</code></pre>

Phoenix is attempting to call `MinimalWeb.ErrorView.render/2`{:.language-elixir} with `"404.html"`{:.language-elixir} as the first argument and our request’s `conn`{:.language-elixir} as the second, and is finding that the module and function don’t exist.

Let’s fix that:

<pre class='language-elixir'><code class='language-elixir'>
defmodule MinimalWeb.ErrorView do
  def render("404.html", _assigns) do
    "Not Found"
  end
end
</code></pre>

Our `render/2`{:.language-elixir} function is a view, not a controller, so we just have to return the content we want to render in our response, not the `conn`{:.language-elixir} itself. That said, the distinctions between [views](https://hexdocs.pm/phoenix/Phoenix.View.html) and [controllers](https://hexdocs.pm/phoenix/Phoenix.Controller.html) may be outside the scope of building a “minimum viable Phoenix application,” so we’ll skim over that for now.

Be sure to read move about [the `ErrorView`{:.language-elixir} module](https://hexdocs.pm/phoenix/views.html#the-errorview), and how it incorporates into our application’s endpoint. Also note that the module called to render errors is customizable through [the `:render_errors`{:.language-elixir} configuration option](https://hexdocs.pm/phoenix/Phoenix.Endpoint.html#module-compile-time-configuration).


<p style='margin-bottom:-2rem;font-family:"fira-mono",monospace;font-size:0.85rem;color:#aaa;text-align:right;' class="diff-filename">lib/minimal_web/views/error_view.ex</p>
<pre class='language-elixirDiff'><code class='language-elixirDiff'>
+defmodule MinimalWeb.ErrorView do
+  def render("404.html", _assigns) do
+    "Not Found"
+  end
+end
</code></pre>


## Final Thoughts

So there we have it. A "minimum viable" Phoenix application. It's probably worth pointing out that we're using the phrase "minimum viable" loosely here. I'm sure there are people who can come up with more "minimal" Phoenix applications. Similarly, I'm sure there are concepts and tools that I left out, like views and templates, that would cause people to argue that this example is too minimal.

The idea was to explore the Phoenix framework from the ground up, building each of the requisite components ourselves, without relying on automatically generated boilerplate. I'd like to think we accomplished that goal.

I've certainly learned a thing or two!

If there's one thing I've taken away from this process, it's that there is no magic behind Phoenix. Everything it's doing can be understood with a little familiarity with [the Phoenix codebase](https://github.com/phoenixframework/phoenix/), a healthy understanding of [Elixir metaprogramming](https://elixir-lang.org/getting-started/meta/macros.html), and a little knowledge about [Plug](https://hexdocs.pm/plug/readme.html).
