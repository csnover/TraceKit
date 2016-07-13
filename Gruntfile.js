/*global module:false*/
module.exports = function (grunt) {
    'use strict';

    /**
     * Bypass grunt-bump limitation
     * see https://github.com/vojtajina/grunt-bump/pull/189
     */
    var gruntBumpPrereleaseName = 'rc';
    grunt.initConfig({
        bump: {
            options: {
                files: ['package.json', 'bower.json', 'appveyor.yml'],
                prereleaseName: gruntBumpPrereleaseName,
                /**
                 * Need to create a new RegExp for appveyor
                 * https://github.com/vojtajina/grunt-bump/issues/190
                 */
                regExp: new RegExp(
                    '([\'|\"]?version[\'|\"]?[ ]*:[ ]*[\'|\"]?)(\\d+\\.\\d+\\.\\d+(-' +
                        gruntBumpPrereleaseName +
                        '\\.\\d+)?(-\\d+)?)[\\d||A-a|-]*([\'|\"]?)', 'i'
                )
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            lint: {
                src: [
                    'grunt.js',
                    'tracekit.js'
                ]
            }
        },
        jasmine : {
            src: [
                'tracekit.js',
                'spec/fixtures/captured-errors.js'
            ],
            options: {
                specs: 'spec/*-spec.js'
            }
        },
        jsdoc : {
            dist: {
                src: ['tracekit.js'],
                options: {
                    destination: 'doc',
                    readme: 'README.md',
                    configure: 'jsdoc.conf.json'
                }
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                sourceMapName: 'tracekit.min.js.map'
            },
            dist: {
                files: {
                    'tracekit.min.js': ['tracekit.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.registerTask('doc', ['jsdoc']);
    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('default', ['jshint:lint']);
};
