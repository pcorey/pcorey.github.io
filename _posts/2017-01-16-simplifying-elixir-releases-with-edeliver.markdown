---
layout: post
title:  "Simplifying Elixir Releases With Edeliver"
excerpt: "Edeliver simplifies the process of building and deploying standard releases for your Elixir and Phoenix applications."
author: "Pete Corey"
date:   2017-01-16
tags: ["Elixir", "Phoenix", "Deployment"]
---

In our previous two posts, we’ve [built releases manually with Distillery](http://www.east5th.co/blog/2016/12/26/deploying-elixir-applications-with-distillery/), and [deployed an upgrade release](http://www.east5th.co/blog/2017/01/09/upgrade-releases-with-distillery/) to an existing Elixir application. As we've seen, this was a very hands-on process.

Thankfully, there is another tool that we can use to simplify our release process. In this post, we’ll dive into using [edeliver](https://github.com/boldpoker/edeliver) to build and release Elixir applications.

## Our Example Application

To help walk ourselves through the process of using edeliver, let’s create a new Phoenix application that we can deploy to a “production server”.

Let’s start by creating a new, basic Phoenix project:

<pre class='language-bash'><code class='language-bash'>
mix phoenix.new hello_edeliver --no-ecto
</code></pre>

We’ll be deploying this application as is, so let’s move onto the process of installing and configuring our release tools.

First, we’ll add dependencies on `edeliver`{:.language-javascript}, and `distillery`{:.language-javascript}, and add `edeliver`{:.language-javascript} to our projects list of applications:

<pre class='language-elixir'><code class='language-elixir'>
def application do
  [...,
   applications: [..., :edeliver]]
end
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
defp deps do
  [
   ...
   {:edeliver, "~> 1.4.0"},
   {:distillery, ">= 0.8.0", warn_missing: false}]
end
</code></pre>

Note: edeliver is a high-level tool designed to orchestrate the creation, deployment, and management of Elixir releases. Under the covers, it can use Distillery, exrm, relx, or rebar to build release bundles.

Our application won’t use any “production secrets”, so to simplify this introduction to edeliver, let’s remove our dependency on the `config/prod.secrets.exs`{:.language-javascript} file by commenting out its `import_config`{:.language-elixir} line in `config/prod.exs`{:.language-javascript}:

<pre class='language-elixir'><code class='language-elixir'>
# import_config "prod.secrets.exs"
</code></pre>

Finally, while we’re in `config/prod.exs`{:.language-javascript}, let’s add a few vital configuration options to our `HelloEdeliver`{:.language-elixir} endpoint:

<pre class='language-elixir'><code class='language-elixir'>
config :hello_edeliver, HelloEdeliver.Endpoint,
  http: [port: {:system, "PORT"}],
  url: [host: "...", port: {:system, "PORT"}],
  server: true,
  root: ".",
  version: Mix.Project.config[:version],
  cache_static_manifest: "priv/static/manifest.json"
</code></pre>

And with that, our example application should be ready for release.

Before we move on, let’s fire up our development server with `mix phoenix.server`{:.language-javascript} and make sure that everything looks as we’d expect.

## Configuring Distillery and edeliver

Now that our application is ready, we need to spend some time configuring our deployment tools.

First, let’s create our Distillery configuration file (`rel/config.exs`{:.language-javascript}) with the `release.init`{:.language-javascript} mix task:

<pre class='language-javascript'><code class='language-javascript'>
mix release.init
</code></pre>

The default configuration options provided by `release.init`{:.language-javascript} should be fine for our first deployment.

Next, let’s take a look at our edeliver configuration file (`.deliver/config`{:.language-javascript}). We’ll update the provided fields and point edeliver to a remote “build host” and “production host”:

<pre class='language-javascript'><code class='language-javascript'>
APP="hello_edeliver"

BUILD_HOST="ec2-52-87-163-123.compute-1.amazonaws.com"
BUILD_USER="ec2-user"
BUILD_AT="/home/ec2-user/hello_edeliver/builds"

PRODUCTION_HOSTS="ec2-54-172-3-38.compute-1.amazonaws.com"
PRODUCTION_USER="ec2-user"
DELIVER_TO="/home/ec2-user"
</code></pre>

At this point, we could add any number of production hosts, or add another environment entirely, such as a staging environment.

----

Because we’re building a Phoenix application, we’ll need to build and digest all of our static assets before building our release.

We’re building our release bundle on our remote build host, so we’ll need to instruct edeliver to do these things for us. Thankfully, edeliver comes with a host of [pre and post hooks](https://github.com/boldpoker/edeliver/wiki/Run-additional-build-tasks) that we can use to accomplish this task.

Let’s add a “pre compile” hook to build (`npm install`{:.language-javascript}, `npm run deploy`{:.language-javascript}) and digest (`mix phoenix.digest`{:.language-javascript}) our static assets:

<pre class='language-bash'><code class='language-bash'>
pre_erlang_clean_compile() {
  status "Installing NPM dependencies"
  __sync_remote "
    [ -f ~/.profile ] && source ~/.profile
    set -e

    cd '$BUILD_AT'
    npm install $SILENCE
  "

  status "Building static files"
  __sync_remote "
    [ -f ~/.profile ] && source ~/.profile
    set -e

    cd '$BUILD_AT'
    mkdir -p priv/static
    npm run deploy $SILENCE
  "

  status "Running phoenix.digest"
  __sync_remote "
    [ -f ~/.profile ] && source ~/.profile
    set -e

    cd '$BUILD_AT'
    APP='$APP' MIX_ENV='$TARGET_MIX_ENV' $MIX_CMD phoenix.digest $SILENCE
  "
}
</code></pre>

By default, edeliver will store all release tarballs in the `.deliver/releases`{:.language-javascript} folder. Let’s preemptively exclude this folder from revision control:

<pre class='language-javascript'><code class='language-javascript'>
echo ".deliver/releases/" >> .gitignore
</code></pre>

The last thing we need to do to prepare for our first release is to commit all of our changes!

## Preparing Our Hosts

When using edeliver, we’ll always have at least two different types of remote environments.

The first is our build host. This is where edeliver actually builds our release. In our case, it’s running a variation of a `mix release`{:.language-javascript} command. As we saw in a previous article, it’s important that the build host be nearly identical to the production host in terms or architectures, etc…

Our build host has several dependencies. We’ll need to [install Git](https://andrewelkins.com/2012/01/08/how-to-add-git-to-an-amazon-ami-ec2-instance/), [Erlang & Elixir](https://gist.github.com/techgaun/335ef6f6abb5a254c66d73ac6b390262), and [Node](http://stackoverflow.com/questions/27350634/how-to-yum-install-node-js-on-amazon-linux/35165401#35165401). Thankfully, we’ll only need to provision a single build host.

The second type of host is our deployment target. These machines will be running our application in environments such as staging or production. We can have any number of these hosts living in the wild.

Our deployment machines have no dependencies. We don’t even need to install Erlang - our release will bring it along for us.

However, we do need to set any required environment variables on these hosts. Out of the box, a Phoenix application needs a `PORT`{:.language-javascript} value. We can export this from our `~/.profile`{:.language-javascript}:

<pre class='language-bash'><code class='language-bash'>
export PORT=4000
</code></pre>

---- 

If you’re using Amazon EC2 hosts, you’ll most likely authenticate with your remote hosts by passing along a `*.pem`{:.language-javascript} file when you establish your SSH connection.

While edeliver doesn’t explicitly support this kind of authentication, adding a `Host`{:.language-javascript}/`IndentityFile`{:.language-javascript} entry in your `~/.ssh/config`{:.language-javascript} file for each of your remote hosts will [authorize edeliver to communicate with these hosts](https://github.com/boldpoker/edeliver/issues/117):

<pre class='language-*'><code class='language-*'>Host ec2-foo.compute-1.amazonaws.com
  IdentityFile ~/my_identity_file.pem

Host ec2-bar.compute-1.amazonaws.com
  IdentityFile ~/my_identity_file.pem
</code></pre>

## Making Our Release

Once our application is ready, our deployment tools are configured, and our hosts are provisioned, we can build and deploy our release.

The first step is to instruct edeliver to build our release on our build host:

<pre class='language-javascript'><code class='language-javascript'>
mix edeliver build release
</code></pre>

Success! If everything went well, we should find our newly built release tarball in our release store (`.deliver/releases`{:.language-javascript}).

Next, let’s push our initial release up to our production server:

<pre class='language-javascript'><code class='language-javascript'>
mix edeliver deploy release to production
</code></pre>

Another success! We’ve deployed our initial release to our production environment.

Now let’s fire up the Phoenix application in production:

<pre class='language-javascript'><code class='language-javascript'>
mix edeliver start production
</code></pre>

We can check that everything went well by using edeliver to ping our application:

<pre class='language-javascript'><code class='language-javascript'>
mix edeliver ping production
</code></pre>

If our application is up and running, we should receive a `pong`{:.language-javascript} reply to our ping.

At this point, we should be able to navigate to our production host and find our application running at the port we’ve specified.

## Final Thoughts

From my limited experience, edeliver is a fantastic tool.

While it does require up-front work (more work than using Distillery on its own), that work is _purely up-front_. Once you’ve provisioned your build host and set up your edeliver configuration file, building and deploying releases to any number of hosts is smooth sailing.

I’m excited to work more with edeliver. Expect an upcoming post on deploying hot upgrade releases to see how the process compares with just using Distillery.
