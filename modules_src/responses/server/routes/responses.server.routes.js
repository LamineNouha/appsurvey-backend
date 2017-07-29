'use strict';

/**
 * Module dependencies
 */
var responses = require('../controllers/responses.server.controller');

module.exports = function (app) {
  // Category collection routes
  app.route('/api/responses')
    .get(responses.list)
    .post(responses.create);

  // Single category routes
  app.route('/api/responses/:responseId')
    .get(responses.read)
    .put(responses.update)
    .delete(responses.delete);

  // Finish by binding the category middleware
  app.param('responseId', responses.responseByID);
};
