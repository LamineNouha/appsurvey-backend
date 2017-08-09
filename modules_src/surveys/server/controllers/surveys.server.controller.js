'use strict';

/**
 * Module dependencies
 */

 
  var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  multer = require('multer'),
  Survey = mongoose.model('Survey'),
  Question = mongoose.model('Question'),
  Response = mongoose.model('Response'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config')),
  AWS = require('aws-sdk'),
  _ = require('underscore'),
  fs = require('fs');

var whitelistedFields = ['title'];

/**
 * Create an survey
 */
exports.create = function (req, res) {
  if(req.user) {
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
   } else {
    return res.status(403).send({
      message: "You need to authenticated"
    });
  }
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
    console.log("hellllo");
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
      message: 'survey not found'
    });
  }

};

/**
 * Delete an survey
 */
exports.delete = function (req, res) {
  var survey = req.survey;
//first we delete for each survey question his responses & then delete survey questions
    Question.find({survey : survey._id} ).exec(function(err, questions){
        if(err || !questions) {
        return res.status(422).send({
          message: "can't remove questions related to this survey"
        });
      }else{

questions.forEach(function(element) {
   //------------------------
     Response.find({question : element._id} ).exec(function(err, responses){
        if(err || !responses) {
        return res.status(422).send({
          message: "can't remove responses related to one question of this survey"
        });
      }else{

responses.forEach(function(element1) {
  element1.remove();
}, this);
  
      }
     });
    //------------------------
  element.remove();
}, this);
  
      }
     });



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

/**
 * add question to survey
 */
exports.addQuestion = function (req, res) {
  var surveyId = req.params.surveyId;
  var questionId = req.params.questionId;
  
  if (!mongoose.Types.ObjectId.isValid(surveyId)) {
    return res.status(400).send({
      message: 'Survey is invalid'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).send({
      message: 'Question is invalid'
    });
  }

  Survey.findOne({_id : surveyId} ).exec(function(err, survey){
        if(err || !survey) {
        return res.status(422).send({
          message: "can't find survey"
        });
      }else{
  survey.questions.push(questionId);
      }
    })
};
