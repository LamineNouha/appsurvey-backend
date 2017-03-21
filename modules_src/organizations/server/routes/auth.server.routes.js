'use strict';

/**
 * Module dependencies
 */
var passport = require('passport');

module.exports = function (app) {
  // User Routes
  var organizations = require('../controllers/organizations.server.controller');
  // Setting up the organizations password api
  app.route('/api/organizations/auth/forgot').post(organizations.forgot);
  app.route('/api/organizations/auth/reset/:token').get(organizations.validateResetToken);
  app.route('/api/organizations/auth/reset/:token').post(organizations.reset);

  // Setting up the organizations authentication api
  app.route('/api/organizations/auth/signup').post(organizations.signup);
  app.route('/api/organizations/auth/signin').post(organizations.signin);
  app.route('/api/organizations/auth/signout').get(organizations.signout);
};
