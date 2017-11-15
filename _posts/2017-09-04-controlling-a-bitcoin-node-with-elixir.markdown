---
layout: post
title:  "Controlling a Bitcoin Node with Elixir"
description: "Explore how to communicate with a Bitcoin full node through its JSON-RPC interface from an Elixir application."
author: "Pete Corey"
date:   2017-09-04
tags: ["Bitcoin", "Blockchain", "Elixir"]
---

I’ve been bit by the [Bitcoin](https://bitcoin.org/en/) bug, and I’ve been bit hard. To satiate my thirst for knowledge, I’ve been reading the fantastic [Mastering Bitcoin](https://www.amazon.com/gp/product/1491954388/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=east5th-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1491954388&linkId=c1ff439b422b447867a247fee90e76d0) (affiliate link) book by Andreas Antonopoulos, and diving into the brave new world of Bitcoin development.

Mastering Bitcoin does a fantastic job of outlining the technical underpinnings of Bitcoin, but I wanted to solidify my understanding with some hands-on experience.

Writing a simple [Elixir](https://elixir-lang.org/) application to communicate and control a Bitcoin Core full node through its [JSON-RPC interface](https://en.bitcoin.it/wiki/API_reference_(JSON-RPC)) seems like a fantastic “hello world” exercise. Let’s get to it!

## You’ll Need a Full Node

The first step in communicating with a Bitcoin Core full node is getting our hands on one. While publicly available nodes with wide open JSON-RPC interfaces are few and far between, it’s fairly simple to [run our own Bitcoin Core node locally](https://bitcoin.org/en/full-node).

Assuming we’ve [installed the `bitcoind`{:.language-elixir} daemon on our system](https://bitcoin.org/en/full-node#osx-daemon), we’ll need to configure it with a `bitcoin.config`{:.language-elixir} file:

<pre class='language-elixir'><code class='language-elixir'>
rpcuser=&lt;username>
rpcpassword=&lt;password>
</code></pre>

The `<username>`{:.language-elixir} and `<password>`{:.language-elixir} values we define in our configuration will be used to authenticate ourselves when making requests to the Bitcoin node.

Once we’ve created our configuration file, we can spin up our full node:

<pre class='language-elixir'><code class='language-elixir'>
bitcoind -conf=&lt;path to bitcoin.config> -daemon
</code></pre>

Once started, our full node daemon will begin connecting to peer nodes, downloading, and verifying blocks from the blockchain.

We can verify that everything is working as expected:

<pre class='language-elixir'><code class='language-elixir'>
bitcoin-cli getinfo
</code></pre>

This command should return some basic information about the node, including the node's `"version"`{:.language-elixir}, and the number of `"blocks"`{:.language-elixir} it’s received and verified. It may take several days to download and verify the entire blockchain, but we can keep continue on with our project in the meantime.

## The Bitcoin Node’s JSON-RPC

Our Bitcoin full node implements a [JSON-based RPC API](https://en.bitcoin.it/wiki/API_reference_(JSON-RPC)) which can be used to retrieve information about the Bitcoin blockchain, and to interact with the node itself.

Interestingly, the `bitcoin-cli`{:.language-elixir} tool that we used to get information about the node [leverages this JSON-RPC API](https://github.com/bitcoin/bitcoin/blob/master/src/bitcoin-cli.cpp#L194-L285). You can fetch a list of all of the available RPC commands on the node by calling `bitcoin-cli help`{:.language-elixir}, or by browsing through the [Bitcoin Wiki](https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list).

The node’s JSON-RPC accepts incoming commands through an HTTP server, which means that we can manually craft these RPC commands and bypass the `bitcoin-cli`{:.language-elixir} tool entirely.

For example, [we can run `getinfo`{:.language-elixir} manually with `curl`{:.language-elixir}](https://bitcoin.stackexchange.com/a/19839):

<pre class='language-bash'><code class='language-bash'>
curl --data-binary '{"jsonrpc":"1.0","method":"getinfo","params":[]}' \
     http://&lt;user>:&lt;pass>@localhost:8332/
</code></pre>

Similarly, we can execute these commands from any programming environment with an HTTP client, like Elixir!

## Setting Up Our Elixir Application

Now that we have a strategy for communicating with our Bitcoin full node, let’s start building out our Elixir application.

First, we’ll create a new Elixir project and update our `mix.exs`{:.language-elixir} to add dependencies on [`poison`{:.language-elixir}](https://hex.pm/packages/poison), which we’ll need to encode and decode JSON objects, and [`httpoison`{:.language-elixir}](https://hex.pm/packages/httpoison), our go-to Elixir HTTP client.

<!-- <pre class='language-elixir'><code class='language-elixir'> -->
<!-- mix new hello_bitcoin -->
<!-- </code></pre> -->

<pre class='language-elixir'><code class='language-elixir'>
defp deps do
  [
    {:httpoison, "~> 0.13"},
    {:poison, "~> 3.1"}
  ]
end
</code></pre>

<!-- <pre class='language-elixir'><code class='language-elixir'> -->
<!-- mix deps.get -->
<!-- </code></pre> -->

Now that we’ve laid out the scaffolding for our application, let’s turn our attention towards talking with our Bitcoin node.

We’ll start by gutting our `HelloBitcoin`{:.language-elixir} module, and stubbing out a new `getinfo`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
defmodule HelloBitcoin do

  def getinfo do
    raise "TODO: Implement getinfo"
  end

end
</code></pre>

To keep things simple, we’ll interact with this module through `iex -S mix`{:.language-elixir}. As a sanity check, let’s verify that everything is working correctly before moving on to the next section.

Calling our `HelloBitcoin.getinfo`{:.language-elixir} stub should raise a runtime exception:

<pre class='language-elixir'><code class='language-elixir'>
iex(1)> HelloBitcoin.getinfo
HelloBitcoin.getinfo
** (RuntimeError) TODO: Implement getinfo
    (hello_bitcoin) lib/hello_bitcoin.ex:4: HelloBitcoin.getinfo/0
</code></pre>

Perfect. Progress through failure.

## Constructing the GetInfo Command

Let’s start to flesh out our `getinfo`{:.language-elixir} function.

To recap, our goal is to send a `POST`{:.language-elixir} HTTP request to our Bitcoin node’s HTTP server (usually listening on `http://localhost:8332`{:.language-elixir}), passing in a JSON object that holds the command we’re trying to execute and any required parameters.

It turns out this is incredibly easy with `httpoison`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def getinfo do
  with url     <- Application.get_env(:hello_bitcoin, :bitcoin_url),
       command <- %{jsonrpc: "1.0", method: "getinfo", params: []},
       body    <- Poison.encode!(command),
       headers <- [{"Content-Type", "application/json"}] do
    HTTPoison.post!(url, body, headers)
  end
end
</code></pre>

We start by pulling our `url`{:.language-elixir} from the `bitcoin_url`{:.language-elixir} key in our application’s configuration. This needs to be set in `config/config.exs`{:.language-elixir} and should point to your local node:

<pre class='language-elixir'><code class='language-elixir'>
config :hello_bitcoin, bitcoin_url: "http://&lt;user>:&lt;password>@localhost:8332"
</code></pre>

Next, we build a map that represents our JSON-RPC `command`{:.language-elixir}. In this case, our `method`{:.language-elixir} is `"getinfo"`{:.language-elixir}, which requires no `params`{:.language-elixir}. Finally, we construct the `body`{:.language-elixir} of our request by JSON encoding our `command`{:.language-elixir} with `Poison.encode!`{:.language-elixir}.

Calling `HelloBitcoin.getinfo`{:.language-elixir} should give us a successful `200`{:.language-elixir} response from the Bitcoin node, along with the JSON encoded response to our `getinfo`{:.language-elixir} command:

<pre class='language-elixir'><code class='language-elixir'>
%HTTPoison.Response{
  body: "{\"result\":{\"version\":140200,\"protocolversion\":70015,\"walletversion\":130000,\"balance\":0.00000000,\"blocks\":482864,\"timeoffset\":-1,\"connections\":8,\"proxy\":\"\",\"difficulty\":888171856257.3206,\"testnet\":false,\"keypoololdest\":1503512537,\"keypoolsize\":100,\"paytxfee\":0.00000000,\"relayfee\":0.00001000,\"errors\":\"\"},\"error\":null,\"id\":null}\n",
  headers: [{"Content-Type", "application/json"}, {"Date", "Thu, 31 Aug 2017 21:27:02 GMT"}, {"Content-Length", "328"}],
  request_url: "http://localhost:8332",
  status_code: 200
}
</code></pre>

Beautiful.

Let’s decode the resulting JSON in `body`{:.language-elixir} and return the result:

<pre class='language-elixir'><code class='language-elixir'>
HTTPoison.post!(url, body)
|> Map.get(:body)
|> Poison.decode!
</code></pre>

Now our call to `HelloBitcoin.getinfo`{:.language-elixir} returns the result returned by `bitcoind`{:.language-elixir} in a more usable format:

<pre class='language-elixir'><code class='language-elixir'>
%{"error" => nil, "id" => nil,
  "result" => %{"balance" => 0.0, "blocks" => 483001, "connections" => 8,
    "difficulty" => 888171856257.3206, "errors" => "",
    "keypoololdest" => 1503512537, "keypoolsize" => 100, "paytxfee" => 0.0,
    "protocolversion" => 70015, "proxy" => "", "relayfee" => 1.0e-5,
    "testnet" => false, "timeoffset" => -1, "version" => 140200,
    "walletversion" => 130000}}
</code></pre>

You’ll notice that the `"result"`{:.language-elixir}, the data we actually want, is wrapped in a map containing metadata about the request itself. This metadata includes a potential `error`{:.language-elixir} string, and the `id`{:.language-elixir} of the request.

Let’s refactor our `getinfo`{:.language-elixir} function to include some error handling, and to return the actual data we care about in the case of an error-free response:

<pre class='language-elixir'><code class='language-elixir'>
with url <- Application.get_env(:hello_bitcoin, :bitcoin_url),
     command <- %{jsonrpc: "1.0", method: "getinfo", params: []},
     {:ok, body} <- Poison.encode(command),
     {:ok, response} <- HTTPoison.post(url, body),
     {:ok, metadata} <- Poison.decode(response.body),
     %{"error" => nil, "result" => result} <- metadata do
  result
else
  %{"error" => reason} -> {:error, reason}
  error -> error
end
</code></pre>

Now our `getinfo`{:.language-elixir} function will return an `{:ok, result}`{:.language-elixir} tuple containing the result of our `getinfo`{:.language-elixir} RPC call if everything goes well. In the case of an error we’ll receive an `{:error, reason}`{:.language-elixir} tuple, explaining the failure.

## Generalizing Commands

We could implement another Bitcoin RPC command, like `getblockhash`{:.language-elixir}, in a nearly identical fashion:

<pre class='language-elixir'><code class='language-elixir'>
def getblockhash(index) do
  with url <- Application.get_env(:hello_bitcoin, :bitcoin_url),
       command <- %{jsonrpc: "1.0", method: "getblockhash", params: [index]},
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

Calling our new `getblockhash`{:.language-elixir} with an index of `0`{:.language-elixir} gives us [the hash of the Bitcoin genesis block](https://en.bitcoin.it/wiki/Genesis_block), as we would expect.

<pre class='language-elixir'><code class='language-elixir'>
HelloBitcoin.getblockhash(0)

{:ok, "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"}
</code></pre>

While it's great that this works, you’ll notice that there’s a huge amount of code duplication going on here. Our `getblockhash`{:.language-elixir} function is nearly identical to our `getinfo`{:.language-elixir} function.

Let’s abstract out the common functionality into a new `bitcoin_rpc`{:.language-elixir} helper function:

<pre class='language-elixir'><code class='language-elixir'>
defp bitcoin_rpc(method, params \\ []) do
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

Now we can redefine our `getinfo`{:.language-elixir} and `getblockhash`{:.language-elixir} functions in terms of this new `bitcoin_rpc`{:.language-elixir} helper function:

<pre class='language-elixir'><code class='language-elixir'>
def getinfo, do: bitcoin_rpc("getinfo")
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
def getblockhash(index), do: bitcoin_rpc("getblockhash", [index])
</code></pre>

Our `bitcoin_rpc`{:.language-elixir} now acts as a fully functional and complete Bitcoin RPC interface. We can easily implement any of the Bitcoin RPC commands using this helper function.

If you’re curious and want to interact with a Bitcoin node yourself, the full source for this `HelloBitcoin`{:.language-elixir} project is [available on GitHub](https://github.com/pcorey/hello_bitcoin).

## Wrap Up

In hindsight, this was a long article explaining a relatively simple idea. The Bitcoin full node software exposes a JSON-RPC interface that can easily be accessed by your favorite language or stack, such as Elixir.

I’m incredibly excited about Bitcoin development, and I’m planning on spending more time diving deeper into this world in the future.

If you’re interested in the technical ideas behind Bitcoin, or are interested in Bitcoin development, I highly recommend you read [Mastering Bitcoin](https://www.amazon.com/gp/product/1491954388/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=east5th-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1491954388&linkId=c1ff439b422b447867a247fee90e76d0) (affiliate link).
