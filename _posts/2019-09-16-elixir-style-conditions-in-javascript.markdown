---
layout: post
title:  "Elixir Style Conditions in Javascript"
excerpt: "With a small perspective shift, we can write Elixir-style conditions in languages like Javascript that only support switch statements."
author: "Pete Corey"
date:   2019-09-16
tags: ["Elixir", "Javascript"]
related: []
---

Elixir has a useful control flow structure called [`cond`{:.language-elixir}](https://elixir-lang.org/getting-started/case-cond-and-if.html#cond) that lets you branch on arbitrary conditions. Unlike the more common [`switch`{:.language-javascript}](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch) control structure ([`case`{:.language-javascript} in Elixir](https://elixir-lang.org/getting-started/case-cond-and-if.html#case)), `cond`{:.language-elixir} doesn't match against a predetermined value. Instead, it evaluates each condition, in order, looking for the first one that evaluates to a truthy value (not `nil`{:.language-elixir} or `false`{:.language-elixir}).

<pre class='language-elixir'><code class='language-elixir'>
numbers = [1, 2, 3]
result = cond do
  4 in numbers ->
    :four
  6 == Enum.sum(numbers) ->
    :sum
  true ->
    :default
end
</code></pre>

This is all probably old hat to you.

As I mentioned, `cond`{:.language-elixir} can be an incredibly useful control structure, and there are times when I've missed it while working in languages like Javascript that only have `switch`{:.language-javascript} expressions.

A traditional Javascript implementation of the above (with a little help from [Lodash](https://lodash.com/)) would look something like this:

<pre class='language-javascript'><code class='language-javascript'>
let numbers = [1, 2, 3];
if (_.includes(numbers, 4)) {
  var result = "four";
} else if (6 === _.sum(numbers)) {
  var result = "sum";
} else {
  var result = "default";
}
</code></pre>

However, [I recently stumbled upon a trick](https://twitter.com/swyx/status/1163225169676132353) that lets you implement a `switch`{:.language-javascript} statement in Javascript that behaves very similarly to a `cond`{:.language-elixir} expression in Elixir. The key is to `switch`{:.language-javascript} on the value of `true`{:.language-javascript}. The case expressions that evaluate to `true`{:.language-javascript} will match, and their corresponding statements will be evaluated in order.

<pre class='language-javascript'><code class='language-javascript'>
let numbers = [1, 2, 3];
switch (true) {
  case _.includes(numbers, 4):
    var result = "four";
    break;
  case 6 === _.sum(numbers):
    var result = "sum";
    break;
  default:
    var result = "default";
    break;
}
</code></pre>

Whether or not this is any more useful or readable than a series of `if`{:.language-javascript}/`else`{:.language-javascript} blocks is debatable. That said, this is definitely an interesting example of perspective shifting and seeing old code in a new light. Hopefully you find it as interesting as I do.
