---
layout: post
title:  "Meteor Unit Testing With Testdouble.js"
titleParts: ["Meteor Unit Testing With", "Testdouble.js"]
excerpt: "Smooth out your Meteor testing experience with Testdouble.js."
author: "Pete Corey"
date:   2016-05-02
tags: ["Javascript", "Meteor", "Testing"]
---

It’s been several months since my [first post on unit testing with Meteor 1.3](/blog/2015/12/21/unit-testing-with-meteor-1.3/), and Meteor 1.3 has [finally been officially released](http://info.meteor.com/blog/announcing-meteor-1.3)!

With this release, Meteor’s new [recommending testing solution](http://guide.meteor.com/testing.html) is the all-in-one `meteor test`{:.language-javascript} command. When you run your application with `meteor test`{:.language-javascript}, it spins up your application server, but only loads your test files and modules explicitly imported by your tests. In theory, you can run your unit tests, integration tests, and (with an extra flag), your end-to-end tags with this tool.

Unfortunately, there is a problem. ___`meteor test`{:.language-javascript} is slow!___ Spinning up a server is fantastic for end-to-end and integration tests, but is a massive hinderance when trying to write fast unit tests.

As I mentioned in my last post, I can easily find myself lost on Twitter by the time my server restarts.

## Dependency Injection Woes

Recently, I’ve been getting feedback from people who read my [Unit Testing With Meteor 1.3](/blog/2015/12/21/unit-testing-with-meteor-1.3/).

They like the idea of using [Mocha](https://mochajs.org/) directly and bypassing `meteor test`{:.language-javascript} for faster unit test turnarounds, but find the dependency injection technique I described to be too much work in practice. But without dependency injection, how do we get around Meteor’s “magic imports”?

<pre class="language-javascript"><code class="language-javascript">Error: Cannot find module 'meteor/meteor'
at Function.Module._resolveFilename (module.js:338:15)
at Function.Module._load (module.js:289:25)
at Module.require (module.js:366:17)
at require (module.js:385:17)
</code></pre>

This error may be familiar to you if you’ve ever tried to evaluate Meteor-style modules outside the context of the Meteor build tool. 

## Hooking and Stubbing

Thankfully, there are ways around these tricky imports that don’t require a cumbersome dependency injection architecture.

What if we could just hook into each `import`{:.language-javascript} and `require`{:.language-javascript} call, and return our own objects whenever we detect an import of the `"meteor/meteor"`{:.language-javascript} module? We could even return a `Meteor`{:.language-javascript} object filled with stubbed or mocked methods so we can make assertions about how and when those methods are called!

The good news is that this is entirely possible within Node.js; there are actually multiple ways of accomplishing this.

In [this post on the Meteor forums](https://forums.meteor.com/t/meteor-1-3-testing-with-meteor-meteor-x-package-imports/21009), Stephan Meijer discussed one technique for doing exactly this using [require-hook](https://www.npmjs.com/package/require-hook) and [Sinon.js](http://sinonjs.org/). While this technique works beautifully, I’ve recently been playing with replacing both of these modules with [Testdouble.js](https://github.com/testdouble/testdouble.js) in my testing infrastructure.

## Enter Testdouble.js

Testdouble.js lets us easily [replace modules with fully stubbed replacements](https://github.com/testdouble/testdouble.js/blob/master/docs/7-replacing-dependencies.md#testdoublereplace-api). For example, replacing the `"meteor/meteor"`{:.language-javascript} with an object with stubbed out `methods`{:.language-javascript} and `call`{:.language-javascript} functions is as simple as:

<pre class="language-javascript"><code class="language-javascript">import td from "testdouble";
let Meteor = td.object(["methods", "call"]);
td.replace("meteor/meteor", { Meteor });
</code></pre>

After this point, any imports of the `"meteor/meteor"`{:.language-javascript} module will be given our test double, rather than the real `"meteor/meteor"`{:.language-javascript} module.

We can even use Testdouble.js to make assertions about how our stubbed methods have been used:

<pre class="language-javascript"><code class="language-javascript">...
thisMethodCallsFooWithBar();
td.verify(Meteor.call("foo", "bar"));
</code></pre>

If `thisMethodCallsForWithBar`{:.language-javascript} did not call the `"foo"`{:.language-javascript} Meteor method with an argument of `"bar"`{:.language-javascript} (e.g., `Meteor.call("foo", "bar");`{:.language-javascript}), our `td.verify`{:.language-javascript} assertion would fail.

## Fast, Simple Unit Testing

I’ve created an example Meteor application that demonstrates these ideas. Check it out [on Github](https://github.com/pcorey/unit-testing-with-testdouble). Be sure to take a look at the [module under test](https://github.com/pcorey/unit-testing-with-testdouble/blob/master/imports/hello-module.js) and the [tests themselves](https://github.com/pcorey/unit-testing-with-testdouble/blob/master/tests/example-module.test.js).

You can run the Mocha unit tests once:

<pre class="language-bash"><code class="language-bash">npm test
</code></pre>

Or you can tell Mocha to watch your project for changes and re-run your test suite on each change:

<pre class="language-bash"><code class="language-bash">npm test -- -w
</code></pre>

I’ve also included a short video showing how I might interact with my test runner. I make a change to a test, instantly notice that the test fails, find the problem, and notice that the test turns green as soon as I make the fix.

<video width="100%" src="https://s3-us-west-1.amazonaws.com/www.1pxsolidtomato.com/Unit+Testing+with+Testdouble.webm" autoplay loop controls></video>

As you can see, the results of my test suite appear nearly instantly after every file change. 

Sweet relief!

## Credit Where Credit Is Due

Credit for this post goes to Stephan Meijer and the [amazing work that he posted to the Meteor forums](https://forums.meteor.com/t/meteor-1-3-testing-with-meteor-meteor-x-package-imports/21009).

Stephan outlines how to mock Meteor dependencies using both `require-hook`{:.language-javascript} and Sinon.js, and the Testdouble.js technique described above. He even [found and documented a workaround](https://forums.meteor.com/t/meteor-1-3-testing-with-meteor-meteor-x-package-imports/21009/7) for an issue related to ES6 import hoisting that was preventing Testdouble.js from properly replacing modules.

Awesome work, Stephan!
