'use strict';

var newrelic = require('newrelic');
var express = require('express');
var logfmt = require("logfmt");


/**
 * Main application file
 */

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Application Config
var config = require('./lib/config/config');

var app = express();

app.use(logfmt.requestLogger());

app.use(express.urlencoded());

// Express settings
require('./lib/config/express')(app);

// Routing
require('./lib/routes')(app);

// Log license key
console.log('Using new relic key %s.',process.env.NEWRELIC_LICENSE);

// Start server
app.listen(config.port, function () {
  console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
