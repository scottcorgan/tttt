#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

// var launcher = require('browser-launcher');
var express = require('express');
var browserify = require('browserify');
var format = require('chalk');
var asArray = require('as-array');
var concat = require('concat-stream');
var socketio = require('socket.io');
var through = require('through2');
var tapSpec = require('tap-spec');

var cli = require('nash')();
var app = express();

app.get('/', function (req, res) {

  res.status(200);
  fs.createReadStream(__dirname + '/index.html').pipe(res);
});

app.get('/style.css', function (req, res) {

  fs.createReadStream(__dirname + '/style.css').pipe(res);
});

var b1 = browserify({});
b1.add(__dirname + '/client.js');
// var testFile;
app.get('/client.js', function (req, res) {

  b1.bundle().pipe(res);

  // if (testFile) {
  //   return res.send(testFile);
  // }

  // var concatStream = concat(function (contents) {

  //   testFile = contents;
  //   res.send(testFile);
  // });

  // b1.bundle().pipe(concatStream);
});

app.get('/test-frame.html', function (req, res) {

  fs.createReadStream(__dirname + '/test-frame.html').pipe(res);
});

var bTestFrame = browserify({});
bTestFrame.add(__dirname + '/test-frame.js');
app.get('/test-frame.js', function (req, res) {

  bTestFrame.bundle().pipe(res);
});

var b2;
cli.default()
  .handler(function (data, flags, done) {

    b2 = browserify({
      entries: asArray(data),
      debug: true
    });

    var server = app.listen(3000, function () {

      console.log('Server started: http://localhost:3000');

      var io = socketio(server);

      io.on('connection', function (socket) {

        console.log('Websocket client connected.');


        // Send bundle to client
        // var concatStream = concat(function (bundle) {

        //   socket.emit('testBundle', bundle.toString());
        // });
        // b2.bundle().pipe(concatStream);

        socket.emit('bundle:start');

        b2.bundle()
          .on('data', function (chunk) {

            socket.emit('bundle:chunk', chunk.toString());
          })
          .on('end', function () {

            socket.emit('bundle:end');
          });


        writeToTerminal(socket);
      });
    });

  });



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

cli.run(process.argv);
