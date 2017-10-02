'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('mongoose').model('User'),
    Personal = require('mongoose').model('Personal');

module.exports = function () {
    // Use local strategy
    passport.use('user-local', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function (username, password, done) {
            var query = {email: username.toLowerCase()};
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




          // Use local strategy
    passport.use('personal-local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function (username, password, done) {
        var query = {email: username.toLowerCase()};
        Personal.findOne(query, function (err, personal) {
            if (err) {
                return done(err);

            }
            if (!personal || !personal.authenticate(password)) {
                return done(null, false, {
                    message: 'Invalid login or password'
                });
            }
            if (personal.banned) {
                return done(null, false, {
                    message: 'This account is banned'
                });
            }
            return done(null, personal);
        });
    }));
};

