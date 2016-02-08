/*global module:false*/
module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
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
            dist : {
                src: ['tracekit.js'],
                options: {
                    destination: 'doc',
                    readme: 'README.md',
                    configure: 'jsdoc.conf.json'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('doc', ['jsdoc']);
    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('default', ['jshint:lint']);
};
