---
layout: post
title:  "Grokking the Y Combinator with Elixir"
date:   2017-10-30
tags: []
---

I’ve been re-reading one of my favorite programming books, [The Little Schemer](http://amzn.to/2y4nsWS), and I had an epiphany in one of the final chapters.

Among many other mind-bending topics, the book goes through a derivation of the [Y combinator](https://en.wikipedia.org/wiki/Fixed-point_combinator). In the past, any technical explanations of the Y combinator have left me with a brain folded into a pretzel and a throbbing headache. This time, however, something clicked.

But with the help of the quirky guiding dialog of [The Little Schemer](http://amzn.to/2y4nsWS), I feel like I finally understand the Y combinator.

I want to share that understanding with you, my Elixir-loving friend!

In this article we’ll briefly go over what exactly the Y combinator is, and then dive deep into how we can derive it using anonymous Elixir functions. This is definitely a brain-stretcher of an article, and I hope you find it as interesting as I do.

## But Why? (Pun Intended)

Why is it important that you know about the Y combinator? Honestly, unless you’re a professional computer scientist, it’s not. When it comes to day-to-day web development, the applicable benefits of knowing what the Y combinator is and how it works are practically nonexistent.

Putting practicality aside, the Y combinator is one of the most interesting objects in all of computer science.

In the most basic sense, the Y combinator allows computer scientists to define recursive functions in [Lambda Calculus](https://en.wikipedia.org/wiki/Lambda_calculus), a language that fundamentally doesn’t support recursion. The way in which it does this is one of the most clever and intricately beautiful solutions to any programming problem I’ve ever seen.

For me, the Y combinator is something like the [Mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set), or [Conway’s Game of Life](http://www.east5th.co/blog/2017/02/06/playing-the-game-of-life-with-elixir-processes/). It’s something to be marveled at; something to be revered.

## Deriving An Example

Let’s start our dive into the world of the Y combinator by coming up with a recursive function we want to build _without using recursion_!

We’ll use a simple classic:

<pre class='language-elixir'><code class='language-elixir'>
def length([]),    do: 0
def length([h|t]), do: 1 + length(t)
</code></pre>

Defined as an anonymous function, `length`{:.language-elixir} computes the length of a list:

<pre class='language-elixir'><code class='language-elixir'>
length([])     # 0
length([1])    # 1
length([1, 1]) # 2, etc...
</code></pre>

When `length`{:.language-elixir} is passed an empty list, we return a length of `0`{:.language-elixir}. When its passed a non-empty list, we return `1`{:.language-elixir} plus the `length`{:.language-elixir} of the tail of the list. We’re able to create this type of [recursive definition](https://en.wikipedia.org/wiki/Recursion) because when defining functions using `def`{:.language-elixir} and `defp`{:.language-elixir}, Elixir is kind enough to allow the defined function to make direct references and calls to itself.

However, what if we were to try to write a recursive anonymous function?

<pre class='language-elixir'><code class='language-elixir'>
length = fn
  []    -> 0
  [h|t] -> 1 + length.(t)
end
</code></pre>

Here we’re binding `length`{:.language-elixir} to an anonymous function. Within that anonymous function we attempt to recurse by calling `length`{:.language-elixir}. Unfortunately, at this point `length`{:.language-elixir} [is not in scope](http://elixir-lang.readthedocs.io/en/latest/technical/scoping.html), and so Elixir blows up with a compilation error:

<pre class='language-*'><code class='language-*'>** (CompileError) iex:9: undefined function length/0
    (stdlib) lists.erl:1354: :lists.mapfoldl/3
    (stdlib) lists.erl:1355: :lists.mapfoldl/3
</code></pre>

Is it possible to write a recursive anonymous function? Put another way, can you write a recursive function without being able to directly refer to yourself?

Yes! __Behold the power of the Y combinator!__

## Down the Rabit Hole

Before we start our deep dive, let’s pull back and simplify things a bit. While our recursive call to our anonymous `length`{:.language-elixir} function doesn’t work, part of our `length`{:.language-elixir} function is still correct.

Let’s pull out the recursive piece to highlight what we mean:

<pre class='language-elixir'><code class='language-elixir'>
length = fn
  []    -> 0
  [h|t] -> 1 + (fn _ -> raise "oops" end).(t)
end
</code></pre>

Even with the recursive piece removed, we’re able to calculate the length of empty lists:

<pre class='language-elixir'><code class='language-elixir'>
length.([])   # 0
length.([1])  # oops
</code></pre>

We could add support for lists of length `1`{:.language-elixir} by substituting the function that raises an exception (our “raising function”) with another identical copy of our `length`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
length = fn
  []    -> 0
  [h|t] -> 1 + (fn
                  []    -> 0
                  [h|t] -> 1 + (fn _ -> raise "oops" end).(t)
                end).(t)
end
</code></pre>

Now our function works for lists of length `0`{:.language-elixir} and `1`{:.language-elixir}, but blows up on lists two or more elements long:

<pre class='language-elixir'><code class='language-elixir'>
length.([])     # 0
length.([1])    # 1
length.([1, 2]) # oops
</code></pre>

We could add support for even longer lists by continuously replacing the raising function with additional copies of our `length`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
length = fn
  []    -> 0
  [h|t] -> 1 + (fn
                  []    -> 0
                  [h|t] -> 1 + (fn
                                  []    -> 0
                                  [h|t] -> 1 + (
                                                  ...
                                               ).(t)
                                end).(t)
                end).(t)
end
</code></pre>

While this works, it’s obviously infeasible. If we wanted to calculate the length of a one thousand element list, we’d need to chain at least one thousand function definitions together.

Not only that, but we’ll always have an upper bound using this technique. At some point, our chain will end and our raising function will throw an exception.

We need to do better.

## Don’t Repeat Yourself

If you look at the code above, you’ll notice lots of repetition. At each level of “recursion” we define an anonymous function that looks very similar to our original `length`{:.language-elixir} function.

Every level is identical except for the function we’re calling into in the next level. Sometimes we call into another `length`{:.language-elixir}-like function, but at the very end we call into our raising function.

We can cut down on all that repeated code by writing a function that makes each level of this `length`{:.language-elixir} stack. Our `make_length`{:.language-elixir} function takes the bit that changes in each level, the next function to call into, as an argument:

<pre class='language-elixir'><code class='language-elixir'>
make_length = fn
  length ->
    fn
      []    -> 0
      [h|t] -> 1 + length.(t)
    end
end
</code></pre>

Now we can use `make_length`{:.language-elixir} to write a `length`{:.language-elixir} function that works on empty lists:

<pre class='language-elixir'><code class='language-elixir'>
make_length.(fn _ -> raise "oops" end)
</code></pre>

And similarly, we can use `make_length`{:.language-elixir} to write a `length`{:.language-elixir} function that works on lists of length zero or one:

<pre class='language-elixir'><code class='language-elixir'>
make_length.(make_length.(fn _ -> raise "oops" end))
</code></pre>

This works because we create our zero-length function and pass it into `make_length`{:.language-elixir}, which wraps it in another application of our `length`{:.language-elixir}-like function.

We can even use [Elixir pipes](https://elixirschool.com/en/lessons/basics/pipe-operator/) to make things a bit cleaner:

<pre class='language-elixir'><code class='language-elixir'>
(fn _ -> raise "oops" end)
|> (make_length).()
|> (make_length).()
</code></pre>

Without using the `make_length`{:.language-elixir} binding, we could define a totally anonymous version of `length`{:.language-elixir} that works on lists up to three elements long:

<pre class='language-elixir'><code class='language-elixir'>
(fn
  make_length ->
    (fn _ -> raise "oops" end)
    |> (make_length).() # support for length 1
    |> (make_length).() # support for length 2
    |> (make_length).() # support for length 3
end).(fn
  length ->
    fn
      []    -> 0
      [h|t] -> 1 + length.(t)
    end 
end)
</code></pre>

Now we’re getting somewhere!

While we’ve managed to cut out most of the repetition of our original solution, we’re still facing the problem of being restricted to a finite number of recursions.

## Building the Road as we Go

In our current solution, we need to define, in advance, the maximum list length our anonymous `length`{:.language-elixir} function will support.

Every repeated application of `make_length`{:.language-elixir} adds another layer to our growing stack of functions. But if we’re passed a long enough list that chews through that stack, the raising function is called and our length calculation grinds to a screeching halt.

To solve the last piece of this puzzle, we need to think very carefully about what it is we’re doing…

---- 

Every time our `length`{:.language-elixir}-like function is called it decides whether or not it needs to recurse. If it does, it calls the `length`{:.language-elixir} function tied to its closure. If it doesn’t, it simply returns a value which trickles its way back up the call stack.

The danger is that the `length`{:.language-elixir} function might actually point to our raising function.

Instead of throwing an exception when we hit that last function in the stack, we’d really like to add another layer of our `length`{:.language-elixir}-like function and call that instead. Really, we only ever need two functions in our stack. The current function, and the next function we want to call into.

Each layer of our `length`{:.language-elixir}-like function is created by passing `make_length`{:.language-elixir} into `make_length`{:.language-elixir}. Let’s simplify our stack creation by pulling out our raising function and simply returning the next layer of our `length`{:.language-elixir}-like function:

<pre class='language-elixir'><code class='language-elixir'>
(fn
  make_length ->
    make_length.(make_length) # Add another layer
end).(fn
  length ->
    fn
      []    -> 0
      [h|t] -> 1 + length.(t)
    end 
end)
</code></pre>

At this point we could even rename the `length`{:.language-elixir} argument in our second anonymous function to `make_length`{:.language-elixir} to remind ourselves of what’s not being passed into it.

<pre class='language-elixir'><code class='language-elixir'>
(fn
  make_length ->
    make_length.(make_length)
end).(fn
  make_length -> # We're being passed make_length
    fn
      []    -> 0
      [h|t] -> 1 + make_length.(t)
    end 
end)
</code></pre>

But there’s a problem here.

Now we’re trying to pass the tail of our list (`t`{:.language-elixir}) into `make_length`{:.language-elixir}. This doesn’t make much sense. The `make_length`{:.language-elixir} function _expects a function_ as an argument, and _returns a function_ that accepts a list.

What could we pass into `make_length`{:.language-elixir} to build the next layer of our recursion? Take a minute, and remember that at this point `make_length`{:.language-elixir} represents the entirety of our second anonymous function:

<pre class='language-elixir'><code class='language-elixir'>
(fn
  make_length ->
    fn
      []    -> 0
      [h|t] -> 1 + make_length.(t)
    end 
end)
</code></pre>

Well, couldn’t we just pass `make_length`{:.language-elixir} into `make_length`{:.language-elixir}? Yes!

Passing `make_length`{:.language-elixir} into `make_length`{:.language-elixir} returns another layer of our `length`{:.language-elixir}-like function that accepts a list as an argument:

<pre class='language-elixir'><code class='language-elixir'>
(fn
  make_length ->
    make_length.(make_length)
end).(fn
  make_length ->
    fn
      []    -> 0
      [h|t] -> 1 + (make_length.(make_length)).(t)
    end 
end)
</code></pre>

This new layer of our `length`{:.language-elixir}-like function still has access to `make_length`{:.language-elixir}, so if it decides to recurse, it has everything it needs to build and apply the next layer of `length`{:.language-elixir}. We don’t need to build our entire tower of `length`{:.language-elixir} functions up-front. We can construct each layer as we go!

Amazing… Does your brain hurt yet?

<blockquote>
  <p>Each generation would be both content and vessel, an echo in a self-sustaining reverberation.
  — Ted Chiang in <a href="http://amzn.to/2zSOH40">Stories of Your Life and Others</a></p>
</blockquote>

## Reclaiming Our Length Function

As it stands now, our solution is fully functional. We can calculate the length of any list, no matter its size:

<pre class='language-elixir'><code class='language-elixir'>
(fn
  make_length ->
    make_length.(make_length)
end).(fn
  make_length ->
    fn
      []    -> 0
      [h|t] -> 1 + (make_length.(make_length)).(t)
    end 
end).([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...])
</code></pre>

The only problem with this solution is that we’ve lost sight of the structure and shape of our original function:

<pre class='language-elixir'><code class='language-elixir'>
fn
  []    -> 0
  [h|t] -> 1 + length.(t)
end
</code></pre>

Instead, we’ve had to modify that function to include strange implementation-specific calls to `make_length`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
fn
  []    -> 0
  [h|t] -> 1 + (make_length.(make_length)).(t)
end
</code></pre>

If we could reclaim the original shape of our `length`{:.language-elixir} function, we could theoretically factor it out and create a generic utility that could be used to make _any_ function recursive without modification.

The first step towards our goal is refactoring the code that makes our next application of `length`{:.language-elixir} (`(make_length.(make_length)))`{:.language-elixir} into a function of its own:

<pre class='language-elixir'><code class='language-elixir'>
fn
  t ->
    (make_length.(make_length)).(t)
end
</code></pre>

This function accepts `t`{:.language-elixir} (the tail of our list) as an argument and applies `t`{:.language-elixir} to the next layer of `length`{:.language-elixir} after it’s been created.

The result of this function is actually `length`{:.language-elixir}! We can write another closure that accepts `length`{:.language-elixir} as an argument and pass this new function into it. The result is slightly longer, but we’ve managed to reclaim the structure of our original `length`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
(fn
  make_length ->
    make_length.(make_length)
end).(fn
  make_length ->
    (fn
      length ->
        fn
          []    -> 0
          [h|t] -> 1 + length.(t)
        end
    end).(fn
      t ->
        (make_length.(make_length)).(t)
    end)
end)
</code></pre>

Our reclaimed `length`{:.language-elixir} function doesn’t make any references to `make_length`{:.language-elixir}, so we’re free to untangle it from this rat’s nest of anonymous functions.

Let’s wrap the entire block in one more closure that accepts our `length`{:.language-elixir} function as a parameter:

<pre class='language-elixir'><code class='language-elixir'>
(fn
  length ->
    (fn
      make_length ->
        make_length.(make_length)
    end).(fn
      make_length ->
        length.(fn
          t ->
            (make_length.(make_length)).(t)
        end)
    end)
end).(fn
  length ->
    fn
      []    -> 0
      [h|t] -> 1 + length.(t)
    end 
end)
</code></pre>

With `length`{:.language-elixir} factored out, let’s refactor the meat of our solution to use slightly more traditional, albeit significantly less readable argument names:

<pre class='language-elixir'><code class='language-elixir'>
y = fn
  f ->
    (fn
      x ->
        x.(x)
    end).(fn
      x ->
        f.(fn
          t ->
            (x.(x)).(t)
        end)
    end)
end
</code></pre>

What’s especially amazing is that we can use this helper function, `y`{:.language-elixir}, to make any function recursive! Here’s a recursive function that calculates the Nth number in the [Fibonacci series](https://en.wikipedia.org/wiki/Fibonacci_number):

<pre class='language-elixir'><code class='language-elixir'>
y.(fn
  fib ->
    fn
      0 -> 0
      1 -> 1
      n -> fib.(n-1) + fib.(n - 2)
    end 
end)
</code></pre>

As you may have guessed, this _thing_ that we’ve come up with has a name. __It’s the Y combinator!__ It’s my opinion that the Y combinator is one of the most beautiful structures in all of computer science.

## Final Thoughts and More Resources

I hope this article helped you understand the Y combinator in all of its recursive, fractal glory.

To be honest, I still find the Y combinator to be a difficult thing to understand. I understand each step of the derivation, but when confronted with the Y combinator in its condensed, Lambda Calculus form, I find myself unable to succinctly sum up what it does in plain English:

> λf. (λx. f (x x))(λx. f (x x))

It’s all Greek to me.

If you need more help wrapping your brain around this slippery idea, I highly recommend you check out [The Little Schemer](http://amzn.to/2y4nsWS) by Daniel P. Friedman and Matthias Felleisen. This book opened my eyes to the beauty of the Y combinator and many other equally mind-blowing topics. Highly recommended.

If books aren’t your thing, check out this [gentle introduction to the Y combinator on Computerphile](https://www.youtube.com/watch?v=9T8A89jgeTI), or read through [this in-depth article](http://mvanier.livejournal.com/2897.html) to deepen your understanding.
