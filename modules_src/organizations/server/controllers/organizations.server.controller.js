'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Extend organization's controller
 */
module.exports = _.extend(
  require('./organizations/organizations.authentication.server.controller'),
  require('./organizations/organizations.authorization.server.controller'),
  require('./organizations/organizations.password.server.controller'),
  require('./organizations/organizations.profile.server.controller')
);
