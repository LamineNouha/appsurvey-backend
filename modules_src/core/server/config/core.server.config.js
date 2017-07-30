'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
    User = require('mongoose').model('User'),
    path = require('path'),
    config = require(path.resolve('./config/config'));

/**
 * Module init function
 */
module.exports = function (app, db) {
    // Serialize sessions
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // Deserialize sessions
    passport.deserializeUser(function (id, done) {

        User.findOne({
            _id: id
        }, '-salt -password', function (err, user) {
            if (!err && user) {
                done(err, user);
                return
            }
        });
    });

    // Initialize strategies
    config.utils.getGlobbedPaths(path.join(__dirname, '../../../**/server/config/strategies/*.js')).forEach(function (strategy) {

        console.log(strategy);
        require(path.resolve(strategy))(config);
    });

    // Add passport's middleware
    app.use(passport.initialize());
    app.use(passport.session());
};
