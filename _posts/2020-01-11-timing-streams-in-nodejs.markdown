---
layout: post
title:  "Timing Streams in Node.js"
excerpt: "I've been tasked with speeding up a Node.js stream-based pipeline. The first step of making something faster is figuring out how slow it is. Check out this small helper function I wrote to do just that!"
author: "Pete Corey"
date:   2020-01-11
tags: ["Javascript", "Streams"]
related: []
---

On a current client project, I was tasked with optimizing a very large, very slow, very CPU-bound [stream](https://nodejs.org/api/stream.html)-based [pipeline](https://nodejs.org/api/stream.html#stream_stream_pipeline_streams_callback). Before I even started to think about optimizing this pipeline, I needed an objective way to measure the execution time of each step of the pipeline.

Imagine the pipeline in question looks something like this:

<pre class='language-javascript'><code class='language-javascript'>
pipeline(
    httpStream,
    decodeStream,
    parseStream,
    batchStream,
    processStream
);
</code></pre>

We're reading in a stream of JSON-encoded events (`httpStream`{:.language-javascript}), making sure they're appropriately decoded (`decodeStream`{:.language-javascript}), JSON parsing each incoming event (`parseStream`{:.language-javascript}), batching events together (`batchStream`{:.language-javascript}), and finally processing each batch of events (`processStream`{:.language-javascript}).

Ideally I'd like to measure any or all of these individual steps.

However, many of these stream implementations are out of our hands. We can't easily reach in and add timing code. Thankfully, we can easily write a function that decorates a provided stream with a simple runtime calculation.

Let's call our decorator function `time`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const time = (stream, name) => {
    return stream;
};
</code></pre>

Our `time`{:.language-javascript} function accepts and returns the stream we'll be decorating, along with a name that describes the provided stream. It should be noted that it's assumed that `stream`{:.language-javascript} implements the `Readable`{:.language-javascript} interface.

What we're trying to accomplish here is relatively simple. We want to measure the amount of time that elapses between data emission events on our stream. We can use [`console.time`{:.language-javascript}/`console.timeEnd`{:.language-javascript}](https://developer.mozilla.org/en-US/docs/Web/API/Console/time) and an event listener to make short work of this task:

<pre class='language-javascript'><code class='language-javascript'>
const time = (stream, name) => {
    let timing = false;
    stream.on('data', () => {
        if (timing) {
            console.timeEnd(name);
        }
        console.time(name);
        timing = true;
    });
    return stream;
};
</code></pre>

Every time we receive a `'data'`{:.language-javascript} event on our stream, we log the duration since the last received `'data'`{:.language-javascript} event, and start a new timer. We're using a `timing`{:.language-javascript} flag to ensure that `console.timeEnd`{:.language-javascript} isn't called the first time we receive a `'data'`{:.language-javascript} event.

Notice that we're also using the provided `name`{:.language-javascript} as the label in our `console.time`{:.language-javascript}/`console.timeEnd`{:.language-javascript} calls. This keeps us from getting confused when we start measuring multiple stages of our pipeline.

This solution mostly works. Unfortunately, a `data`{:.language-javascript} event isn't fired when the stream starts processing its first chunk of data. This means that we're missing a measurement for this first chunk of execution time. Thankfully, we can capture that missing metric by also listening for a `'resume'`{:.language-javascript} event, which is called when the stream starts processing its first chunk of data:

<pre class='language-javascript'><code class='language-javascript'>
const time = (stream, name) => {
    stream.on('resume', () => {
        console.time(name);
    });
    stream.on('data', () => {
        console.timeEnd(name);
        console.time(name);
    });
    return stream;
};
</code></pre>

Notice that we're no longer concerned about wrapping our `console.timeEnd`{:.language-javascript} call in a guard in our `'data'`{:.language-javascript} event listener. We know that the `'resume'`{:.language-javascript} event handler will always call `console.time`{:.language-javascript} before we reach our `'data'`{:.language-javascript} event handler, so we have no need for the `timing`{:.language-javascript} guard anymore.

We can use our `time`{:.language-javascript} function by decorating any or all of the stages of our pipeline:

<pre class='language-javascript'><code class='language-javascript'>
await pipeline(
    httpStream,
    decodeStream,
    parseStream,
    time(batchStream, 'batch'),
    time(processStream, 'process')
);
</code></pre>

Now that our runtime durations are finding their way to the logs, we can either use them as-is, or take things a step further and aggregate them for more in-depth data analysis:

<pre class='language-*'><code class='language-*'>...
batch: 258.213ms
process: 512.493ms
batch: 239.112ms
process: 475.293ms
...
</code></pre>

As a warning to the reader, I'll be the first to admit that I'm no [stream expert](https://github.com/substack/stream-handbook). That said, this utility function proved invaluable to me, so I thought I'd record what I learned and pass it along for posterity.

Stream on.
