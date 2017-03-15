'use strict';

/**
 * Module dependencies.
 */

var passport = require('passport'),
    GoogleTokenStrategy = require('passport-google-id-token'),
    users = require('../../controllers/users.server.controller');

module.exports = function (config) {
  // Use google strategy
  passport.use(new GoogleTokenStrategy({
    clientID: config.google.clientID,
    passReqToCallback: true
    // passReqToCallback: true
  }, function (req, parsedToken, googleId, done) {

    // Set the provider data and include tokens
    var providerData = parsedToken.payload;
    providerData.id = googleId;

    // Create the user OAuth profile
    var providerUserProfile = {
      firstName: providerData.given_name,
      lastName: providerData.family_name,
      verified: providerData.email_verified,
      displayName: undefined,
      email: providerData.email,
      username: undefined,
      profileImageURL: providerData.picture ? providerData.picture : undefined,
      provider: 'google',
      providerIdentifierField: 'id',
      providerData: providerData
    };

    // Save the user OAuth profile
    users.saveOAuthUserProfile(req, providerUserProfile, done);
  }));
};