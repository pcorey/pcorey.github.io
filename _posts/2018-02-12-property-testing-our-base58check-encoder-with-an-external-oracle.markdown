---
layout: post
title:  "Property Testing our Base58Check Encoder with an External Oracle"
description: "Property-based testing is an amazingly powerful tool to add to your testing toolbox. Check out how we can use it to verify the correctness of our Base58Check encoder against an external oracle."
author: "Pete Corey"
date:   2018-02-12
tags: ["Elixir", "Bitcoin", "Mastering Bitcoin"]
related: ["/blog/2018/01/08/bitcoins-base58check-in-pure-elixir/"]
---

Recently, we wrote [a Base58Check encoder](http://www.petecorey.com/blog/2018/01/08/bitcoins-base58check-in-pure-elixir/) to power [our Bitcoin private key and public address generator](http://www.petecorey.com/blog/2018/01/22/generating-bitcoin-private-keys-and-public-addresses-with-elixir/). Being the diligent developers that we are, we added a unit test to ensure that our encoder was working as we expected.

But was that enough?

Call me a coward, but relying on a solitary unit test based on a single example pulled from a wiki article doesn’t instill huge amounts of confidence in our solution.

Let’s thoroughly test our solution with the help of property-based testing tools and an external oracle!

## Oracles and Property Testing

The [Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding) algorithm has been implemented many times by many different developers. Wouldn’t it be great if we could automatically check our implementation against theirs?

We can!

In [property-based testing](https://propertesting.com/) vernacular, this is known as using an oracle. [An oracle](https://www.hillelwayne.com/post/hypothesis-oracles/) is another implementation of your solution that is known to be correct under some  domain of inputs.

Thankfully, we have a perfect oracle in the form of the [Bitcoin Explorer’s CLI tools](https://github.com/libbitcoin/libbitcoin-explorer). Bitcoin Explorer ships with [a `base58check-encode`{:.language-elixir} utility](https://github.com/libbitcoin/libbitcoin-explorer/wiki/bx-base58check-encode) that Base58Check encodes any Base16 string with a given version byte:

<pre class='language-elixir'><code class='language-elixir'>
> bx base58check-encode abc123 --version 0
17WWM7GLKg9
</code></pre>

Given this oracle, we can thoroughly and concisely test our implementation with a single property. The primary desired property of our solution is that it should match the output of `bx base58check-encode`{:.language-elixir} for all valid inputs.

## Getting Comfortable with our Tools

Property testing is simple in concept, but more difficult in practice.

It’s easy to say that for any given binary and any given byte, the output of our solution should match the output of my oracle. Actually generating those inputs and coordinating those test executions is a whole different ball game.

Thankfully, the groundwork has already been laid for us, and there are plenty of Elixir-based property testing tools for us to chose from. For this exercise, let’s use [StreamData](https://github.com/whatyouhide/stream_data).

---- 

To get our feet wet, let’s write a simple property test using StreamData that verifies the [associative property](https://en.wikipedia.org/wiki/Associative_property) of the `Kernel.+/2`{:.language-elixir} addition function:

<pre class='language-elixir'><code class='language-elixir'>
property "addition is associative" do
  check all a &lt;- integer(),
            b &lt;- integer(),
            c &lt;- integer() do
    l = Kernel.+(Kernel.+(a, b), c)
    r = Kernel.+(a, Kernel.+(b, c))
    assert l == r
  end
end
</code></pre>

The `property`{:.language-elixir} keyword defines our new property test with a short description of the property under test.

The `check all`{:.language-elixir} block lets us define our automatically generated inputs and a function block that will use those inputs to make assertions about our property.

Put simply, we’re telling StreamData that we want three random integers: `a`{:.language-elixir}, `b`{:.language-elixir}, and `c`{:.language-elixir}. For every set of `a`{:.language-elixir}, `b`{:.language-elixir}, and `c`{:.language-elixir}, we want to verify that `(a + b) + c`{:.language-elixir} equals `a + (b + c)`{:.language-elixir}.

StreamData does this by generating many (one hundred by default) random sets of `a`{:.language-elixir}, `b`{:.language-elixir}, and `c`{:.language-elixir} and checking them against our assertions. If any assertion fails, StreamData will try to “shrink” the input set (`a`{:.language-elixir}, `b`{:.language-elixir}, and `c`{:.language-elixir}, in this case) to the simplest possible failing test case and present it to us.

<pre class='language-elixir'><code class='language-elixir'>
> mix test
.

Finished in 0.06 seconds
1 property, 0 failures
</code></pre>

Thankfully, addition is associative, and our test passes!

{% include newsletter.html %}

## Consulting the Oracle

Now let’s take the training wheels off and write a property test for our Base58Check encoder against our external oracle.

First, we’ll define a new test block:

<pre class='language-elixir'><code class='language-elixir'>
property "gives the same results as bx base58check-encode" do
end
</code></pre>

Within our test, we’ll generate two random variables, `key`{:.language-elixir} and `version`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
check all key &lt;- binary(min_length: 1),
          version &lt;- byte() do
end
</code></pre>

We’re telling StreamData that `key`{:.language-elixir} can be any non-empty binary, and that `version`{:.language-elixir} can be any byte.

Now that we have our set of test data, we'll need to get the result of encoding `key`{:.language-elixir} with `version`{:.language-elixir} using our own implementation of the Base58Check encoding algorithm:

<pre class='language-elixir'><code class='language-elixir'>
result = Base58Check.encode(key, &lt;&lt;version>>)
</code></pre>

Next, we’ll use [Elixir's `System.cmd`{:.language-elixir}](https://hexdocs.pm/elixir/System.html#cmd/3) to call `bx base58check-encode`{:.language-elixir}, passing in our Base16-encoded `key`{:.language-elixir} string and our `version`{:.language-elixir} byte:

<pre class='language-elixir'><code class='language-elixir'>
oracle =
  System.cmd("bx", [
    "base58check-encode",
    Base.encode16(key),
    "--version",
    "#{version}"
  ])
  |> elem(0)
  |> String.trim()
</code></pre>

Now all that’s left to do is to verify that our `result`{:.language-elixir} matches the output of our `oracle`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
assert result == oracle
</code></pre>

If StreamData detects any failures in this assertion, it will simplify `key`{:.language-elixir} and `version`{:.language-elixir} to the simplest failing case and report the failure to us.

But thankfully, our implementation of the Base58Check encoding algorithm passes the test:

<pre class='language-elixir'><code class='language-elixir'>
mix test
.

Finished in 1.0 seconds
1 property, 0 failures
</code></pre>

## Final Thoughts

I won’t pretend to be a property testing expert. I’m just a guy who’s read a few articles and who’s hopped on board the hype train. That said, property testing was the perfect tool for this job, and I can see it being an incredibly useful tool in the future. I’m excited to incorporate it into my testing arsenal.

If you’re interested in property-based testing, I recommend you check out Fred Hebert’s [PropEr Testing](https://propertesting.com/), and Hillel Wayne’s articles on [hypothesis testing with oracle functions](https://www.hillelwayne.com/post/hypothesis-oracles/) and [property testing with contracts](https://www.hillelwayne.com/post/pbt-contracts/).

Lastly, if you’re interested in Bitcoin development, I encourage you to check out Andreas Antonopoulos’ [Mastering Bitcoin](http://amzn.to/2GRJrkm).
