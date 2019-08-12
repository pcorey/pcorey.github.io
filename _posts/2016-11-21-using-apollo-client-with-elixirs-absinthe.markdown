---
layout: post
title:  "Using Apollo Client with Elixir's Absinthe"
excerpt: "Explore how Elixir's Absinthe GraphQL library can be used to fuel a front-end application built around Apollo Client."
author: "Pete Corey"
date:   2016-11-21
tags: ["Elixir", "Absinthe", "GraphQL", "Apollo"]
---

There’s no doubt that [GraphQL](http://graphql.org/) has been making waves in the web development community since it was announced, and for good reason! GraphQL helps decouple an application’s front-end from its back-end in amazingly flexible ways.

Unfortunately, [React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/), the current go-to front-end frameworks for handling client-side state and interacting with a GraphQL server are cumbersome to use at best. Thankfully, the [Apollo](http://www.apollodata.com/) client, a new project from the [Meteor Development Group](https://www.meteor.com/), is trying to offer a more straight-forward, batteries included option for interfacing with GraphQL and managing your client-side state.

Let’s dig into how to set up a basic GraphQL server in [Elixir](http://elixir-lang.org/) using [Absinthe](http://absinthe-graphql.org/), and how to interact with that server using the Apollo client.

## Elixir’s Absinthe

[Absinthe](http://absinthe-graphql.org/) is a [GraphQL implementation for Elixir](https://github.com/absinthe-graphql/absinthe). It lets you set up a GraphQL endpoint on your Elixir/Phoenix server.

Setting up Absinthe is a straight-forward process. To start, we’ll add dependencies on the `absinthe`{:.language-elixir} and `absinthe_plug`{:.language-elixir} Mix packages and fire up their corresponding applications:

<pre class='language-elixir'><code class='language-elixir'>
defp deps do
  [ ...
   {:absinthe, "~> 1.2.0"},
   {:absinthe_plug, "~> 1.2.0"}]
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
applications: [ … :absinthe, :absinthe_plug]
</code></pre>

Just like in the [Absinthe tutorial](http://absinthe-graphql.org/tutorial/our-first-query/), our next step is to set up our GraphQL types. We’ll create simple schemas for an author and a post:

<pre class='language-elixir'><code class='language-elixir'>
object :author do
  field :id, :id
  field :first_name, :string
  field :last_name, :string
  field :posts, list_of(:post) do
    resolve fn author, _, _ ->
      {:ok, HelloAbsinthe.Schema.find_posts(author.id)}
    end
  end
end

object :post do
  field :id, :id
  field :title, :string
  field :author, :author do
    resolve fn post, _, _ ->
      {:ok, HelloAbsinthe.Schema.find_author(post.author.id)}
    end
  end
  field :votes, :integer
end
</code></pre>

Next, we’ll define the types of queries we support. To keep things simple, we’ll add two basic queries. The first, `posts`{:.language-elixir}, will return all posts in the system, and the second, `author`{:.language-elixir}, will return an author for a given `id`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
query do
  field :posts, list_of(:post) do
    resolve &get_all_posts/2
  end

  field :author, type: :author do
    arg :id, non_null(:id)
    resolve &get_author/2
  end
end
</code></pre>

To cut down on the number of moving parts in this example, we’ll write our two resolver functions to return a set of hard-coded posts and authors, rather than pulling them from some external data source:

<pre class='language-elixir'><code class='language-elixir'>
@posts [
  %{id: 1, title: "GraphQL Rocks",           votes: 3, author: %{id: 1}},
  %{id: 2, title: "Introduction to GraphQL", votes: 2, author: %{id: 2}},
  %{id: 3, title: "Advanced GraphQL",        votes: 1, author: %{id: 1}}
]

@authors [
  %{id: 1, first_name: "Sashko", last_name: "Stubailo"},
  %{id: 2, first_name: "Tom",    last_name: "Coleman"},
]

...

def get_all_posts(_args, _info) do
  {:ok, @posts}
end

def get_author(%{id: id}, _info) do
  {:ok, find_author(id)}
end

def find_author(id) do
  Enum.find(@authors, fn author -> author.id == id end)
end

def find_posts(author_id) do
  Enum.find(@posts, fn post -> post.author.id == author_id end)
end
</code></pre>

Now all we need to do is tell Absinthe that we want our GraphQL endpoint to listen on the `"/graphql"`{:.language-elixir} route and that we want it to use our newly defined schemas and queries:

<pre class='language-elixir'><code class='language-elixir'>
forward "/graphql", Absinthe.Plug, schema: HelloAbsinthe.Schema
</code></pre>

And that’s it! Now we can send our server GraphQL queries and it will process them and send back the result.

Let’s move on to setting up Apollo on the front-end.

## Apollo Client

If you haven’t noticed already, we’re basing this example off of the query example on the [Apollo Developer page](http://dev.apollodata.com/).

Before we continue with their example, we need to set up React in our application. Since we started with a fresh [Phoenix project](http://www.phoenixframework.org/) (`mix phoenix.new`{:.language-bash}), we’ll need to install install some NPM dependencies to work with React, Apollo, etc…:

<pre class='language-bash'><code class='language-bash'>
npm install --save react react-dom apollo-client react-apollo \
                         graphql-tag babel-preset-react
</code></pre>

Next, we’ll need to tell Brunch how to we want our ES6 transpiled by tweaking our Babel options in `brunch-config.js`{:.language-bash}:

<pre class='language-javascript'><code class='language-javascript'>
plugins: {
  babel: {
    presets: ["es2015", "react"],
    ...
</code></pre>

The last thing we need to do is replace the HTML our Phoenix application generates (in `app.html.eex`{:.language-bash}) with an empty `<div>`{:.language-markup} to hold our React application:

<pre class='language-markup'><code class='language-markup'>
 &lt;div id="app">&lt;/div>
</code></pre>

Now we can copy over the `<PostList>`{:.language-markup} component from the Apollo example. We’ll throw it in a file called `PostList.jsx`{:.language-bash}.

Lastly, we’ll create an instance of `ApolloClient`{:.language-javascript} and wire up the `<PostList>`{:.language-markup} component to our container `<div>`{:.language-markup} in our `app.js`{:.language-bash}:

<pre class='language-javascript'><code class='language-javascript'>
const client = new ApolloClient();

ReactDOM.render(
  &lt;ApolloProvider client={client}>
    &lt;PostList />
  &lt;/ApolloProvider>,
  document.getElementById("app")
);
</code></pre>

And that’s it! When our application reloads, we’ll see all of the hard-coded author and post data from our server loaded up and rendered on the client.

## How it Works

This is obviously a drastically over-simplified example of what GraphQL can do, but it’s a good jumping off point. Let’s see how all of it ties together, starting on the client.

The `<PostList>`{:.language-markup} component we pulled from the Apollo example is a simple component that expects to be passed a `loading`{:.language-javascript} boolean and a list of `posts`{:.language-javascript} inside of a `data`{:.language-javascript} property.

If `loading`{:.language-javascript} is true, we’ll show a loading message. Otherwise, we’ll render the list of `posts`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
function PostList({ data: { loading, posts } }) {
  if (loading) {
    return &lt;div>Loading&lt;/div>;
  } else {
    return (&lt;ul>{posts.map(post => … )} &lt;/ul>);
  }
}
</code></pre>

Where do `loading`{:.language-javascript} and `posts`{:.language-javascript} come from? The `loading`{:.language-javascript} field is controlled by the Apollo client. When we’re waiting on the response for a GraphQL query, `loading`{:.language-javascript} will be `true`{:.language-javascript}. The `posts`{:.language-javascript} field actually comes directly from the response to our GraphQL query.

When we export `PostList`{:.language-javascript}, we actually wrap it in a GraphQL query that describes the data this component needs to render:

<pre class='language-javascript'><code class='language-javascript'>
export default graphql(gql`
  query allPosts {
    posts {
      id
      title
      votes
      author {
        id
        firstName
        lastName
      }
    }
  }
`)(PostList);
</code></pre>

The shape of a GraphQL query’s response maps directly to the shape of the query itself. Notice how we’re asking for a set of `posts`{:.language-javascript}. We want each post to be returned with an `id`{:.language-javascript}, `title`{:.language-javascript}, `votes`{:.language-javascript}, and an `author`{:.language-javascript} object, complete with `id`{:.language-javascript}, `firstName`{:.language-javascript}, and `lastName`{:.language-javascript}.

Our response will look exactly like this:

<pre class='language-javascript'><code class='language-javascript'>
{
  posts: [
    {
      id: 1,
      title: "GraphQL Rocks",
      votes: 3,
      author: {
        id: 1,
        firstName: "Sashko",
        lastName: "Stubailo"
      }
    },
    ...
  ]
}
</code></pre>

This is the power of GraphQL. It inverts the normal query/result relationship between the client and the server. The client tells the server exactly what it needs, and that exact data is returned from the query. No more, no less.

Apollo takes that client-first mentality even further. With Apollo, _each component_ tells the server exactly what it needs and manages it’s data lifecycle entirely on its own, independent from other components in the application.

## Final Thoughts

I’m really excited about the combination of an Elixir/Absinthe back-end driving an Apollo-powered client front-end.

I’ve only just started playing with this combination, but I hope to start building out more complex and realistic applications to see if it lived up to my hopes and expectations.

Be sure to check out [the entire project on GitHub](https://github.com/pcorey/hello_absinthe). Have you used Absinthe or any part of the Apollo stack? If so, shoot me an email and let me know your opinions!
