---
layout: post
title:  "Random Seeds, Lodash, and ES6 Imports"
excerpt: "Generating a stream of consistently random values can be incredibly important in some situations, but it can also be tricky to achieve. Check out how we can take advantage of ES6 imports to ensure consistent randomness from external libraries, like Lodash."
author: "Pete Corey"
date:   2020-01-01
tags: ["Javascript", "Generative", "Lodash"]
related: []
---

[David Bau's `seedrandom`{:.language-javascript} Javascript library](http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html) is an excellent tool for introducing deterministic random values into your Javascript project. After setting a fixed seed, `Math.random`{:.language-javascript} will produce a stream of random values. Those same random values will be produced again, in order, the next time you run your program. This is very important when creating generative art or procedurally generated game content.

However, there's a small problem when trying to combine `seedrandom`{:.language-javascript} with a library like [Lodash](https://lodash.com/docs/4.17.15). Ideally, we'd like Lodash to respect our random seed, so methods like `shuffle`{:.language-javascript} would always produce a deterministic shuffling. Unfortunately, with a setup like the one described below, this won't be the case:

<pre class='language-javascript'><code class='language-javascript'>
import _ from "lodash";
import seedrandom from "seedrandom";

seedrandom("seed", { global: true });

_.shuffle([1, 2, 3]); // Ignores our random seed.
</code></pre>

The `seedrandom`{:.language-javascript} library [wholesale replaces `Math.random`{:.language-javascript} with a new pseudo-random number generator](https://github.com/davidbau/seedrandom/blob/f38648743a80fef0319d0d66c2cd37bec116a5a7/seedrandom.js#L94). Because we're importing `lodash`{:.language-javascript} before we initialize `seedrandom`{:.language-javascript}, Lodash defines all of its functions, `shuffle`{:.language-javascript} included, to use the original reference to `Math.random`{:.language-javascript}. We need to initialize `seedrandom`{:.language-javascript} before importing Lodash.

Unfortunately, this won't work:

<pre class='language-javascript'><code class='language-javascript'>
import seedrandom from "seedrandom";
seedrandom("seed", { global: true });

import _ from "lodash";
</code></pre>

Node.js requires all import statements to be at the top of a module. We can't initialize `seedrandom`{:.language-javascript} before importing Lodash.

Thankfully, a simple solution exists. We'll make a new module called `seed.js`{:.language-javascript} that simply imports `seedrandom`{:.language-javascript} and then initializes it with our seed:

<pre class='language-javascript'><code class='language-javascript'>
import seedrandom from "seedrandom";

seedrandom("seed", { global: true });
</code></pre>

Next we can import our local `"./seed.js"`{:.language-javascript} module before importing Lodash:

<pre class='language-javascript'><code class='language-javascript'>
import "./seed.js";
import _ from "lodash";

_.shuffle([1, 2, 3]); // Produces deterministic shufflings!
</code></pre>

And with that small change `seedrandom`{:.language-javascript}, Lodash, and ES6-style imports all play nicely together. Our `shuffle`{:.language-javascript} function will now product deterministic shufflings based on the seed we pass into `seedrandom`{:.language-javascript}!
