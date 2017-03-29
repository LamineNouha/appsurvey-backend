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
