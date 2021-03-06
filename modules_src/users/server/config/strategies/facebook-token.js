'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  FacebookTokenStrategy = require('passport-facebook-token'),
  users = require('../../controllers/users.server.controller');

module.exports = function (config) {

  passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    passReqToCallback: true ,
    fbGraphVersion : 'v2.7'
  },
  function (req, accessToken, refreshToken, profile, done) {

    // Set the provider data and include tokens
    var providerData = profile._json;
    providerData.accessToken = accessToken;
    providerData.refreshToken = refreshToken;
    // Create the user OAuth profile
    var providerUserProfile = {

      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      displayName: profile.displayName,
      verified : profile.verified || false ,
      email: profile.emails ? profile.emails[0].value : undefined,
      username: profile.username || generateUsername(profile),
      profileImageURL: (profile.id) ? 'https://graph.facebook.com/' + profile.id + '/picture?type=large' : undefined,
      provider: 'facebook',
      providerIdentifierField: 'id',
      providerData: providerData
    };

    // Save the user OAuth profile
    users.saveOAuthUserProfile(req, providerUserProfile, done);

    function generateUsername(profile) {
      var username = '';

      if (profile.emails) {
        username = profile.emails[0].value.split('@')[0];
      } else if (profile.name) {
        username = profile.name.givenName[0] + profile.name.familyName;
      }

      return username.toLowerCase() || undefined;
    }
  }));
};
