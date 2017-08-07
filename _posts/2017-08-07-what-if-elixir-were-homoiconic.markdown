---
layout: post
title:  "What if Elixir were Homoiconic?"
date:   2017-08-07
tags: []
---

Because of it’s fantastically powerful macro system, Elixir is sometimes [mistakenly referred to as a homoiconic programming language](https://news.ycombinator.com/item?id=7623991).

That being said, let’s put on our day-dreaming hats and think about what Elixir would look like _if it were homoiconic_.

## What is Homoiconicity?

Before we start throwing around the word “homoiconic” and exploring how it applies to Elixir, let’s take the time to talk about what it means.

Boiled down to its essence, “homoiconic” when referring to programming languages means that “code is data”. That is, the code used to express a program is written using the data structures of that language.

The archetypal homoiconic family of programming languages is the Lisp family. The Lisp family includes languages like [Common Lisp](https://common-lisp.net/), [Scheme](http://www.schemers.org/), [Clojure](https://clojure.org/), and so on.

In most Lisps, list data structures are represented by values within sets of parentheses, separated by spaces:

<pre class='language-elixir'><code class='language-elixir'>
(1 2 3)
</code></pre>

Similarly, programs are represented by keywords and values within sets of parentheses, separated by spaces. Here’s an example of a function that calculates the [Fibonacci sequence](https://en.wikipedia.org/wiki/Fibonacci_number) [written in Scheme](http://wiki.c2.com/?FibonacciSequence):

<pre class='language-elixir'><code class='language-elixir'>
(define (fib n)
    (cond
      ((= n 0) 0)
      ((= n 1) 1)
      (else
        (+ (fib (- n 1))
           (fib (- n 2))))))
</code></pre>

If we view this code through a homoiconic lens, we can see that it’s really just a set of nested lists. At its highest level, we’re looking at a list of three elements. The first element is the keyword `define`{:.language-elixir}, while the second and third arguments are new lists.

This code is data, and this data is code.

Going deeper down the rabbit hole, we could write code (read: data) that takes code (read: data) as an argument and outputs new code (read: data). This type of function would be [referred to as a macro](https://en.wikipedia.org/wiki/Macro_(computer_science)).

Not only does homoiconicity give us powerful metaprogramming tools, but it’s also sublimely beautiful.

## Is Elixir Homoiconic?

The Elixir programming language is not homiconic. Elixir programs aren’t written using data structures from the language itself. That being said, Elixir does have [an incredibly powerful macro system](https://elixir-lang.org/getting-started/meta/macros.html) that gives us many of the benefits of a truly homoiconic language.

Macros operate on Elixir’s [abstract syntax tree (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree), which is basically a data structure that represents the structure of a given piece of Elixir code.

To visualize that idea, here’s a simple piece of Elixir code followed by its AST equivalent:

<pre class='language-elixir'><code class='language-elixir'>
if (foo) do
  bar
end
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
{:if, [context: Elixir, import: Kernel],
 [{:foo, [], Elixir}, [do: {:bar, [], Elixir}]]}
</code></pre>

Much of Elixir’s syntax is actually constructed with macros that operate directly on these ASTs. In fact, [`if`{:.language-elixir} itself is a macro](https://github.com/elixir-lang/elixir/blob/v1.5.1/lib/elixir/lib/kernel.ex#L2575-L2633) and is replaced at compile-time with a `case`{:.language-elixir} statement!

We can generate an AST for any piece of Elixir code using `quote`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
ast = quote do
  if (foo) do
    bar
  end
end
</code></pre>

We can then use `Macro.to_string`{:.language-elixir} to convert our AST back into printable code:

<pre class='language-elixir'><code class='language-elixir'>
ast
|> Macro.to_string
|> IO.puts
</code></pre>

This would result in our original `if`{:.language-elixir} statement being printed to the console.

## If Elixir Were Homoiconic…

If Elixir were homoiconic, we would essentially be writing these abstract syntax trees by hand, bypassing the [lexing and parsing phase](https://softwareengineering.stackexchange.com/a/118587) of Elixir compilation.

Let’s quickly break down Elixir’s AST structure so we can better understand what we would be writing.

Elixir ASTs, unlike Lisp programs which are composed of nested lists, are composed of nested tuples. [Each tuple contains three parts](https://elixir-lang.org/getting-started/meta/quote-and-unquote.html): the name of the function being called, any necessary metadata related to the function call, any any arguments being passed into that function.

<pre class='language-elixir'><code class='language-elixir'>
{:if, [context: Elixir, import: Kernel],
 [{:foo, [], Elixir}, [do: {:bar, [], Elixir}]]}
</code></pre>

Using our previous example of an `if`{:.language-elixir} statement, we can see that the first tuple is calling the `:if`{:.language-elixir} function with two arguments: `{:foo, [], Elixir}`{:.language-elixir}, and `[do: {:bar, [], Elixir}]`{:.language-elixir}.

This type of representation of an Elixir program is very similar to a Lisp, because a Lisp is essentially a textual representation of a program’s AST!

---- 

Using this newfound way of writing Elixir code, let’s write a basic GenServer module:

<pre class='language-elixir'><code class='language-elixir'>
{:defmodule, [],
 [{:__aliases__, [], [:Stack]},
  [do: {:__block__, [],
    [{:use, [],
      [{:__aliases__, [], [:GenServer]}]},
     {:def, [],
      [{:handle_call, [],
        [:pop, {:_from, [], Elixir},
         [{:|, [],
           [{:h, [], Elixir},
            {:t, [], Elixir}]}]]},
       [do: {:{}, [],
         [:reply, {:h, [], Elixir},
          {:t, [], Elixir}]}]]},
     {:def, [],
      [{:handle_cast, [],
        [{:push, {:item, [], Elixir}}, {:state, [], Elixir}]},
       [do: {:noreply,
         [{:|, [], [{:item, [], Elixir}, {:state, [], Elixir}]}]}]]}]}]]}
</code></pre>

Beautiful, isn’t it? No, I guess not.

In case you can’t grok what’s going on in the above code, it’s simply the basic implementation of a stack using GenServer [as described by the Elixir documentation](https://hexdocs.pm/elixir/GenServer.html#module-example):

<pre class='language-elixir'><code class='language-elixir'>
defmodule Stack do
  use GenServer

  def handle_call(:pop, _from, [h | t]) do
    {:reply, h, t}
  end

  def handle_cast({:push, item}, state) do
    {:noreply, [item | state]}
  end
end
</code></pre>

It turns out that vanilla Elixir syntax is much easier to understand than our homoiconic representation.

## Final Thoughts

If this has shown us anything, it’s that homoiconicity is something special. 

It takes considerable upfront design work on the behalf of a language designer to create a homoiconic language that’s pleasant to use.

That being said, Elixir’s built-in macro system lets us take advantage of many of the benefits of a truly homoiconic language, while still giving us a syntax that is easy to use and understand.
