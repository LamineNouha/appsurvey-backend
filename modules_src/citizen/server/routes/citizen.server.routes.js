'use strict';

/**
 * Module dependencies
 */
var citizens = require('../controllers/citizens.server.controller');

module.exports = function (app) {
  // Question collection routes
  app.route('/api/citizens')
    .post(citizens.create);

  

  // Finish by binding the question middleware
  app.param('citizenId', citizens.citizenByID);
 
};
