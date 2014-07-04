'use strict';
var twilio = require('twilio');

var api = require('./controllers/api'),
    daon_voice_api = require('./controllers/daon_voice_api'),
    index = require('./controllers');

/**
 * Application routes
 */
module.exports = function(app) {

  // Server API Routes
  app.get('/api/awesomeThings', api.awesomeThings);
  app.get('/api/transactions', api.transactions);
  app.delete('/api/transactions', api.deleteTransaction);

  // DaonVoice API Routes
  app.post('/api/daonvoice/greet', twilio.webhook(), daon_voice_api.greet);
  app.post('/api/daonvoice/isregistered', twilio.webhook(), daon_voice_api.isregistered);
  app.post('/api/daonvoice/verify', twilio.webhook(), daon_voice_api.verify);
  app.post('/api/daonvoice/verify2', twilio.webhook(), daon_voice_api.verify2);
  app.post('/api/daonvoice/transcribe', twilio.webhook(), daon_voice_api.transcribe);
  app.post('/api/daonvoice/register', twilio.webhook(), daon_voice_api.register);
  app.post('/api/daonvoice/register2', twilio.webhook(), daon_voice_api.register2);
  app.post('/api/daonvoice/register3', twilio.webhook(), daon_voice_api.register3);

  // All undefined api routes should return a 404
  app.get('/api/*', function(req, res) {
    res.send(404);
  });

  // All other routes to use Angular routing in app/scripts/app.js
  app.get('/partials/*', index.partials);
  app.get('/*', index.index);
};
