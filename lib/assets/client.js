/*
I like this vertical line style:
- http://thenextweb.com/apps/2015/07/10/you-are-not-all-chat/
*/





var through = require('through2');
var parser = require('tap-out');

var socket = io('http://localhost:3000');

var $output = document.getElementById('output');
var $tests = document.getElementById('tests');

var log = console.log.bind(console);

function outPipe () {

  var out = through();
  var tap = parser();
  var nextLineIsEnd = false;

  console.log = function (msg) {

    out.write(msg + '\n');

    // Output to console
    log(msg);

    if (nextLineIsEnd) {
      out.end();
      nextLineIsEnd = false;
    }

    // Reached the end?
    if (msg.indexOf('# fail') > -1 || msg.indexOf('# ok') > -1) {
      nextLineIsEnd = true;
    }
  };

  tap.on('output', function (output) {

    if (output.fail.length > 0) {
      $output.className = 'fail';
    }
    else {
      $output.className = 'success';
    }
  });

  tap.on('test', function (test) {

    var div = document.createElement('div');
    div.setAttribute('id', 'test-' + test.number);
    div.className = 'test';
    div.appendChild(document.createTextNode(test.name));
    $tests.appendChild(div);
  });

  tap.on('assert', function (assertion) {

    var div = document.createElement('div');
    div.setAttribute('id', 'assert-' + assertion.test);
    div.className = 'assertion ' + (assertion.ok ? 'success' : 'fail');
    div.appendChild(document.createTextNode(assertion.name));

    // Mark test element as failed
    if (!assertion.ok) {
      var testEl = document.getElementById('test-' + assertion.test)
      testEl.className = testEl.className + ' fail';
    }

    $tests.appendChild(div);
  });

  tap.on('comment', function (comment) {

    log('%c[TESSEDER]: %c' + comment.raw, 'font-weight: bold;color: gray', 'font-weight:bold;color: black');
  });

  out.pipe(tap);

  out.pipe(through(function (chunk, enc, next) {

    socket.emit('tap', chunk.toString());
    next();
  }, function () {
    socket.emit('tap:end');
  }));
}




/////////////

// TODO: run each file in its own iframe
var bundleStr = '';
var domain = 'http://localhost:3000';
var iframe = document.createElement('iframe');

window.addEventListener('message', function (e) {

  var message = JSON.parse(e.data);

  if (message.type === 'chunk') {
    console.log(message.data);
  }

  if (message.type === 'end') {
    console.log('');
  }
});

// Transfer socket data to iframe
socket.on('bundle:start', function () {

  iframe.setAttribute('src', '/test-frame.html');
  document.getElementById('test-frame').appendChild(iframe);

  iframe.contentWindow.addEventListener('DOMContentLoaded', function () {

    var data = {
      type: 'start'
    };
    iframe.contentWindow.postMessage(JSON.stringify(data), domain);
  });

  outPipe();
});
socket.on('bundle:chunk', function (chunk) {

  var data = {
    type: 'chunk',
    data: chunk
  };
  iframe.contentWindow.postMessage(JSON.stringify(data), domain);
});
socket.on('bundle:end', function () {

  var data = {
    type: 'end'
  };
  iframe.contentWindow.postMessage(JSON.stringify(data), domain);
});
