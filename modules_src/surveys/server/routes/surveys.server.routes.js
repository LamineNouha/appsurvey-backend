'use strict';

/**
 * Module dependencies
 */
var surveys = require('../controllers/surveys.server.controller');

module.exports = function (app) {
  // Survey collection routes
  app.route('/api/surveys')
    .get(surveys.list)
    .post(surveys.create);

  // Single Survey routes
  app.route('/api/surveys/:surveyId')
    .get(surveys.read)
    .put(surveys.update)
    .delete(surveys.delete);

     app.route('/api/surveys/:surveyId/:questionId')
    .put(surveys.addQuestion);
    

  // Finish by binding the survey middleware
  app.param('surveyId', surveys.surveyByID);
};
