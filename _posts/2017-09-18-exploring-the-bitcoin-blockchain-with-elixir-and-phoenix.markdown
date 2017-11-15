---
layout: post
title:  "Exploring the Bitcoin Blockchain with Elixir and Phoenix"
description: "Let's use the Phoenix framework and our Bitcoin node interface to build a basic Bitcoin blockchain explorer!"
author: "Pete Corey"
date:   2017-09-18
tags: ["Bitcoin", "Blockchain", "Elixir", "Phoenix"]
---

Earlier this month [we dove into the brave new world of Bitcoin development](http://www.east5th.co/blog/2017/09/04/controlling-a-bitcoin-node-with-elixir/) by writing [an Elixir module](https://github.com/pcorey/hello_bitcoin/blob/master/lib/hello_bitcoin.ex) that could communicate with a [Bitcoin full node](https://bitcoin.org/en/full-node). At this end of the day, we had a small handful of Elixir functions that could retrieve some basic information about the Bitcoin blockchain.

Let’s expand on that idea a bit.

In this article we’re going to use the [Phoenix framework](http://phoenixframework.org/) to build a bare-bones blockchain viewer. Let’s get to it!

## Project Scaffolding

First things first, let’s create our new Phoenix project. We’ll be using [Phoenix 1.3](http://phoenixframework.org/blog/phoenix-1-3-0-released) and the new `phx`{:.language-elixir} generators that shipped with it:

<pre class='language-bash'><code class='language-bash'>
mix phx.new hello_blockchain --no-ecto
</code></pre>

Once we’ve gone ahead and set up our new project, let’s add two new routes to our application. One for viewing block headers, and another for viewing full blocks:

<pre class='language-bash'><code class='language-bash'>
mix phx.gen.html Blockchain Header headers --no-schema
</code></pre>

<pre class='language-bash'><code class='language-bash'>
mix phx.gen.html Blockchain Blocks blocks --no-schema
</code></pre>

Notice that we specified `--no-ecto`{:.language-bash} when generating our new project, and `--no-schema`{:.language-bash} when generating our block and header resources. We don’t be needing [Ecto](https://github.com/elixir-ecto/ecto) in our blockchain viewer. All of the data we’re rendering lives in our full node!

## Our Blockchain Context

When we generated our header and block resources, we also generated a `Blockchain`{:.language-elixir} context module. Our context will be our interfacing with our Bitcoin full node.

Sound familiar?

That’s because we implemented the `Blockchain`{:.language-elixir} context module in our last article! Let’s remove the auto-generated contents of `Blockchain`{:.language-elixir} and copy over [the `bitcoin_rpc`{:.language-elixir} function](https://github.com/pcorey/hello_bitcoin/blob/master/lib/hello_bitcoin.ex#L3-L15).

<pre class='language-elixir'><code class='language-elixir'>
def bitcoin_rpc(method, params \\ []) do
  with url <- Application.get_env(:hello_bitcoin, :bitcoin_url),
       command <- %{jsonrpc: "1.0", method: method, params: params},
       {:ok, body} <- Poison.encode(command),
       {:ok, response} <- HTTPoison.post(url, body),
       {:ok, metadata} <- Poison.decode(response.body),
       %{"error" => nil, "result" => result} <- metadata do
    {:ok, result}
  else
    %{"error" => reason} -> {:error, reason}
    error -> error
  end
end
</code></pre>

Be sure to add dependencies on `:httpoison`{:.language-elixir} and `:poison`{:.language-elixir}, and set up your `:bitcoin_url`{:.language-elixir} in your configuration file.

Once we’ve finished that, we’ll add four helper functions to our `Blockchain`{:.language-elixir} module. we’ll use these functions to fetch the data we want to render with our blockchain viewer:

<pre class='language-elixir'><code class='language-elixir'>
def getbestblockhash, do: bitcoin_rpc("getbestblockhash")
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
def getblockhash(height), do: bitcoin_rpc("getblockhash", [height])
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
def getblock(hash), do: bitcoin_rpc("getblock", [hash])
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
def getblockheader(hash), do: bitcoin_rpc("getblockheader", [hash])
</code></pre>

Now that we have a functional context module, we can start wiring it up to our routes.

## Routing

Armed with our newly generated block and header resources, let’s add their new routes to our router:

<pre class='language-elixir'><code class='language-elixir'>
scope "/", HelloBlockchainWeb do
  pipe_through :browser
  resources "/", PageController, only: [:index]
  resources "/blocks", BlockController, only: [:index, :show]
  resources "/headers", HeaderController, only: [:index, :show]
end
</code></pre>

For now, we’re only going to be handling the `:index`{:.language-elixir} and `:show`{:.language-elixir} routes for our blocks and headers.

Now that our routes are established, let’s move on to refactoring our controller modules. We’ll start with the `BlockController`{:.language-elixir}.

We’re going to remove all of our controller functions except the `index`{:.language-elixir} and `show`{:.language-elixir} functions, which we’ll heavily modify.

When we hit the `/blocks/`{:.language-elixir} route, we’ll fall into the `index`{:.language-elixir} controller function. We want this function to redirect us to the most recent block in the blockchain:

<pre class='language-elixir'><code class='language-elixir'>
def index(conn, _params) do
  with {:ok, hash} <- Blockchain.getbestblockhash() do
    redirect(conn, to: block_path(conn, :show, hash))
  end
end
</code></pre>

We use `getbestblockhash`{:.language-elixir} to get the hash of the most recently validated Bitcoin block, and we redirect the user to the `:show`{:.language-elixir} route, providing the resulting hash.

Our `show`{:.language-elixir} controller function accepts the provided `hash`{:.language-elixir} as an argument, fetches more information about the block from our full node, and finally renders the block using the `show.html`{:.language-elixir} template:

<pre class='language-elixir'><code class='language-elixir'>
def show(conn, %{"id" => hash}) do
  with {:ok, block} <- Blockchain.getblock(hash) do
    render(conn, "show.html", block: block)
  end
end
</code></pre>

---- 

Similarly, the `index`{:.language-elixir} function in the `HeaderController`{:.language-elixir} redirects the user to the `:show`{:.language-elixir} route of the most recently verified block:

<pre class='language-elixir'><code class='language-elixir'>
def index(conn, _params) do
  with {:ok, hash} <- Blockchain.getbestblockhash() do
    redirect(conn, to: header_path(conn, :show, hash))
  end
end
</code></pre>

While the `show`{:.language-elixir} function fetches the relevant information using `Blockchain.getblockheader`{:.language-elixir} and passes it into its `show.html`{:.language-elixir} template:

<pre class='language-elixir'><code class='language-elixir'>
def show(conn, %{"id" => hash}) do
  with {:ok, block} <- Blockchain.getblockheader(hash) do
    render(conn, "show.html", block: block)
  end
end
</code></pre>

---- 

There’s one final route we need to implement. When a user hits our application for the first time, they’ll land on the Phoenix landing page. Instead, let’s show them the most recent block header:

<pre class='language-elixir'><code class='language-elixir'>
def index(conn, _params) do
  with {:ok, hash} <- Blockchain.getbestblockhash() do
    redirect(conn, to: header_path(conn, :show, hash))
  end
end
</code></pre>

Once again, we use `Blockchain.getbestblockhash`{:.language-elixir} to fetch the most recently verified block hash from our Bitcoin full node. We use that hash to redirect the user to the header’s `:show`{:.language-elixir} route.

With our routes properly configured, we can fetch data about any full block or block header just by knowings its hash.

Let’s more on to the final piece of the puzzle: rendering that data.

## Templates

Our blockchain viewer now correctly routes the user to the appropriate `:show`{:.language-elixir} route for either the block or block header they’re trying to view, and passes all relevant data to the corresponding template to render.

Now all we need to do is build out our templates!

To keep the scope of this article manageable, we’ll keep our user interface as minimal as possible. The more bare-bones way to render our blocks and headers, while still being meaningful to our users, is to render the data received from our controllers as JSON code blocks.

The simplest way to do this would be to dump the output of `Poison.encode!`{:.language-elixir} into the DOM:

<pre class='language-markup'><code class='language-markup'>
&lt;code>&lt;%= Poison.encode!(@block, pretty: true) %>&lt;/code>
</code></pre>

The `pretty: true`{:.language-elixir} option passed into `Poison.encode!`{:.language-elixir} ensures that the resulting JSON string is nicely formatted. In our `app.css`{:.language-elixir} file, we should set the `white-space`{:.language-elixir} rule on `<code>`{:.language-elixir} blocks to preserve this formatting:

<pre class='language-css'><code class='language-css'>
code {
  white-space: pre !important;
}
</code></pre>

Beautiful. 

<a href="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/blockchain-viewer-01.png" style="display: block; background-color: transparent; color: #ccc; text-align: center; line-height: 1; font-size: 0.8; margin: 2em auto;"><img style="display:block; width: 75%; margin: 0 auto 1em;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/blockchain-viewer-01.png"/>A basic block header.</a>

A bit minimal, but beautiful none-the-less.

---- 

While dumping raw JSON into the DOM is informative, it’s not especially user-friendly. Let’s add an extra layer of interactivity to our blockchain viewer.

The blocks and block headers we receive from our Bitcoin full node come with `previousblockhash`{:.language-elixir} field and (usually) a `nextblockhash`{:.language-elixir} field. These hashes, as we would expect, point to the previous and next blocks in the blockchain, respectively. Let’s transform these hashes into links so users can easily navigate through the blockchain.

The first thing we’ll do is write a function in the corresponding view file that converts hashes into links. In our `HeaderView`{:.language-elixir} module, our `hash_link`{:.language-elixir} function would look like this:

<pre class='language-elixir'><code class='language-elixir'>
defp hash_link(hash), do: "&lt;a href='/headers/#{hash}'>#{hash}&lt;/a>"
</code></pre>

Using this function, we can write a function that modifies our block header. It replaces the hashes in `previousblockhash`{:.language-elixir} and `nextblockhash`{:.language-elixir} with links to those blocks, and JSON encodes the resulting object:

<pre class='language-elixir'><code class='language-elixir'>
def mark_up_block(block) do
  block
  |> Map.replace("previousblockhash", hash_link(block["previousblockhash"]))
  |> Map.replace("nextblockhash", hash_link(block["nextblockhash"]))
  |> Poison.encode!(pretty: true)
end
</code></pre>

In our HTML template, we can replace the contents of our `<code>`{:.language-elixir} block with the result of `mark_up_block`{:.language-elixir}:

<pre class='language-markup'><code class='language-markup'>
&lt;code>&lt;%= raw(mark_up_block(@block)) %>&lt;/code>
</code></pre>

Notice that we’re wrapping `mark_up_block`{:.language-elixir} with `raw`{:.language-elixir}. We want to HTML being injected into our JSON to be interpreted as raw HTML, and not encoded as special characters.

After carrying out the same changes in our `BlockView`{:.language-elixir} and our block HTMl template, cleaning up our layout template, and adding a few final styling touches, we have our result.

<a href="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/blockchain-viewer-02.png" style="display: block; background-color: transparent; color: #ccc; text-align: center; line-height: 1; font-size: 0.8; margin: 2em auto;"><img style="display:block; width: 75%; margin: 0 auto 1em;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/blockchain-viewer-02.png"/>A decorated full block.</a>

Behold, the most basic of blockchain explorers!

## Final Thoughts

Obviously, this is just the tip of the iceberg when it comes to building a Bitcoin blockchain explorer.

I’m super excited about Bitcoin and development projects related to Bitcoin. If you’ve made it this far, I assume you are as well! If you’re looking for a deep dive into Bitcoin development, I recommend you check out the fantastic [Mastering Bitcoin](https://www.amazon.com/gp/product/1491954388/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=east5th-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1491954388&linkId=c1ff439b422b447867a247fee90e76d0) (affiliate link) book by Andreas Antonopoulos.

Expect more updates to this blockchain explorer in the future, and more Bitcoin focused projects. In the meantime, check out this project [on Github](https://github.com/pcorey/hello_blockchain).
