---
layout: post
title:  "Throw Back Thursday: Julia Sets with Sass"
titleParts: ["Throw Back Thursday", "Julia Sets with Sass"]
date:   2014-12-18
categories:
---


The other day I was looking through my old [GitHub repositories](https://github.com/pcorey?tab=repositories), and I found [JuliaSass](https://github.com/pcorey/JuliaSass). This was my fisrt time experimenting with [Sass](http://sass-lang.com/) and [Haml](http://haml.info/). I had been using [Less](http://lesscss.org/) at the time, but I learned about Sass' support of [@functions](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#function_directives) and I was inspired. I decided to build a Sass script that would generate a [Julia Set](http://en.wikipedia.org/wiki/Julia_set) fractal. Haml would be used to generate a huge number of divs, and Sass would be used to calculate and set each div's color based on the fractal's coloring algorithm.

The resulting CSS file was over 50000 lines long and took over 1 minute to generate on my machine. Needless to say, this is a horrible idea, but I thought it was a cool expiriment.

[Check it out!](http://1pxsolidtomato.com/JuliaSass/)

<img style="max-width: 100%;" src="http://i.imgur.com/uDOVJ4a.png">