---
layout: post
title:  "Exporting ES6 Classes From Meteor Packages"
titleParts: ["Exporting ES6 Classes From", "Meteor Packages"]
excerpt: "How do you export ES6 classes from Meteor packages? This articles dives into the topic."
author: "Pete Corey"
date:   2015-09-23
tags: ["Javascript", "Meteor"]
---

To celebrate the release of [Meteor 1.2](http://info.meteor.com/blog/announcing-meteor-1.2) and built-in support for [ES6 syntax](https://babeljs.io/), I've been playing with implementing some of my favorite Object Oriented design patterns in JavaScript. While doing this, I quickly ran into an interesting quirk of the Meteor package system. I began by writing creating a class in a Meteor package:

<pre class="language-javascript"><code class="language-javascript">class CommandHandler {
  ...
}
</code></pre>

Next, I added an export for <code class="language-javascript">CommandHandler</code> in the package's package.js file:

<pre class="language-javascript"><code class="language-javascript">api.export('CommandHandler');
</code></pre>

But interestingly, <code class="language-javascript">CommandHandler</code> was <code class="language-javascript">undefined</code> in my Meteor application. What's going on here?

<hr/>

A quick session in the [Babel REPL](https://babeljs.io/repl/) shows that a plain class decleration will compile down to a locally scoped function:

<pre class="language-javascript"><code class="language-javascript">class CommandHandler {}
</code></pre>

<pre class="language-javascript"><code class="language-javascript">"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CommandHandler = function CommandHandler() {
  _classCallCheck(this, CommandHandler);
};
</code></pre>

This type of function declaration will not be picked up by the <code class="language-javascript">api.export</code> method. Only [package-level variables](http://docs.meteor.com/#/full/pack_export), or variables declared without a <code class="language-javascript">var</code>, <code class="language-javascript">let</code>, or <code class="language-javascript">const</code>, are exportable. A quick fix to our class definition would be to tie our class definition to the global scope:

<pre class="language-javascript"><code class="language-javascript">CommandHandler = class CommandHandler {}
</code></pre>

This declaration compiles down to the following JavaScript:

<pre class="language-javascript"><code class="language-javascript">CommandHandler = function CommandHandler() {
  _classCallCheck(this, CommandHandler);
};
</code></pre>

We can get more concise about it and use an unnamed class expression:

<pre class="language-javascript"><code class="language-javascript">CommandHandler = class { }
</code></pre>

Which compiles down to:

<pre class="language-javascript"><code class="language-javascript">CommandHandler = (function () {
  function _class() {
    _classCallCheck(this, _class);
  }

  return _class;
})();
</code></pre>

_When using unnamed class expressions, it's important to remember that certain features like <code class="language-javascript">this.constructor.name</code> cannot be used within your class._

Notice that the <code class="language-javascript">CommandHandler</code> function is now being declared on the global scope. Now <code class="language-javascript">api.export</code> will happily pick up our <code class="language-javascript">CommandHandler</code> declaration and we can use it within our Meteor application.

Happy ES6ing!
