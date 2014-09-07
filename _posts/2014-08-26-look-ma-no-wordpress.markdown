---
layout: post
title:  "Look Ma'! No Wordpress!"
date:   2014-08-26 15:19:00
categories:
---

Check me out; I'm a blogger now. This was built with Jekyll and is running on Github Pages. I'm using LESS for my CSS preprocessor and Grunt to keep my build process sane. Tomato color scheme based on [Paletton](http://paletton.com/#uid=1070u0kn5w0dlMviJDfsvuaurnr) suggestions.

I'm also trying out Prism as my code highlighter:

<pre><code class="language-javascript">module.exports = function(grunt) {
    grunt.initConfig({
        ...
        ...
        watch: {
            less: {
                files: ["less/**/*.less"],
                tasks: ["less"]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
</code></pre>

I'm planning on pumping out a handful of micro-blogs. Small things I've been planning on writing down, but haven't had a place to.
