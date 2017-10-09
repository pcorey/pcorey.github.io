---
layout: post
title:  "Learning to Crawl - Building a Bare Bones Web Crawler with Elixir"
date:   2017-10-09
tags: []
---

I’ve been cooking up a side project recently that involves crawling through a domain, searching for links to specific websites.

While I’m keeping the details of the project shrouded in mystery for now, building out a web crawler using Elixir sounds like a fantastic learning experience.

Let’s roll up our sleeves and dig into it!

## Let’s Think About What We Want

Before we start writing code, it’s important to think about what we want to build.

We’ll kick off the crawling process by handing our web crawler a starting URL. The crawler will fetch the page at that URL and look for links (`<a>`{:.language-markup} tags with `href`{:.language-markup} attributes) to other pages.

If the crawler finds a link to a page on the same domain, it’ll repeat the crawling process on that new page. This second crawl is considered one level “deeper” than the first. Our crawler should have a configurable maximum depth.

Once the crawler has traversed all pages on the given domain up to the specified depth, it will return a list of all internal and external URLs that the crawled pages link to.

To keep things efficient, let’s try to parallelize the crawling process as much as possible.

## Crawling a Page

Let’s start off our crawler project by creating a new Elixir project:

<pre class='language-bash'><code class='language-bash'>
mix new hello_crawler
</code></pre>

Based on the description given above, we know that we’ll need some function (or set of functions) that takes in a starting URL, fetches the page, and looks for links.

Let’s start sketching out that function:

<pre class='language-elixir'><code class='language-elixir'>
def get_links(url) do
  [url]
end
</code></pre>

So far our function just returns a list holding URL that was passed into it. That’s a start, I guess…

We’ll use [`HTTPoison`{:.language-elixir}](https://hex.pm/packages/httpoison) to fetch the page at that URL (being sure to specify that we want to follow `301`{:.language-elixir} redirects), and pull the resulting HTML out of the `body`{:.language-elixir} field of the response:

<pre class='language-elixir'><code class='language-elixir'>
with {:ok, %{body: body}} <- HTTPoison.get(url, [], follow_redirect: true) do
  [url]
else
  _ -> [url]
end
</code></pre>

Notice that we’re using a `with`{:.language-elixir} block and pattern matching on a successful call to `HTTPoison.get`{:.language-elixir}. If a failure happens anywhere in our process, we abandon ship and return the current `url`{:.language-elixir} in a list.

Now we can use [`Floki`{:.language-elixir}](https://hex.pm/packages/floki) to search for any `<a>`{:.language-elixir} tags within our HTML and grab their `href`{:.language-elixir} attributes:

<pre class='language-elixir'><code class='language-elixir'>
with {:ok, %{body: body}} <- HTTPoison.get(url, [], [follow_redirect: true]),
     tags                 <- Floki.find(body, "a"),
     hrefs                <- Floki.attribute(tags, "href") do
  [url | body
         |> Floki.find("a")
         |> Floki.attribute("href")]
else
  _ -> [url]
end
</code></pre>

Lastly, let’s clean up our code by replacing our `with`{:.language-elixir} block with a new `handle_response`{:.language-elixir} function with multiple function heads:

<pre class='language-elixir'><code class='language-elixir'>
def handle_response(url, {:ok, %{body: body}}) do
  [url | body
         |> Floki.find("a")
         |> Floki.attribute("href")]
end

def handle_response(url, _response) do
  [url]
end

def get_links(url) do
  headers = []
  options = [follow_redirect: true]
  handle_response(url, base_uri, HTTPoison.get(url, headers, options))
end
</code></pre>

<div style="float: right; width: 30%; margin: 0 0 1em 1em;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/crawler.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Hello, Crawler.</p>
</div>

This step is purely a stylistic choice. I find `with`{:.language-elixir} blocks helpful for sketching out solutions, but prefer the readability of branching through multiple function heads.

Running our `get_links`{:.language-elixir} function against a familiar site should return a handful of internal and external links:

<pre class='language-elixir'><code class='language-elixir'>
iex(1)> HelloCrawler.get_links("http://www.east5th.co/")
["http://www.east5th.co/", "/", "/blog/", "/our-work/", "/services/", "/blog/",
 "/our-work/", "/services/",
 "https://www.google.com/maps/place/Chattanooga,+TN/", "http://www.amazon.com/",
 "https://www.cigital.com/", "http://www.tapestrysolutions.com/",
 "http://www.surgeforward.com/", "/blog/", "/our-work/", "/services/"]
</code></pre>

Quick, someone take a picture; it’s crawling!

## Crawling Deeper

While it’s great that we can crawl a single page, we need to go deeper. We want to scape links from our starting page and recursively scrape any other pages we’re linked to.

The most naive way of accomplishing this would be to recurse on `get_links`{:.language-elixir} for every new list of links we find:

<pre class='language-elixir'><code class='language-elixir'>
[url | body
       |> Floki.find("a")
       |> Floki.attribute("href")
       |> Enum.map(&get_links/1) # Recursive call get_links
       |> List.flatten]
</code></pre>

While this works conceptually, it has a few problems:

- Relative URLs, like `/services`{:.language-elixir}, don’t resolve correctly in our call to `HTTPoison.get`{:.language-elixir}.
- A page that links to itself, or a set of pages that form a loop, will cause our crawler to enter an infinite loop.
- We’re not restricting crawling to our original host.
- We’re not counting depth, or enforcing any depth limit.

Let’s address each of these issues.

## Handling Relative URLs

Many links within a page are relative; they don’t specify all of the necessary information to form a full URL.

For example, on `http://www.east5th.co/`{:.language-bash}, there’s a link to `/blog/`{:.language-bash}. Passing `"/blog/"`{:.language-elixir} into `HTTPoison.get`{:.language-elixir} will return an error, as `HTTPoison`{:.language-elixir} doesn’t know the context for this relative address.

We need some way of transforming these relative links into full-blown URLs given the context of the page we’re currently crawling. Thankful, Elixir’s standard library ships with [the fantastic `URI`{:.language-elixir} module](https://hexdocs.pm/elixir/URI.html) that can help us do just that!

Let’s use `URI.merge`{:.language-elixir} and `to_string`{:.language-elixir} to transform all of the links scraped by our crawler into well-formed URLs that can be understood by `HTTPoison.get`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def handle_response(url, {:ok, %{body: body}}) do
  [url | body
         |> Floki.find("a")
         |> Floki.attribute("href")
         |> Enum.map(&URI.merge(url, &1)) # Merge our URLs
         |> Enum.map(&to_string/1) # Convert the merged URL to a string
         |> Enum.map(&get_links/1)
         |> List.flatten]
end
</code></pre>

Now our link to `/blog/`{:.language-bash} is transformed into `http://www.east5th.co/blog/`{:.language-bash} before being passed into `get_links`{:.language-elixir} and subsequently `HTTPoison.get`{:.language-elixir}.

Perfect.

## Preventing Loops

While our crawler is correctly resolving relative links, this leads directly to our next problem: our crawler can get trapped in loops.

The first link on `http://www.east5th.co/`{:.language-bash} is to `/`{:.language-bash}. This relative link is translated into `http://www.east5th.co/`{:.language-bash}, which is once again passed into `get_links`{:.language-elixir}, causing an infinite loop.

To prevent looping in our crawler, we’ll need to maintain a list of all of the pages we’ve already crawled. Before we recursively crawl a new link, we need to verify that it hasn’t been crawled previously.

We’ll start by adding a new argument to `get_links`{:.language-elixir} called `path`{:.language-elixir}. The `path`{:.language-elixir} argument holds all of the URLs we’ve visited on our way to the current URL. It defaults to `[]`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def get_links(url, path \\ []) do # Our path starts out empty
  headers = []
  options = [follow_redirect: true]
  handle_response(url, path, HTTPoison.get(url, headers, options))
end
</code></pre>

Whenever we crawl a URL, we’ll add that URL to our `path`{:.language-elixir}, like a breadcrumb marking where we’ve been.

<div style="width: 100%; margin: 2em 0;">
  <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/crawler-path.png" style=" width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Crawler's path.</p>
</div>

Next, we’ll filter out any links we find that we’ve already visited, and append the current `url`{:.language-elixir} to `path`{:.language-elixir} before recursing on `get_links`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
path = [url | path] # Add a breadcrumb
[url | body
       |> Floki.find("a")
       |> Floki.attribute("href")
       |> Enum.map(&URI.merge(url, &1))
       |> Enum.map(&to_string/1)
       |> Enum.reject(&Enum.member?(path, &1)) # Avoid loops
       |> Enum.map(&get_links(&1, [&1 | path]))
       |> List.flatten]
</code></pre>

It’s important to note that this doesn’t completely prevent the repeated fetching of the same page. It simply prevents the same page being refetched in a single recursive chain, or path.

Imagine if page A links to pages B and C. If page B or C link back to page A, page A will not be refetched. However, if both page B and page C link to page D, page D will be fetched twice.

We won’t worry about this problem in this article, but caching our calls to `HTTPoison.get`{:.language-elixir} might be a good solution.

## Restricting Crawling to a Host

If we try and run our new and improved `WebCrawler.get_links`{:.language-elixir} function, we’ll notice that it takes a long time to run. __In fact in most cases, it'll never return!__

The problem is that we’re not limiting our crawler to crawl only pages within our starting point’s domain. If we crawl `http://www.east5th.co/`{:.language-bash}, we’ll eventually get linked to Google and Amazon, and from there, the crawling never ends.

We need to detect the host of the starting page we’re given, and restrict crawling to only that host.

Thankful, the `URI`{:.language-elixir} module comes to our rescue again.

We can use `URI.parse`{:.language-elixir} to pull out the `host`{:.language-elixir} of our starting URL, and pass it into each call to `get_links`{:.language-elixir} and `handle_response`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def get_links(url) do
  url = URI.parse(url)
  get_links(url, url.host, [])
end
</code></pre>

We’ll update the three argument function head of `get_links`{:.language-elixir} to enforce that we’re crawling on our original domain through pattern matching:

<pre class='language-elixir'><code class='language-elixir'>
def get_links(url = %{host: host}, host, path) do
</code></pre>

Along with another function head that catches any domain mismatches:

<pre class='language-elixir'><code class='language-elixir'>
def get_links(url, _host, _path) do
  [url]
end
</code></pre>

At this point, our `url`{:.language-elixir} is actually a `URI`{:.language-elixir} struct. We need to convert it back into a string before passing it into `HTTPoison.get`{:.language-elixir} and `handle_response`{:.language-elixir}, along with our expected `host`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
url = to_string(url)
response = HTTPoison.get(url, headers, options)
handle_response(url, host, path, response)
</code></pre>

You’ve probably noticed that our collected list of links is no longer a list of URL strings. Instead, it’s a list of `URI`{:.language-elixir} structs.

After we finish crawling through our target site, let’s convert all of those structs back into strings, and remove any duplicates:

<pre class='language-elixir'><code class='language-elixir'>
def get_links(url) do
  url = URI.parse(url)
  get_links(url, url.host, [])
  |> Enum.map(&to_string/1)
  |> Enum.uniq
end
</code></pre>

We’re crawling deep now!

## Limiting Our Crawl Depth

Once again, if we let our crawler loose on the world, it’ll most likely take a long time to get back to us.

Because we’re not limiting how deep our crawler can travel into our site, it’ll explore all possible paths [that don’t involve retracing its steps](#preventing-loops). We need a way of telling it not to continue crawling once it’s already followed a certain number of links and reached a specified depth.

Due to the way we structured out solution, __this is incredibly easy to implement!__

All we need to do is add another `get_links`{:.language-elixir} function head that has a `when`{:.language-elixir} clause preventing the length of `path`{:.language-elixir} from exceeding our desired depth:

<pre class='language-elixir'><code class='language-elixir'>
def get_links(url, _host, path) when length(path) > @max_depth do
  [url]
end
</code></pre>

Here we’re specifying our maximum allowed depth as a module attribute:

<pre class='language-elixir'><code class='language-elixir'>
@max_depth 3
</code></pre>

If our crawler tries to crawl deeper than the maximum allowed depth, this function head will simply return the `url`{:.language-elixir} being crawled, and prevent further recursion.

Simple and effective.

## Crawling in Parallel

While our crawler is fully functional at this point, it would be nice to improve upon it a bit. Instead of waiting for every path to be exhausted before crawling the next path, why can’t we crawl multiple paths in parallel?

Amazingly, parallelizing our web crawler is as simple as swapping our  map over the links we find on a page with a [parallelized map](http://elixir-recipes.github.io/concurrency/parallel-map/):

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.map(&(Task.async(fn -> get_links(URI.parse(&1), host, [&1 | path]) end)))
|> Enum.map(&Task.await/1)
</code></pre>

Instead of passing each scraped link into `get_links`{:.language-elixir} and waiting for it to fully crawl every sub-path before moving onto the next link, we pass all of our links into asynchronous calls to `get_links`{:.language-elixir}, and then wait for all of those asynchronous calls to return.

For every batch of crawling we do, we really only need to wait for the slowest page to be crawled, rather than waiting one by one for every page to be crawled.

Efficiency!

## Final Thoughts

It’s been a process, but we’ve managed to get our simple web crawler up and running.

While we accomplished everything we set out to do, our final result is still very much a bare bones web crawler. A more mature crawler would come equipped with more sophisticated scraping logic, rate limiting, caching, and more efficient optimizations.

That being said, I’m proud of what we’ve accomplished. Be sure to check out [the entire `HelloCrawler`{:.language-elixir} project on Github](https://github.com/pcorey/hello_crawler/blob/master/lib/hello_crawler.ex).
