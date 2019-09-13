---
layout: post
title:  "Obverse and Under"
excerpt: "Have you ever thought of JSON parsing and serialization as a domain transformation? If not, expand your brain a bit with this overview of J's concept of \"obverse\" verbs and the \"under\" conjunction."
author: "Pete Corey"
date:   2019-09-13
tags: ["J"]
related: ["/blog/2019/08/26/prime-parallelograms/"]
---

I previously wrote about [plotting an "amazing graph"](/blog/2019/08/26/prime-parallelograms/) using [the J programming language](https://www.jsoftware.com/). The solution I landed on looked something like this:

<pre class='language-j'><code class='language-j'>
require 'plot'
f =: ] - [: #. [: |. #:
'type dot' plot f"0 p: i. 10000
</code></pre>

Our verb, `f`{:.language-j}, is taking a very explicit approach by making judicious use of "capped" ([`[:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d502.htm)) verb trains. We're essentially saying that `f`{:.language-j} is ([`=:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d001.htm)) the given number ([`]`{:.language-j}](https://www.jsoftware.com/help/dictionary/d500.htm)) minus ([`-`{:.language-j}](https://www.jsoftware.com/help/dictionary/d120.htm)) the base two ([`#.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d401.htm)) of the reverse ([`|.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d231.htm)) of the antibase two ([`#:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d402.htm)) of the given number.

Several members of the J community pointed out to me that this verb could be simplified with the help of the "under" ([`&.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d631.htm)) conjunction. Let's dig into what "under" is, and how we can use it.

## Under What?

The best way to think about "under" ([`&.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d631.htm)), [as explained by the NuVoc page on "under"](https://code.jsoftware.com/wiki/Vocabulary/ampdot), is to think in terms of [domains](https://en.wikipedia.org/wiki/Domain_of_a_function) and transformations in and out of those domains.

> Verb v defines a transformation of the argument(s) (x and) y into the v-domain.
> Next, verb u operates on the transformed argument(s).
> Lastly the result is transformed back from the v-domain to the original domain.

In our example, the domain of our input is base ten, but the transformation we want to apply (reversal) needs to happen in the base two domain. "Under" ([`&.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d631.htm)) can be used to transform our input into base two ([`#:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d402.htm)), apply our reversal ([`|.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d231.htm)), and transform the result of that reversal back to our original base ten domain with the obverse, or opposite, of our base two verb, anti base ([`#.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d401.htm)):

<pre class='language-j'><code class='language-j'>
f =: ] - |. &. #:
</code></pre>

Notice that we're not explicitly stating how to transform the result of our reversal back into our original domain. J knows that the obverse of [`#:`{:.language-j}](https://www.jsoftware.com/help/dictionary/d402.htm) is [`#.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d401.htm), and automatically applies it for us.

Out of the box, J comes with many obverse pairings. "Open" ([`>`{:.language-j}](https://www.jsoftware.com/help/dictionary/d020.htm)), for example, is the obverse of "box" ([`<`{:.language-j}](https://www.jsoftware.com/help/dictionary/d010.htm)), and visa versa. This pairing is especially useful when applying transformations to boxed values:

<pre class='language-j'><code class='language-j'>
   1+&.>1;2;3
┌─┬─┬─┐
│2│3│4│
└─┴─┴─┘
</code></pre>

Check out a full listing of obverse pairs [at the end of this Shades of J article](https://code.jsoftware.com/wiki/Fifty_Shades_of_J/Chapter_12#Obverse_to_Adverse).

## Inferred Obverses

Even compound verbs built up of verbs with well-defined obverse pairings can be used with "under" ([`&.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d631.htm)). J will correctly infer and apply the compound obverse without any intervention or instruction.

For example, if we wanted to unbox a list of values and then work with them in the "square root domain" (whatever that means), we could do something like this:

<pre class='language-j'><code class='language-j'>
   1+&.([:%:>)1;2;3
┌────────────────┐
│4 5.82843 7.4641│
└────────────────┘
</code></pre>

J takes each value, opens it and finds its square root (`[:%:>`{:.language-j}), adds one to the result, and then squares and boxes up (`[:*:<`{:.language-j}) the incremented value.

## Explicit Obverses

Even more interestingly, if an obverse pairing isn't defined or inferable for a given verb, J lets us define our own pairing using the "obverse" ([`:.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d311.htm)) verb.

As an example, imagine that we have a JSON string holding an array of values. We want to parse our string, perform some operation on those values, and then serialize the resulting list back into JSON.

We can use the `dec_json`{:.language-j} and `enc_json`{:.language-j} verbs provided by [the `convert/json`{:.language-j} package](https://github.com/jsoftware/convert_json), and tell J that the obverse of `dec_json`{:.language-j} is `enc_json`{:.language-j}:

<pre class='language-j'><code class='language-j'>
   json =: dec_json :. enc_json
</code></pre>

Running `dec_json`{:.language-j} on a JSON array like `'[1, 2, 3]'`{:.language-j} will return a list of boxed numbers, so we'll want to open each of these boxes, perform our operation, and box the results back up. This sounds like another job for "under" ([`&.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d631.htm)):

<pre class='language-j'><code class='language-j'>
   transform =: 1&+&.>
</code></pre>

All together, we can perform our `transform`{:.language-j} "under" ([`&.`{:.language-j}](https://www.jsoftware.com/help/dictionary/d631.htm)) the `json`{:.language-j} domain:

<pre class='language-j'><code class='language-j'>
   transform &. json '[1, 2, 3]'
[2,3,4]
</code></pre>

And our result is the JSON string `'[2,3,4]'`{:.language-j}!

"Under" is definitely a very powerful conjunction, and I can see myself using it extensively in the future. Thanks to everyone in the J community who was kind enough to point it out and teach me something new!
