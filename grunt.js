/*global module:false*/

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! jsSIP v@<%= pkg.version %> jssip.net | jssip.net/license */'
    },
    lint: {
      dist: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
    },
    concat: {
      dist: {
        src: [
          'src/head.js',
          'src/EventEmitter.js',
          'src/Constants.js',
          'src/Exceptions.js',
          'src/Timers.js',
          'src/Transport.js',
          'src/Parser.js',
          'src/SIPMessage.js',
          'src/URI.js',
          'src/NameAddrHeader.js',
          'src/Transactions.js',
          'src/Dialogs.js',
          'src/RequestSender.js',
          'src/InDialogRequestSender.js',
          'src/Registrator.js',
          'src/Session.js',
          'src/MediaSession.js',
          'src/Message.js',
          'src/UA.js',
          'src/Utils.js',
          'src/SanityCheck.js',
          'src/DigestAuthentication.js',
          'src/WebRTC.js',
          'src/tail.js'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      },
      post: {
        src: [
          'dist/<%= pkg.name %>-<%= pkg.version %>.js',
          'src/Grammar/dist/Grammar.js'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      },
      post_min: {
        src: [
          'dist/<%= pkg.name %>-<%= pkg.version %>.min.js',
          'src/Grammar/dist/Grammar.min.js'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint test'
    },
    jshint: {
      options: {
        browser: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: false,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        onecase:true,
        unused:true,
        supernew: true
      },
      globals: {}
    },
    qunit: {
      noWebRTC: ['test/run-TestNoWebRTC.html']
    },
    uglify: {}
  });


  // Task for building JsSIP Grammar.js and Grammar.min.js files.
  grunt.registerTask('grammar', function(){
    var done = this.async();  // This is an async task.
    var sys = require('sys');
    var exec = require('child_process').exec;
    var child;

    // First compile JsSIP grammar with PEGjs.
    console.log('"grammar" task: compiling JsSIP PEGjs grammar into Grammar.js ...');
    child = exec('if [ -x "./node_modules/pegjs/bin/pegjs" ] ; then PEGJS="./node_modules/pegjs/bin/pegjs"; else PEGJS="pegjs" ; fi && $PEGJS -e JsSIP.Grammar src/Grammar/src/Grammar.pegjs src/Grammar/dist/Grammar.js', function(error, stdout, stderr) {
      if (error) {
        sys.print('ERROR: ' + stderr);
        done(false);  // Tell grunt that async task has failed.
      }
      console.log('OK');

      // Then modify the generated Grammar.js file with custom changes.
      console.log('"grammar" task: applying custom changes to Grammar.js ...');
      var fs = require('fs');
      var grammar = fs.readFileSync('src/Grammar/dist/Grammar.js').toString();
      var modified_grammar = grammar.replace(/throw new this\.SyntaxError\(([\s\S]*?)\);([\s\S]*?)}([\s\S]*?)return result;/, 'new this.SyntaxError($1);\n        return -1;$2}$3return data;');
      fs.writeFileSync('src/Grammar/dist/Grammar.js', modified_grammar);
      console.log('OK');

      // Then minify Grammar.js.
      console.log('"grammar" task: minifying Grammar.js ...');
      child = exec('cd src/Grammar/ && node minify.js', function(error, stdout, stderr) {
        if (error) {
          sys.print('ERROR: ' + stderr);
          done(false);  // Tell grunt that async task has failed.
        }
        console.log('OK');
        done();  // Tell grunt that async task has succeeded.
      });
    });
  });

  // Task for building JsSIP in both uncompressed and minified flavors.
  grunt.registerTask('build', ['concat:dist', 'lint', 'min', 'concat:post', 'concat:post_min']);

  // Task for building just JsSIP uncompressed (faster during development).
  grunt.registerTask('devel', ['concat:dist', 'lint', 'concat:post']);

  // Test tasks.
  grunt.registerTask('testNoWebRTC', ['qunit:noWebRTC']);
  grunt.registerTask('test', ['testNoWebRTC']);

  // A task for doing everything.
  grunt.registerTask('all', ['grammar', 'build', 'test']);

  // Travis CI task (it does everything).
  // Doc: http://manuel.manuelles.nl/blog/2012/06/22/integrate-travis-ci-into-grunt/
  grunt.registerTask('travis', ['all']);

  // Default task is an alias for 'build'.
  grunt.registerTask('default', ['build']);

};