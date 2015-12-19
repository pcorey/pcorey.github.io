---
layout: post
title:  "Unit Testing With Meteor 1.3"
titleParts: ["Unit Testing", "With Meteor 1.3"]
date:   2015-12-21
tags: []
---

It's no secret that [I love testing](http://blog.east5th.co/2015/08/18/the-ecstasy-of-testing/). My ideal testing setup is a neatly mocked, blazingly fast unit test suite backed by a sprinkling of happy-path end-to-end tests as a last bastion against bugs. I want my [test pyramid](http://martinfowler.com/bliki/TestPyramid.html)!

Until very recently, this setup has been at odds with how Meteor has envisioned software testing. Meteor has always placed more emphasis on end-to-end testing, effectively turning the test pyramid into a deliciously unstable [ice cream cone](http://watirmelon.com/2012/01/31/introducing-the-software-testing-ice-cream-cone/).

## The Problem With End-to-end

[Velocity](https://github.com/meteor-velocity/velocity) is [___hesitantly___ the official solution](http://xolv.io/velocity-announcement) for Meteor testing. Velocity is fundamentally designed to run end-to-end tests on a second, mirrored, instance of your application. While writing unit tests to run under Velocity is possible and encouraged, it can take anywhere from fifteen to thirty seconds to see the results of your testing, due to server restart delays.

Fifteen seconds is a ___huge amount of time___ to wait for unit test! In fifteen seconds, I can easily lose context on the code under test, or even worse, I might start browsing Twitter.

## What About Mocha

If I want faster unit tests, why not use a more standard test runner like vanilla [Mocha](https://mochajs.org/), or [Jasmine](http://jasmine.github.io/)? Until very recently, this was nearly impossible due to the fact that Meteor's application architecture had no real notion of "modules". It was a challenge to write a Mocha test and only pull in the target module under test. To give the module context, you'd have to load up the rest of the Meteor application in its entirety.

Meteor packages were an attempt to solve this problem, and they were a solid step in the right direction. They allowed us to isolate a small chunk of our application and write targeted tests for that chunk. Unfortunately, within each package, it was very difficult to further isolate individual components; the entire package had to be treated as a single "unit", which could be unfeasible for larger packages.

## ES6 Modules to the Rescue

Thankfully, [MDG](https://www.meteor.com/people) (specifically [Ben Newman](https://github.com/benjamn)) has come to our rescue! Meteor 1.3 is introducing full support for [ES6 modules](http://www.2ality.com/2014/09/es6-modules-final.html) within Meteor applications and packages. This paves the way for fast unit testing within the Meteor ecosystem. Being able to structure our projects into small, isolated units means that we're also able to test those isolated units under a microscope.

As of writing this post, Meteor 1.3 is available as an early beta release. Follow [these instructions](https://github.com/meteor/meteor/issues/5788) to try out the release, and take a look at the [modules readme](https://github.com/meteor/meteor/blob/release-1.3/packages/modules/README.md) for a great overview on how to use ES6 modules in your project.

Leveraging this new functionality takes a bit of work, but the payoffs are well worth the effort. Let's dive into how we would use ES6 modules to set up a unit testing framework in our application.

## Setting Up The Suite

First thing's first, let's get our application set up to run unit tests. We're going to be using [Mocha](https://mochajs.org/) spiced up with [Chai](http://chaijs.com/guide/installation/) and [Sinon](http://sinonjs.org/). We'll also want to write our unit tests in [ES6](https://github.com/lukehoban/es6features), so we'll include [Babel](http://babeljs.io/) as well. Let's set up [npm](https://www.npmjs.com/) for our project and pull in the development dependencies we'll need to get testing:

~~~ bash
npm init
npm i --save-dev mocha chai sinon sinon-chai babel-register
~~~

Now we'll need to set up our test directory. Normally, mocha tests are placed in a `test/`{:.language-bash} directory, but Meteor will interpret that was a source directory and compile everything within it. Instead, we'll keep our tests in `tests/`{:.language-bash}, which Meteor happily ignores.

~~~ bash
mkdir tests/
touch tests/foo.js
~~~

Now we have a test file called `foo.js`{:.language-bash} in our `tests`{:.language-bash} folder. Finally, let's add an `npm test`{:.language-bash} script that uses the Babel compiler, just to make our lives easier. Add the following entry to the `"scripts"`{:.language-javascript} entry of your `package.json`{:.language-bash}:

~~~ javascript
"test": "mocha ./tests --compilers js:babel-register"
~~~

That's it! Now we can run our test suite:

~~~ bash
npm test
~~~

Or we can run it in [watch mode](https://mochajs.org/#w-watch), which will instantly rerun the suite every time any Javascript files in or below the current working directory change:

~~~ bash
npm test -- -w
~~~

You should see a message like this, indicating that our test suite is working:

~~~ bash
0 passing (0ms)
~~~

Now it's time to add our tests!

## Breaking Down The Tests

Let's say we have a module in our application called `Foo`{:.language-javascript}. `Foo`{:.language-javascript} is simple. `Foo`{:.language-javascript} has a method called `bar`{:.language-javascript} that always returns `"woo!"`{:.language-javascript}. How would we write a test for that?

~~~ javascript
describe("Foo", () => {

  it("returns woo", function() {
    let foo = new Foo(Meteor);
    let bar = foo.bar();
    expect(bar).to.equal("woo!");
  });

});
~~~

That's fairly straight-forward. We're creating an instance of `Foo`{:.language-javascript}, and we're running `bar()`{:.language-javascript}. Lastly, we assert that the value we got from `bar()`{:.language-javscript} is `"woo!"`{:.language-javascript}.

`Foo`{:.language-javascript} has another method called `doSomething`{:.language-javascript}. `doSomething`{:.language-javascript} makes a call to a Meteor method called `"something"`{:.language-javascript} and passes it the value of `bar()`{:.language-javascript}.

Testing for this behavior is a little more complicated. We're going to write a [test double](http://www.martinfowler.com/bliki/TestDouble.html) for the `Meteor.call`{:.language-javascript} method that will let us spy on how this method is used by our code under test. Check it out:

~~~ javascript
let Meteor;
beforeEach(function() {
  Meteor = {
    call: sinon.spy()
  };
});

...

it("does something", function() {
  let foo = new Foo(Meteor);
  foo.doSomething();
  expect(Meteor.call).to.have.been.calledWith("something", "woo!");
});
~~~

Once again, we create an instance of `Foo`{:.language-javascript}. However this time, we call `doSomething()`{:.language-javascript} on the instance of `Foo`{:.language-javascript}, and then we assert that the `Meteor.call`{:.language-javascript} method was called with the arguments `"something"`{:.language-javascript} and `"woo!"`{:.language-javascript}. We can make this kind of assertion because we've replaced the normal `Meteor.call`{:.language-javascript} [with a spy](http://sinonjs.org/docs/#spies), which lets us observe all kinds of interesting things about how a function is used and how it behaves during the test.

## Inject Your Dependencies

You'll notice that each of these tests are passing a `Meteor`{:.language-javascript} object into `Foo`{:.language-javascript}. If you dig into the `Foo`{:.language-javascript} module, you'll see that any interactions it has with the outside world of Meteor are done through this passed in object:

~~~ javascript
export class Foo {
  constructor(Meteor) {
    this.Meteor = Meteor;
  }
  bar() {
    return "woo!";
  }
  doSomething() {
    this.Meteor.call("something", this.bar());
  }
}
~~~

In this scenario, `Meteor`{:.language-javascript} is a dependency of `Foo`{:.language-javascript}. `Foo`{:.language-javascript} needs `Meteor`{:.language-javascript} to function. This technique of passing in dependencies is known as [Dependency Injection](http://stackoverflow.com/a/130862), and can be very useful.

Accessing Meteor through a reference provided at construction may seem strange at first; the Meteor object is usually isomorphically global. It's everywhere! But as we've seen, by being able to control what our module _thinks_ is the `Meteor`{:.language-javascript} object, we can underhandedly trick it into calling our mocked methods, which lets us test our units of code faster and more consistently.

At this point, if you've built our your `Foo`{:.language-javascript} and its corresponding tests, your watching test runner should be showing you two passing tests (completed in ___milliseconds___):

~~~ bash
foo
   ✓ returns woo
   ✓ does s

2 passing (2ms)
~~~

You can see the full test file, with a little extra boilderplate, [on Github](https://github.com/pcorey/hello-meteor-modules/blob/master/tests/foo.js), along with the source for the [`Foo`{:.language-javascript} module](https://github.com/pcorey/hello-meteor-modules/blob/master/foo.js).

## Final Thoughts

I couldn't be more happy about module support coming to Meteor in 1.3. While restructuring our applications into modules may take some upfront work, I truly believe that the benefits of this kind of structure will far outweigh the initial costs.

Let's build our test pyramids!
