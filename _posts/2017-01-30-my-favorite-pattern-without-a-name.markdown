---
layout: post
title:  "My Favorite Pattern Without a Name"
excerpt: "I've been notice a recurring pattern in modern open source projects and even my own Elixir code, but strangely, this pattern doesn't seem to have a name."
author: "Pete Corey"
date:   2017-01-30
tags: ["Elixir"]
---

My recent dives into [Elixir](http://elixir-lang.org/) have been changing how I write software. More and more I find myself writing in a functional style, even in languages where its not the norm.

As my style of programming changes, I find myself re-using patterns and ideas across many different languages.

This article is about one of the patterns I use most often; interestingly, a pattern without a clear name.

<p style="border: 1px dashed #690; padding: 1em; background-color: #F0F9F0">
As my friend <a href="https://twitter.com/deaniusaur/status/826127630328004608">Dean Radcliffe pointed out</a>, I'm probably describing a <a href="https://en.wikipedia.org/wiki/Fluent_interface">fluent interface</a> as described by <a href="https://www.martinfowler.com/bliki/FluentInterface.html">Martin Fowler</a>. Today I learned.
</p>

## An Example

I often find myself wanting to chain together many function calls, passing in the results of previous calls into the next function in the chain.

Sometimes, the next function in the chain only needs the result of the previous function. Sometimes, it needs the result of a function further back in the chain.

To make things more real, let’s consider an example. Imagine we’re building a system that receives and responds to text messages from users. In this example, we’ll have three functions:

<pre class='language-elixir'><code class='language-elixir'>
def get_user(phone_number) do
  ...
end

def get_response(message) do
  ...
end

def send_response(user, response) do
  ...
end
</code></pre>

The `get_user`{:.language-elixir} function takes in the sender’s phone number and returns a corresponding user object. The `get_response`{:.language-elixir} function takes in the sender’s text message and returns a response. `send_response`{:.language-elixir} will take in a response and the user to send that response to.

One way of calling these three methods together might look like this:

<pre class='language-elixir'><code class='language-elixir'>
user = get_user(sms.from)
response = get_response(sms.message)
send_response(user, response)
</code></pre>

This is a fine solution. However, we’re binding `user`{:.language-elixir} and `response`{:.language-elixir} for no other reason than to pass them into `send_response`{:.language-elixir}.

Additionally, if our methods evolve over time to need more inputs, or more intermediary values, our function calls will get more and more tangled up.

## The Pattern in Elixir

Instead of writing each function to take in exactly the arguments it needs, and returning a single value, let’s broaden our scope.

Let’s create a larger, all-encompassing state object that will contain all inputs, intermediary values, and outputs of our function chain.

In our case, we’ll need the `sms`{:.language-elixir} input, the `user`{:.language-elixir} object, and our system’s `response`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
%{sms: sms, user: nil, response: nil}
</code></pre>

We can then rewrite our `get_user`{:.language-elixir}, `get_response`{:.language-elixir}, and `send_response`{:.language-elixir} methods to take our state object as an argument, and return a (potentially modified) state object as a result:

<pre class='language-elixir'><code class='language-elixir'>
def get_user(state = %{sms: %{from: from}}) do
  ...
  %{state | user: ...}
end

def get_response(state = %{sms: %{message: message}}) do
  ...
  %{state | response: ...}
end

def send_response(state = %{user: user, response: response}) do
  ...
end
</code></pre>

Now we can cleanly chain together all of our function calls:

<pre class='language-elixir'><code class='language-elixir'>
%{sms: sms, user: nil, response: nil}
|> get_user
|> get_response
|> send_response
</code></pre>

<img style="width: 40%; margin: 0em 0 0em 1em; float:right;" title="The pattern visualized." src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/middleware.png">

Beautiful!

What’s great is that we can easily inject new functions into our chain without worrying about juggling inputs and outputs. Let’s add a function to the end of our chain that logs the entire interaction:

<pre class='language-elixir'><code class='language-elixir'>
%{sms: sms, user: nil, response: nil}
|> get_user
|> get_response
|> send_response
|> log_interaction
</code></pre>

In a similar vein, we can easily add debug logging (or anything else) between each step of the chain to get an in-depth look at what’s happening between each call in the chain:

<pre class='language-elixir'><code class='language-elixir'>
%{sms: sms, user: nil, response: nil}
|> get_user
|> IO.inspect    # debug logging
|> get_response
|> IO.inspect    # debug logging
|> send_response
|> IO.inspect    # debug logging
</code></pre>

## Now in Javascript

We can apply this same pattern in Javascript. The [Lodash](https://lodash.com/) library gives us an excellent set of tools for chaining together function calls. Let’s put them to work.

Imagine we have a similar set of functions:

<pre class='language-javascript'><code class='language-javascript'>
function get_user({sms: {from}}) {
  ...
}

function get_response({sms: {message}}) {
  ...
}

function send_response({user, response}) {
  ...
}
</code></pre>

We can use Lodash to run through our chain, just like we did in Elixir:

<pre class='language-javascript'><code class='language-javascript'>
_.chain({sms, user: undefined, response: undefined})
 .thru(get_user)
 .thru(get_response)
 .thru(send_response)
 .value();
</code></pre>

Similarly, we can [tap](https://lodash.com/docs/4.17.4#tap) into any point of this chain to add debug logging:

<pre class='language-javascript'><code class='language-javascript'>
_.chain({sms, user: undefined, response: undefined})
 .thru(get_user)
 .tap(console.debug)    // debug logging
 .thru(get_response)
 .tap(console.debug)    // debug logging
 .thru(send_response)
 .tap(console.debug)    // debug logging
 .value();
</code></pre>

## What’s in a Name

There are lots of names that we can throw at this pattern. Some of them stick better than others, but I’m not fully satisfied with any of them.

I asked in the [Elixir slack channel](https://elixir-slackin.herokuapp.com/) if anyone had a name for this kind of thing:

<blockquote style="font-size: 1rem;">
  <p style="font-weight: bold;">Is there a generic name for building a large, all encompassing state object, and then passing it through a lot of different functions that might only work on a subset of that state? What Plug does, for example.</p>
  <p style="font-weight: bold;">I find myself doing that kind of thing a lot, and I wonder if there’s some kind of name/pattern that describes it.</p>

  <p>Dependency injection?</p>

  <p style="font-weight: bold;">Yeah, maybe. I’d describe it as maybe DI + method chaining. DI seems like a weird thing to talk about in a purely functional setting. Of course dependencies will be injected.</p>

  <p>I was trying to look at “popular" non-Elixir projects (like Redux or Om) which use the same concept to see if they identify the pattern by a name, but I’m not seeing anything.</p>
</blockquote>

[Dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) (DI) might apply in a way, but I usually think of dependency injection in terms of passing around functionality, not data. In a pure functional context, _everything could be considered dependency injection_ in that sense.

I mentioned “method chaining”, which seems to describe a nice side-effect of the pattern, not the pattern itself.

---- 

Maybe the best pattern name would be “Middleware”, as seen in libraries like [Express](http://expressjs.com/en/guide/using-middleware.html), [React](http://redux.js.org/docs/advanced/Middleware.html), and [Plug](http://www.phoenixframework.org/v0.11.0/docs/understanding-plug).

The pattern used by these libraries is exactly what I’ve been describing, but I’m not sure about the name. The term “middleware” was originally used to describe something [very different](https://en.wikipedia.org/wiki/Middleware) than what we’ve been talking about.

On top of that, there’s some [disagreement amongst software developers](http://softwareengineering.stackexchange.com/questions/203314/what-is-the-middleware-pattern) as to whether “middleware” is the term we should be applying to this pattern (or if this is even a pattern at all).

Either way, I’ll probably refer to this pattern as middleware when talking with other developers, and I’ll definitely continue using my favorite pattern without a name.
