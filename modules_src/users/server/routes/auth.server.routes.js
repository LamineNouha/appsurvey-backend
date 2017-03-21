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

  // Setting the facebook oauth routes
  app.route('/api/users/auth/facebook').get(users.oauthCall('facebook', {
    scope: ['email']
  }));
  app.route('/api/users/auth/facebook/callback').get(users.oauthCallback('facebook'));

  // Setting the twitter oauth routes
  app.route('/api/users/auth/twitter').get(users.oauthCall('twitter'));
  app.route('/api/users/auth/twitter/callback').get(users.oauthCallback('twitter'));

  // Setting the google oauth routes
  app.route('/api/users/auth/google').get(users.oauthCall('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }));
  app.route('/api/users/auth/google/callback').get(users.oauthCallback('google'));

  // Setting the linkedin oauth routes
  app.route('/api/users/auth/linkedin').get(users.oauthCall('linkedin', {
    scope: [
      'r_basicprofile',
      'r_emailaddress'
    ]
  }));
  app.route('/api/users/auth/linkedin/callback').get(users.oauthCallback('linkedin'));

  // Setting the github oauth routes
  app.route('/api/users/auth/github').get(users.oauthCall('github'));
  app.route('/api/users/auth/github/callback').get(users.oauthCallback('github'));

  // Setting the paypal oauth routes
  app.route('/api/users/auth/paypal').get(users.oauthCall('paypal'));
  app.route('/api/users/auth/paypal/callback').get(users.oauthCallback('paypal'));
};
