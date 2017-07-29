'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  multer = require('multer'),
  Question = mongoose.model('Question'),
  Survey = mongoose.model('Survey'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config')),
  AWS = require('aws-sdk'),
  _ = require('underscore'),
  fs = require('fs');

var whitelistedFields = ['content'];

/**
 * Create an question
 */
exports.create = function (req, res) {
  if(req.user) {
    var question = new Question(req.body);
    Survey.findOne({_id: req.user._doc._id}).populate('questions').exec(function(err, survey) {
      if(err || !survey) {
        return res.status(422).send({
          message: "Survey not found"
        });
      } else {
        question.survey = mongoose.Types.ObjectId(req.user._doc._id);

        question.save(function (err) {
          if (err) {
            return res.status(400).send({
              message: "Question exist"
            });
          } else {
            survey.questions.push(question)
            survey.save(function(err) {
              if(err) {
                return res.status(400).send({
                  message: "Cant save survey"
                });
              } else {
                res.json(question);
              }
            })
          }
        });
      }
    })

  } else {
    return res.status(403).send({
      message: "You need to authenticated"
    });
  }
};

/**
 * Show the current question
 */
exports.read = function (req, res) {
  var questionId = req.params.questionId
  Question.findOne({_id: questionId}).sort('-created').populate('survey').exec(function (err, questions) {
    if (err) {
      return res.status(422).send({
        message: "Cannot find question"
      });
    } else {
      res.json(questions);
    }
  });
};

/**
 * Update an question
 */
exports.update = function (req, res) {
  var question = req.question;

  if(question) {
    // Update whitelisted fields only
    question = _.extend(question, _.pick(req.body, whitelistedFields));

    question.updated = Date.now();

    question.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: "Cannot update question"
        });
      } else {
        res.json(question);
      }
    });

  } else {
    res.status(401).send({
      message: 'question not found'
    });
  }

};

/**
 * Delete an question
 */
exports.delete = function (req, res) {
  var question = req.question;

  question.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: "Cannot delete question"
      });
    } else {
      res.json(question);
    }
  });
};

/**
 * List of Question
 */
exports.list = function (req, res) {
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  var limit = req.query.limit ? parseInt(req.query.limit) : 15;
  Question.find().sort('-created').skip(skip).limit(limit).lean().populate('survey').exec(function (err, questions) {
    if (err) {
      console.log(err)
      return res.status(422).send({
        message: "Cannot list questions"
      });
    } else {
   
        res.json(questions);
      
    }
  });
};



/**
 * Question middleware
 */
exports.questionByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Question is invalid'
    });
  }

  Question.findById(id).populate('survey').exec(function (err, question) {
    if (err) {
      return next(err);
    } else if (!question) {
      return res.status(404).send({
        message: 'No question with that identifier has been found'
      });
    }
    req.question = question;
    next();
  });
};
