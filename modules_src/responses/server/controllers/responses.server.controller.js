'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  multer = require('multer'),
  Response = mongoose.model('Response'),
  Question = mongoose.model('Question'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config')),
  AWS = require('aws-sdk'),
  _ = require('underscore'),
  fs = require('fs');

var whitelistedFields = ['choice'];

/**
 * Create an response
 */
exports.create = function (req, res) {
  if(req.user) {
    var response = new Response(req.body);
    Question.findOne({_id: req.body.question}).populate('responses').exec(function(err, question) {
      if(err || !question) {
        return res.status(422).send({
          message: "Question not found"
        });
      } else {
        response.question = mongoose.Types.ObjectId(req.body.question);

        response.save(function (err) {
          if (err) {
            return res.status(400).send({
              message: "Response exist"
            });
          } else {
            question.responses.push(response)
            question.save(function(err) {
              if(err) {
                return res.status(400).send({
                  message: "Cant save question"
                });
              } else {
                res.json(response);
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
 * Show the current response
 */
exports.read = function (req, res) {
  var responseId = req.params.responseId
  Response.findOne({_id: responseId}).sort('-created').populate('question').exec(function (err, response) {
    if (err) {
      return res.status(422).send({
        message: "Cannot find response"
      });
    } else {
      res.json(response);
    }
  });
};

/**
 * Update an response
 */
exports.update = function (req, res) {
  var response = req.response;

  if(response) {
    // Update whitelisted fields only
    response = _.extend(response, _.pick(req.body, whitelistedFields));

    response.updated = Date.now();

    response.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: "Cannot update response"
        });
      } else {
        res.json(response);
      }
    });

  } else {
    res.status(401).send({
      message: 'response not found'
    });
  }

};

/**
 * Delete an response
 */
exports.delete = function (req, res) {
  var response = req.response;

//we need to remove the response from the question belong
        Question.findOne({_id: response.question}).populate('responses').exec(function(err, question) {
      if(err || !question) {
        return res.status(422).send({
          message: "Question on whitch belong this response not found"
        });
      } else {
        //response.question = mongoose.Types.ObjectId(req.body.question);

       response.remove(function (err) {
      if (err) {
      return res.status(422).send({
        message: "Cannot delete response"
      });
          } else {
            question.responses.remove(response);
            question.save(function(err) {
              if(err) {
                return res.status(400).send({
                  message: "Cant save question on whitch belong this response"
                });
              } else {
                res.json(response);
              }
            })
          }
        });
      }
    })
};

/**
 * List of Response
 */
exports.list = function (req, res) {
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  var limit = req.query.limit ? parseInt(req.query.limit) : 15;
  Response.find().sort('-created').skip(skip).limit(limit).lean().populate('question').exec(function (err, responses) {
    if (err) {
      console.log(err)
      return res.status(422).send({
        message: "Cannot list responses"
      });
    } else {
   
        res.json(responses);
      
    }
  });
};



/**
 * Response middleware
 */
exports.responseByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Response is invalid'
    });
  }

  Response.findById(id).populate('question').exec(function (err, response) {
    if (err) {
      return next(err);
    } else if (!response) {
      return res.status(404).send({
        message: 'No response with that identifier has been found'
      });
    }
    req.response = response;
    next();
  });
};
