---
layout: post
title:  "Rum Boogie Café"
description: "Character encodings have long been the bane of software developers. Read about the lengths I recently went to in order to debug a character encoding issue."
author: "Pete Corey"
date:   2017-11-06
tags: ["Javascript", "Node.js", "Debugging"]
---

Recently I ran into an interesting problem while working on a project with a [Memphis-based](https://www.google.com/maps/place/Memphis,+TN/@35.1294252,-90.2509759,10z/data=!3m1!4b1!4m5!3m4!1s0x87d57e1eea439745:0xd193f315601ab6fe!8m2!3d35.1495343!4d-90.0489801) client. This interesting problem led to several hours of sleuthing through HTTP headers, combing over hex dumps, and pouring through the source of several packages.

At the end of a long day, I came to the conclusion that character encodings are important, if often overlooked things, and that assumptions do indeed make asses out of you and me.

So buckle up, and I’ll tell you a story about [Rum Boogie Café](http://rumboogie.com/about-rum-boogie/)! Or is it Rum Boogie Caf�? Or… `RUM BOOGIE CAFÉ,"D`{:.language-javascript}?

## Invalid JSON

The project in question involves streaming massive JSON documents into a Node.js application from a proxy service which in turn pulls the original JSON documents from an external, third-party service.

Once streamed in, the Node.js application parses the incoming JSON with the [`JSONStream`{:.language-javascript} package](https://github.com/dominictarr/JSONStream), and Does Things™ with the resulting data.

This process was working beautifully for several relatively small JSON documents, but when it came time to parse larger, _wilder_ JSON documents served by the third-party service, bugs started to crawl out of the woodwork.

The first sign of trouble was this exception:

<pre class='language-javascript'><code class='language-javascript'>
Error: Invalid JSON (Unexpected "D" at position 2762 in state STOP)
    at Parser.proto.charError (/project/node_modules/jsonparse/jsonparse.js:90:16)
    at Parser.proto.write (/project/node_modules/jsonparse/jsonparse.js:154:23)
    at Stream.&lt;anonymous> (/project/node_modules/JSONStream/index.js:23:12)
    ...
</code></pre>

Well, that seems like an obvious problem. The JSON must be corrupt.

But after taking a look at the raw JSON served from the external service, we can see that the section of the document in question is perfectly well formed:

<pre class='language-javascript'><code class='language-javascript'>
...,"DESC":"RUM BOOGIE CAFÉ","DEF":"",...
</code></pre>

So what gives?

## Invalid UTF-8?

Before spending too much time with this issue, I wanted to get more data. Was this a problem with this report specifically, or all larger reports?

I tried to process another similarly large JSON document served by the external service.

This similarly large document resulted in a similar exception:

<pre class='language-javascript'><code class='language-javascript'>
Error: Invalid JSON (Invalid UTF-8 character at position 3832 in state STRING1)
    at Parser.proto.write (/project/node_modules/jsonparse/jsonparse.js:171:31)
    at Stream.&lt;anonymous> (/project/node_modules/JSONStream/index.js:23:12)
    ...
</code></pre>

This time around, the [`jsonparse`{:.language-javascript} package](https://github.com/creationix/jsonparse) (a dependency of the [`JSONStream`{:.language-javascript} package](https://github.com/dominictarr/JSONStream) we’re using) is complaining about an invalid UTF-8 character.

Interesting!

---- 

At this point, I have a hunch. Is the data being returned by our proxy service utf-8 encoded?

To find out, I fired up [Postman](https://www.getpostman.com/) and made a request to the proxy server to pull down the first of the large JSON documents. Interestingly, the HTTP response wasn’t specifying a character encoding, but it was returning a `Content-Type`{:.language-javascript} of `application/json`{:.language-javascript} which implies a default encoding of utf-8.

Let’s put this implication to the test.

We can use `xxd`{:.language-javascript} to dump the raw hex of the JSON document being returned by the proxy service (after saving it to disk):

<pre class='language-javascript'><code class='language-javascript'>
0074f60: 2042 4f4f 4749 4520 4341 46c9 222c 2244   BOOGIE CAF.","D
</code></pre>

Our JSON parser is failing at the `D`{:.language-javascript} at the end of this line. To verify that this is actually utf-8 encoded text, we’ll copy the relevant hex values for the line into a buffer in a new Node.js program:

<pre class='language-javascript'><code class='language-javascript'>
let buffer = Buffer.from([
    0x43, // 'C'
    0x41, // 'A'
    0x46, // 'F'
    0xc9, // 'É'
    0x22, // '"'
    0x2c, // ','
    0x22, // '"'
    0x44, // 'D'
]);
</code></pre>

Next, we can print the buffer, decoding it as utf-8:

<pre class='language-javascript'><code class='language-javascript'>
console.log(buffer.toString('utf-8'));
</code></pre>

This gives us:

<pre class='language-javascript'><code class='language-javascript'>
CAF�
</code></pre>

The wrong character…

Digging deeper, I realized that the proxy service was mangling the response headers of the external service it was proxying for. Thankfully, this was an easy fix.

Soon the `Content-Type`{:.language-javascript} header of the newly-fixed proxy service revealed that the JSON documents were encoded with `ISO-8859-1`{:.language-text} (which Node.js refers to as `latin1`{:.language-javascript}).

<pre class='language-javascript'><code class='language-javascript'>
console.log(buffer.toString('latin1'));
</code></pre>

Decoding our buffer with `latin1`{:.language-javascript} gives us…

<pre class='language-javascript'><code class='language-javascript'>
CAFÉ
</code></pre>

The right character! Victory!

Well, not really; our application is still broken. At least we know that we’re dealing with `latin1`{:.language-text} encoded text, not utf-8.

## Going Spelunking

So now we know that the stream we’re passing into `JSONStream`{:.language-javascript}, and ultimately `jsonparse`{:.language-javascript} is `latin1`{:.language-javascript} encoded, not utf-8 encoded.

Why is this a problem?

Taking a look at [the `jsonparse`{:.language-javascript} source](https://github.com/creationix/jsonparse/blob/master/jsonparse.js), we can see quite a few places where the code is making the assumption that any data streamed in will be utf-8 encoded.

Let’s trace through this code and find out what happens when it processes our `latin1`{:.language-javascript}-encoded `É`{:.language-javascript} character (remember, `É`{:.language-javascript} has a hex value of `0xc9`{:.language-javascript} and a decimal value of `201`{:.language-javascript}).

Let’s assume we’re in the process of [working through a streamed in buffer](https://github.com/creationix/jsonparse/blob/master/jsonparse.js#L130-L313). Our `É`{:.language-javascript} character is within a JSON string, so we’d be in [the `STRING1`{:.language-javascript} state](https://github.com/creationix/jsonparse/blob/master/jsonparse.js#L157-L201) when we encounter it. Let’s also assume we have no `bytes_remaining`{:.language-javascript} for now.

The value of `É`{:.language-javascript} is greater than `128`{:.language-javascript} (`201`{:.language-javascript}), so we’d [fall into the “parse multi byte” block](https://github.com/creationix/jsonparse/blob/master/jsonparse.js#L169-L186). Because `É`{:.language-javascript} (`201`{:.language-javascript}) is greater than `194`{:.language-javascript} and less than `223`{:.language-javascript}, `bytes_in_sequence`{:.language-javascript} would be set to `2`{:.language-javascript}. A few lines later, this `2`{:.language-javascript} in `bytes_in_sequence`{:.language-javascript} prompts `jsonparse`{:.language-javascript} to swallow the next two bytes (`",`{:.language-javascript}) from the buffer and include them as part of the current string.

Unfortunately, one of the characters that’s mistakenly swallowed is the JSON string’s terminating quote. The parser happily continues on until it finds another quote, the opening quote for the `"DEF"`{:.language-javascript} string, and uses that as the closing quote for the current string.

At this point, the parser expects [a valid starting character](https://github.com/creationix/jsonparse/blob/master/jsonparse.js#L131-L157) like a comma or a closing bracket. Instead, it finds our ill-fated `D`{:.language-javascript} and throws a familiar exception:

<pre class='language-javascript'><code class='language-javascript'>
Error: Invalid JSON (Unexpected "D" at position 2762 in state STOP)
</code></pre>

Interestingly, the value of the wrongly-encoded character affects the behavior of this bug. 

For example, if we were to pass in [a non-breaking space](https://en.wikipedia.org/wiki/ISO/IEC_8859-1#Codepage_layout) with a `latin1`{:.language-javascript} character code of `160`{:.language-javascript}, [an `Invalid UTF-8`{:.language-text} exception would be thrown](https://github.com/creationix/jsonparse/blob/master/jsonparse.js#L170-L172).

Similarly, a character like `ð`{:.language-javascript} with a `latin1`{:.language-javascript} character code of `240`{:.language-javascript} would result in [four characters being swallowed by the parser](https://github.com/creationix/jsonparse/blob/master/jsonparse.js#L175).

## Fixing the Issue

Now that we know what the problem is, fixing it is simple. We’re streaming `ISO-8859-1`{:.language-text}, or `latin1`{:.language-javascript} encoded data from our proxy service, but our streaming JSON parser expects the data to be utf-8 encoded.

We’ll need to re-encode our data into utf-8 before passing it into our parser.

This sounds daunting, but thankfully [libraries like `iconv-lite`{:.language-javascript}](https://github.com/ashtuchkin/iconv-lite) make it a very simple process. Especially when you’re using streams.

Assuming that our original setup looks something like this:

<pre class='language-javascript'><code class='language-javascript'>
getDocumentStream(...)
    .pipe(JSONStream.parse('*'));
</code></pre>

We can easily pipe our document stream through a conversion stream before handing it off to our parser:

<pre class='language-javascript'><code class='language-javascript'>
getDocumentStream(...)
    .pipe(iconv.decodeStream('ISO-8859-1'))
    .pipe(JSONStream.parse('*'));
</code></pre>

And with that, all is right in the world. Everything works as expected, and we can get back to bigger and better things.

## Final Thoughts

So in hindsight, was this a bug?

Probably not.

Neither the `JSONStream`{:.language-javascript} documentation nor the `jsonparse`{:.language-javascript} documentation make it explicit that your stream needs to be utf-8 encoded, but this seems like a reasonable assumption on their end.

Instead, I think this was a complicated set of misunderstandings and faulty assumptions that led to some bizarre, but _technically correct_ behavior.

The moral of the story is that if you’re dealing with strings, you need to know how they’re encoded. Most developers keep string encodings out of sight and out of mind, but when things go wrong they can lead to time consuming and confusing bugs.

Next time you’re in Memphis, be sure to stop by `RUM BOOGIE CAFÉ,"D`{:.language-javascript}!
