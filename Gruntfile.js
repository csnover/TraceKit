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
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('doc', ['jsdoc']);
    grunt.registerTask('test', ['karma:unit']);
    grunt.registerTask('default', ['jshint:lint']);
};
