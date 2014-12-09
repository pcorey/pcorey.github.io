module.exports = function(grunt) {
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
        autoprefixer: {
            dist: {
                src: 'css/main.css',
                dest: 'css/main.css'
            }
        },
        watch: {
            less: {
                files: ['less/**/*.less'],
                tasks: ['less', 'autoprefixer']
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
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.registerTask('default', ['concurrent:all']);
};