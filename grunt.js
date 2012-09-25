module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      all: ['grunt.js', 'javascripts/Maja.js']
    },
    jshint: {
      options: {
        smarttabs: true,
        browser: true
      }
    },
    // Lists of files to be concatenated, used by the "concat" task.
    concat: {
      dist: {
        src: ['javascripts/gv/jquery.timers-1.2.js', 'javascripts/gv/jquery.easing.1.3.js', 'javascripts/gv/jquery.galleryview-3.0-dev.js', 'javascripts/backbone/modernizr-2.0.6.js', 'javascripts/backbone/underscore.js', 'javascripts/backbone/json2.js', 'javascripts/backbone/happy.js', 'javascripts/backbone/backbone.js', 'javascripts/Maja.js'],
        dest: 'dist/libs.js'
      }
    },
    // Lists of files to be minified with UglifyJS, used by the "min" task.
    min: {
      dist: {
        src: ['dist/libs.js'],
        dest: 'dist/libs.min.js'
      }
    },
    csslint: {
      base_theme: {
        src: "stylesheets/main.css",
        rules: {
          "import": false,
          "overqualified-elements": 2
        }
      }
    },
    cssmin: {
        dist: {
        src: ['stylesheets/main.css'],
        dest: 'stylesheets/main.min.css'
      } 
    }, 
    // Lists of files or URLs to be unit tested with QUnit, used by the "qunit" task.
    qunit: {},

    // Configuration options for the "server" task.
    server: {},

    // Configuration options for the "watch" task.
    watch: {},
    // Global configuration options for JSHint.
    uglify: {}
  });

  grunt.loadNpmTasks('grunt-css');
  grunt.loadNpmTasks('grunt-sass');
  
  // Default task.
  grunt.registerTask('default', 'lint');
};