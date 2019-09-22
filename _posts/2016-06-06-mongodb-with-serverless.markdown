---
layout: post
title:  "MongoDB With Serverless"
titleParts: ["MongoDB", "with Serverless"]
excerpt: "Using MongoDB from an AWS Lambda function is more difficult than you may expect. Here's one possible solution."
author: "Pete Corey"
date:   2016-06-06
tags: ["Javascript", "Serverless", "MongoDB"]
---

Last week I wrote about how excited I was about [AWS Lambda’s pricing model](/blog/2016/05/24/aws-lambda-first-impressions/). Fueled by that excitement, I spent some time this week experimenting on how I could incorporate [Lambda functions](https://aws.amazon.com/lambda/) into my software development toolbox.

As a [Meteor](https://www.meteor.com/) developer, I’m fairly intimately associated with [MongoDB](https://www.mongodb.com/) (for better or worse). It goes without saying that any Lambda functions I write will most likely need to interact with a Mongo database in some way.

Interestingly, using MongoDB in a Lambda function turned out to be more difficult that I expected.

## Leveraging Serverless

Rather than writing, deploying and managing my Lambda functions on my own, I decided to leverage one of the existing frameworks that have been built around the Lambda platform. With [nearly nine thousand stars](https://github.com/serverless/serverless) on its GitHub repository, [Serverless](http://docs.serverless.com/) seems to be the most popular platform for building Lambda functions.

Serverless offers several abstractions and seamless integrations with other AWS tools like [CloudFormation](https://aws.amazon.com/cloudformation/), [CloudWatch](https://aws.amazon.com/cloudwatch/) and [API Gateway](https://aws.amazon.com/api-gateway/) that help make the micro-service creation process very simple (once you wrap your head around the massive configuration files).

Using the tools Serverless provides, I was able to quickly whip up a Lambda function that was triggered by a web form submission to an endpoint. The script would take the contents of that form submission and store them in a MongoDB collection called `"events"`{:.language-javascript}:

<pre class="language-javascript"><code class="language-javascript">"use strict";

import _ from "lodash";
import qs from "qs";
import { MongoClient } from "mongodb";

export default (event, context) => {

    let parsed = _.extend(qs.parse(event), {
        createdAt: new Date()
    });

    MongoClient.connect(process.env.MONGODB, (err, db) => {
        if (err) { throw err; }
        db.collection("events").insert(parsed);
        db.close();
        context.done();
    });

};</code></pre>

Unfortunately, while the process of creating my ES6-based MongoDB-using Lambda function with Serverless was painless, the deployment process turned out to be more complicated.

## MongoDB Module Problems

Locally, I was using Mocha with a [Babel compiler](http://babeljs.io/) to convert my ES6 to ES5 and verify that my script was working as expected. However, once I deployed my script, I ran into problems.

After deploying, submitting a web form to the endpoint I defined in my project resulted in the following error:

<pre class="language-javascript"><code class="language-javascript">{
  "errorMessage": "Cannot find module './binary_parser'",
  "errorType": "Error",
  "stackTrace": [
    "Function.Module._load (module.js:276:25)",
    "Module.require (module.js:353:17)",
    "require (internal/module.js:12:17)",
    "o (/var/task/_serverless_handler.js:1:497)",
    "/var/task/_serverless_handler.js:1:688",
    "/var/task/_serverless_handler.js:1:17260",
    "Array.forEach (native)",
    "Object.a.12../bson (/var/task/_serverless_handler.js:1:17234)",
    "o (/var/task/_serverless_handler.js:1:637)"
  ]
}
</code></pre>

At some point during the deployment process, it looked like the `"binary_parser"`{:.language-javascript} module (an eventual dependency of the `"mongodb"`{:.language-javascript} module) was either being left behind or transformed beyond recognition, resulting in a broken Lambda function.

## Over Optimized

After hours of tinkering and frantic Googling, I finally made the realization that the problem was with the [`serverless-optimizer-plugin`{:.language-javascript}](https://github.com/serverless/serverless-optimizer-plugin). Disabling the optimizer and switching to using ES5-style JavaScript resulted in a fully-functional Lambda.

While I could have stopped here, I’ve grown very accustomed to writing ES6. Transitioning back to writing ES5-style code seemed like an unacceptable compromise.

While weighing the decision of forking and hacking on the `serverless-optimizer-plugin`{:.language-javascript} to try and fix my problem, I discovered the [`serverless-runtime-babel`{:.language-javascript}](https://github.com/serverless/serverless-runtime-babel) plugin. This new plugin seemed like a promising alternative to the optimizer. Unfortunately, after removing the optimizer form my project and adding the babel plugin, I deployed my Lambda only to receive the same errors.

## Webpack Saves the Day

Finally, I discovered the [`serverless-webpack-plugin`{:.language-javascript}](https://github.com/asprouse/serverless-webpack-plugin). After installing the [Webpack](https://webpack.github.io/) plugin, and spending some time tweaking my [configuration file](https://webpack.github.io/docs/configuration.html), I attempted to deploy my Lambda function…

Success! My ES6-style Lambda function deployed successfully (albeit somewhat slowly), and successfully inserted a document into my MongoDB database!

<pre class="language-javascript"><code class="language-javascript">PRIMARY> db.events.findOne({})
{
        "_id" : ObjectId("5751e06e1aba0e0100313db7"),
        "name" : "asdf",
        "createdAt" : ISODate("2016-06-03T19:54:22.139Z")
}
</code></pre>

## MongoDB With Lambda

While I still don’t fully understand how the optimizer or babel plugins were corrupting my MongoDB dependencies, I was able to get my ES6-style Lambda function communicating beautifully with a MongoDB database. ___This opens many doors for exciting future projects incorporating Lambda functions with Meteor applications___.

Check out the full [serverless-mongodb](https://github.com/pcorey/serverless-mongodb/) project on GitHub for a functional example.

<hr/>

While working on this project, some interesting ideas for future work came up. In my current Lambda function, I’m re-connecting to my MongoDB database on every execution. Connecting to a Mongo database can be a slow operation. By pulling this connection request out of the Lambda handler, the connection could be re-used if several executions happen in quick succession. In theory, this could result in significantly faster Lambda functions, cutting costs significantly.

Finding explicit details on this kind of container sharing is difficult. The information that I’ve been able to find about it is [incomplete at best](https://forums.aws.amazon.com/thread.jspa?threadID=216000), but it’s definitely an interesting area to look into.
