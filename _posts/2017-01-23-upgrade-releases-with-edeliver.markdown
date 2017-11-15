---
layout: post
title:  "Upgrade Releases With Edeliver"
description: "Edeliver simplifies the process of building and deploying upgrade releases for your Elixir and Phoenix applications."
author: "Pete Corey"
date:   2017-01-23
tags: ["Elixir", "Phoenix", "Deployment"]
---


Last week we saw that [using edeliver could drastically simplify our Elixir release process](http://www.east5th.co/blog/2017/01/16/simplifying-elixir-releases-with-edeliver/). Now that we can build and deploy our initial releases, we should investigate how [edeliver](https://github.com/boldpoker/edeliver) can help us build, manage, and deploy upgrade releases.

To get a better idea of how upgrade releases work with edeliver, let’s make a change to our original application, build an upgrade release from that change, and then deploy that change to our production server.

## Configuring edeliver

Before we start building our upgrade release, we’ll need to make a configuration change to [Distillery](https://github.com/bitwalker/distillery).

Recently, Distillery [changed where it stores its release artifacts](https://github.com/bitwalker/distillery/blob/master/CHANGELOG.md#changed).   If left unchanged, this new output directory would [break our edeliver release process](https://github.com/boldpoker/edeliver/issues/182):

<pre class='language-*'><code class='language-*'>==> Upgrading prod from 0.0.1 to 0.0.1+82e2ed7
==> Upgrade from 0.0.1 to 0.0.1+82e2ed7 failed:
  0.0.1 does not exist at _build/prod/rel/prod/releases/0.0.1
</code></pre>

Thankfully, we can change where these artifacts are stored with Distillery’s `output_dir`{:.language-bash} configuration option.

Let’s edit `rel/config.exs`{:.language-bash} and set `output_dir`{:.language-bash} to the `rel/<application name>`{:.language-bash} directory:

<pre class='language-elixir'><code class='language-elixir'>
set output_dir: "rel/hello_edeliver"
</code></pre>

Now Distillery will store our release artifacts in `rel/hello_edeliver`{:.language-bash}, which is where edeliver expects to find them.

## Making Our Change

Let’s make a small change to our application. We’ll update our `index.html.eex`{:.language-bash} and add a line indicating that we’ve upgraded the application.

<pre class='language-markup'><code class='language-markup'>
&lt;p>We've upgraded!&lt;/p>
</code></pre>

At this point, we can either manually upgrade our application’s version in our `mix.exs`{:.language-bash} file, or we can let edeliver manage our versioning for us.

Let’s keep things as hands-off as possible and let edeliver manage our application’s version.

At this point, we can commit our changes and move on to building our upgrade.

<pre class='language-bash'><code class='language-bash'>
git commit -am "Added upgrade message."
</code></pre>

## Building and Deploying Our Upgrade

Elixir upgrade releases are always built off on a previous release. Distillery will generate a patch that changes only what is different between the old and new version of the application.

With that in mind, we need to know what version of our application is currently running in production. We can find this out using edeliver’s `version`{:.language-bash} mix task:

<pre class='language-bash'><code class='language-bash'>
mix edeliver version production
</code></pre>

In our case, we can see that we’re running version `0.0.1`{:.language-javascript} of our application in production.

Knowing that, we can generate our upgrade release. Upgrade releases are built with the `build upgrade`{:.language-bash} mix task:

<pre class='language-bash'><code class='language-bash'>
mix edeliver build upgrade --with=0.0.1 --auto-version=git-revision
</code></pre>

We’re using the `--with`{:.language-bash} flag to point to our previous `0.0.1`{:.language-javascript} release. We’re also using the `--auto-version`{:.language-bash} flag to tell edeliver to automatically handle the versioning of our application.

This command will generate an upgrade release with a version similar to `0.0.1+82e2ed7`{:.language-bash}. You can see that the `git-revision`{:.language-bash} option appended the current commit’s SHA to the end of the original release version.

For more information about upgrade flags and automatic versioning, be sure the check out the [edeliver](https://github.com/boldpoker/edeliver#build-an-upgrade-package) documentation and [wiki](https://github.com/boldpoker/edeliver/wiki/Auto-Versioning).

---- 

Once our upgrade release has been built, deploying it to our production environment is a simple task:

<pre class='language-bash'><code class='language-bash'>
mix edeliver deploy upgrade to production
</code></pre>

That’s it! Our change was applied instantly to our running application with zero downtime.

If we check the version of our application running in production, we should see `0.0.1+82e2ed7`{:.language-bash}:

<pre class='language-bash'><code class='language-bash'>
mix edeliver version production
</code></pre>

And lastly, when we view our application in the browser, we should see our upgrade message in the DOM.

Success!

## Final Thoughts

After getting over a few configuration hurdles, using edeliver to build and deploy an upgrade release was a breeze.

Being able to seamlessly deploy an upgrade to any number of hosts with zero downtime is an incredibly powerful tool, and edeliver gives a polished interface for just this.

I’m looking forward to using edeliver more in the future.
