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
  function _signup (req, res) {
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

        //user has authenticated correctly thus we create a JWT token
        var token = jwt.sign(user, config.secret.jwt);
        res.json({ user : user, token : token });
      }
    });
  }

  /**
  * Signin after passport authentication
  */
  function _signin(req, res, next) {
    passport.authenticate('user-local', function(err, user, info) {
      if (err) { return next(err) }
      if (!user) {
        return res.json(401, { error: 'message' });
      }

      //user has authenticated correctly thus we create a JWT token
      var token = jwt.sign(user, config.secret.jwt);
      res.json({ user : user, token : token });

    })(req, res, next);
  }

  /**
  * Signout
  */
  var _signout = function (req, res) {
    req.logout();
    res.redirect('/');
  }

  /**
  * OAuth provider call
  */
  function _oauthCall(strategy, scope) {
    return function (req, res, next) {
      if (req.query && req.query.redirect_to)
      req.session.redirect_to = req.query.redirect_to;

      // Authenticate
      passport.authenticate(strategy, scope)(req, res, next);
    };
  }

  /**
  * OAuth callback
  */
  function _oauthCallback(strategy) {
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
  }

  /**
  * Helper function to save or update a OAuth user profile
  */
  function _saveOAuthUserProfile(req, providerUserProfile, done) {
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

            user.email = providerUserProfile.email;

            // And save the user
            user.save(function (err) {
              return done(err, user, info);
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
  }

  /**
  * Remove OAuth provider
  */
  function _removeOAuthProvider(req, res, next) {
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
  }

function _signupFb(req, res, next) {

    var facebookId=req.query.facebookId;
    var facebookToken=req.query.facebookToken;
    var response={};
    if(!facebookId || !facebookToken){
      response.success=false;
      response.msg='missing parameters facebookId or facebookToken';
      return res.status(400).json(response);
    }


    FB.setAccessToken(facebookToken);

    FB.api('me', { fields: ['id', 'name','email', 'picture'] }, function (fbRes) {
      if(!fbRes || fbRes.error) {
        response.success=false;
        response.msg= !fbRes ? 'error occurred' : fbRes.error;
        return res.status(500).json(response);
      }else{

        var id=fbRes.id;
        var name=fbRes.name;
        var email=fbRes.email;
        var arrNames = name.toString().split(" ");
        var profileImageURL = fbRes.picture.url;

        var userProfile= {
          firstName: arrNames[0]  ? arrNames[0] :"",
          lastName: arrNames[1] ? arrNames[1] :"",
          email: typeof email != "undefined" ? email : id+'@vayetek.facebook.com',
          provider: 'facebook',
          roles: ['user'],
          password: facebookToken,
          profileImageURL: profileImageURL
        };

        if(id != facebookId){
          response.success=false;
          response.msg='wrong facebook id';
          return res.status(400).json(response);
        }
        User.findOne({email : userProfile.email}, function(err, user) {
          if(!user) {
            req.body = userProfile

            // do signup
            _signup(req, res)
          } else {
            //user has authenticated correctly thus we create a JWT token
            var token = jwt.sign(user, config.secret.jwt);
            res.json({ user : user, token : token });
          }
        })

      }
    });
  }

  function _signupGoogle(req, res, next) {

    if (config) {
      var plus = google.plus('v1');
      var OAuth2 = google.auth.OAuth2;
      var oauth2Client = new OAuth2(config.google.clientID, config.google.clientSecret, config.google.callbackURL);
    }

    var googleId=req.query.googleId;
    var googleToken=req.query.googleToken;

    var response={};
    if(!googleId || !googleToken){
      response.success=false;
      response.msg='missing parameters googleId or googleToken';
      return res.status(400).json(response);
    }

    var userInfos = jwt.decode(googleToken)
    var id=userInfos.sub
    var givenName=userInfos.given_name;
    var familyName=userInfos.family_name;
    var email=userInfos.email;
    var imageUrl=userInfos.picture;
    var userProfile= {
      firstName: givenName ? givenName :"",
      lastName: familyName ? familyName :"",
      email: typeof email != "undefined" ? email : id+'@vayetek.google.com',
      profileImageURL: imageUrl,
      provider: 'facebook',
      roles: ['user'],
      password: googleToken
    };

    if(id != googleId){
      response.success=false;
      response.msg='wrong facebook id';
      return res.status(400).json(response);
    }

    User.findOne({email : userProfile.email}, function(err, user) {
      if(!user) {
        req.body = userProfile

        // do signup
        _signup(req, res)
      } else {
        //user has authenticated correctly thus we create a JWT token
        var token = jwt.sign(user, config.secret.jwt);
        res.json({ user : user, token : token });
      }
    })

  }

var self = module.exports = {
  signup: _signup,
  signin: _signin,
  signout: _signout,
  oauthCall: _oauthCall,
  oauthCallback: _oauthCallback,
  saveOAuthUserProfile: _saveOAuthUserProfile,
  removeOAuthProvider: _removeOAuthProvider,
  signupFb: _signupFb,
  signupGoogle: _signupGoogle
};
