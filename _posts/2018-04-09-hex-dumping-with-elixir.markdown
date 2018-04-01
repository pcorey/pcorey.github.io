---
layout: post
title:  "Hex Dumping with Elixir"
description: "Is it better to call out to an existing external tool, or roll your own solution to a problem? Climb down this rabbit hole with me as we implement a hex dump utility in Elixir."
author: "Pete Corey"
date:   2018-04-09
tags: ["Elixir", "Bitcoin"]
related: ["/blog/2018/03/26/building-mixed-endian-binaries-with-elixir/"]
---

I recently written about [my explorations into the Bitcoin peer-to-peer network](/blog/2018/03/26/building-mixed-endian-binaries-with-elixir/) from the context of an Elixir application. These explorations have caused me to get up-close and personal with binary data as I serialize and parse packets at the byte level.

Being a visual person, I wanted some way of inspecting the binaries I was constructing and sending. I decided that [a hex dump](https://en.wikipedia.org/wiki/Hex_dump) would be the best way to visualize these packets.

What followed was an odyssey of finding and implementing a safe and fast process for printing hex dumps of arbitrary, untrusted binary data from within an Elixir application.

## Calling Out to the System

My first instinct for implementing a hex dump method within my application was to not implement it at all! It made more sense to leverage the existing `hexdump`{:.language-elixir} command line utility living on my system.

Specially, I wanted to render my packets with the `hexdump -C`{:.language-elixir} command. The `-C`{:.language-elixir} flag includes an ASCII rendering of the bytes being dumped:

<pre class='language-*'><code class='language-*'>0000   F9 BE B4 D9 76 65 72 73  69 6F 6E 00 00 00 00 00   ....version.....
0010   55 00 00 00 9C 7C 00 00  01 00 00 00 00 00 00 00   U....|..........
0020   E6 15 10 4D 00 00 00 00  01 00 00 00 00            ...M.........
</code></pre>

Unfortunately, calling `hexdump`{:.language-elixir} from within an Elixir application proved to be more challenging than I first expected.

When trying to call system commands, I reflexively reach for [Elixir's `System.cmd/3`{:.language-elixir}](https://hexdocs.pm/elixir/System.html#cmd/3) function. Unfortunately, `hexdump`{:.language-elixir} relies on the input bytes through either `stdin`{:.language-elixir}, or through a file. Because `System.cmd/3`{:.language-elixir} only lets you pass arguments to your system command, not data through `stdin`{:.language-elixir}, we can't use it to build our hex dumps.

Another option would be to write our packets to a temporary file, and use `System.cmd/3`{:.language-elixir} to instruct `hexdump`{:.language-elixir} to load and dump the bytes in that file. Relying on temporary files seems like a poor choice for a logging utility that would be called hundreds to thousands of times per minute.

While `System.cmd/3`{:.language-elixir} won't work, maybe we can use an [Elixir `Port`{:.language-elixir}](https://hexdocs.pm/elixir/Port.html) directly. Unfortunately, while we can pipe our binary data directly to `hexdump`{:.language-elixir} using a port, [there is no way to signal the end of our data by sending the expected EOF (`^D`{:.language-elixir}) signal](http://erlang.org/pipermail/erlang-questions/2013-July/074905.html). Without signaling the end of our byte stream, closing the port will leave us without any data to show for our work.

## Here Be Dragons

Our third option for solving this problem is to dig deeper into our tool belt and pull out the big guns. Both `System.cmd/3`{:.language-elixir} and `Port`{:.language-elixir} have limitations in this context, but [Erlang's `:os.cmd/1`{:.language-elixir}](http://erlang.org/doc/man/os.html#cmd-1) gives us exactly what we need:

<pre class='language-elixir'><code class='language-elixir'>
output =
  ('echo "' ++ :binary.bin_to_list(data) ++ '" | hexdump -C')
  |> :os.cmd()
</code></pre>

We can use `:os.cmd/1`{:.language-elixir} to evaulate _any shell command_, including compositions of commands strung together with pipes and redirections.

In this case, our command uses `echo`{:.language-elixir} to pipe our binary into `hexdump -C`{:.language-elixir}. The `:os.cmd/1`{:.language-elixir} function expects our shell command to be in the form of a character list, so we use [Erlang's `:binary.bin_to_list/1`{:.language-elixir}](http://erlang.org/doc/man/binary.html#bin_to_list-1) to inject our binary `data`{:.language-elixir} directly into our `echo`{:.language-elixir} argument.

However, __this solution has major security issues__.

Depending on the source of our `data`{:.language-elixir} binary, we're potentially giving outside sources free reign to run any shell command on our machine. Considering that this hex dump is intended to log packets received from external sources on the Bitcoin peer-to-peer network, this is a _catastrophically bad idea_.

We need to find another solution.

## Going the Safe Route

Ultimately, I decided that the safest and fastest solution to my problem was to simply build my own hex dump utility in pure Elixir.

The general idea behind the `hexdump`{:.language-elixir} tool is simple. For every line, display the current byte count in hex, followed by two chunks of eight bytes rendered in hex, followed by all sixteen bytes rendered together as ASCII characters.

This is a great chance to flex our Elixir muscles. Let's implement this in a `to_string/1`{:.language-elixir} function within a new `Hexdump`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
defmodule Hexdump do
  def to_string(data) when is_binary(data) do
    # TODO: Implement `to_string`{:.language-elixir}...
  end
  def to_string(data), do: Kernel.inspect(data)
end
</code></pre>

We only want to run our hex dump algorithm on binary data, so we'll guard our first function head with an `is_binary`{:.language-elixir} guard. If `data`{:.language-elixir} isn't binary, we'll simply return the result of [`Kernel.inspect/2`{:.language-elixir}](https://hexdocs.pm/elixir/Kernel.html#inspect/2).

In order to work more easily with our `data`{:.language-elixir} binary, let's convert it into a list of bytes and chunk it into our lines of sixteen bytes:

<pre class='language-elixir'><code class='language-elixir'>
data
|> :binary.bin_to_list()
|> Enum.chunk_every(16)
</code></pre>

We want to divide each of our lines of sixteen bytes into two groups of eight (or fewer) bytes. If we don't have enough bytes to create our second group, we'll append an empty list to fill its place:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.map(&Enum.chunk_every(&1, 8))
|> Enum.map(fn
  [a] -> [a, []]
  [a, b] -> [a, b]
end)
</code></pre>

Now we're left with a list of lines. Within each line is a list of two eight byte groupings.

We'll use the index of the outer list to calculate and render how many bytes we've dumped so far. We'll need to attach that to our list with [`Enum.with_index/2`{:.language-elixir}](https://hexdocs.pm/elixir/Enum.html#with_index/2):

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.with_index()
</code></pre>


Finally, we'll map our lines over a function that transforms each line tuple into a string, and we'll join the resulting list of strings with newlines:

<pre class='language-elixir'><code class='language-elixir'>
|> Enum.map(&line_to_string/1)
|> Enum.join("\n")
</code></pre>

---- 

Our `line_to_string/1`{:.language-elixir} function is a helper that accepts a tuple of eight byte `parts`{:.language-elixir} and the current line `index`{:.language-elixir}, and returns the string representation of the current line:

<pre class='language-elixir'><code class='language-elixir'>
def line_to_string({parts, index}) do
end
</code></pre>

The first job of `line_to_string/1`{:.language-elixir} is to build the current byte count in hex. The byte count needs to be padded to at least eight characters:

<pre class='language-elixir'><code class='language-elixir'>
count =
  index
  |> Kernel.*(16)
  |> :binary.encode_unsigned()
  |> Base.encode16(case: :lower)
  |> String.pad_leading(8, "0")
</code></pre>

Next, we map over each eight byte part of our line. We render each byte in each part into hex by converting it into a binary using [Erlang's `:binary.encode_unsigned/1`{:.language-elixir}](http://erlang.org/doc/man/binary.html#encode_unsigned-1) and rendering it into base sixteen with [Elixir's `Base.encode16/2`{:.language-elixir}](https://hexdocs.pm/elixir/Base.html#encode16/2). Next, can join the characters in each of our parts with spaces and pad the result to twenty three characters using [`String.pad_trailing/3`{:.language-elixir}](https://hexdocs.pm/elixir/String.html#pad_trailing/3):

<pre class='language-elixir'><code class='language-elixir'>
bytes =
  parts
  |> Enum.map(fn bytes ->
    bytes
    |> Enum.map(fn byte ->
      byte
      |> :binary.encode_unsigned()
      |> Base.encode16(case: :lower)
    end)
    |> Enum.join(" ")
    |> String.pad_trailing(23, " ")
  end)
</code></pre>

The ASCII component of each line is rendered in a similar way. Because we don't want a divider in the middle of our ASCII rendering, we'll flatten our eight byte parts and map each byte over a function that converts it into a printable string. If the byte falls between `0x20`{:.language-elixir} and `0x7E`{:.language-elixir}, we convert it into a string. Otherwise, we return `"."`{:.language-elixir}.

<pre class='language-elixir'><code class='language-elixir'>
ascii =
  parts
  |> List.flatten()
  |> Enum.map(fn byte ->
    case byte &lt;= 0x7E && byte >= 0x20 do
      true -> &lt;&lt;byte>>
      false -> "."
    end
  end)
  |> Enum.join("")
</code></pre>

Now we can flatten our byte count, each of our two byte parts, and our ASCII representation into a single list and join them together with two characters of whitespace separating each component:

<pre class='language-elixir'><code class='language-elixir'>
[count, bytes, ascii]
|> List.flatten()
|> Enum.join("  ")
</code></pre>

And that's it!

We can safely use our new `Hexdump`{:.language-elixir} module to safely and quickly create a hex dump string of any binary packets encountered by our application:

<pre class='language-elixir'><code class='language-elixir'>
&lt;&lt;
  0xF9, 0xBE, 0xB4, 0xD9, 0x76, 0x65, 0x72, 0x73,
  0x69, 0x6F, 0x6E, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x55, 0x00, 0x00, 0x00, 0x9C, 0x7C, 0x00, 0x00
>>
|> Hexdump.to_string()
|> IO.puts()
</code></pre>

<pre class='language-*'><code class='language-*'>0000  F9 BE B4 D9 76 65 72 73  69 6F 6E 00 00 00 00 00  ....version.....
0010  55 00 00 00 9C 7C 00 00                           U....|..
</code></pre>

## Final Thoughts

What an adventure. The moral of this story is that using the tools and resources available to you is fantastic in the right situations.

That said, it's important to always be aware of the downsides and potential costs of using existing solutions. Sometimes, rolling your own solution is the right choice. In my case, using the command line version of `hexdump`{:.language-elixir} would have been horrendously insecure and most likely less performant than implementing my own solution.

If you're interested in the full source of the `Hexdump`{:.language-elixir} module we created in this article, [check it out on Github](https://github.com/pcorey/bitcoin_network/blob/master/lib/hexdump.ex).
