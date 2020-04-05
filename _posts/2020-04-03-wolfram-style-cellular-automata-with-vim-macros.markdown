---
layout: post
title:  "Wolfram Style Cellular Automata with Vim Macros"
excerpt: "Let's use substitutions and recursive macros to generate Wolfram-style cellular automata entirely within Vim. Why? Because it's Friday."
author: "Pete Corey"
date:   2020-04-03
tags: ["Vim", "Cellular Automata", "Math"]
related: []
---

It struck me while taking a break from a heavy refactoring session and browsing [/r/cellular_automata](https://www.reddit.com/r/cellular_automata/) that Wolfram-style cellular automata are really just glorified string substitutions. Suddenly I felt a tickling deep in my hindbrain. An idea was forming. _Can you implement [a Wolfram-style cellular automata](https://en.wikipedia.org/wiki/Cellular_automaton#Classification), like [Rule-30](https://en.wikipedia.org/wiki/Rule_30), entirely within Vim using only "normal" features like macros and substitutions?_

In an effort to rid myself of the crushing weight of that question (and because it was Friday), I descended into the depths and came back with an answer. _Yes, you can._

## What is Rule 30?

Before we stick our hands into a big pile of Vim, let's take a look at what we're trying to accomplish. Wolfram-style [cellular automata](https://en.wikipedia.org/wiki/Cellular_automaton) are a family of one-dimensional cellular automata where a cell's state in the next generation is determined by its current state and the state of its immediate neighbors.


[Rule 30](https://en.wikipedia.org/wiki/Rule_30), a specific type of Wolfram-style cellular automata, derives it's rules from the binary representation of the number thirty, `00011110`{:.language-*}:

<table align="center" style="text-align:center">
<tbody><tr>
<th style="padding: 0 0.5rem;"><code class="language-*">■</code><code class="language-*">■</code><code class="language-*">■</code></th>
<th style="padding: 0 0.5rem;"><code class="language-*">■</code><code class="language-*">■</code><code class="language-*">□</code></th>
<th style="padding: 0 0.5rem;"><code class="language-*">■</code><code class="language-*">□</code><code class="language-*">■</code></th>
<th style="padding: 0 0.5rem;"><code class="language-*">■</code><code class="language-*">□</code><code class="language-*">□</code></th>
<th style="padding: 0 0.5rem;"><code class="language-*">□</code><code class="language-*">■</code><code class="language-*">■</code></th>
<th style="padding: 0 0.5rem;"><code class="language-*">□</code><code class="language-*">■</code><code class="language-*">□</code></th>
<th style="padding: 0 0.5rem;"><code class="language-*">□</code><code class="language-*">□</code><code class="language-*">■</code></th>
<th style="padding: 0 0.5rem;"><code class="language-*">□</code><code class="language-*">□</code><code class="language-*">□</code>
</th></tr>
<tr>
<td><code class="language-*">□</code></td>
<td><code class="language-*">□</code></td>
<td><code class="language-*">□</code></td>
<td><code class="language-*">■</code></td>
<td><code class="language-*">■</code></td>
<td><code class="language-*">■</code></td>
<td><code class="language-*">■</code></td>
<td><code class="language-*">□</code>
</td></tr></tbody></table>

As you can hopefully infer from the diagram above, an "on" cell with two "on" neighbors will turn off in the next generation. Similarly, an "off" cell with an "on" leftmost neighbor will turn on, and so on.

When computing the next generation, every cell with two neighbors is considered before any modifications are made. Let's solidify our understanding by considering how the next generation of a longer initial sequence would be computed:

<pre class='language-*'><code class='language-*'>□□■□□
</code></pre>

Looking at each cell and its imediate neighbors, we can use [the rules](https://en.wikipedia.org/wiki/Rule_30#Rule_set) described above to come up with the next generation of our sequence. The first three cells are `□□■`{:.language-*}, which map to `■`{:.language-*} in the next generation. The next three cells, `□■□`{:.language-*}, map to `■`{:.language-*}. And finally, the last three cells, `■□□`{:.language-*}, map to `■`{:.language-*}.

This means the next generation of our initial sequence of cells (`□□■□□`{:.language-*}) is `■■■`{:.language-*}. Notice that the next generation of our automata is two cells shorter than the previous generation. A simple way of avoiding this problem is to prepend and append "off" cells to the initial generation before computing the subsequent generation. If we had done that, we'd have ended up with `□■■■□`{:.language-*} as our next generation, rather than `■■■`{:.language-*}.

We can repeatedly apply this operation on successive generations to create many interesting patterns, [balancing on the edge of chaos and order](https://en.wikipedia.org/wiki/Cellular_automaton#Classification).

## The Seeds of a Plan

Coming into this project, I had a high-level plan of attack for accomplishing what I was after. I knew I wouldn't be able to process every iteration of the cellular automata in one pass. I'd have to break the process down into pieces.

My main strategy was to break each generation, represented as a line of on/off characters, into a paragraph of three-character lines, one for each grouping of neighbors. From there I could encode the cellular automata's rules into substitution commands, and roll the resulting paragraph of one-character lines back up into a single line.

This [current-line](https://vim.fandom.com/wiki/Ranges) substitution was the foundation of my solution:

<pre class='language-*'><code class='language-*'>:.s/^\(..*\)\(\(..\).\)$/\1\3\r\2/
</code></pre>

The idea behind this [substitution](https://vim.fandom.com/wiki/Search_and_replace) is to use [capture groups](http://vimregex.com/#backreferences) to replace a line with everything up until the last character of the line (`\1\3`{:.language-*}), followed by a newline (`\r`{:.language-*}), and the last three characters of the original line (`\2`{:.language-*}). As an aside, I learned that [you should use `\r`{:.language-*} instead of `\n`{:.language-*} when using newlines in substitutions](https://stackoverflow.com/questions/71323/how-to-replace-a-character-by-a-newline-in-vim).

Executed on a line with the text, `□□■□□`{:.language-*}, we'd get the following result:

<pre class='language-*'><code class='language-*'>□□□■□□
□□□
</code></pre>

Repeatedly applying this substitution would give us the following paragraph of lines:

<pre class='language-*'><code class='language-*'>□□□
□□■
□■□
■□□
□□□
</code></pre>

From here, we can translate our eight Rule 30 rules into global substitutions:

<pre class='language-*'><code class='language-*'>:%s/^■■■$/□/g
:%s/^■■□$/□/g
:%s/^■□■$/□/g
:%s/^■□□$/■/g
:%s/^□■■$/■/g
:%s/^□■□$/■/g
:%s/^□□■$/■/g
:%s/^□□□$/□/g
</code></pre>

Running those substitutions on our paragraph gives us a new paragraph made up of single character lines. Each of these characters is a cell in our next generation:

<pre class='language-*'><code class='language-*'>□
■
■
■
□
</code></pre>

Next we just need to roll that paragraph back up into a single line. `J`{:.language-*} is the tool for joining lines in Vim, but `J`{:.language-*} insists on separating newly concatenated lines with a space. It turns out [you can join lines directly with the `gJ`{:.language-*} command](https://vi.stackexchange.com/questions/439/how-to-join-lines-without-producing-a-space):

<pre class='language-*'><code class='language-*'>□■■■□
</code></pre>

And just like that we have our next generation.

## Implementing Our Plan

The outline of our plan includes lots of hand waving, like "repeatedly applying this substitution," which just won't cut it for a fully automated cellular automata generation machine.

We need a way of turning our very hands-on algorithm into a hands-off, fully automated solution. An elegant way of doing this is using [Vim's built-in macro system](https://vim.fandom.com/wiki/Macros). Vim macros are ridiculously powerful while being ridiculously simple in concept. [They're just stored keystrokes](https://www.hillelwayne.com/post/vim-macro-trickz/). This means there's nothing stopping a macro (stored in, say, the `q`{:.language-*} register) from invoking itself recursively (`@q`{:.language-*}). This opens the door for quite a few interesting possibilities.

In the hope of building a fully automated solution, let's implement our cellular automata generator as a script of keystrokes that can be executed in ["batch mode"](http://vimdoc.sourceforge.net/htmldoc/starting.html#-s) with the `-s`{:.language-*} flag. Once finished, we'll be able to invoke our generator on a file containing a seed, or an initial sequence of cells, with the following command:


<pre class='language-bash'><code class='language-bash'>vim -s script seed
</code></pre>

We'll start off our script by using `setreg`{:.language-*} ([instead of `let`{:.language-*}](https://groups.google.com/forum/#!topic/vim_use/-pbK15zfqts)) to define a macro `b`{:.language-*} that will perform our first set of substitutions and build our paragraph of three-character lines:

<pre class='language-*'><code class='language-*'>:call setreg('b', ':.s/^\(..*\)\(\(..\).\)$/\1\3\r\2/|norm!``@b', 'l')
</code></pre>

The ```|norm!`` ```{:.language-*} at the end of our substitution [returns the cursor to it's starting place](https://stackoverflow.com/questions/10468324/vim-replace-all-without-cursor-moving) after each replacement.

Next, let's define a macro to perform each of our Rule 30 replacements. I built these as eight separate macros, rather than one macro that performed eight substitutions because any of these substitutions might not find what they're looking for, which causes it's active macro execution to fail. Breaking each substitution out into it's own macro prevents its potential failure from affecting other rules:

<pre class='language-*'><code class='language-*'>:call setreg('1', ':%s/^■■■$/□/g', 'l')
:call setreg('2', ':%s/^■■□$/□/g', 'l')
:call setreg('3', ':%s/^■□■$/□/g', 'l')
:call setreg('4', ':%s/^■□□$/■/g', 'l')
:call setreg('5', ':%s/^□■■$/■/g', 'l')
:call setreg('6', ':%s/^□■□$/■/g', 'l')
:call setreg('7', ':%s/^□□■$/■/g', 'l')
:call setreg('8', ':%s/^□□□$/□/g', 'l')
</code></pre>

Let's write one more macro, `c`{:.language-*}, to roll our paragraph of Rule 30 replacements back up into a single line:

<pre class='language-*'><code class='language-*'>:call setreg('c', '''aV}gJ', 'l')
</code></pre>

Now we'll tie everything together with a macro, `a`{:.language-*}, that copies the current line and pastes it below, performs our recursive line destructing, carries out our Rule 30 replacements, and then rolls everything back together, producing the next generation of our cells right below the previous generation:

<pre class='language-*'><code class='language-*'>:call setreg('a', 'yypma:.s/^.*$/ \0 /|norm!``@b@1@2@3@4@5@6@7@8@c', 'l')
</code></pre>

We can produce the next two generations of a given starting generation by calling `a`{:.language-*} two times:

<pre class='language-*'><code class='language-*'>:norm 2@a
</code></pre>

<pre class='language-*'><code class='language-*'>□□■□□
□■■■□
■■□□■
</code></pre>

If we start with a bigger starting generation (fifty "off" cells on either side of a single "on" cell, in this case), we could go even further!

<div style="width: 100%; margin: 0;">
  <img src="/img/2020-04-03-wolfram-style-cellular-automata-with-vim-macros/rule30.png" style="display: block; margin:auto; width: 100%;"/>
  <p style="text-align: center; color: #ccc; margin: 0;">Fifty generations of Rule 30 generated entirely within Vim.</p>
</div>

## Final Thoughts

And with that, we can finally answer the question that has plagued us for so long. _You can implement a Wolfram-style cellular automata, like [Rule-30](https://en.wikipedia.org/wiki/Rule_30), entirely within Vim using only "normal" features like macros and substitutions._ Rest easy, my tired brain.

Altogether our `script`{:.language-*} looks like this, and produces fifty generations of a given seed:

<pre class='language-*'><code class='language-*'>:call setreg('a', 'yypma:.s/^.*$/□\0□/|norm!``@b@1@2@3@4@5@6@7@8@c', 'l')
:call setreg('b', ':.s/^\(..*\)\(\(..\).\)$/\1\3\r\2/|norm!``@b', 'l')
:call setreg('1', ':%s/^■■■$/□/g', 'l')
:call setreg('2', ':%s/^■■□$/□/g', 'l')
:call setreg('3', ':%s/^■□■$/□/g', 'l')
:call setreg('4', ':%s/^■□□$/■/g', 'l')
:call setreg('5', ':%s/^□■■$/■/g', 'l')
:call setreg('6', ':%s/^□■□$/■/g', 'l')
:call setreg('7', ':%s/^□□■$/■/g', 'l')
:call setreg('8', ':%s/^□□□$/□/g', 'l')
:call setreg('c', '''aV}gJ', 'l')
:norm 50@a
</code></pre>

I'm no Vim expert by any stretch of the imagination, so if you think you can improve on this solution, either in terms of terseness or clarity, while staying in the bounds of only using normal Vim features (no Vimscript), [please let me know](https://twitter.com/petecorey)!

As a closing remark, I want to be clear and say that this project served absolutely no purpose, and this is a terribly inefficient way of propagating cellular automata. That said, learned quite a lot about my text editor of choice, which I consider to be invaluable.
