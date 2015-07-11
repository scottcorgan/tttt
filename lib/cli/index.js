var cli = require('nash')();
var serverApp = require('../server');

cli.register([
  {
    register: require('./default'),
    options: {
      serverApp: serverApp
    }
  }
])

module.exports = cli;
