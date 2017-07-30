'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  multer = require('multer'),
 Survey = mongoose.model('Survey'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config'));

var whitelistedFields = ['title'];

/**
 * Create an survey
 */
exports.create = function (req, res) {
  
    var survey = new Survey(req.body);
    Survey.create(survey, function(err, survey) {
      if(err || !survey) {
        res.status(400).send({
          message: "Bad request"
        })
      } else {
        res.json(survey);
      }
    });
  
};

/**
 * Show a survey
 */
exports.read = function (req, res) {
  var surveyId = req.params.surveyId
  Survey.findOne({_id: surveyId}).populate('questions').sort('-created').exec(function (err, survey) {
    if (err || !survey) {
      return res.status(422).send({
        message: "Cannot find survey"
      });
    } else {
      res.json(survey);
    }
  });
};

/**
 * Update an survey
 */
exports.update = function (req, res) {
  var survey = req.survey;

  if(survey) {
    // Update whitelisted fields only
    survey = _.extend(survey, _.pick(req.body, whitelistedFields));

    survey.updated = Date.now();

    survey.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: "Cannot update survey"
        });
      } else {
        res.json(survey);
      }
    });

  } else {
    res.status(401).send({
      message: 'Survey not found'
    });
  }

};

/**
 * Delete an survey
 */
exports.delete = function (req, res) {
  var survey = req.survey;

  survey.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: "Cannot delete survey"
      });
    } else {
      res.json(survey);
    }
  });
};

/**
 * List of surveys
 */
exports.list = function (req, res) {
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  var limit = req.query.limit ? parseInt(req.query.limit) : 15;
  Survey.find().sort('-created').skip(skip).limit(limit).lean().populate('questions').exec(function (err, surveys) {
    if (err) {
      console.log(err)
      return res.status(422).send({
        message: "Cannot list surveys"
      });
    } else {
   
        res.json(surveys);
      
    }
  });
};

/**
 * Survey middleware
 */
exports.surveyByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Survey is invalid'
    });
  }

  Survey.findById(id).exec(function (err, survey) {
    if (err) {
      return next(err);
    } else if (!survey) {
      return res.status(404).send({
        message: 'No Survey with that identifier has been found'
      });
    }
    req.survey = survey;
    next();
  });
};
