---
layout: post
title:  "Be Careful Using With in Tests"
excerpt: "Elixir's 'with' special form is a fantastic tool, but be careful using it in tests. Read all about how my incorrect usage of 'with' lead to a false positive in my test suite!"
author: "Pete Corey"
date:   2018-06-04
tags: ["Elixir", "Testing"]
related: []
---

Last week I struck a chord in the Elixir community when [I tweeted about a trap I fell into while writing a seemingly simple test using Elixir's `with`{:.language-elixir} special form](https://twitter.com/petecorey/status/1001228444896669696). Based on the reaction to that tweet, I thought it'd be a good idea to explore where I went wrong and how I could have prevented it.

## The Test

The test in question was fairly simple. Let's imagine it looked something like this:

<pre class='language-elixir'><code class='language-elixir'>
test "foo equals bar" do
  with {:ok, foo} <- do_foo(),
       {:ok, bar} <- do_bar() do
    assert foo == bar
  end
end
</code></pre>

We're using `with`{:.language-elixir} to destructure the results of our calls to `do_foo/0`{:.language-elixir} and `do_bar/0`{:.language-elixir} function calls. Next, we're asserting that `foo`{:.language-elixir} should equal `bar`{:.language-elixir}.

If `do_foo/0`{:.language-elixir} or `do_bar/0`{:.language-elixir} return anything other than an `:ok`{:.language-elixir} tuple, _we'd expect our pattern match to fail, causing our test to fail_. On running our test, we see that it passes. Our `do_foo/0`{:.language-elixir} and `do_bar/0`{:.language-elixir} functions must be working as expected!

## The False Positive

Unfortunately, we're operating under a faulty assumption. In reality, our `do_foo/0`{:.language-elixir} and `do_bar/1`{:.language-elixir} functions actually look like this:

<pre class='language-elixir'><code class='language-elixir'>
def do_foo, do: {:ok, 1}
def do_bar, do: {:error, :asdf}
</code></pre>

Our `do_bar/0`{:.language-elixir} is returning an `:error`{:.language-elixir} tuple, not the `:ok`{:.language-elixir} tuple our test is expecting, but our test is still passing. What's going on here?

{% include newsletter.html %}

It's easy to forget (at least for me, apparently) that when a `with`{:.language-elixir} expression fails a pattern match, it doesn't throw an error. Instead, it immediately returns the unmatched value. So in our test, our `with`{:.language-elixir} expression is returning the unmatched `{:error, :asdf}`{:.language-elixir} tuple without ever executing its `do`{:.language-elixir} block and skipping our assertion entirely.

Because our assertion is never given a chance to fail, our test passes!

## The Fix

The fix for this broken test is simple once we recognize what the problem is. We're expecting our assignments to throw errors if they fail to match. One surefire way to accomplish that is to _use assignments rather than a `with`{:.language-elixir} expression_.

<pre class='language-elixir'><code class='language-elixir'>
test "foo equals bar" do
  {:ok, foo} = do_foo()
  {:ok, bar} = do_bar()
  assert foo == bar
end
</code></pre>

Now, the `:error`{:.language-elixir} tuple returned by our `do_bar/0`{:.language-elixir} function will fail to match with our `:ok`{:.language-elixir} tuple, and the test will fail. Not only that, but we've also managed to simplify our test in the process of fixing it.

Success!

## The Better Fix

After posting the above fix in response to my original tweet, Michał Muskała replied with a fantastic tip to improve the error messaging of the failing test.

<div style="width: 80%; margin: 4em auto;">
  <a href="https://twitter.com/michalmuskala/status/1001448061594488832" style="background-color: transparent;">
    <img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/be-careful-using-with-in-tests/pro-tip.png" style=" width: 100%;"/>
    <p style="text-align: center; color: #ccc; margin: 0;">Michał's pro tip.</p>
  </a>
</div>

Currently, our test failure looks like this:

<pre class='language-elixir'><code class='language-elixir'>
** (MatchError) no match of right hand side value: {:error, :asdf}
code: {:ok, bar} = do_bar()
</code></pre>

If we add assertions to our pattern matching assignments, we set ourselves up to receive better error messages:

<pre class='language-elixir'><code class='language-elixir'>
test "foo still equals bar" do
  assert {:ok, foo} = do_foo()
  assert {:ok, bar} = do_bar()
  assert foo == bar
end
</code></pre>

Now our failing test reads like this:

<pre class='language-elixir'><code class='language-elixir'>
match (=) failed
code:  assert {:ok, bar} = do_bar()
right: {:error, :asdf}
</code></pre>

While we're still given all of the same information about the failure, it's presented in a way that's easier to read and internalize, leading to a quicker understanding of how and why our test is failing.

I'll be sure to incorporate that tip into my tests from now on. Thanks Michał!
