var through = require('through2');

var out = through();
var source;
var origin;
var actions = {
  start: start,
  chunk: chunk,
  end: end
};

window.addEventListener('message', function (e) {

  if (!source) {
    source = e.source;
  }

  if (!origin) {
    origin = e.origin;
  }

  var spec = JSON.parse(e.data);
  actions[spec.type](spec.data, e.origin);
}, false);

var log = console.log.bind(console);
var nextLineIsEnd = false;
console.log = function (msg) {

  out.write(msg);

  if (nextLineIsEnd) {
    out.end();
    nextLineIsEnd = false;

    var sourceMsg = {
      type: 'end'
    };
    source.postMessage(JSON.stringify(sourceMsg), origin);
  }

  // Reached the end?
  if (msg.indexOf('# fail') > -1 || msg.indexOf('# ok') > -1) {
    nextLineIsEnd = true;
  }
};

function start (data, origin) {

  out.on('data', function (chunk) {

    var msg = {
      type: 'chunk',
      data: chunk.toString()
    };
    source.postMessage(JSON.stringify(msg), origin);
  });

  var msg = {
    type: 'start',
  };
  source.postMessage(JSON.stringify(msg), origin);
}

var testBundle = '';
function chunk (data, origin) {

  testBundle += data;
}

function end (data, origin) {

  executeBundle();
}

function executeBundle () {

  var scr = document.createElement('script');
  scr.innerHTML = testBundle;
  document.body.innerHTML = '';
  document.body.appendChild(scr);
}
