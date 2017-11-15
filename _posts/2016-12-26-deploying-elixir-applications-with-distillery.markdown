---
layout: post
title:  "Deploying Elixir Applications with Distillery"
description: "Use Distillery to build and deploy your Elixir and Phoenix applications."
author: "Pete Corey"
date:   2016-12-26
tags: ["Elixir", "Phoenix", "Deployment"]
---

While [churning through the exercises](http://www.east5th.co/blog/2016/12/19/intentionally-learning-elixir/) in [Programming Elixir](https://www.amazon.com/gp/product/168050200X/ref=as_li_tl?ie=UTF8&tag=east5th-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=168050200X&linkId=bd25aac110b20a11b82607f1f0e48f65) (affiliate link), I came across a section dedicated to deploying Elixir applications using the [Elixir Release Manager](https://github.com/bitwalker/exrm) (`exrm`{:.language-elixir}).

Browsing through the Elixir Release Manager project, I noticed that it is being replaced by [Distillery](https://github.com/bitwalker/distillery):

> I would highly recommend using [Distillery] moving forward, as most of my efforts will be put towards that project from now on.

Rather than learning how to use a deprecated tool, I decided it might be a better investment of my time to learn how to deploy Elixir applications using Distillery.

Below is a guide for doing a basic release with Distillery. For the most part, the instructions are very similar to doing a release with `exrm`{:.language-elixir}, with a few minor differences.

## Creating Our Application

Before we start, we’ll need an Elixir project we want to deploy. To keep things simple, we’ll use a bare-bones [Phoenix](http://www.phoenixframework.org/) application. We can create our application (called `HelloDistillery`{:.language-elixir}) with the `phoenix.new`{:.language-elixir} [Mix](http://elixir-lang.org/getting-started/mix-otp/introduction-to-mix.html) task:

<pre class='language-*'><code class='language-*'>mix phoenix.new --no-ecto hello_distillery
</code></pre>

Once we’ve got our application set up and tested locally (`mix phoenix.server`{:.language-elixir}), we can start the Distillery deployment process.

## Installing Distillery

The first step of deploying an Elixir project with Distillery is to add Distillery as a dependency. In our `mix.exs`{:.language-elixir} file, add a dependency on `:distillery`{:.language-elixir} version `1.0`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
{:distillery, "~> 1.0"}
</code></pre>

Now tell Mix to pull down the new dependency:

<pre class='language-*'><code class='language-*'>mix deps.get
</code></pre>

Once installed, Distillery creates a new `release`{:.language-elixir} Mix task. If we try to run it, we’ll be told that we need to do some initial configuration:

<pre class='language-*'><code class='language-*'>mix release
==> You are missing a release config file. Run the release.init task first
</code></pre>

Following that advice, we can generate our initial config file with the `release.init`{:.language-elixir} Mix task:

<pre class='language-*'><code class='language-*'>mix release.init
</code></pre>

Review the newly generated `rel/config.exs`{:.language-elixir} file. For our purposes, the defaults should be fine.

## Configuring Our Release

The last step before we build our first release is to do some final configuration on the environment we’ll be deploying.

In our case, we’ll be deploying the `prod`{:.language-elixir} environment. If we look in our `config/prod.exs`{:.language-elixir} file, we’ll see a comment block addressing releases:

<pre class='language-elixir'><code class='language-elixir'>
# ## Using releases
#
# If you are doing OTP releases, you need to instruct Phoenix
# to start the server for all endpoints:
#
# config :phoenix, :serve_endpoints, true
#
# Alternatively, you can configure exactly which server to
# start per endpoint:
#
#     config :hello_distillery, HelloDistillery.Endpoint, server: true
</code></pre>

Following this advice and the advice in the [Distillery Phoenix Walkthrough](https://hexdocs.pm/distillery/phoenix-walkthrough.html#phoenix-walkthrough), we’ll add a few configuration options to our `HelloDistillery`{:.language-elixir} endpoint, and update its `url`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
config :hello_distillery, HelloDistillery.Endpoint,
  ...
  url: [ ... ],
  server: true,
  root: ".",
  version: Mix.Project.config[:version]
</code></pre>

Once we’ve made those configuration changes, we’re ready to build and deploy our release!

## Building Our Release

Building our release with Distillery is an easy process.

If we’re deploying a Phoenix application, we’ll need to be sure that we’ve bundled our front-end assets. We can do that with the following command:

<pre class='language-*'><code class='language-*'>brunch build --production
</code></pre>

Next, we’ll run a series of Mix tasks. First, we’ll compile our project. Next, we’ll [compress and digest](https://hexdocs.pm/phoenix/Mix.Tasks.Phoenix.Digest.html) all of our static files. Finally, we’ll build our `prod`{:.language-elixir} release:

<pre class='language-*'><code class='language-*'>MIX_ENV=prod mix do compile, phoenix.digest, release --env=prod
</code></pre>

The `mix release`{:.language-elixir} task builds our release and places it in the `_build`{:.language-elixir} folder. To make sure everything went well, we can run the release locally using the following command:

<pre class='language-*'><code class='language-*'>PORT=8080 ./_build/prod/rel/hello_distillery/bin/hello_distillery foreground
</code></pre>

If the release was successful, we should see our application’s server logs in the console, and we should be able to access your application at `http://localhost:8080`{:.language-elixir}.


## Deploying Our Release

At this point, I’ll assume that you’ve already provisioned the machine you’ll be using for your production environment.


<p style="border: 1px dashed #690; padding: 1em; background-color: #F0F9F0">
As a side note, I decided to deploy my application to an Amazon EC2 instance running 64 bit Amazon Linux.
</p>

Because we’re using the default configuration value of `include_erts: false`{:.language-elixir}, we’ll need to be sure that [Erlang](https://www.erlang.org/) is installed on the machine we’ll be deploying our release to.

Following [these instructions](http://imperialwicket.com/aws-install-erlang-otp-on-amazon-linux/), I was able to easily build Erlang from source and install it on my production machine. You may also have luck with a pre-compiled [Erlang package](https://www.erlang-solutions.com/resources/download.html).

Be sure to use the same version of Erlang on your production machine as the machine you built your release on. If you do not, you may encounter obtuse errors when trying to run your release.

Once our machine is provisioned and Erlang is installed, we’ll copy our release tarball from our development machine up to our production machine:

<pre class='language-*'><code class='language-*'>scp -i ~/hello_distillery.pem \ 
       _build/prod/rel/hello_distillery/releases/0.0.1/hello_distillery.tar.gz \
       ec2-user@ec2-...amazonaws.com:/home/ec2-user
</code></pre>

Be sure to tweak this command to suite your needs. I’m authenticating with a `pem`{:.language-elixir} file stored in my home directory, and deploying to the home directory of the default `ec2-user`{:.language-elixir} of my Amazon EC2 instance.

Once our release tarball is pushed up to our production server, we’ll need to extract it and run the release.

On the production server, extract the newly uploaded tarball:

<pre class='language-*'><code class='language-*'>tar -xzf ~/hello_distillery.tar.gz
</code></pre>

Now is the moment of truth. Run the release binary using the `foreground`{:.language-elixir} option:

<pre class='language-*'><code class='language-*'>PORT=8080 ./bin/hello_distillery foreground
</code></pre>

If everything went well, we should see our application’s server logs in the console. Additionally, we should be able to access our application at our production machine’s host on port `8080`{:.language-elixir} (granted you’ve properly opened that port).

Now that we know everything works, kill the server process. This time we’ll run the `hello_distillery`{:.language-elixir} application as a daemon:

<pre class='language-*'><code class='language-*'>PORT=8080 ./bin/hello_distillery start
</code></pre>

Once we’ve started the application, we can ensure that it’s running with a ping:

<pre class='language-*'><code class='language-*'>./bin/hello_distillery ping
> pong
</code></pre>

And with that, we’ve deployed a basic Phoenix application using Distillery!


## Final Thoughts

This was a simple run-through of a happy-path first deployment using Distillery.

I highly recommend you check out [Distillery’s documentation](https://hexdocs.pm/distillery/getting-started.html), especially the [Walkthrough](https://hexdocs.pm/distillery/walkthrough.html#content) and [Phoenix Walkthrough](https://hexdocs.pm/distillery/phoenix-walkthrough.html#content) sections. They go into much more detail about the various aspects of deploying with Distillery.

Overall, the process of deploying an application with Distillery was very similar to the Elixir Release Manager process described in Programming Elixir.

If you'd like to see Distillery in action, check out this short webm of entire entire deployment process:

<video width="100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/Distillery.webm" controls></video>
