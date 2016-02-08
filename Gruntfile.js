module.exports = function(grunt) {
    grunt.initConfig({
        jekyll: {
            serve: {
                options: {
                    serve: true,
                    watch: true,
                    host: '0.0.0.0',
                    future: true
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
        cssmin: {
            compress: {
                files: {
                    'css/main.css': ['css/main.css']
                }
            }
        },
        watch: {
            less: {
                files: ['less/**/*.less'],
                tasks: ['less', 'autoprefixer', 'cssmin']
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
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['concurrent:all']);
};
