'use strict';

/**
 * Module dependencies
 */
var surveys = require('../controllers/surveys.server.controller');

module.exports = function (app) {
  // Survey collection routes
  app.route('/api/surveys')
    .post(surveys.create);

    app.route('/api/surveys/:userId').get(surveys.list);

  // Single Survey routes
  app.route('/api/surveys/:surveyId')
    .get(surveys.read)
    .put(surveys.update)
    .delete(surveys.delete);

  
    

  // Finish by binding the survey middleware
  app.param('surveyId', surveys.surveyByID);
};
