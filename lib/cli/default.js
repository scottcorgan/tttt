var path = require('path');

// var launcher = require('browser-launcher');
var browserify = require('browserify');
var format = require('chalk');
var asArray = require('as-array');
var socketio = require('socket.io');
var through = require('through2');
var tapSpec = require('tap-spec');
var sane = require('sane');

module.exports = function (cli, imports, done) {

  var serverApp = imports.serverApp;

  cli.default().handler(testRunner);

  function testRunner (data, flags, done) {

    serverApp.start(function (err, server) {

      console.log('Server started: http://localhost:3000');

      var io = socketio(server);
      io.on('connection', function (socket) {

        console.log('Websocket client connected.');

        emitBundle();

        function emitBundle () {

          console.log('Emitting bundle.');

          socket.emit('bundle:start');
          var b2 = browserify({
            entries: asArray(data),
            debug: true
          });
          b2.bundle()
            .on('data', function (chunk) {

              socket.emit('bundle:chunk', chunk.toString());
            })
            .on('end', function () {

              socket.emit('bundle:end');
            });

          writeToTerminal(socket);
        }
      });
    });
  }

  function writeToTerminal (socket) {

    var out = through();
    out.pipe(tapSpec()).pipe(process.stdout);

    socket.on('tap', function (line) {

      out.write(line);
    });

    socket.on('tap:end', function () {

      out.end();
    });
  }

  done();
};
