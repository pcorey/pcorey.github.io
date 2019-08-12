---
layout: post
title:  "Transitioning to Modules With Global Imports"
titleParts: ["Transitioning to Modules With", "Global Imports"]
excerpt: "Transitioning your entire Meteor application towards using imports is a time-consuming and error-prone process. Thankfully, there's a middle way."
author: "Pete Corey"
date:   2016-05-09
tags: ["Javascript", "Meteor"]
---

[Meteor 1.3 is upon us](http://info.meteor.com/blog/announcing-meteor-1.3)! It brings with it promises of better testability, reusability and debugability all thanks to the [ES6 module system](http://www.2ality.com/2014/09/es6-modules-final.html).

Unfortunately, a wholesale [transition into the 1.3-style of doing things](http://guide.meteor.com/1.3-migration.html) may take a huge amount of work, depending on the size of your application. Where will you find the time to refactor ___your entire application___ into modules?

<hr/>

Even a partial transition can be frustrating.

Imagine you have a collection called `MyCollection`{:.language-javascript} that you’ve decided to move into a module. This process is simple enough. After your refactor, you might have a module located at `/imports/lib/mycollection`{:.language-javascript} that exports `MyCollection`{:.language-javascript}:

<pre class="language-javascript"><code class="language-javascript">import { Mongo } from "meteor/mongo";
export default new Mongo.Collection("mycollection");
</code></pre>

The difficulty comes in when you realize that the rest of your 1.2-style application still assumes that this collection will be accessible as a global reference. 

When you run your application, you’ll be greeted by countless errors complaining that `MyCollection`{:.language-javascript} is not defined throughout your application:

<pre class="language-javascript"><code class="language-javascript">ReferenceError: MyCollection is not defined
</code></pre>

<hr/>

One possible solution to this problem is to find each file referencing this collection and import `MyCollection`{:.language-javascript} module within it.

<pre class="language-javascript"><code class="language-javascript">import MyCollection from "/imports/lib/mycollection";
...
MyCollection.find(...);
</code></pre>

However, if your application references this collection throughout dozens or hundreds of files, this can quickly get out of hand. The seemingly simple process of moving `MyCollection`{:.language-javascript} into a module has suddenly turned into a hydra requiring you to edit files throughout your entire project.

<hr/>

Another solution to this problem is to import `MyCollection`{:.language-javascript} globally on both your client and your server. This eliminates the need to modify potentially hundreds of files throughout your project, and lets your legacy 1.2 code exist in blissful harmony with your 1.3 modules.

But how do we import modules globally? It’s not as simple as just importing them in your project’s `main.js`{:.language-javascript} files. After all, ES6 `import`{:.language-markup} calls are [transpiled down to `var`{:.language-javascript} declarations](http://babeljs.io/repl/#?evaluate=true&lineWrap=false&presets=es2015%2Creact%2Cstage-2&experimental=false&loose=false&spec=false&code=import%20%7B%20foo%20%7D%20from%20%22foo%22%3B) by [Babel](http://babeljs.io/), and `var`{:.language-markup} scope is limited to the file it was declared in.

The key is to import your module into your local scope and then explicitly assign it to a global reference. Using this technique, your `client/main.js`{:.language-javascript} and `server/main.js`{:.language-javascript} would look something like this:

<pre class="language-javascript"><code class="language-javascript">...
import _MyCollection from "/imports/lib/mycollection";
MyCollection = _MyCollection;
</code></pre>

If your collection is a named export, rather than a default export, you can assign it to a global reference like this:

<pre class="language-javascript"><code class="language-javascript">import { MyCollection as _MyCollection } 
       from "/imports/lib/mycollection";
MyCollection = _MyCollection;
</code></pre>

Transpired down to ES5, our import looks something like this:

<pre class="language-javascript"><code class="language-javascript">var _mycollection = require("/imports/lib/mycollection");
MyCollection = _mycollection.MyCollection;
</code></pre>

Notice that we’re reassigning the locally scoped `_mycollection`{:.language-javascript} to the global `MyCollection`{:.language-javascript} reference. Now, your old 1.2 style code can continue to reference `MyCollection`{:.language-javascript} as a global.

___Happy refactoring!___
