---
layout: post
title:  "Bending Jest to Our Will: Restoring Node's Require Behavior"
description: "Jest overrides the behavior of Node's require behavior to support concurrent testing and better test isolation. But what if we don't want that?"
author: "Pete Corey"
date:   2019-03-25
tags: ["Javascript", "Testing", "Jest"]
related: ["/blog/2018/11/05/bending-jest-to-our-will-caching-modules-across-tests/"]
---

[Jest](https://jestjs.io/) does some _interesting things_ to Node's default `require`{:.language-javascript} behavior. In an attempt to encourage test independence and concurrent test execution, Jest resets the module cache after every test.

You may remember one of my previous articles about "bending Jest to our will" and [caching instances of modules across multiple tests](/blog/2018/11/05/bending-jest-to-our-will-caching-modules-across-tests/). While that solution works for single modules on a case-by-case basis, sometimes that's not quite enough. Sometimes we just want to completely restore Node's original `require`{:.language-javascript} behavior across the board.

After sleuthing through support tickets, blog posts, and "official statements" from Jest core developers, this seems to be entirely unsupported and largely impossible.

However, with some highly motivated hacking I've managed to find a way.

## Our Goal

If you're unfamiliar with how `require`{:.language-javascript} works under the hood, here's a quick rundown. The first time a module is required, its contents are executed and the resulting exported data is cached. Any subsequent `require`{:.language-javascript} calls of the same module return a reference to that cached data.

That's all there is to it.

Jest overrides this behavior and maintains its own "module registry" which is blown away after every test. If one test requires a module, the module's contents are executed and cached. If that same test requires the same module, the cached result will be returned, as we'd expect. However, other tests don't have access to our first test's module registry. If another test tries to require that same module, it'll have to execute the module's contents and store the result in its own private module registry.

Our goal is to find a way to reverse Jest's [monkey-patching](https://en.wikipedia.org/wiki/Monkey_patch) of Node's default `require`{:.language-javascript} behavior and restore it's original behavior.

This change, or reversal of a change, will have some unavoidable consequences. Our Jest test suite won't be able to support concurrent test processes. This means that all our tests will have to run ["in band"](https://jestjs.io/docs/en/cli#runinband)(`--runInBand`{:.language-javascript}). More interestingly, Jest's ["watch mode"](https://jestjs.io/docs/en/cli#watch) will no longer work, as it uses multiple processes to run tests and maintain a responsive command line interface.

Accepting these limitations and acknowledging that this is likely a very bad idea, let's press on.

## Dependency Hacking

After several long code reading and debugging sessions, I realized that the heart of the problem resides in Jest's `jest-runtime`{:.language-javascript} module. Specifically, [the `requireModuleOrMock`{:.language-javascript} function](https://github.com/facebook/jest/blob/e998c9230cb78b3befe0b1b57b36fd5353e766f0/packages/jest-runtime/src/index.js#L452), which is responsible for Jest's out-of-the-box `require`{:.language-javascript} behavior. Jest internally calls this method whenever a module is required by a test or by any code under test.

Short circuiting this method with a quick and dirty `require`{:.language-javascript} causes the `require`{:.language-javascript} statements throughout our test suites and causes our code under test to behave exactly as we'd expect:

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
requireModuleOrMock(from: Path, moduleName: string) {
+ return require(this._resolveModule(from, moduleName));
  try {
    if (this._shouldMock(from, moduleName)) {
      return this.requireMock(from, moduleName);
    } else {
      return this.requireModule(from, moduleName);
    }
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      const appendedMessage = findSiblingsWithFileExtension(
        this._config.moduleFileExtensions,
        from,
        moduleName,
      );

      if (appendedMessage) {
        e.message += appendedMessage;
      }
    }
    throw e;
  }
}
</code></pre>

Whenever Jest reaches for a module, we relieve it of the decision [to use a cached module from it's internally maintained `moduleRegistry`{:.language-javascript}](https://github.com/facebook/jest/blob/e998c9230cb78b3befe0b1b57b36fd5353e766f0/packages/jest-runtime/src/index.js#L288-L365), and instead have it always return the result of requiring the module through Node's standard mechanisms.

## Patching Jest

Our fix works, but in an ideal world we wouldn't have to fork `jest-runtime`{:.language-javascript} just to make our change. Thankfully, the `requireModuleOrMock`{:.language-javascript} function isn't hidden within a closure or made inaccessible through other means. This means we're free to monkey-patch it ourselves!

{% include newsletter.html %}

Let's start by creating a `test/globalSetup.js`{:.language-javascript} file in our project to hold our patch. Once created, we'll add the following lines:

<pre class='language-javascript'><code class='language-javascript'>
const jestRuntime = require('jest-runtime');

jestRuntime.prototype.requireModuleOrMock = function(from, moduleName) {
    return require(this._resolveModule(from, moduleName));
};
</code></pre>

We'll tell our Jest setup to use this config file by listing it in our `jest.config.js`{:.language-javascript} file:

<pre class='language-javascript'><code class='language-javascript'>
module.exports = {
    globalSetup: './test/globalSetup.js',
    ...
};
</code></pre>

And that's all there is to it! Jest will now execute our `globalSetup.js`{:.language-javascript} file once, before all of our test suites, and restore the original behavior of `require`{:.language-javascript}.

Being the future-minded developers that we are, it's probably wise to document this small and easily overlooked bit of black magic:

<pre class='language-javascript'><code class='language-javascript'>
/*
 * This requireModuleOrMock override is _very experimental_. It affects
 * how Jest works at a very low level and most likely breaks Jest-style
 * module mocks.
 *
 * The upside is that it lets us evaluate heavy modules once, rather
 * that once per test.
 */

jestRuntime.prototype.requireModuleOrMock = function(from, moduleName) {
    return require(this._resolveModule(from, moduleName));
};
</code></pre>

If you find yourself with no other choice but to perform this incantation on your test suite, I wish you luck. You're most likely going to need it.
