---
layout: post
title:  "Bending Jest to Our Will: Caching Modules Across Tests"
description: "I recently had to go trudging through the weeds in an effort to make my test suite pass more reliably. It turns out that loading a module once in Jest is extremely difficult."
author: "Pete Corey"
date:   2018-11-05
tags: ["Javascript", "Testing", "Jest"]
related: []
---

My test suite has grown to be unreliable. At first, a single red test raised its head. Not believing my eyes, I re-ran the suite, and as expected, everything came back green. As time went on and as more tests were offered up to the suite, random failures became more of a recurring problem. Eventually, the problem became so severe that the suite _consistently failed_, rather than _consistently passed._

Something had to be done.

After nearly twenty four hours of banging my head against the wall and following various loose ends until they inevitably unraveled, I finally stumbled upon the cause of my problems.

## Making Too Many Database Connections

[Jest, the testing platform used by the project in question](https://jestjs.io/), insists on running tests in isolation. The idea is that tests run in isolation can also be run in parallel, which is the default behavior of Jest's test runner. Due to decisions made far in the immutable past, our team decided to scrap parallel executions of tests and run each test sequentially with [the `--runInBand`{:.language-javascript} command line option](https://jestjs.io/docs/en/cli.html#runinband).

The Jest documentation explains that running tests in band executes all of the tests sequentially within the same process, rather than spinning up a new process for every test:

> Run all tests serially in the current process, rather than creating a worker pool of child processes that run tests.

However, when I ran the test suite I noticed that every test file was trigging a log statement that indicated that it just established a new database connection.

<pre class='language-javascript'><code class='language-javascript'>
Connected to mongodb://localhost:27017/test
</code></pre>

This explains a lot. If each test is spinning up its own database connection, it's conceivable that our database simply can't handle the amount of connections we're forcing on it. In that case, it would inevitably time out and fail on seemingly random tests.

But if all of our tests are sharing a single process, why aren't they sharing a single database connection?

## Jest Ignores the Require Cache

In turns out that this project instantiates its database connection in a dependent, shared sub-module. The code that handles the instantiation looks something like this:

<pre class='language-javascript'><code class='language-javascript'>
let connection = mongoose.createConnection(MONGO_URL, ...);

connection.on('open', () => console.log(`Connected to ${MONGO_URL}`));

module.exports.connection = connection;
</code></pre>

Normally, due to [how Node.js' `require`{:.language-javascript} and `require.cache`{:.language-javascript} work](https://nodejs.org/api/modules.html#modules_require), the first time this shared module is required anywhere in our project, this code would be executed and our database connection would be established. Any subsequent `require`{:.language-javascript}s of our module would return the previously cached value of `module.exports`{:.language-javascript}. The module's code would not re-run, and additional database connections would not be opened.

{% include newsletter.html %}

Unfortunately, [Jest doesn't honor `require.cache`{:.language-javascript}](https://github.com/facebook/jest/issues/4940#issuecomment-346557115). This means that every test file blows away any previously cached modules, and any `require`{:.language-javascript} calls that test file makes will re-evaluate the required module's source. In our case, this re-evaulation creates a new database connection, which is the root of our problem.

## Mocking a Module with the Real Thing

The Github issue I linked above [hints at a solution to our problem](https://github.com/facebook/jest/issues/4940#issuecomment-346557115).

> If you'd like to set a module, you can add it to setupFiles in a way that does `jest.mock('module-name', () => { return moduleContents })`{:.language-javascript}.

Christoph is suggesting that we add a file to our `setupFiles`{:.language-javascript} Jest configuration, which we'll call `test/setup.js`{:.language-javascript}, and mock our shared module in that setup file:

<pre class='language-javascript'><code class='language-javascript'>
const mockSharedModule = require('shared-module');
jest.mock('shared-module', () => mockSharedModule);
</code></pre>

Unfortunately, this doesn't solve our problem. The `test/setup.js`{:.language-javascript} script [runs _before each test_](https://jestjs.io/docs/en/configuration.html#setuptestframeworkscriptfile-string) (emphasis is my own):

> The path to a module that runs some code to configure or set up the testing framework _before each test_.

We need to find a way to require our shared module once, _before all tests run_.

Thankfully, we can do this by creating a custom Jest environment, and instructing Jest to use our new environment with the `testEnvironment`{:.language-javascript} configuration option. We can require our shared module within our new environment, and mock any subsequent imports of our module to return a reference to the instance we just instantiated.

Unfortunately, we can't set up that mock within our environment. We need to do that within our test setup file.

This means we need some way of passing the contents of our shared module from our custom environment into our `test/setup.js`{:.language-javascript}. Strangely, the only way I've found to accomplish this is through the use of globals:

<pre class='language-javascript'><code class='language-javascript'>
const NodeEnvironment = require('jest-environment-node');
const sharedModule = require('shared-module');

class CustomEnvironment extends NodeEnvironment {
    constructor(config) {
        super(config);
    }

    async setup() {
        await super.setup();
        this.global.__SHARED_MODULE__ = sharedModule;
    }

    async teardown() {
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }
}

module.exports = CustomEnvironment;
</code></pre>

Most of this custom environment class is boilerplate required by Jest. The interesting pieces are where we `require`{:.language-javascript} our shared module, and most importantly, when we assign its contents to the `__SHARED_MODULE__`{:.language-javascript} global variable:

<pre class='language-javascript'><code class='language-javascript'>
this.global.__SHARED_MODULE__ = sharedModule;
</code></pre>

Note that `__SHARED_MODULE__`{:.language-javascript} isn arbitrary name I chose to avoid collisions with other variables defined in the global namespace. There's no magic going on in the naming.

Now, we can go back to `test/setup.js`{:.language-javascript} and create a mock of our shared module that returns the contents of the global `__SHARED_MODULE__`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
jest.mock('shared-module', () => global.__SHARED_MODULE__);
</code></pre>

And that's all there is to it.

Our custom environment requires and evaluates our shared module once, instantiating a single database connection. The reference to the shared module's contents is passed into our test setup script through a global variable. Our setup script mocks any future requires of our shared module to return the provided reference, rather than re-evaluating the module, creating a new database connection, and returning the new reference.

Whew.

## In Hindsight

After much blood, swear, and tears, our test suite is once again consistently passing. Rejoice!

While this solution works, it highlights a fundamental problem. __We're not using Jest correctly.__ We came into this project with a preconceived notion of how testing and, by extension, our test framework should work. When the we learned more about our tools and realized that they didn't work how we expected, we didn't retrace our steps and reassess our strategy. Instead, we applied quite a bit of time and pressure to force our tools to behave as we expected.

While having the knowhow and ability to do this is great, actually doing it in your project isn't recommended. Instead, see if you can use Jest in "The Jest Way". If you cannot, maybe you shouldn't be using Jest.

In hindsight, I should go have a talk with my team…
