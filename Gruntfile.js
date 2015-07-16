/*global module:false*/
module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        closureCompiler: {
            options: {
                compilerFile: './closure/compiler.jar',
                checkModified: true,
                compilerOpts: {
                    compilation_level: 'ADVANCED_OPTIMIZATIONS',
                    warning_level: 'verbose',
                    jscomp_off: ['checkTypes', 'checkVars', 'fileoverviewTags'],
                    summary_detail_level: 3,
                    output_wrapper: '"(function(){%output%}).call(this);"'
                },
                execOpts: {
                    maxBuffer: 200 * 1024
                }
            },
            compile: {
                src: './tracekit.js',
                dest: './tracekit.min.js'
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
                'spec/fixtures/captured-errors.js',
                'spec/spec-helper.js'
            ],
            options: {
                specs: 'spec/*-spec.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-closure-tools');

    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('default', ['jshint:lint', 'closureCompiler:compile']);
};
