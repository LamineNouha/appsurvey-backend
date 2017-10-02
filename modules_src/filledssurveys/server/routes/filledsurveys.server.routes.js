'use strict';

/**
 * Module dependencies
 */
var filledsurveys = require('../controllers/filledsurveys.server.controller');

module.exports = function (app) {
  // Survey collection routes
  app.route('/api/filledsurveys')
    .post(filledsurveys.create);

   

  
    

  // Finish by binding the survey middleware
  app.param('filledsurveyId', filledsurveys.filledsurveyByID);
};
