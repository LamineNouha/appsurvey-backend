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
  var https = require('https');
  import * as authorization from 'auth-header';
  var querystring = require('querystring');

var whitelistedFields = ['title'];




/**
 * Create an survey
 */
exports.create = function (req, res) {
  if(req.user) {
    
//var auth = authorization.parse(req.get('authorization'));
console.log("userID "+req.user._doc._id);
    var survey = new Survey({title: req.body.title,user: req.user._doc._id});
 
     //treating questions
        var questions = req.body.questions;
        for(var i in questions)
        {console.log("question "+i);
          var question = questions[i];
          //console.log("question "+i+JSON.stringify(question));
          var quest = new Question({content: question.content, survey: survey._id});
          survey.questions.push(quest)
         
          //treating questions
           var responses = question.responses;
           for(var j in responses)
           {console.log("response "+j);
           var response = responses[j];
           var resp = new Response({choice: response.choice, question: quest._id, checked: false});
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
   
   } else {
    return res.status(403).send({
      message: "You need to authenticated"
    });
  }
};

/**
 * Edit an survey
 */
/*
exports.edit = function (req, res) {
  if(req.user) {

    var surveyId = req.params.surveyId;
    //delete section
    //first we delete for each survey question his responses & then delete survey questions
    Question.find({survey : surveyId} ).exec(function(err, questions){

questions.forEach(function(element) {
 //------------------------
   Response.find({question : element._id} ).exec(function(err, responses){
    

responses.forEach(function(element1) {
element1.remove();
}, this);


   });
  //------------------------
element.remove();
}, this);

  
   });



survey.remove(function (err) {
});

//delete section

  
//var auth = authorization.parse(req.get('authorization'));
console.log("userID "+req.user._doc._id);
    var survey = new Survey({title: req.body.title,user: req.user._doc._id});
 
     //treating questions
        var questions = req.body.questions;
        for(var i in questions)
        {console.log("question "+i);
          var question = questions[i];
          //console.log("question "+i+JSON.stringify(question));
          var quest = new Question({content: question.content, survey: survey._id});
          survey.questions.push(quest)
         
          //treating questions
           var responses = question.responses;
           for(var j in responses)
           {console.log("response "+j);
           var response = responses[j];
           var resp = new Response({choice: response.choice, question: quest._id, checked: false});
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
   
   } else {
    return res.status(403).send({
      message: "You need to authenticated"
    });
  }
};
*/


/**
 * Show a survey
 */
exports.read = function (req, res) {
  var surveyId = req.params.surveyId;
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
  var userId = req.params.userId;
  Survey.find({user: userId}).sort('-created').skip(skip).limit(limit).lean().populate({
    path: 'questions',
    model:Question,
    populate: {
      path: 'responses',
    model:Response}}
    ).exec(function (err, surveys) {
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