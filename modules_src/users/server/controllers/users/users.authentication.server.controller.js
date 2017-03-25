'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  passport = require('passport'),
  User = mongoose.model('User'),
  jwt = require('jsonwebtoken'),
  config = require('../../../../../config/config'),
  FB = require('fb'),
  google = require('googleapis');

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

  // Init user and add missing fields
  var user = new User(req.body);
  user.provider = 'local';
  // change roles
  user.roles = ['user']
  user.displayName = user.firstName + ' ' + user.lastName;

  // Then save the user
  user.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  });
};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('user-local', function(err, user, info) {
   if (err) { return next(err) }
   if (!user) {
     return res.json(401, { error: 'message' });
   }

   //user has authenticated correctly thus we create a JWT token
   var token = jwt.sign(user, config.secret.jwt);
   res.json({ user : user, token : token });

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
 * OAuth provider call
 */
exports.oauthCall = function (strategy, scope) {
  return function (req, res, next) {
    if (req.query && req.query.redirect_to)
      req.session.redirect_to = req.query.redirect_to;

    // Authenticate
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {

    // info.redirect_to contains inteded redirect path
    passport.authenticate(strategy, function (err, user, info) {
      if (err) {
        return res.redirect('/authentication/signin?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }

        return res.redirect(info.redirect_to || '/');
      });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  // Setup info object
  var info = {};

  // Set redirection path on session.
  // Do not redirect to a signin or signup page
  if (noReturnUrls.indexOf(req.session.redirect_to) === -1)
    info.redirect_to = req.session.redirect_to;

  if (!req.user) {
    // Define a search query fields
    var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
    var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

    // Define main provider search query
    var mainProviderSearchQuery = {};
    mainProviderSearchQuery.provider = providerUserProfile.provider;
    mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define additional provider search query
    var additionalProviderSearchQuery = {};
    additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define a search query to find existing user with current provider profile
    var searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
    };

    User.findOne(searchQuery, function (err, user) {
      if (err) {
        return done(err);
      } else {
        if (!user) {
          var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

          User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
            user = new User({
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              username: availableUsername,
              displayName: providerUserProfile.displayName,
              profileImageURL: providerUserProfile.profileImageURL,
              provider: providerUserProfile.provider,
              providerData: providerUserProfile.providerData
            });

            // Email intentionally added later to allow defaults (sparse settings) to be applid.
            // Handles case where no email is supplied.
            // See comment: https://github.com/meanjs/mean/pull/1495#issuecomment-246090193
            user.email = providerUserProfile.email;

            // And save the user
            user.save(function (err) {
              return done(err, user, info);
            });
          });
        } else {
          return done(err, user, info);
        }
      }
    });
  } else {
    // User is already logged in, join the provider data to the existing user
    var user = req.user;

    // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
    if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
      // Add the provider data to the additional provider data field
      if (!user.additionalProvidersData) {
        user.additionalProvidersData = {};
      }

      user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

      // Then tell mongoose that we've updated the additionalProvidersData field
      user.markModified('additionalProvidersData');

      // And save the user
      user.save(function (err) {
        return done(err, user, info);
      });
    } else {
      return done(new Error('User is already connected using this provider'), user);
    }
  }
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
  var user = req.user;
  var provider = req.query.provider;

  if (!user) {
    return res.status(401).json({
      message: 'User is not authenticated'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  user.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });
};

exports.signupFb = function(req, res, next) {

    var facebookId=req.query.facebookId;
    var facebookToken=req.query.facebookToken;
    var response={};
    if(!facebookId || !facebookToken){
      response.success=false;
      response.msg='missing parameters facebookId or facebookToken';
      return res.status(400).json(response);
    }


    FB.setAccessToken(facebookToken);

    FB.api('me', { fields: ['id', 'name','email'] }, function (fbRes) {
      if(!fbRes || fbRes.error) {
        response.success=false;
        response.msg= !fbRes ? 'error occurred' : fbRes.error;
        return res.status(500).json(response);
      }else{

        var id=fbRes.id;
        var name=fbRes.name;
        var email=fbRes.email;
        var arrNames = name.toString().split(" ");

        var userProfile= {
          firstName: arrNames[0]  ? arrNames[0] :"",
          lastName: arrNames[1] ? arrNames[1] :"",
          username: typeof email != "undefined" ? email : id+'@vayetek.facebook.com',
          displayName: typeof email != "undefined" ? email : id+'@vayetek.facebook.com',
          provider: 'facebook',
          roles: ['user']
        };

        if(id != facebookId){
          response.success=false;
          response.msg='wrong facebook id';
          return res.status(400).json(response);
        }
        req.body = userProfile

        // do signup
        singup(req, res)

      }
    });
}

exports.signupGoogle = function(req, res, next) {

  if (config) {
    var plus = google.plus('v1');
    var OAuth2 = google.auth.OAuth2;
    var oauth2Client = new OAuth2(config.google.appId, config.google.appSecret, config.google.redirectUri);
  }

  var googleId=req.query.googleId;
    var googleToken=req.query.googleToken;

    var response={};
    if(!googleId || !googleToken){
      response.success=false;
      response.msg='missing parameters googleId or googleToken';
      return res.status(400).json(response);
    }

    oauth2Client.setCredentials({
      access_token: googleToken
    });

    plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, responseG) {
        // handle err and response
        if(err){
          response.success=false;
          response.msg=err;
          return res.status(500).json(response);
        }else{
          var id=responseG.id;
          var name=responseG.name;
          var email=responseG.hasOwnProperty('emails') ? responseG.emails[0].value :'undefined';
          var imageUrl=responseG.image.url.replace("sz=50", "sz=700");

          var userProfile= {
            firstName: name.givenName ? name.givenName :"",
            lastName: name.familyName ? name.familyName :"",
            username: typeof email != "undefined" ? email : id+'@vayetek.google.com',
            displayName: typeof email != "undefined" ? email : id+'@vayetek.facebook.com',
            profileImageURL: imageUrl,
            provider: 'facebook',
            roles: ['user']
          };

          if(id != googleId){
            response.success=false;
            response.msg='wrong facebook id';
            return res.status(400).json(response);
          }
          req.body = userProfile

          // do signup
          singup(req, res)

        }
    });
}
