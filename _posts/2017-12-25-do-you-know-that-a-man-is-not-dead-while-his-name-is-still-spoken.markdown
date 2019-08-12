---
layout: post
title:  "Do you know that a man is not dead while his name is still spoken?"
excerpt: "I've decided to move away from the East5th name and start publishing everything I do under my name: Pete Corey."
author: "Pete Corey"
date:   2017-12-25
tags: ["Elixir", "Phoenix", "Books"]
related: []
---

In my free time I’ve been making many trips to Discworld over the past few months. I’ve been rereading my favorites like [Going Postal](http://amzn.to/2BgtcOT), and devouring other classics like [Hogfather](http://amzn.to/2CFvjYO) for the first time.

I thought I’d take a pause this Christmas and offer up my contribution to [an ongoing tribute](http://www.gnuterrypratchett.com/) to [the late Terry Pratchett](https://en.wikipedia.org/wiki/Terry_Pratchett).

> You know they'll never really die while the Trunk is alive… It lives while the code is shifted, and they live with it, always Going Home.
<br/>
> — Terry Pratchett, [Going Postal](http://amzn.to/2BgtcOT)

The Clacks, as described in Going Postal, is a system of trans-continental semaphore towers used to send messages across great distances. Each packet of text sent through the Clacks is encoded using a set of standardized codes and encodings.

Sounds familiar, doesn’t it?

The codes `G`{:.language-elixir}, `N`{:.language-elixir}, and `U`{:.language-elixir}, stand for “send the message on”, “do not log the message”, and “turn the message around at the end of the line” respectively. In Going Postal, these codes are used to send a character’s name perpetually up and down the Clacks.

As long as his name is spoken, he will never die.

We can write a [Plug](https://github.com/elixir-plug/plug) function to easily broadcast our own Clacks overhead messages from our [Phoenix](http://phoenixframework.org/) server:

<pre class='language-elixir'><code class='language-elixir'>
pipeline :browser do
  ...
  plug :gnu_terry_pratchett
end

def gnu_terry_pratchett(conn, options) do
  Plug.Conn.put_resp_header(conn, "X-Clacks-Overhead", "GNU Terry Pratchett")
end
</code></pre>

Of course, this is all a fantasy. The Clacks aren’t real, Terry's name won't live forever in the overhead, and any `X-Clacks-Overhead`{:.language-javascript} messages we send will simply be ignored by the world at large.

That being said, "humans need fantasy to be human".

> HUMANS NEED FANTASY TO BE HUMAN. TO BE THE PLACE WHERE THE FALLING ANGEL MEETS THE RISING APE.
<br/>
> "Tooth fairies? Hogfathers? Little—"
<br/>
> YES. AS PRACTICE. YOU HAVE TO START OUT LEARNING TO BELIEVE THE  LITTLE  LIES.
<br/>
> "So we can believe the big ones?"
<br/>
> YES. JUSTICE. MERCY. DUTY…
<br/>
> — Terry Pratchett, [Hogfather](http://amzn.to/2CFvjYO)
