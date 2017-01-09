---
layout: post
title:  "Upgrade Releases With Distillery"
date:   2017-01-09
tags: []
---

Now that we’ve [deployed our first Elixir application](http://www.east5th.co/blog/2016/12/26/deploying-elixir-applications-with-distillery/) using Distillery, let’s dive into the process of building and deploying a “hot upgrade” for our application!

We’ll move through the process of making a change to our application, using [Distillery](https://github.com/bitwalker/distillery) to [build our upgrade](https://hexdocs.pm/distillery/walkthrough.html#building-an-upgrade-release), and then deploying the upgrade with zero downtime.

## Making Our Changes

With the goal of keeping things simple, let’s make a small change to our application’s `index.html.eex`{:.language-bash} file. We’ll add a new `<h3>`{:.language-markup} tag that shows we’ve upgraded our application:

<pre class='language-markup'><code class='language-markup'>
&lt;div class="jumbotron">
  &lt;h2>&lt;%= gettext "Welcome to %{name}", name: "Phoenix!" %>&lt;/h2>
  &lt;h3>Version 0.0.2!&lt;/h3>
  ...
&lt;/div>
</code></pre>

Next, we’ll need to upgrade our project’s version in our `mix.exs`{:.language-bash} file:

<pre class='language-elixir'><code class='language-elixir'>
def project do
  [app: :hello_distillery,
   version: "0.0.2",
   ...
</code></pre>

It’s important to upgrade our project’s version so distillery can correctly build an upgrade/downgrade patch for our application.

## Problems With Our Build

And with that, we should be ready to build our upgrade release. The process for building an upgrade is very similar to that of building a normal release:

<pre class='language-bash'><code class='language-bash'>
MIX_ENV=prod mix do compile, phoenix.digest, release --env=prod --upgrade
</code></pre>

Unfortunately, due to how we configured our project in the last article, this upgrade build will fail:

<pre class='language-bash'><code class='language-bash'>
==> Assembling release..
==> Building release hello_distillery:0.0.2 using environment prod
==> Failed to build release:
    Hot upgrades will fail when include_erts: false is set,
    you need to set include_erts to true or a path if you plan to use them!
</code></pre>

Because we installed Erlang on our production machine, we set `include_erts`{:.language-javascript} to false in our release configuration file, indicating that we didn’t want to include the Erlang runtime in our final build.

Distillery is complaining that when building upgrade releases, `include_erts`{:.language-javascript} either needs to be `true`{:.language-javascript} (which will include the Erlang runtime installed on our development machine in the release), or a path pointing to the Erlang runtime we want to include in the release.

## A Tale of Two Erlangs

My development machine is a Macbook, and my production machine is an Amazon Linux EC2 instance. This means that including my development machine’s version of Erlang in the release is not an option.

This means that we’ll have to copy the instance of Erlang we installed on our production server onto our development server and point to it with `include_erts`{:.language-javascript}.

The [Distillery walkthrough](https://hexdocs.pm/distillery/walkthrough.html#deploying-your-release) touches in this in the “Deploying Your Release” section:

> If you are deploying to a different OS or architecture than the build machine, you should either set `include_erts`{:.language-javascript}: `false`{:.language-javascript} or `include_erts`{:.language-javascript}: `"path/to/cross/compiled/erts"`{:.language-bash}.

> The latter will require that you have built/installed Erlang on the target platform, and copied the contents of the Erlang `lib`{:.language-bash} directory somewhere on your build machine, then provided the path to that directory to `include_erts`{:.language-javascript}.

Following this advice, we’ll copy the Erlang runtime from our production server into a folder on our development machine (`~/al-erlang`{:.language-bash}):

<pre class='language-bash'><code class='language-bash'>
scp -i ~/hello_distillery.pem -r \
    ec2-user@ec2...amazonaws.com:/usr/local/lib/erlang \
    /Users/pcorey/al-erlang
</code></pre>

Now we can change our `include_erts`{:.language-javascript} to point to our newly downloaded `~/al-erlang`{:.language-bash} directory:

<pre class='language-elixir'><code class='language-elixir'>
set include_erts: "/Users/pcorey/al-erlang"
</code></pre>

And finally, we can build our upgrade release:

<pre class='language-bash'><code class='language-bash'>
MIX_ENV=prod mix do compile, phoenix.digest, release --env=prod --upgrade
</code></pre>

## Hot Deploying Our Upgrade

Now that we’ve successfully built our upgrade release, we can deploy it to our production server.

The first thing we’ll need to do is ssh into our production server and create a `0.0.2`{:.language-bash} folder in our application’s `releases`{:.language-bash} directory:

<pre class='language-bash'><code class='language-bash'>
mkdir ~/releases/0.0.2/
</code></pre>

Next, we’ll hop back over to our development server and copy our newly built release tarball into that new directory:

<pre class='language-bash'><code class='language-bash'>
scp -i /hello_distillery.pem \
    _build/prod/rel/hello_distillery/releases/0.0.2/hello_distillery.tar.gz \
    ec2-user@ec2-...amazonaws.com:/home/ec2-user/releases/0.0.2/ \
    hello_distillery.tar.gz
</code></pre>

Lastly, we’ll switch back to our production server and run the `upgrade`{:.language-bash} command, passing in the new version of our application that we just uploaded:

<pre class='language-bash'><code class='language-bash'>
./bin/hello_distillery upgrade 0.0.2
</code></pre>

If everything went well, we should be able to refresh our application in the browser and see our `"Version 0.0.2!"`{:.language-javascript} message!

## Final Thoughts

Minus a few burs and rough edges, Distillery is a fantastic tool for building and deploying Elixir/Phoenix applications.

I imagine that all of the sticking points I encountered can be smoothed out with a combination of well-designed build scripts and building releases on a machine with the same architecture as the production environment.

Looking to the future, it looks like [edeliver](https://github.com/boldpoker/edeliver) does exactly that. Expect to see an article in the next few weeks about simplifying the deployment process with edeliver!
