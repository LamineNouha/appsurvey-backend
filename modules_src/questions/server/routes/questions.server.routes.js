'use strict';

/**
 * Module dependencies
 */
var questions = require('../controllers/questions.server.controller');

module.exports = function (app) {
  // Question collection routes
  app.route('/api/questions')
    .get(questions.list)
    .post(questions.create);
  app.route('/api/filledsurveyques')
    .post(questions.filledcreate);
    

  // Single question routes
  app.route('/api/questions/:questionId')
    .get(questions.read)
    .put(questions.update)
    .delete(questions.delete);

  // Finish by binding the question middleware
  app.param('questionId', questions.questionByID);
 
};
