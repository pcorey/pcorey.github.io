---
layout: post
title:  "My Favorite Pattern Revisited"
date:   2017-02-27
tags: []
---

A few weeks ago, I posted an article about [my favorite pattern without a name](http://www.east5th.co/blog/2017/01/30/my-favorite-pattern-without-a-name/). Surprisingly, this article got quite a bit of feedback, both good and bad.

People were quick to point out that this pattern did indeed have a name. It’s a [fluent interface](https://martinfowler.com/bliki/FluentInterface.html)! It’s an [interceptor](https://stuarth.github.io/clojure/pedestal-browser-repl/), a la Clojure!  It’s a [lense](https://medium.com/@dtipson/functional-lenses-d1aba9e52254#.mcbjpmh68)! No wait, it’s just plain-old [functional composition](https://medium.com/@dtipson/im-a-bit-confused-with-the-lodash-part-because-afaict-thru-805184e804f3#.pyp6bsh5j)!

Some people pointed out that, regardless of what its called, [it’s an awful pattern](https://medium.com/@jorgecool/i-dont-want-to-sound-to-harsh-but-i-hadn-t-seen-such-a-bad-pattern-in-a-long-time-this-is-the-d416a6a268bb#.gri9qz07z).

While <strike>all</strike> most of these comments were relevant and useful, I found one of the discussions around this article especially interesting from a practical point of view; my friend [Charles Watson](https://twitter.com/SirCharlesW727) introduced me to the beauty of [Elixir’s `with`{:.language-elixir} macro](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#with/1)!

## Criticisms

The original example we started with in [my previous article](http://www.east5th.co/blog/2017/01/30/my-favorite-pattern-without-a-name/) looked something like this:

<pre class='language-elixir'><code class='language-elixir'>
user = get_user(sms.from)
response = get_response(sms.message)
send_response(user, response)
</code></pre>

After constructing an all-encompassing state object and chaining it through our three methods, we were left with this:

<pre class='language-elixir'><code class='language-elixir'>
%{sms: sms, user: nil, response: nil}
|> get_user
|> get_response
|> send_response
</code></pre>

The [main criticism of this approach](https://medium.com/@jorgecool/i-dont-want-to-sound-to-harsh-but-i-hadn-t-seen-such-a-bad-pattern-in-a-long-time-this-is-the-d416a6a268bb#.1hmmd58mm) largely boils down to the fact that we’re allowing our functions to know too much about the architecture of our final solution.

By passing our entire state “God object” into each function, we’re obfuscating the actual dependencies of the function. This makes it difficult to determine what the function actually does, and what it needs to operate.

---- 

From a practical standpoint, this chaining also presents problems with error handling.

Our original solution assumed that all of our functions succeeded. However, what happens if any of the functions in our chain fail? Can we even tell how they would fail in our example? Would they return an `:error`{:.language-elixir} tuple? Would they throw an exception?

It’s hard to tell from reading the code, and even worse, both failure modes would lead to a less-than-ideal debugging situations.

Thankfully, we can refactor this solution to use the `with`{:.language-elixir} macro and address both of these criticisms.

## Using the With Macro

With Elixir’s `with`{:.language-elixir} macro, we could have refactored our original example to look like this:

<pre class='language-elixir'><code class='language-elixir'>
with
  user     <- get_user(sms.from)
  response <- get_response(sms.message)
do
  send_response(user, response)
end
</code></pre>

So what’s the big deal? Arguably, this is much less clean that both our previous refactor and our original implementation!

While using the `with`{:.language-elixir} macro does cost a few extra characters, it doesn’t come without its benefits.

In our original example, I happily glossed over any errors that might have occurred during our SMS sending process.

Imagine if `get_response`{:.language-elixir} encountered an error. What does it return? Judging by the fact that a happy path call returns a response object, it’s easy to assume that an error would result in an exception. What if we wanted to gracefully handle that error, rather than having our process blow up?

Let’s pretend that we’ve refactored `get_user`{:.language-elixir}, `get_response`{:.language-elixir}, and `send_response`{:.language-elixir} to return either an `{:ok, result}`{:.language-elixir} tuple if everything went well, or an `{:error, error}`{:.language-elixir} tuple in the case of an error.

We could then refactor our `with`{:.language-elixir}-powered function pipeline to gracefully handle these errors:

<pre class='language-elixir'><code class='language-elixir'>
with
  {:ok, user}     <- get_user(sms.from)
  {:ok, response} <- get_response(sms.message)
  {:ok, sent}     <- send_response(user, response)
do
  {:ok, sent}
else
  {:error, :no_response} -> send_response(user, "I'm not sure what to say...")
  error -> error
end
</code></pre>

Our `with`{:.language-elixir} assignments happen in order. First, we call `get_user`{:.language-elixir} and try to pattern match it against `{:ok, user}`{:.language-elixir}. If that fails, we fall into the `else`{:.language-elixir} block where we try to pattern match against our known error patterns.

If `get_user`{:.language-elixir} fails with an `{:error, :user_not_found}`{:.language-elixir} error, for example, that error will match the `error -> error`{:.language-elixir} case in our `else`{:.language-elixir} block and will be returned by our `with`{:.language-elixir} expression.

Even more interestingly, if `get_response`{:.language-elixir} fails with a `{:error, :no_response}`{:.language-elixir} error, we’ll match against that error tuple in our `else`{:.language-elixir} block and send an error response back to the user.

___Using `with`{:.language-elixir}, we’re able to short circuit our function pipeline as soon as anything unexpected happens, while still being able to gracefully handle errors.___

Another added benefit of using `with`{:.language-elixir} over the pattern I described in [my previous post](http://www.east5th.co/blog/2017/01/30/my-favorite-pattern-without-a-name/) is that it doesn’t artificially inflate the surface area of the functions we’re calling.

Each function is passed only the exact arguments it needs. This reduction of arguments creates a much more understandable, testable, and maintainable solution.

On top of that, by specifying arguments more explicitly, a natural ordering falls out of our function chain.

## Final Thoughts

While this is a fairly contrived example, `with`{:.language-elixir} can be used to gracefully express complicated functional pipelines. I’ll definitely be using the `with`{:.language-elixir} macro in my future adventures with Elixir.

I’d like to thank my friend [Charles Watson](https://twitter.com/SirCharlesW727) for pointing out the `with`{:.language-elixir} macro to me and showing me just how awesome it can be.

If you’re interested in this type of thing and want to dive deeper into the world of functional composition, I highly recommend you check out [this response to my previous article](https://medium.com/@dtipson/im-a-bit-confused-with-the-lodash-part-because-afaict-thru-805184e804f3#.xr3mfr31h), left by [Drew Tipson](https://twitter.com/dtipson). He outlines many interesting topics which are all fantastic diving boards into worlds of amazing topics.

Happy composing!
