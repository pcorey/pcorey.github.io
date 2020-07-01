---
layout: post
title:  "Hello Roguelike"
excerpt: "Let's take a breather and use a random walk algorithm to generate a roguelike-style dunegon in the browser."
author: "Pete Corey"
date:   2020-06-01
tags: ["Gamedev", "Roguelike", "Javascript", "React", "Canvas"]
image: "/img/2020-06-01-hello-roguelike/roguelike.png"
related: []
---

Like a lot of folks, the desire to create my own video games is what originally got me into computer programming. While I don't play many video games these days, video game development still holds a special place in my heart. I'm especially fascinated by procedural generation techniques used in video games and many forms of computer art, so you'll often find me creeping around the [/r/roguelikedev](https://www.reddit.com/r/roguelikedev/) and [/r/generative](https://www.reddit.com/r/generative/) subreddits.

Inspired by [a recent post on /r/roguelikedev](https://www.reddit.com/r/roguelikedev/comments/hhzszb/using_a_modified_drunkards_walk_to_generate_cave/), I decided to try my hand at implementing a _very basic_ dungeon generator using a [random walk](http://www.roguebasin.com/index.php?title=Random_Walk_Cave_Generation) algorithm.

After getting our canvas set up, we can implement our basic random walk algorithm by starting in the center of our grid and moving in random directions, filling in each square we encounter as we come to it:

<pre class='language-javascript'><code class='language-javascript'>
let pixelSize = 32;
let w = Math.floor(width / pixelSize);
let h = Math.floor(height / pixelSize);

let state = [];
let x = Math.floor(w / 2);
let y = Math.floor(h / 2);
let filled = 0;
let path = [];
let maxFilled = 500;

while (filled < maxFilled) {
    path.push(y * w + x);
    if (!state[y * w + x]) {
        state[y * w + x] = true;
        filled++;
    }
    let [nx, ny] = getNextDirection(x, y);
    x += nx;
    y += ny;
}
</code></pre>

Notice that we're also keeping track of the sequence of steps, or the `path`{:.language-javascript} we took to as we moved through our grid. Also notice that this isn't particularly "good" code. That doesn't matter as long as we're having fun.

The `getNextDirection`{:.language-javascript} function just returns a random direction, with a little added fanciness to keep our path from falling off our grid:

<pre class='language-javascript'><code class='language-javascript'>
let getNextDirection = (cx, cy) => {
    let [x, y] = _.sample([[0, 1], [0, -1], [1, 0], [-1, 0]]);
    if (cx + x < 1 || cy + y < 1 || cx + x >= w - 1 || cy + y >= h - 1) {
        return getNextDirection(cx, cy);
    } else {
        return [x, y];
    }
};
</code></pre>

Animating this algorithm is its own microcosm of interesting divergences...

<div id="one"></div>

Once we have our fully filled out grid, we can flip our perspective and render the walls around the steps we took through the grid, rather than rendering the steps themselves:

<div id="two"></div>

We can add a path through our dungeon by removing the cycles from our `path`{:.language-javascript} and tracing its newly simplified form through our grid. We could even hint at up and down stairways with orange dots at the beginning and end of our path.

<div id="three"></div>

This is a ridiculously simple algorithm, but what comes out of it absolutely pulls me in. What else lives in these dungeons? What kinds of things could we expect to find, and how would we bring those things to life?

Refresh the page to get more dunegons!

<script src="/js/2020-06-01-hello-roguelike/runtime-main.b70e5729.js"></script>
<script src="/js/2020-06-01-hello-roguelike/2.fb7ba099.chunk.js"></script>
<script src="/js/2020-06-01-hello-roguelike/main.df842370.chunk.js"></script>

<style>
canvas {
  width: 100%;
  height: 100%;
}
</style>
