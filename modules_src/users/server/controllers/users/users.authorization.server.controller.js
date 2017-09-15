'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Personal = mongoose.model('Personal');

/**
 * verifies that the client is a user
 */
exports.isUser = function(req,res,next){
   if(req.user && req.user.roles.indexOf('user') !== -1 ){
     next() ;
   }else{
     return res.status(403).send({
         message: 'this api is for users'
     });
   }
};
/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findOne({
    _id: id
  }).exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load User ' + id));
    }

    req.profile = user;
    next();
  });
};

exports.personalByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Personal is invalid'
    });
  }

  Personal.findOne({
    _id: id
  }).exec(function (err, personal) {
    if (err) {
      return next(err);
    } else if (!personal) {
      return next(new Error('Failed to load Personal ' + id));
    }

    req.profile = personal;
    next();
  });
};
