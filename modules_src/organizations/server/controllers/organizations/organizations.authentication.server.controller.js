'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  passport = require('passport'),
  Organization = mongoose.model('Organization'),
  jwt = require('jsonwebtoken'),
  config = require('../../../../../config/config');

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin',
  '/authentication/signup'
];

/**
 * Signup
 */
exports.signup = function (req, res) {
  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  // Init organization and add missing fields
  var organization = new Organization(req.body);
  organization.provider = 'local';
  // change roles
  organization.roles = ['organization']

  // Then save the organization
  organization.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // Remove sensitive data before login
      organization.password = undefined;
      organization.salt = undefined;

      //organization has authenticated correctly thus we create a JWT token
      var token = jwt.sign(organization, config.secret.jwt);
      res.json({ user : organization, token : token });
    }
  });
};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('organization-local', function(err, organization, info) {
   if (err) { return next(err) }
   if (!organization) {
     return res.json(401, { error: 'message' });
   }

   //user has authenticated correctly thus we create a JWT token
   var token = jwt.sign(organization, config.secret.jwt);
   res.json({ organization : organization, token : token });

 })(req, res, next);
};

/**
 * Signout
 */
exports.signout = function (req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
  var organization = req.organization;
  var provider = req.query.provider;

  if (!organization) {
    return res.status(401).json({
      message: 'Organization is not authenticated'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete organization.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    organization.markModified('additionalProvidersData');
  }

  organization.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(organization, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });
};
