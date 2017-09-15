'use strict';

/**
 * Module dependencies
 */
var passport = require('passport');

module.exports = function (app) {
  // User Routes
  var users = require('../controllers/users.server.controller');
  // Setting up the users password api
  app.route('/api/users/auth/forgot').post(users.forgot);
  app.route('/api/users/auth/reset/:token').get(users.validateResetToken);
  app.route('/api/users/auth/reset/:token').post(users.reset);

  // Setting up the users authentication api
  app.route('/api/users/auth/signup').post(users.signup);
  app.route('/api/users/auth/signin').post(users.signin);
  app.route('/api/users/auth/signout').get(users.signout);



  
  app.route('/api/users/auth/signupPer').post(users.signupPer);
  app.route('/api/users/auth/signinPer').post(users.signinPer);
  app.route('/api/users/auth/signoutPer').get(users.signoutPer);

  // Setting the facebook oauth routes
  app.route('/api/users/auth/facebook').get(users.signupFb);

  // Setting the google oauth routes
  app.route('/api/users/auth/google').get(users.signupGoogle);

};
