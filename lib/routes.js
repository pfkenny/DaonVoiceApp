'use strict';

var api = require('./controllers/api'),
    index = require('./controllers');

/**
 * Application routes
 */
module.exports = function(app) {

  // Server API Routes
  app.get('/api/awesomeThings', api.awesomeThings);

  // DaonVoice API Routes
  app.post('/api/daonvoice/greet', twilio.webhook(), api.daonVoiceAPI.greet);
  app.post('/api/daonvoice/isregistered', twilio.webhook(), api.daonVoiceAPI.isregistered);
  app.post('/api/daonvoice/verify', twilio.webhook(), api.daonVoiceAPI.verify);
  app.post('/api/daonvoice/verify2', twilio.webhook(), api.daonVoiceAPI.verify2);
  app.post('/api/daonvoice/transcribe', twilio.webhook(), api.daonVoiceAPI.transcribe);
  app.post('/api/daonvoice/register', twilio.webhook(), api.daonVoiceAPI.register);
  app.post('/api/daonvoice/register2', twilio.webhook(), api.daonVoiceAPI.register2);
  app.post('/api/daonvoice/register3', twilio.webhook(), api.daonVoiceAPI.register3);

  // All undefined api routes should return a 404
  app.get('/api/*', function(req, res) {
    res.send(404);
  });

  // All other routes to use Angular routing in app/scripts/app.js
  app.get('/partials/*', index.partials);
  app.get('/*', index.index);
};
