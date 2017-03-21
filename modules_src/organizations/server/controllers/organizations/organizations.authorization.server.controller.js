'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  Organization = mongoose.model('Organization');

/**
 * verifies that the client is a user
 */
exports.isOrganization = function(req,res,next){
   if(req.organization && req.organization.roles.indexOf('organization') !== -1 ){
     next() ;
   }else{
     return res.status(403).send({
         message: 'this api is for organizations'
     });
   }
};
/**
 * User middleware
 */
exports.organizationByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Organization is invalid'
    });
  }

  Organization.findOne({
    _id: id
  }).exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!organization) {
      return next(new Error('Failed to load Organization ' + id));
    }

    req.profile = organization;
    next();
  });
};
