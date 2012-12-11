/*global module:false*/
module.exports = function(grunt) {
  'use strict';
  
  // Project configuration.
  grunt.initConfig({
    lint: {
      files: ['grunt.js', 'tracekit.js']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
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
        
        es5:       true,
        onecase:   true,
        
        //Adding a few of nice restrictions:
        trailing: true,
        maxparams: 6,
        maxdepth: 9,
        maxerr: 20
      },
      globals: {
        ActiveXObject: false
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint watch');

  // Travis-CI task.
  grunt.registerTask('travis', 'lint');
};
