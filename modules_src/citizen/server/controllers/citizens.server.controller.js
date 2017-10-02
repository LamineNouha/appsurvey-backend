'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  multer = require('multer'),
  Citizen = mongoose.model('Citizen'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config')),
  AWS = require('aws-sdk'),
  _ = require('underscore'),
  fs = require('fs');

var whitelistedFields = ['content'];

/**
 * Create an citizen
 */
exports.create = function (req, res) {
  //if(req.personal) {
    var citizen = new Citizen(req.body);
   
    citizen.save(function (err) {
          if (err) {
            return res.status(400).send({
              message: "Citizen exist"
            });
          //} 
  }else{
    res.json(citizen);
  }
  })/*else {
  return res.status(403).send({
    message: "You need to authenticated"
  });*/
};


exports.citizenByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Citizen is invalid'
    });
  }

  Citizen.findById(id).exec(function (err, citizen) {
    if (err) {
      return next(err);
    } else if (!citizen) {
      return res.status(404).send({
        message: 'No citizen with that identifier has been found'
      });
    }
    req.citizen = citizen;
    next();
  });
};
