'use strict';

/**
 * Module dependencies
 */
var statistiques = require('../controllers/statistiques.server.controller');

module.exports = function (app) {
 
  // Single question routes
  app.route('/api/statistiques/:surveyId/respPercentages')
    .get(statistiques.respPercentages);
  app.route('/api/dashboard/:userId').get(statistiques.dashboard);

    // Finish by binding the survey middleware
  app.param('surveyId', statistiques.surveyByID);
 
};
