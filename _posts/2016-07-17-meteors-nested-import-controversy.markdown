---
layout: post
title:  "Meteor's Nested Import Controversy"
date:   2016-07-17
tags: []
---

In my [last post](/blog/2016/07/04/winston-and-meteor-13/) you might have noticed an interesting piece of ES6-flavored syntax sugar. We imported a module within a nested block:

<pre class='language-javascript'><code class='language-javascript'>
if (Meteor.isServer) {
    import winston from "winston";
    ...
</code></pre>

Although this code is isomorphic and executed on both the client and the server, `winston`{:.language-javascript} is only imported on the server.

While this kind of nested importing seems like a handy addition to our Meteor toolbox, it doesn’t come without its share of controversy.

## Meteor Meet Reify

As recently as Meteor version 1.3.2.4, this kind of nested import was impossible. Importing a module within any non-top-level block would result in an exception when building your Meteor application:

<pre class='language-javascript'><code class='language-javascript'>
import winston from “winston”;
^^^^^^
SyntaxError: Unexpected reserved word
</code></pre>

However, this all changed in Meteor 1.3.3. Digging through the [release notes](https://github.com/meteor/meteor/blob/devel/History.md#v133) for that version, you’ll notice a very interesting bullet point:

> import statements in application modules are no longer restricted to the top level, and may now appear inside conditional statements (e.g. if (Meteor.isServer) { import ... }) or in nested scopes.

In this release, Meteor transitioned to using [Ben Newman’s Reify transpiler](https://github.com/benjamn/reify), which transforms our nested import statement into something like this:

<pre class='language-javascript'><code class='language-javascript'>
if (Meteor.isServer) {
    var winston;
    module.import("winston",{"default":function(v){winston=v}});
}
</code></pre>

Initially, this seems like a useful improvement to the module system.

Importing modules within nested blocks can alleviate some of the pains of context-dependent (client vs. server) imports in isomorphic code. You only want this module imported on the server? Not a problem!

## Reify Meet Babel

Trouble quickly rears its ugly head when we try using these modules outside the context of the Meteor build tool.

To simplify our example, imagine we have a module that looks like this:

<pre class='language-javascript'><code class='language-javascript'>
export function parse(input) {
    import qs from "qs";
    return qs.parse(input);
}
</code></pre>

This module exports a function called `parse`{:.language-javascript} that takes in an `input`{:.language-javascript} string, runs it through [`qs.parse`{:.language-javascript}](https://www.npmjs.com/package/qs), and returns the result.

If this were a Meteor module, this would work just fine. The `qs`{:.language-javascript} module would be imported at runtime using `module.import`{:.language-javascript} and everything would work as expected.

Now, imagine that we wanted to test this functionality. Because [we want to keep our tests fast](/blog/2015/12/21/unit-testing-with-meteor-1.3/), we’ll bypass Meteor’s test framework and use [Mocha](https://mochajs.org/) directly.

A simple test for this module might look something like this:

<pre class='language-javascript'><code class='language-javascript'>
import { expect } from "chai";
import { parse } from "../imports/parse";

describe("myParseModule", function() {
    it("parses input", function() {
        expect(parse("foo=bar")).to.deep.equal({
            foo: "bar"
        });
    });
});
</code></pre>

We execute this test by running mocha over our `./test`{:.language-javascript} directory. Unaware of the transition to Reify (and, admittedly, unaware that Reify even exists), we specify that we want to use [Babel](http://babeljs.io/) as our Javascript transpiler:

<pre class='language-javascript'><code class='language-javascript'>
mocha ./test --compilers js:babel-register
</code></pre>

Unfortunately, when Babel tries to transpile our application, it throws an error:

<pre class='language-javascript'><code class='language-javascript'>
SyntaxError: 'import' and 'export' may only appear at the top level (2:4)
  1 | export function parse(input) {
> 2 |     import qs from "qs";
    |     ^
  3 |     return qs.parse(input);
  4 | }
  5 |
</code></pre>

Outside the context of Reify and the Meteor build system, nested imports are not recognized as valid ES6.

## The Controversy

Currently, [ES6 only supports top-level module imports](http://exploringjs.com/es6/ch_modules.html#_imports-and-exports-must-be-at-the-top-level). This design decision is intended to [open the doors](http://calculist.org/blog/2012/06/29/static-module-resolution/) for static analysis tools, better resolution of cyclic dependencies, improved dead code removal, and faster lookups, along with proposed Javascript features like macros and types.

___Reify’s choice to deviate from this decision is potentially at odds with these design goals, and violates the ES6 specification itself.___

That isn’t to say that Reify or Meteor are necessarily in the wrong. Specifications should be changeable, provided there is a compelling reason to change. Ben took up the torch and wrote a [compelling document outlining the benefits of nested imports](https://github.com/benjamn/reify/blob/master/WHY_NEST_IMPORTS.md).

In addition to static imports, ES6 also describes a [module loader API](http://www.2ality.com/2014/09/es6-modules-final.html#the_ecmascript_6_module_loader_api) that can be used to dynamically import modules:

<pre class='language-javascript'><code class='language-javascript'>
["./foo", "./bar"]
.map(System.import)
.then((foo, { baz }) => {
    // ...
});
</code></pre>

An argument could be made that the dynamic module loader API makes techniques like dead code removal impossible. How can a static analysis tool know which modules can be culled if it can’t see, at compile time, which modules will be used?

<pre class='language-javascript'><code class='language-javascript'>
let version = Math.round(Math.random());
System.import("./foo-v" + version);
</code></pre>

Can our build system remove the `foo-v0`{:.language-javascript} module from our final bundle? What about `foo-v1`{:.language-javascript}? Either of the modules could be chosen at runtime, so it’s impossible to know.

[Ben argues](https://github.com/benjamn/reify/blob/master/WHY_NEST_IMPORTS.md#nested-import-declarations-prevent-static-analysis) that using nested imports, which require string literal import locations and require all import symbols be explicitly named would eliminate this problem entirely. Even with nested imports, it’s easy to see which modules and symbols within those modules will be required in a final bundle.

Would nested imports bring us closer to our goals of better compile-time static analysis, while at the same time providing a better, more consistent developer experience?

The controversy is subtle, but the controversy is real.

## Looking Forward

As Meteor developers, we have two immediate options moving forward. We can embrace Reify, and potentially distance ourselves from the rest of the Javascript community, or we call fall back to using CommonJS-style `require`{:.language-javascript} statements to pull in nested modules (or [shim ES6-style module loaders](https://github.com/ModuleLoader/es6-module-loader)):

<pre class='language-javascript'><code class='language-javascript'>
if (Meteor.isServer) {
    const winston = require("winston");
    ...
</code></pre>

For the time being, because I enjoy using native Node.js tools outside the context of the Meteor build tool, I plan on refraining from using nested imports.

I’m very interested to see how all of this will play out.

Ben will be [discussing his proposal](https://github.com/tc39/agendas/pull/195) for nested imports with the ECMAScript standards committee at the end of this month.
