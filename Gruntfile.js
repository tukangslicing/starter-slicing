/*!
 * Starter Slicing Gruntfile
 * http://tukangslicing.com
 */

module.exports = function (grunt) {
  'use strict';

  require('time-grunt')(grunt);
  require('jit-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      less: {
        files: 'less/**/*',
        tasks: ['newer:less', 'notify:less']
      },
      js: {
        files: ['Gruntfile.js','js/**/*.js'],
        tasks: ['jscs', 'jshint', 'newer:concat', 'notify:js']
      }
    },

    notify: {
      first: {
        options: {
          title: '<%= pkg.name %>',
          message: 'Assets is finish compiled.'
        }
      },
      less: {
        options: {
          title: '<%= pkg.name %>',
          message: 'LESS finish compiling to CSS.'
        }
      },
      js: {
        options: {
          title: '<%= pkg.name %>',
          message: 'JS is finish concated'
        }
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      bootstrap: {
        src: [
          'js/bootstrap/transition.js',
          'js/bootstrap/alert.js',
          'js/bootstrap/button.js',
          'js/bootstrap/carousel.js',
          'js/bootstrap/collapse.js',
          'js/bootstrap/dropdown.js',
          'js/bootstrap/modal.js',
          'js/bootstrap/tooltip.js',
          'js/bootstrap/popover.js',
          'js/bootstrap/scrollspy.js',
          'js/bootstrap/tab.js',
          'js/bootstrap/affix.js'
        ],
        dest: 'js/bootstrap.js'
      }
    },

    jshint: {
      options: {
        jshintrc: 'js/.jshintrc',
        reporter: require('jshint-stylish')
      },
      core: {
        options: {
          jshintrc: 'js/bootstrap/.jshintrc'
        },
        src: 'js/bootstrap/*.js'
      }
      // },
      // grunt: {
      //   options: {
      //     jshintrc: 'grunt/.jshintrc'
      //   },
      //   src:'Gruntfile.js'
      // }
    },

    jscs: {
      options: {
        config: 'js/bootstrap/.jscsrc'
      },
      bootstrap: {
        src: 'js/bootstrap/*.js'
      },
      grunt: {
        src: 'Gruntfile.js'
      }
    },

    uglify: {
      options: {
        report: 'min',
        preserveComments: 'some'
      },
      frontend: {
        files: {
          'js/<%= pkg.name.toLowerCase() %>.min.js': ['js/bootstrap.js', 'js/plugins.js', 'js/<%= pkg.name.toLowerCase() %>.js']
        }
      }
    },

    less: {
      compileCore: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: 'bootstrap.css.map',
          sourceMapFilename: 'css/bootstrap.css.map'
        },
        files: {
          'css/bootstrap.css': 'less/bootstrap/bootstrap.less'
        }
      },
      compileWeb: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name.toLowerCase() %>.css.map',
          sourceMapFilename: 'css/<%= pkg.name.toLowerCase() %>.css.map'
        },
        files: {
          'css/<%= pkg.name.toLowerCase() %>.css': 'less/apps.less'
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: [
          'Android 2.3',
          'Android >= 4',
          'Chrome >= 20',
          'Firefox >= 24', // Firefox 24 is the latest ESR
          'Explorer >= 8',
          'iOS >= 6',
          'Opera >= 12',
          'Safari >= 6'
        ]
      },
      core: {
        options: {
          map: true
        },
        src: 'css/bootstrap.css'
      },
      web: {
        options: {
          map: true
        },
        src: 'css/<%= pkg.name.toLowerCase() %>.css'
      }
    },

    cssmin: {
      options: {
        compatibility: 'ie8',
        keepSpecialComments: '*',
        noAdvanced: true
      },
      core: {
        files: {
          'css/<%= pkg.name.toLowerCase() %>.css': 'css/<%= pkg.name.toLowerCase() %>.css',
          'css/bootstrap.css': 'css/bootstrap.css'
        }
      }
    },

    csscomb: {
      options: {
        config: 'less/bootstrap/.csscomb.json'
      },
      dist: {
        expand: true,
        cwd: 'css/',
        src: ['*.css', '!*.min.css'],
        dest: 'css/'
      }
    },

    newer: {
      options: {
        /**
         * when changing a less file, we run an addional check on all the *.less files to see if they are @importing a modified *.less file, and if so we include it in the files which less task should execute.
         */
        override: function (details, shouldIncludeCallback) {
          var fs = require('fs');
          var path = require('path');
          var async = require('async');

          var checkFileForModifiedImports = async.memoize(function (filepath, fileCheckCallback) {
            fs.readFile(filepath, 'utf8', function (error, data) {
              var directoryPath = path.dirname(filepath);
              var regex = /@import (?:\([^)]+\) )?"(.+?)(\.less)?"/g;
              var match;

              function checkNextImport() {
                if ((match = regex.exec(data)) === null) {
                  return fileCheckCallback(false); // all @import files has been checked.
                }

                var importFilePath = path.join(directoryPath, match[1] + '.less');
                fs.exists(importFilePath, function (exists) {
                  if (!exists) { // @import file does not exists.
                    return checkNextImport(); // skip to next
                  }

                  fs.stat(importFilePath, function (error, stats) {
                    if (stats.mtime > details.time) { // @import file has been modified, -> include it.
                      fileCheckCallback(true);
                    } else { // @import file has not been modified but, lets check the @import's of this file.
                      checkFileForModifiedImports(importFilePath, function (hasModifiedImport) {
                        if (hasModifiedImport) {
                          fileCheckCallback(true);
                        } else {
                          checkNextImport();
                        }
                      });
                    }
                  });
                });
              }
              checkNextImport();
            });
          });

          // only add override behavior to less tasks.
          if (details.task === 'less') {
            checkFileForModifiedImports(details.path, function (found) {
              shouldIncludeCallback(found);
            });
          } else {
            shouldIncludeCallback(false);
          }
        }
      }
    },

    concurrent: {
      less: [
        'less:compileCore',
        'less:compileWeb'
      ],
      js: [
        'jscs',
        'jshint',
        'concat'
      ],
      options: {
        logConcurrentOutput: true
      }
    },

    imagemin: {                          // Task
      dynamic: {                         // Another target
        files: [{
          expand: true,                  // Enable dynamic expansion
          cwd: 'img/',                   // Src matches are relative to this path
          src: ['**/*.{png,jpg,gif}'],   // Actual patterns to match
          dest: 'img/'                  // Destination path prefix
        }]
      }
    },

    clean: {
      dev: ['js/plugins.js', 'js/<%= pkg.name.toLowerCase() %>.js', 'css/*.css', 'css/*.css.map'],
      build: ['build/*']
    }
  });

  grunt.registerTask('compress-image', ['imagemin']);
  grunt.registerTask('dev', ['concurrent:less', 'concurrent:js', 'autoprefixer']);
  grunt.registerTask('default', ['dev', 'notify:first', 'watch']);
  grunt.registerTask('production', ['clean:build', 'compress-image', 'less', 'concat', 'autoprefixer', 'csscomb', 'cssmin', 'uglify']);
  grunt.registerTask('heroku', 'dev');
  grunt.registerTask('heroku:development', 'dev');
  grunt.registerTask('heroku:production', 'dev');
};
