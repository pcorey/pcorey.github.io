---
layout: post
title:  "Nested Resources, Camel Casing, and Open API Spex"
excerpt: "Documenting camel cased APIs with Open API Spex can be problematic when making heavy use of nested Phoenix resources."
author: "Pete Corey"
date:   2021-11-09
tags: ["Elixir", "Phoenix", "OpenAPI"]
related: []
---

My current client project requires that all public facing APIs exposed by our Elixir Phoenix application be camel cased, rather than snake cased. Thanks to the help of the plugs provided by [`casex`{:.language-elixir}](https://hexdocs.pm/casex/Casex.html), this was no sweat to implement. However, the Phoenix router in this project makes heavy use of nesting [the `resource/4`{:.language-elixir} macro](https://hexdocs.pm/phoenix/Phoenix.Router.html#resources/4), which poses a problem when combined with the `open_api_spex`{:.language-elixir} package we're using to build and serve our project's Swagger documentation.

Imagine we're defining a "Foos" resource with a nested "Bars" index route in our router like so:

<pre class='language-elixir'><code class='language-elixir'>
resources "/foos", Web.FooController do
  get "/bars", Web.BarController, :foo_index
end
</code></pre>

The `open_api_spex`{:.language-elixir} package lets you document your path parameters  following a camel case convention, if you choose to do so. We could document the `:foo_index`{:.language-elixir} action in our `Web.BarController`{:.language-elixir} like so:

<pre class='language-elixir'><code class='language-elixir'>
operation :foo_index,
parameters: [
  fooId: [
    in: :path,
    type: :integer,
    ...
  ]
],
...
</code></pre>

In our example, `fooId`{:.language-elixir} will appear in our route's list of documented parameters within our Swagger documentation, but the route itself will still look like this:

<pre class='language-elixir'><code class='language-elixir'>
/foos/{foo_id}/bars
</code></pre>

Not only is the route showing its parameter in snake case, but the corresponding documentation of that parameter is in camel case. This is confusing to say the least.

We need to change how `open_api_spex`{:.language-elixir} displays the nested resource variables in our application's API routes.

[Out of the box](https://github.com/open-api-spex/open_api_spex#main-spec), the `open_api_spex`{:.language-elixir} library uses [`OpenApiSpex.Paths.from_router/1`{:.language-elixir}](https://hexdocs.pm/open_api_spex/OpenApiSpex.Paths.html#from_router/1) to build a map from your application's routes to `OpenApiSpex.PathItem`{:.language-elixir} structs describing those routes.

The map containing our nested route might look something like this:

<pre class='language-elixir'><code class='language-elixir'>
%{
  "/foos/{foo_id}/bars" => %OpenApiSpex.PathItem{
    ...
  },
  ...
}
</code></pre>

The keys to this map are literally the string representations of the routes in your application. These keys are what's displayed in Swagger UI, and they're what we need to change in order to fix our problem.

To change the offending snake cased `foo_id`{:.language-elixir} in our path, we simply need to map over the result of `OpenApiSpex.Paths.from_router/1`{:.language-elixir} and camel case every key in the map:

<pre class='language-elixir'><code class='language-elixir'>
def spec do
  %OpenApi{
    ...
    # Populate the paths from a phoenix router
    paths:
      Paths.from_router(Router)
      |> camel_case_paths()
  }
  |> OpenApiSpex.resolve_schema_modules()
end

defp camel_case_paths(paths) do
  paths
  |> Enum.map(fn {key, value} -> {Recase.to_camel(key), value} end)
  |> Enum.into(%{})
end
</code></pre>

In this example we're using [`recase`{:.language-elixir}](https://hex.pm/packages/recase) to handle our camel casing.

The resulting map looks something like this:

<pre class='language-elixir'><code class='language-elixir'>
%{
  "/foos/{fooId}/bars" => %OpenApiSpex.PathItem{
    ...
  },
  ...
}
</code></pre>

Opening up our Swagger documentation, we can see that the path parameter in our route's URL is camel cased, as expected:

<pre class='language-elixir'><code class='language-elixir'>
/foos/{fooId}/bars
</code></pre>

Victory!
