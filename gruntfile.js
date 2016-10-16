module.exports = function(grunt) {
    grunt.initConfig({
        sass: {
            options: {
                sourcemap: "none"
            },
            build: {
                files: {
                    'dist/the-framework.bundle.css': 'sass/the-framework.scss'
                }
            }
        },
        cssmin: {
            options: {
                keepSpecialComments: 0,
                report: 'gzip'
            },
            target: {
                files: {
                    'dist/the-framework.bundle.css': 'dist/the-framework.bundle.css'
                }
            }
        },
        concat: {
            buildjs: {
                src: [
                    "node_modules/fastclick/lib/fastclick.js",
                    "node_modules/browser-jquery/dist/jquery.min.js",
                    "node_modules/selectize/dist/js/standalone/selectize.min.js",
                    'node_modules/moment/min/moment.min.js',
                    'modified_modules/moment-jalaali/moment-jalaali.js',

                    "node_modules/angular/angular.js",
                    "node_modules/angular-route/angular-route.js",
                    "node_modules/angular-animate/angular-animate.js",
                    "node_modules/angular-touch/angular-touch.js",
                    "node_modules/angular-carousel/dist/angular-carousel.min.js",

                    "js/the-framework.js"
                ],
                dest: 'dist/the-framework.bundle.js',
            },
            buildcss: {
                src: [
                    "dist/the-framework.bundle.css",
                    "node_modules/angular-carousel/dist/angular-carousel.min.css",
                ],
                dest: 'dist/the-framework.bundle.css',
            },
        },
        uglify: {
            options: {
                mangle: false
            },
            build: {
                files: {
                    'dist/the-framework.bundle.js': 'dist/the-framework.bundle.js'
                }
            }
        },
        exec: {
            start: {
                command: 'http-server .',
                stdout: true,
                stderr: true
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask('buildcss', ['sass:build', 'cssmin', 'concat:buildcss']);
    grunt.registerTask('buildjs', ['concat:buildjs', 'uglify:build']);
    grunt.registerTask('build', ['buildcss', 'buildjs']);
    grunt.registerTask('fastbuild', ['sass:build', 'concat:buildcss', 'concat:buildjs']);
    grunt.registerTask('start', ['fastbuild', 'exec:start']);
};