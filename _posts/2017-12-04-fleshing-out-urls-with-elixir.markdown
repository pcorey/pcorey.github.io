---
layout: post
title:  "Fleshing out URLs with Elixir"
description: "Step one of crawling a web page is getting a fully fleshed out URL pointing to that page. Unfortunately, people usually think of URLs in fuzzy, incomplete terms. Thankfully, fleshing out the missing details is simple with Elixir."
author: "Pete Corey"
date:   2017-12-11
tags: ["Elixir", "Affiliate Crawler", "Web Crawling"]
related: ["/blog/2017/10/09/learning-to-crawl-building-a-bare-bones-web-crawler-with-elixir/", "/blog/2017/11/20/crawling-for-cash-with-affiliate-crawler/"]
---

My most recent side project, [Affiliate Crawler](https://www.affiliatecrawler.com/), is a web crawler designed to find links in your written content that can be turned into affiliate links.

If you’re curious, be sure to [read more about the how, what, and why behind Affiliate Crawler](/blog/2017/11/20/crawling-for-cash-with-affiliate-crawler/).

Affiliate Crawler works by being given a starting URL that points to your content. It crawls that page, looking for external links that can potentially be monetized, and internal links to crawl further.

Unfortunately, [the Elixir-based crawler that powers Affiliate Crawler](http://www.east5th.co/blog/2017/10/09/learning-to-crawl-building-a-bare-bones-web-crawler-with-elixir/) only works correctly when given fully qualified URLs, such as `http://www.east5th.co/`{:.language-url}. Partial URLs, like `www.east5th.co`{:.language-url} result in parsing errors and a general “failure to crawl”.

This is unfortunate because most people deal exclusively in partially formed URLs. You tell people to go to `google.com`{:.language-url}, not `http://www.google.com/`{:.language-url}. This seems to be especially true when prompted for URLs online.

What we need is a way to infer fully fleshed out URLs from user-provided partial URLs, just like we naturally would in conversation.

Thankfully, this is ridiculously easy thanks to Elixir’s `URI`{:.language-elixir} module, pattern matching, and the awesome power of recursion!

## The Parts of a Parsed URL

Elixir’s [`URI.parse/1`{:.language-elixir} function](https://hexdocs.pm/elixir/URI.html#parse/1) accepts a `uri`{:.language-elixir} string as an argument and returns a `URI`{:.language-elixir} struct that holds the component pieces that make up that `uri`{:.language-elixir}.

For example, parsing `"http://www.east5th.co/"`{:.language-elixir} returns the following data:

<pre class='language-elixir'><code class='language-elixir'>
%URI{authority: "www.east5th.co", fragment: nil, host: "www.east5th.co",
 path: "/", port: 80, query: nil, scheme: "http", userinfo: nil}
</code></pre>

`URI.parse/1`{:.language-elixir} only works on fully fleshed out URLs. Attempting to parse a partially specified `uri`{:.language-elixir} string, like `"east5th.co"`{:.language-elixir}, returns a mostly empty struct:

<pre class='language-elixir'><code class='language-elixir'>
%URI{authority: nil, fragment: nil, host: nil, path: "east5th.co", port: nil,
 query: nil, scheme: nil, userinfo: nil}
</code></pre>

The major pieces of missing information needed to properly parse this `uri`{:.language-elixir} are the `path`{:.language-elixir}, and the `scheme`{:.language-elixir}. Given those two pieces of information, everything else can be inferred by `URI.parse/1`{:.language-elixir}.

Thankfully, we can come up with some fairly reasonable defaults for both `path`{:.language-elixir} and `scheme`{:.language-elixir}. If no path is provided, as in a `uri`{:.language-elixir} like `"http://www.east5th.co"`{:.language-elixir}, we could assume a default of `"/"`{:.language-elixir}. If no `scheme`{:.language-elixir} is specified, like in `"www.east5th.co/`{:.language-elixir}, we could assume a default of `http`{:.language-elixir}.

But how do we know when and where to add these default values to our `uri`{:.language-elixir} string?

Always prepending `"http://"`{:.language-elixir} and appending `"/"`{:.language-elixir} leads to obvious problems in most cases. Using a regex-based check sounds fragile and error-prone.

There has to be some other way.

## Pattern Matching and Recursion

In turns out that [pattern matching](http://elixir-lang.github.io/getting-started/pattern-matching.html#pattern-matching-1) makes it incredibly easy to know wether we need to provide a default `path`{:.language-elixir} or `scheme`{:.language-elixir}. After our first pass through `URI.parse/1`{:.language-elixir}, we can look for `nil`{:.language-elixir} values in either `path`{:.language-elixir} or `scheme`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
case URI.parse(uri) do
  %URI{scheme: nil} ->
    # Needs default scheme
  %URI{path: nil} ->
    # Needs default path
  %URI{} ->
    # Successfully parsed
end
</code></pre>

But pattern matching alone doesn’t give us our solution…

But what if `uri`{:.language-elixir} needs both a `scheme`{:.language-elixir} and `path`{:.language-elixir}, as in the case of `"www.east5th.co"`{:.language-elixir}? And wouldn’t we still need to re-parse the newly fleshed out `uri`{:.language-elixir} to populate the inferred fields in the `URI`{:.language-elixir} struct like `port`{:.language-elixir}, and `authority`{:.language-elixir}?

Thankfully, wrapping our `URI.parse/1`{:.language-elixir} call in a function and calling that function recursively elegantly solves both problems:

<pre class='language-elixir'><code class='language-elixir'>
defp parse(uri) do
  case URI.parse(uri) do
    %URI{scheme: nil} ->
      parse("http://#{url}")
    %URI{path: nil} ->
      parse("#{url}/")
    parsed ->
      parsed
  end
end
</code></pre>

We define a function called `parse`{:.language-elixir} and within that function we parse the provided `uri`{:.language-elixir} string with a call to `URI.parse/1`{:.language-elixir}.

If `URI.parse/1`{:.language-elixir} returns a `URI`{:.language-elixir} struct without a `scheme`{:.language-elixir}, we recursively call `parse`{:.language-elixir} with `"http://"`{:.language-elixir} prepended to the current `uri`{:.language-elixir}.

Similarly, if `URI.parse/1`{:.language-elixir} returns a `URI`{:.language-elixir} struct without a `path`{:.language-elixir}, we recursively call `parse`{:.language-elixir} with `"/"`{:.language-elixir} appended to the current `uri`{:.language-elixir} string.

Otherwise, we return the parsed `URI`{:.language-elixir} struct generated from our fully-qualified URL.

---- 

Depending on your personal preference, we could even write our `parse/1`{:.language-elixir} function with our pattern matching spread across multiple function heads:

<pre class='language-elixir'><code class='language-elixir'>
def parse(uri) when is_binary(uri), do: parse(URI.parse(uri))
def parse(uri = %URI{scheme: nil}), do: parse("http://#{to_string(uri)}")
def parse(uri = %URI{path: nil}),   do: parse("#{to_string(uri)}/")
def parse(uri),                     do: uri
</code></pre>

Pattern matching and recursion, regardless of your preferred style, can lead to some truly beautiful code.

## Final Thoughts

I’m continually amazed by the tools offered by the Elixir programming language straight out of the box. Pattern matching, a recursion-first philosophy, and even the incredibly useful `URI`{:.language-elixir} module are examples of techniques and features that make your day-to-day development life easier when working this this language.

If you want to see how I used these tools to build fully-qualified URLs from partial user input, [check out the Affiliate Crawler source code on Github](https://github.com/pcorey/affiliate_crawler/blob/master/lib/affiliate_crawler/crawler.ex#L19-L28), and check it out in action at [Affiliate Crawler](https://www.affiliatecrawler.com/).
