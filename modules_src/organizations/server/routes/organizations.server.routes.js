'use strict';

module.exports = function (app) {
  // Organizations Routes
  var organization = require('../controllers/organizations.server.controller');

  // Setting up the users profile api
  app.route('/api/organizations/me').get(organization.me);
  app.route('/api/organizations/').get(organization.list);
  app.route('/api/organizations/').put(organization.update);
  app.route('/api/organizations/:organizationId').get(organization.read);
  app.route('/api/organizations/accounts').delete(organization.removeOAuthProvider);
  app.route('/api/organizations/password').post(organization.changePassword);
  app.route('/api/organizations/picture').post(organization.changeProfilePicture);
};
