---
layout: post
title:  "Winston and Meteor 1.3"
date:   2016-07-04
tags: []
---

Logging is a very important part of any production application. Quality logging provides invaluable, irreplaceable information about the inner workings of your application as it runs.

Winston is a great tool for providing a unified logging interface for a variety of log transports (the console, rotating files, third party services, etc…).

Unfortunately, some of the intricacies of Meteor's isomorphic build system make using Winston more difficult that it would seem at first glance.

## Setting Up Winston

In Meteor 1.3, adding Winston to your project is as simple as installing the NPM package:

<pre class='language-javascript'><code class='language-javascript'>
meteor npm install winston
</code></pre>

Thanks to its ￼stellar documentation￼, setting up Winston as an ES6 module in your Meteor project is fairly straight forward too:

<pre class='language-javascript'><code class='language-javascript'>
import winston from "winston";

let console = new winston.transports.Console({
    name: "console",
    timestamp: true
});

export const logger = new winston.Logger({
    transports: [
        console
    ]
});
</code></pre>

Now that `logger`{:.language-javascript} is being exported by our new module, it can be `imported`{:.language-javascript} anywhere else in the project and used to log vital information:

<pre class='language-javascript'><code class='language-javascript'>
import { logger } from "/imports/logger";

logger.info("Party time! 🎉");
</code></pre>

While this works beautifully on the server, we'll quickly run into issues when we start up our application and try to do some logging from the client.

## Troubles on the Client

After starting up the application, you may see an error like the following in your browser console:

<pre class='language-javascript'><code class='language-javascript'>
TypeError: fs.readdirSync is not a function
</code></pre>

If you spend some time Googling this obtuse error, you'll eventually land on this ￼open Github issue￼ which explains that Winston currently doesn't support in-browser logging.

This unfortunate information leaves us with two options. We can either restrict imports of our `logger`{:.language-javascript} module to only server-side components, or we can wrap our `import winston`{:.language-javascript} and `export logger`{:.language-javascript} statements in a `Meteor.isServer`{:.language-javascript} guard.

Because the first option would be difficult to manage and would be a constant source of bugs, a reasonable solution would be to choose the second option:

<pre class='language-javascript'><code class='language-javascript'>
import { Meteor } from "meteor/meteor";

if (Meteor.isServer) {

    import winston from "winston";

    let console = new winston.transports.Console({
        name: "console",
        timestamp: true
    });

    export const logger = new winston.Logger({
        transports: [
            console
        ]
    });
    
}
</code></pre>

Now that Winston is confined to the server, our client is happy.

## A Tale of Two Loggers

Unfortunately, this solutions leaves us in an awkward position. On the server, we can import and use our new logger, but on the client we're forced to continue using `console`{:.language-javascript} for all of our logging needs.

Isomorphic code, or code that runs on both the server and the client, amplifies the awkwardness of this situation.

Imagine that a ￼collection has a helper method￼ which can be called from both the client and the server. How would we log an error in that helper? If we're on the client, we'd have to use `console.log`{:.language-javascript} or `console.error`{:.language-javascript}, but if we're on the server we would want to use `logger.error`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
Collection.helpers({
    foo() {
        return something()
        .catch((e) => {
            if (Meteor.isServer) {
                logger.error(e);
            }
            else {
                console.error(e);
            }
        });
    }
});
</code></pre>

This is far from an ideal situation. Ideally, we'd like to be able to use `logger`{:.language-javascript} across the board, regardless of if we're on the client or server.

## Creating a Faux-Logger

Thankfully, we can make this ideal situation a reality.

Back in our `logger`{:.language-javascript} module, we can detect if we're being imported on the client and, if we are, export an object that looks like a Winston logger, but is actually `console`{:.language-javascript}.

<pre class='language-javascript'><code class='language-javascript'>
if (Meteor.isServer) {
    …
}
else {
    export const logger = console;
}
</code></pre>

On Chrome this works just as we would expect. If we import `logger`{:.language-javascript} on the client we can use `logger.info`{:.language-javascript}, `logger.warn`{:.language-javascript}, and `logger.error`{:.language-javascript} because Chrome implements all of these methods (`info`{:.language-javascript}, `warn`{:.language-javascript}, and `error`{:.language-javascript}) in its built-in `console`{:.language-javascript} object.

However, if you want to target other browsers or environments that don't natively implement all of these logging methods, we'll have to implement them in our faux-logger ourselves:

<pre class='language-javascript'><code class='language-javascript'>
if (Meteor.isServer) {
    …
}
else {
    export const logger = {
        info: console.log,
        warn: console.log,
        error: console.log
    };
}
</code></pre>

We can even take this solution to the next level by decorating our calls to `console.log`{:.language-javascript} and prepending whatever information we need:

<pre class='language-javascript'><code class='language-javascript'>
function prepend(argument) {
    return function() and{
        let args = [].slice.call(arguments);
        args.unshift(argument);
        console.log.apply(console, args);
    }
}

export const logger = {
    info: console.log,
    warn: prepend("⚠️"),
    error: prepend("☠️")
};
</code></pre>

Now our `logger`{:.language-javascript} module can be imported and used as expected throughout our entire code base.

The browser's underlying logging framework will be used on the client, and Winston will be used on the server. While the underlying logging changes depending on context, our developer experience does not.
