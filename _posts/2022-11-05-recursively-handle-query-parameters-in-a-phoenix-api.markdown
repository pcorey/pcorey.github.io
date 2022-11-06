---
layout: post
title:  "Recursively Handle Query Parameters in a Phoenix API"
excerpt: "Handle combinations of query parameters with recursive function calls and pattern matching function heads."
author: "Pete Corey"
date:   2022-11-05
tags: ["Elixir", "Phoenix", "API"]
related: []
---

It's very common when building a Phoenix JSON API to have an endpoint that accepts a number of optional query parameters. In my applications, I've fallen into a pattern of handling these query parameters with a combination of recursive function calls and focused pattern matching. Here's a rundown of my method.

Imagine we're building a `/foos`{:.language-elixir} endpoint and a corresponding `:index`{:.language-elixir} action:

<pre class='language-elixir'><code class='language-elixir'>
resources "/foos", FooController, only: [:index]
</code></pre>

We want our `/foos`{:.language-elixir} route to optionally accept `search`{:.language-elixir}, `limit`{:.language-elixir}, and `offset`{:.language-elixir} query parameters:

A naive way of handling every possible combination of these three query parameters might involve writing seven function heads to handle every combination of the three:

<pre class='language-elixir'><code class='language-elixir'>
@query from f in Foo, order_by: f.id

def index(conn, %{"search" => search}) do
  query = from f in @query, where: ilike(f.display_name, ^"%#{search}%")
  render("index.json", foos: Repo.all(query))
end

def index(conn, %{"limit" => limit}) do
  query = from f in @query, limit: ^limit
  render("index.json", foos: Repo.all(query))
end

def index(conn, %{"offset" => offset}) do
  query = from f in @query, offset: ^offset
  render("index.json", foos: Repo.all(query))
end

def index(conn, %{"search" => search, "limit" => limit}) do
  query = from f in @query,
    where: ilike(f.display_name, ^"%#{search}%"),
    limit: ^limit
    
  render("index.json", foos: Repo.all(query))
end

def index(conn, %{"search" => search, "offset" => offset}) do
  query = from f in @query,
    where: ilike(f.display_name, ^"%#{search}%"),
    offset: ^offset
    
  render("index.json", foos: Repo.all(query))
end

def index(conn, %{"limit" => limit, "offset" => offset}) do
  query = from f in @query, limit: ^limit, offset: ^offset
  render("index.json", foos: Repo.all(query))
end

def index(conn, %{"search" => search, "limit" => limit, "offset" => offset}) do
  query = from f in @query,
    where: ilike(f.display_name, ^"%#{search}%"),
    limit: ^limit,
    offset: ^offset
    
  render("index.json", foos: Repo.all(query))
end
</code></pre>

This kind of combinatorial explosion in our code can quickly become impossible to manage. Even this small example was almost too much to fully flesh out.

A better way to handle these types of optional query parameter combinations is to write a function with multiple heads, where each head handles a specific query parameter, or a linked set of query parameters, and then recursively calls itself to handle any other parameters.

Let's see how that looks with our example:

<pre class='language-elixir'><code class='language-elixir'>
@query from f in Foo, order_by: f.id
         
def index(conn, params) do
  index(conn, params, @query)
end

def index(conn, %{"search" => search} = params, query) do
  query = from f in query, where: ilike(f.display_name, ^"%#{search}%")
  index(conn, Map.delete(params, "search"), query)
end

def index(conn, %{"limit" => limit} = params, query) do
  query = from f in query, limit: ^limit
  index(conn, Map.delete(params, "limit"), query)
end

def index(conn, %{"offset" => offset} = params, query) do
  query = from f in query, offset: ^offset
  index(conn, Map.delete(params, "offset"), query)
end

def index(conn, _params, query) do
  render(conn, "index.json", foos: Repo.all(query))
end
</code></pre>

The first `index/2`{:.language-elixir} function is called by our router and immediately calls into `index/3`{:.language-elixir} with our base `@query`{:.language-elixir}. The next three `index/3`{:.language-elixir} function heads match on a single query parameter and update the provided `query`{:.language-elixir} accordingly. Finally, the last `index/3`{:.language-elixir} function head is invoked when we've exhausted the set of `params`{:.language-elixir} we can handle, so we run our `query`{:.language-elixir} and `render`{:.language-elixir} the results.

This setup can handle any combination of `search`{:.language-elixir}, `limit`{:.language-elixir}, and `offset`{:.language-elixir}, and new parameters can easily be added into the mix.

This pattern has been working well for me, but I'm curious, how do you handle query parameters in your Phoenix applications?
