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
  FilledSurvey = mongoose.model('FilledSurvey'),
  Response = mongoose.model('Response'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config')),
  AWS = require('aws-sdk'),
  _ = require('underscore'),
  fs = require('fs');


/**
 * Show the current question
 */
exports.respPercentages = function (req, res) {
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  var limit = req.query.limit ? parseInt(req.query.limit) : 15;
  var surveyId = req.params.surveyId
  console.log("idsurvey"+ surveyId);
  Survey.findOne({_id: surveyId}).populate('questions').sort('-created').exec(function (err, survey) {
    if (err || !survey) {
       /*res.status(422).send({
        message: "Cannot find survey"
      });*/
    } else {
      FilledSurvey.find({originalSurveyId: surveyId}).sort('-created').skip(skip).limit(limit).lean().populate({
        path: 'questions',
        model:Question,
        populate: {
          path: 'responses',
        model:Response}}
        ).exec(function (err, filledsurveys) {
        if (err) {
         /* console.log(err)
           res.status(422).send({
            message: "Cannot list filledsurveys"
          });*/
        } else {
          console.log("nombre de repondants: "+ filledsurveys.length)

          var stats = {
            total_answering_per: filledsurveys.length,
            questions : []
          }

          for( var i=0; i< survey.questions.length; i++)
          {
var percentages = [];
            for( var j=0; j< survey.questions[i].responses.length; j++)
            {
                var count = 0;
              for( var d=0; d< filledsurveys.length; d++)
              { //console.log("filled survey /"+d+" : "+JSON.stringify(filledsurveys[d]));
                if(filledsurveys[d].questions[i].responses[j].checked)
                count = count+1;



              }
              var per = (count/ stats.total_answering_per) *100;
              console.log("perc resp "+j +" "+per+"%");
              percentages.push(per);
            }
            stats.questions.push(percentages);
          }

          
          
       console.log("stats object to return: "+JSON.stringify(stats));
            res.json(stats);
          
        }
      });

      //res.json(survey);
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