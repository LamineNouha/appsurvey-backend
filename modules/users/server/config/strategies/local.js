'use strict';

/**
 * Module dependencies.
 */

var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('mongoose').model('User');

module.exports = function () {
  // Use local strategy
  passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, function (username, password, done) {
    var query = { username: username.toLowerCase() };
    if (username.indexOf('@') !== -1) {
      query = { email: username.toLowerCase() };
    }
    User.findOne(query, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user || !user.authenticate(password)) {
        return done(null, false, {
          message: 'Invalid login or password'
        });
      }
      if (user.banned) {
        return done(null, false, {
          message: 'This account is banned'
        });
      }
      return done(null, user);
    });
  }));
};