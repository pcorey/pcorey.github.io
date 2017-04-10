---
layout: post
title:  "Using Apollo Client with Elixir's Absinthe"
date:   2017-04-10
tags: []
---

Last week I wrote about [how I’m using Create React App in conjunction with the Phoenix framework](http://www.east5th.co/blog/2017/04/03/using-create-react-app-with-phoenix/) to get off the ground incredibly quickly when building single page applications.

In that post I gave a teaser of how you can integrate your React front-end with your [Elixir](http://elixir-lang.org/)/[Phoenix](http://www.phoenixframework.org/) back-end using GraphQL and the [Apollo](http://www.apollodata.com/) client.

Let’s dive deeper into how we can wire up an Apollo driven React application to our [Absinthe](http://absinthe-graphql.org/)/[Phoenix](http://www.phoenixframework.org/) back-end.

## Getting Started

Before we get started, let’s make sure we’re on the same page.

[The Apollo client](http://dev.apollodata.com/) is a powerful [GraphQL](http://graphql.org/) client with a  variety of [framework-specific integrations](http://dev.apollodata.com/react/). [Absinthe](http://absinthe-graphql.org/) is an [Elixir](http://elixir-lang.org/)-powered GraphQL server implementation with built-in support for the [Phoenix framework](http://www.phoenixframework.org/).

Apollo + Absinthe = 😍

In the past I’ve talked about the basics of [getting started with Apollo client and Absinthe](http://www.east5th.co/blog/2016/11/21/using-apollo-client-with-elixirs-absinthe/). Be sure to check out those instructions, and read through [the Apollo documentation](http://dev.apollodata.com/) and the [Absinthe guides](http://absinthe-graphql.org/guides/) if you’re unfamiliar with either tool.

For this article, I’ll assume you’re using a project setup similar to the one I described last week. That is, you’re running a React front-end application served through the Create React App tooling that connects to a Phoenix back-end application.

Once that’s all set up, we can spin up our React front-end by navigating to our React application’s folder and running:

<pre class='language-javascript'><code class='language-javascript'>
npm start
</code></pre>

Similarly, we can spin up our Phoenix back-end server by navigating to our Elixir project and running:

<pre class='language-javascript'><code class='language-javascript'>
mix phoenix.server
</code></pre>

Out of the box, our React application will run on port `3000`{:.language-javascript}, and our Phoenix server will run on port `4000`{:.language-javascript}.

## Wiring Our Front-end to Our Back-end

As we mentioned last week, we need a way to tell our React application how to communicate with our back-end Phoenix applications. We do this by giving our application the URI to our GraphQL endpoint.

In different environments, this endpoint might change. That is, our staging environment might point to a different GraphQL endpoint than our production environment.

This means we can’t hardcode these endpoints into our front-end code.

So what do we do?

Thankfully, Create React App lets us [pass custom environment variables](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-custom-environment-variables) into our front-end applications as long as they’re prefixed with `REACT_APP_`{:.language-javascript}. These environment variables are passed into the application by the build tool and can be accessed through the `process.env`{:.language-javascript} object.

Let’s assume that our GraphQL endpoint will be passed in through the `REACT_APP_GRAPHQL_URI`{:.language-javascript} environment variable. We can use this to build Apollo’s network interface:

<pre class='language-javascript'><code class='language-javascript'>
const networkInterface = createNetworkInterface({
    uri: _.get(process.env, "REACT_APP_GRAPHQL_URI"),
});
</code></pre>

Now when we spin up our React application, we need to be sure to set `REACT_APP_GRAPHQL_URI`{:.language-javascript}, otherwise our call to `createNetworkInterface`{:.language-javascript} will fail:

<pre class='language-javascript'><code class='language-javascript'>
REACT_APP_GRAPHQL_URI="http://localhost:4000/graphql" npm start
</code></pre>

Now our React application knows where to find our Absinthe-powered GraphQL server.

Perfect!

## Using a Custom Watcher… Partially

While our setup is now fully functional, having to manage two different development servers is cumbersome. Instead, let’s write a [custom Phoenix watcher](http://www.phoenixframework.org/docs/static-assets#section-using-another-asset-management-system-in-phoenix) than spins up our Create React App development server whenever we start our Phoenix server.

We can do this by adding a new watcher to our `Endpoint`{:.language-javascript} configuration in `config/dev.exs`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
config :hello_create_react_app, HelloCreateReactApp.Endpoint,
  ...
  watchers: [npm: ["start", cd: Path.expand("priv/hello_create_react_app/")]]
</code></pre>

Now whenever we fire up our Phoenix server with `mix phoenix.server`{:.language-javascript} or even `iex -S mix phoenix.server`{:.language-javascript}, our Create React App development server (`npm start`{:.language-javascript}) will spin up as well.

Remember, we still need to set `REACT_APP_GRAPHQL_URI`{:.language-javascript}!

<pre class='language-javascript'><code class='language-javascript'>
REACT_APP_GRAPHQL_URI="http://localhost:4000/graphql" mix phoenix.server
</code></pre>

Fantastic!

---- 

Unfortunately, there’s currently a problem with this solution.

For some reason, when Create React App’s `npm start`{:.language-javascript} command is executed through a watcher, which [ultimately boils down](https://github.com/phoenixframework/phoenix/blob/827480ec27b554538656ba2772f28b47ed254719/lib/phoenix/endpoint/watcher.ex#L15) to a call to `System.call "npm", ["start"], ...`{:.language-elixir}, killing the Phoenix server will not kill the Create React App development server running in the background.

Killing your Phoenix server and trying to spin it up again will give you this error from the `npm start`{:.language-javascript} command:

<pre class='language-javascript'><code class='language-javascript'>
Something is already running on port 3000.
</code></pre>

You’ll need to manually find the orphaned node process and kill it before once again restarting the Phoenix server.

I believe this problem is related to [this issue on Github](https://github.com/facebookincubator/create-react-app/issues/932). Hopefully it will be fixed soon.

## Integrating with our Release Manager

We know that we can point our React front-end to different back-ends with our `REACT_APP_GRAPHQL_URI`{:.language-javascript} environment variable, but how do we automate this?

Is there a way to incorporate this into our release process?

If you’re [using edeliver to generate your releases](http://www.east5th.co/blog/2017/01/16/simplifying-elixir-releases-with-edeliver/), you’re in luck. You edeliver configuration file can be customized to set `REACT_APP_GRAPHQL_URI`{:.language-javascript} according to your build target.

Your edeliver configuration (`.edeliver/config`{:.language-javascript}) is really just [a bash script that’s executed before each edeliver task](https://github.com/boldpoker/edeliver/wiki/Extend-edeliver-(config)-to-fit-your-needs). This means that we can conditionally set `REACT_APP_GRAPHQL_URI`{:.language-javascript} based on the environment we’re building for:

<pre class='language-javascript'><code class='language-javascript'>
if [[ "$DEPLOY_ENVIRONMENT" = "production" ]]
then
  REACT_APP_GRAPHQL_API="http://production/graphql"
fi

if [[ "$DEPLOY_ENVIRONMENT" = "staging" ]]
then
  REACT_APP_GRAPHQL_API="http://staging/graphql"
fi
</code></pre>

We can then add a compile hook to build our React application’s static bundle:

<pre class='language-javascript'><code class='language-javascript'>
pre_erlang_clean_compile() {
  status "Installing NPM dependencies"
  __sync_remote "
    [ -f ~/.profile ] && source ~/.profile
    set -e

    cd '$BUILD_AT/priv/hello_create_react_app'
    npm install $SILENCE
  "

  status "Building React application"
  __sync_remote "
    [ -f ~/.profile ]
    set -e

    cd '$BUILD_AT/priv/hello_create_react_app'
    npm run build $SILENCE
  "
}
</code></pre>

Now our React application should be built into `priv/hello_create_react_app/build/`{:.language-javascript}, which is where our Phoenix application expects to find it.

Additionally, when it’s served by our Phoenix application it will connect to either our staging or production GraphQL endpoint depending on the environment the particular release was built for.

Now that our release manager is handling our front-end build process, all we need to worry about it building our application.

## Final Thoughts

Once again, I’m very happy with this setup!

So far the combination of using React with Apollo and communicating with my Phoenix server using Absinthe has been a very powerful and productive combination.

[As I mentioned last time](http://www.east5th.co/blog/2017/04/03/using-create-react-app-with-phoenix/), building your front-end application independently from your back-end application can offer up interesting optimizations if you choose to go that route.

Alternatively, you can configure your Create React App to be served as a static asset from your Phoenix application. Hopefully this article has shown that that’s a fairly painless process.
