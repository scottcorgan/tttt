var path = require('path')

var express = require('express');
var send = require('send');
var browserify = require('browserify');

var app = express();
var ROOT = path.join(__dirname, 'assets');

app.get('/', function (req, res) {

  send(req, '/index.html', {root: ROOT}).pipe(res);
});

app.get('/style.css', function (req, res) {


  send(req, req.url, {root: ROOT}).pipe(res);
});

var b1 = browserify({});
b1.add(ROOT + '/client.js');
app.get('/client.js', function (req, res) {

  res.status(200);
  res.contentType('application/javascript');

  b1.bundle().pipe(res);
});

app.get('/test-frame.html', function (req, res) {

  send(req, req.url, {root: ROOT}).pipe(res);
});

var bTestFrame = browserify({});
bTestFrame.add(ROOT + '/test-frame.js');
app.get('/test-frame.js', function (req, res) {

  res.status(200);
  res.contentType('application/javascript');
  bTestFrame.bundle().pipe(res);
});

exports.start = function (done) {

  var server = app.listen(3000, function (err) {

    done(err, server);
  });
}
