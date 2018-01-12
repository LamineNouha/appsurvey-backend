'use strict';

/**
 * Module dependencies
 */

 
  var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  multer = require('multer'),
  FilledSurvey = mongoose.model('FilledSurvey'),
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

 /*
exports.create = function (req, res) {
  if(req.user) {
    var filledsurvey = new FilledSurvey(req.body);
    FilledSurvey.create(filledsurvey, function(err, filledsurvey) {
      if(err || !filledsurvey) {
        res.status(400).send({
          message: "Bad request"
        })
      } else {
        res.json(filledsurvey);
      }
    });
   } else {
    return res.status(403).send({
      message: "You need to authenticated"
    });
  }
};

*/


/**
 * Create an survey
 */
exports.create = function (req, res) {
  console.log("body res "+JSON.stringify(req.body));
    var survey = new FilledSurvey({title: req.body.nameValuePairs.title,user:  req.body.nameValuePairs.user, citizen:  req.body.nameValuePairs.citizen, originalSurveyId:req.body.nameValuePairs.originalSurveyId, personal:  req.body.nameValuePairs.personal });
        survey.created = Date.now();
     //treating questions
        var questions =  req.body.nameValuePairs.questions.values;
        for(var i in questions)
        {console.log("question "+i);
          var question = questions[i];
          //console.log("question "+i+JSON.stringify(question));
          var quest = new Question({content: question.nameValuePairs.content, survey: survey._id});
          survey.questions.push(quest)
         
          //treating questions
           var responses = question.nameValuePairs.responses.values;
           for(var j in responses)
           {console.log("response "+j);
           var response = responses[j];
           var resp = new Response({choice: response.nameValuePairs.choice, question: quest._id, checked: response.nameValuePairs.checked});
           quest.responses.push(resp)

           resp.save(function (err) {
          });
     
          }

          quest.save(function (err) {
          });

        }

        survey.save(function (err) {
        });
        return res.json(survey);
   
  
};



/**
 * Survey middleware
 */
exports.filledsurveyByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Survey is invalid'
    });
  }

  FilledSurvey.findById(id).exec(function (err, filledsurvey) {
    if (err) {
      return next(err);
    } else if (!filledsurvey) {
      return res.status(404).send({
        message: 'No Survey with that identifier has been found'
      });
    }
    req.filledsurvey = filledsurvey;
    next();
  });
};