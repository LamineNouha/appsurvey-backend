'use strict';

/**
 * Module dependencies
 */
var events = require('../controllers/events.server.controller');

module.exports = function (app) {
  // Event collection routes
  app.route('/api/events')
    .get(events.list)
    .post(events.create);

  // Single event routes
  app.route('/api/events/:eventId')
    .get(events.read)
    .put(events.update)
    .delete(events.delete);

  // Finish by binding the event middleware
  app.param('eventId', events.eventByID);
};
