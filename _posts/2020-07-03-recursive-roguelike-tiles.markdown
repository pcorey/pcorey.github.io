---
layout: post
title:  "Recursive Roguelike Tiles"
excerpt: "Let's dig deeper into the dungeon we generated last time and start adding grass and flowers. Recursive grids of tiles and cellular automata abound!"
author: "Pete Corey"
date:   2020-07-03
tags: ["Gamedev", "Roguelike", "Javascript", "React", "Canvas"]
image: "/img/2020-07-03-recursive-roguelike-tiles/roguelike.png"
related: []
---

The roguelike dungeon generator we hacked together in [a previous post](/blog/2020/07/01/hello-roguelike/) sparked something in my imagination. What kind of flora and fauna lived there, and how could we bring them to life?

The first thing that came to mind was grass. We should have some way of algorithmically generating grass throughout the open areas of our dungeon. A quick stab at adding grass could be to randomly colorize floor tiles as we render them:

<div id="one"></div>

But this isn't very aesthetically pleasing. The grass tiles should be smaller than the walkable tiles to give us some visual variety. We could model this by giving every `ground`{:.language-javascript} tile a set of `grass`{:.language-javascript} tiles. All of the `grass`{:.language-javascript} tiles in a given area live entirely within their parent `ground`{:.language-javascript} tile.

<div id="two"></div>

This is better, but we can go further. To spice up our grass, let's inject some life into it. We'll model our grass cells as a basic [cellular automaton](https://en.wikipedia.org/wiki/Cellular_automaton) that changes its state over time, looking to its immediate neighbors to decide what changes to make.

Because of how we recursively modeled our tiles, finding all of the neighbors of a single `grass`{:.language-javascript} tile takes some work:

<pre class='language-javascript'><code class='language-javascript'>
const getGrass = (x1, y1, x2, y2) => {
    let ground = state[y1 * w + x1];
    return _.get(ground, `grass.${y2 * grassWidth + x2}`{:.language-javascript});
};

const getGrassNeighbors = (i, x, y) => {
    let ix = i % w;
    let iy = Math.floor(i / w);
    return _.chain([
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
    ])
        .map(([dx, dy]) => {
            let nx = x + dx;
            let ny = y + dy;
            if (nx >= 0 && nx < grassWidth && ny >= 0 && ny < grassWidth) {
                return getGrass(ix, iy, nx, ny);
            } else if (nx < 0 && ny >= 0 && ny < grassWidth) {
                return getGrass(ix - 1, iy, grassWidth - 1, ny);
            } else if (nx >= grassWidth && ny >= 0 && ny < grassWidth) {
                return getGrass(ix + 1, iy, 0, ny);
            } else if (nx >= 0 && nx < grassWidth && ny < 0) {
                return getGrass(ix, iy - 1, nx, grassWidth - 1);
            } else if (nx >= 0 && nx < grassWidth && ny >= grassWidth) {
                return getGrass(ix, iy + 1, nx, 0);
            } else if (nx < 0 && ny < 0) {
                return getGrass(ix - 1, iy - 1, grassWidth - 1, grassWidth - 1);
            } else if (nx < 0 && ny >= grassWidth) {
                return getGrass(ix - 1, iy + 1, grassWidth - 1, 0);
            } else if (nx >= grassWidth && ny < 0) {
                return getGrass(ix + 1, iy - 1, 0, grassWidth - 1);
            } else if (nx >= grassWidth && ny >= grassWidth) {
                return getGrass(ix + 1, iy + 1, 0, 0);
            }
        })
        .reject(_.isUndefined)
        .value();
};
</code></pre>

Once we get get each grass cell's neighbors (sometimes dipping into a neighboring ground cell's grass tiles), we can start modeling a basic cellular automaton.

In this example, if a grass tile has more than four neighbors that are "alive", we set its value to the average of all of its neighbors, smoothing the area out. Otherwise, we square it's value, effectively darkening the tile:

<pre class='language-javascript'><code class='language-javascript'>
for (let y = 0; y < grassWidth; y++) {
    for (let x = 0; x < grassWidth; x++) {
        let grass = cell.grass[y * grassWidth + x];
        let neighbors = getGrassNeighbors(i, x, y);
        let alive = _.filter(neighbors, ({ value }) => value > 0.5);
        if (_.size(alive) > 4) {
            cell.grass[y * grassWidth + x].value = _.chain(neighbors)
                .map("value")
                .mean()
                .value();
        } else {
            cell.grass[y * grassWidth + x].value =
                cell.grass[y * grassWidth + x].value *
                cell.grass[y * grassWidth + x].value;
        }
    }
}
</code></pre>

There is no rhyme of reason for choosing these rules, but they produce interesting results:

<div id="three"></div>

We can even take this idea of recursive tile further. What if every `grass`{:.language-javascript} tile had a set of `flower`{:.language-javascript} tiles? Again, those flower tiles could be driven by cellular automata rules, or simple randomly generated.

<div id="four"></div>

Now I'm even more pulled in. What else lives in these caves? How do they change over time? Refresh the page for more dunegons!

<script src="/js/2020-07-03-recursive-roguelike-tiles/runtime-main.b70e5729.js"></script>
<script src="/js/2020-07-03-recursive-roguelike-tiles/2.30fa5df5.chunk.js"></script>
<script src="/js/2020-07-03-recursive-roguelike-tiles/main.11928e83.chunk.js"></script>

<style>
canvas {
  width: 100%;
  height: 100%;
}
</style>
