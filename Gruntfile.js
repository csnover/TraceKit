/*global module:false*/
module.exports = function (grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        'closureCompiler': {
            options: {
                compilerFile: './closure/compiler.jar',
                checkModified: true,
                compilerOpts: {
                    compilation_level: 'ADVANCED_OPTIMIZATIONS',
                    warning_level: 'verbose',
                    jscomp_off: ['checkTypes', 'fileoverviewTags'],
                    summary_detail_level: 3,
                    output_wrapper: '"(function(){%output%}).call(this);"'
                },
                execOpts: {
                    maxBuffer: 200 * 1024
                }

            },
            'compile': {
                src: './tracekit.js',
                dest: './tracekit.min.js'
            }
        },
        jshint: {
            options: {
                // Uncommented are default grunt options
                bitwise: true, //Added from site
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                noempty: true, //Added from site
                nonew: true, //Added
                quotmark: 'single', //Added
                /* regexp: true, */
                undef: true,
                unused: true, //Added from site
                /* strict: true, //Added from site */
                sub: true,
                boss: true, //dont' allow assignments to be evaluated as truthy/falsey */
                eqnull: true, //Allow == null
                browser: true,
                /* indent: 4, //Added from site */
                devel: true, //Added
                white: false,
                onecase: true,
                trailing: true,
                maxparams: 6,
                maxdepth: 9,
                maxerr: 20
            },
            globals: {
                ActiveXObject: false
            },
            lint: {
                src: ['grunt.js', 'tracekit.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-closure-tools');

    grunt.registerTask('default', ['jshint:lint', 'closureCompiler:compile']);
    grunt.registerTask('travis', ['jshint:lint', 'closureCompiler:compile']);
};
