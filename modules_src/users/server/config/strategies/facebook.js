'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,
  users = require('../../controllers/users.server.controller'),
  FB = require('fb');

module.exports = function (config) {

  FB.options({
        appId:          config.facebook.facebook,
        appSecret:      config.facebook.clientSecret
      });

};
