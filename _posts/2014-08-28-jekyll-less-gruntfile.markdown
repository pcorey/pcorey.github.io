---
layout: post
title:  "My Concurrent Jekyll Gruntfile"
titleParts: ["My Concurrent", "Jekyll Gruntfile"]
description: "Use concurrency to simultaneously run multiple Grunt commands."
author: "Pete Corey"
date:   2014-08-28
tags: ["Grunt", "Jekyll"]
---

I wanted to have a single default grunt command kick off my Jekyll server (<code class="language-*">jekyll serve --watch</code>), and my grunt watch task. After sleuthing around [StackOverflow](http://stackoverflow.com/questions/17849018/grunt-watch-command-never-runs-when-including-other-tasks-in-registertask-metho/17855350#17855350), I found a solution using [grunt-jekyll](https://github.com/dannygarcia/grunt-jekyll) and [grunt-concurrent](https://github.com/sindresorhus/grunt-concurrent). Concurrency is needed to prevent the jekyll server from blocking.

<pre class="language-javascript"><code class="language-javascript">module.exports = function(grunt) {
    grunt.initConfig({
        jekyll: {
            serve: {
                options: {
                    serve: true,
                    watch: true
                }
            }
        },
        less: {
            development: {
                options: {
                    paths: ['./less'],
                    yuicompress: true
                },
                files: {
                    'css/main.css': 'less/main.less'
                }
            }
        },
        watch: {
            less: {
                files: ['less/**/*.less'],
                tasks: ['less']
            }
        },
        concurrent: {
            all: {
                tasks: ['jekyll:serve', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jekyll');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.registerTask('default', ['concurrent:all']);
};
</code></pre>
