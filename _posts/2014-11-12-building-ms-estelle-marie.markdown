---
layout: post
title:  "Building Ms. Estelle Marie"
titleParts:  ["Building Ms.", "Estelle Marie"]
excerpt: "Recently I spent some time customizing a Wordpress template for a client. Here's a quick rundown of my process and impressions."
author: "Pete Corey"
date:   2014-11-12
tags: ["PHP", "Wordpress", "Grunt"]
---

I firmly believe that design and development are inseparable. One cannot be done without a thorough understanding of the other. As a developer, I feel that more experience with all kinds of design (visual, interaction, product, etc...) will only do good things for me. Because of this, I’ve spent the past few months trying to work out my design muscle. My most recent design-heavy project was to build a custom [WordPress](https://wordpress.com/) theme for the [Ms. Estelle Marie](http://www.msestellemarie.com/) beauty blog. Here’s a quick rundown:

## Goals

For this project I was shooting for a very minimal aesthetic. I wanted the theme to be as unobtrusive and undistracting as possible to draw more of the user's attention to the bright, colorful content. For this reason I went with a mostly achromatic color scheme with a single gold accent and generous amounts of whitespace.

Because the design of [Ms. Estelle Marie](http://www.msestellemarie.com/) is so minimal, much of the aesthetic value comes from the typeface selection. After going back and forth between different combinations, I landed on two typefaces: [Playfair Display](http://www.google.com/fonts/specimen/Playfair+Display) and [Raleway](http://www.google.com/fonts/specimen/Raleway). I felt that the heaviness of the Playfair Display contrasted nicely with the lightness of Raleway.

## Base Wordpress Template

Before this project, I had zero exposure to WordPress development (although I’m no stranger to PHP). I figured that the best way to quickly get moving with the CMS was to start with a bare bones template. After sifting through a few options, I finally landed on the [Underscores](http://underscores.me/) (_s) theme. Underscores offered everything I was looking for. Namely, not much at all! A clean Underscores install presented with me with a very minimal theme with next to no superfluous styling or content to get in my way. With the help of the [WordPress Codex](http://codex.wordpress.org/), I was able to quickly wrap my mind around things like the WordPress file structure, API functionality and the general WordPress way of doing things. I’d highly recommend Underscores to anyone looking for a bare bones starter theme.

## Grunt

As with nearly all of my projects, my frontend workflow for this project relied heavily on [Grunt](http://gruntjs.com/). For this project, I was running WordPress out of <code class="language-*">/var/www</code>, so the only tools I used were [SASS](http://sass-lang.com/) and [LiveReload](http://livereload.com/). My Gruntfile was relatively thin:

<pre><code class="language-javascript">module.exports = function(grunt) {
    grunt.initConfig({
        sass: {
            dist: {
                files: {
                    'style.css': 'scss/style.scss'
                }
            }
        },
        watch: {
            options: {
                livereload: true,
            },
            less: {
                files: ['scss/**/*.scss'],
                tasks: ['sass']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
};</code></pre>

## SVG Logo

In [previous](http://1pxsolidtomato.com/2014/10/08/quest-for-scalable-svg-text/) [posts](http://1pxsolidtomato.com/2014/09/09/responsive-svg-height-issue/), I described creating scaling SVG text. I used a technique like this to manually create the [Ms. Estelle Marie](http://www.msestellemarie.com/) logo. My technique was fairly primitive. I created two text elements, styled them with a Google font and then resized and positioned them until I was happy with the results. Because the SVG element is using a <code class="language-*">viewBox</code> to define its internal coordinate system, the logo can responsively resize to whatever size is needed.

## Google Fonts

From a technicaly standpoint, I'm a huge fan of [Google Fonts](http://www.google.com/fonts). Being one line of CSS away from using any font you want is incredibly convenient. However, I did run into issues on this project with flashes of unstyled content (FOUC). The SVG logo would render before the font was loaded, which caused a flash of ugly, misaligned text. As recommended by Google, I used the [Web Font Loader](https://github.com/typekit/webfontloader) to fix these problems. The Web Font Loader synchronously loads the fonts specified, so by placing the provided script tags before any of your content, the script will block rendering until all of the fonts have been loaded, preventing the FOUC!
