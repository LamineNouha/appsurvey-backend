'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Organization = require('mongoose').model('Organization');

module.exports = function () {
  // Use local strategy
  passport.use('organization-local', new LocalStrategy({
    usernameField: 'organizationName',
    passwordField: 'password'
  },
  function (organizationName, password, done) {
    var query = {organizationName: organizationName} ;
    if(organizationName.indexOf('@') !== -1){
      query = {email : organizationName.toLowerCase()}
    }
    Organization.findOne(query , function (err, organization) {
      if (err) {
        return done(err);
      }
      if (!organization || !organization.authenticate(password)) {
        return done(null, false, {
          message: 'Invalid login or password'
        });
      }
      if(organization.banned){
        return done(null, false, {
          message: 'This account is banned'
        });
      }
      return done(null, organization);
    });
  }));
};
