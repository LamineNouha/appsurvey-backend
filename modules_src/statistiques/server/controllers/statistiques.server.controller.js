import { start } from '../../../../config/lib/seed';

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
  Citizen = mongoose.model('Citizen'),
  Response = mongoose.model('Response'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config')),
  AWS = require('aws-sdk'),
  _ = require('underscore'),
  fs = require('fs');
  var Promise = require('promise');


/**
 * Show the current question
 */
exports.respPercentages = async function (req, res, next) {
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  var limit = req.query.limit ? parseInt(req.query.limit) : 15;
  var surveyId = req.params.surveyId;
  var male=0;
  var female=0;



 

var promise1 = new Promise(function resolve(stats) {



});
  
  console.log("idsurvey"+ surveyId);
   Survey.findOne({_id: surveyId}).populate('questions').sort('-created').exec( function (err, survey) {
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
        ).exec(  function (err, filledsurveys) {
        if (err) {
        
        } else {
          
          var stats = {
            total_answering_per: filledsurveys.length,
            questions : [],
            sex : []
          }
          
        

        //setting sex percent
     
        for( var t=0; t< filledsurveys.length; t++)
        {
         // femal/ mal percentages
         var f = new FilledSurvey();
         f = filledsurveys[t];
         console.log("citizenffff " + f.citizen);
          Citizen.findOne({_id: f.citizen}).sort('-created').exec(   function (err, citizen) {
           if (err || !citizen) {
             
           } else {
            
             console.log("citizen sex" + citizen.sex);
            if(citizen.sex ==="Male"){
             
              male = male + 1;
              console.log("nbr male " + male);
             
              
            }
            else {
              female = female + 1;
          
            }

           

            console.log(" mali " +male);
            console.log("male / female :"+male);
            stats.sex[0]=male;
            stats.sex[1]=female;


            console.log("stats " + JSON.stringify(stats));
          }
           
          
 

         
         });

        

        }


        /////setting quest percentages


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
        //res.send(JSON.stringify(stats))
       
        //return stats;

      
      }
   

     

      console.log("end1");

        
      setTimeout(function() {
        console.log("stats to  send " + JSON.stringify(stats));
       res.json(stats);
    }, 2000);
   
   
    
          
        }
      });

      
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
 * List of surveys organazied per date
 */
exports.dashboard = function (req, res) {
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
//var limit = req.query.limit ? parseInt(req.query.limit) : 15;
  var userId = req.params.userId;


  var Ariana= 0;
  var Beja=0;
  var Ben_Arous=0;
  var Bizerte= 0;
  var Gabes=0;
  var Gafsa=0;

  var Jendouba= 0;
  var Kairouan=0;
  var Kasserine=0;
  var Kebili= 0;
  var Kef=0;
  var Mahdia=0;

  var Manouba= 0;
  var Medenine=0;
  var Monastir=0;
  var Nabeul= 0;
  var Sfax=0;
  var Bouzid=0;

  
  var Siliana= 0;
  var Sousse=0;
  var Tataouine=0;
  var Tozeur= 0;
  var Tunis=0;
  var Zaghouan=0;


  FilledSurvey.find({user: userId}).sort('-created').skip(skip).lean().populate({
    path: 'questions',
    model:Question,
    populate: {
      path: 'responses',
    model:Response}}
    ).exec(function (err, filledsurveys) {
    if (err) {
      console.log(err)
      return res.status(422).send({
        message: "Cannot list surveys"
      });
    } else {

   var jsonObjetTosend =
   {tabDate: [],
    tabMonth: [],
    tabWeek: [],
   Ariana:0,
  Beja:0,
  Ben_Arous:0,
  Bizerte:0,
  Gabes:0,
  Gafsa:0,

   Jendouba:0,
   Kairouan:0,
   Kasserine:0,
  Kebili:0,
  Kef:0,
  Mahdia:0,

  Manouba:0,
  Medenine:0,
  Monastir:0,
  Nabeul:0,
  Sfax:0,
  Bouzid:0,

  
  Siliana:0,
  Sousse:0,
  Tataouine:0,
  Tozeur:0,
  Tunis:0,
  Zaghouan:0,
  };

  for( var t=0; t< filledsurveys.length; t++)
  {
   // femal/ mal percentages
   var f = new FilledSurvey();
   f = filledsurveys[t];
   console.log("citizenffff " + f.citizen);
    Citizen.findOne({_id: f.citizen}).sort('-created').exec(   function (err, citizen) {
     if (err || !citizen) {
       
     } else {
      
       console.log("citizen region : " + citizen.region);
      if(citizen.region ==="Ariana"){
       
        Ariana = Ariana + 1;
        
      }
      if(citizen.region ==="Béja"){
       
        Beja = Beja + 1;
        
      }
      if(citizen.region ==="Ben Arous"){
       
        Ben_Arous = Ben_Arous + 1;
        
      }
      if(citizen.region ==="Bizerte"){
       
        Bizerte = Bizerte + 1;
        
      }
      if(citizen.region ==="Gabès"){
       
        Gabes = Gabes + 1;
        
      }
      if(citizen.region ==="Gafsa"){
       
        Gafsa = Gafsa + 1;
        
      }
      if(citizen.region ==="Jendouba"){
       
        Jendouba = Jendouba + 1;
        
      }
      if(citizen.region ==="Kairouan"){
       
        Kairouan = Kairouan + 1;
        
      }
      if(citizen.region ==="Kasserine"){
       
        Kasserine = Kasserine + 1;
        
      }
      if(citizen.region ==="Kébili"){
       
        Kebili = Kebili + 1;
        
      }
      if(citizen.region ==="Le Kef"){
       
        Kef = Kef + 1;
        
      }
      if(citizen.region ==="Mahdia"){
       
        Mahdia = Mahdia + 1;
        
      }
      if(citizen.region ==="La Manouba"){
       
        Manouba = Manouba + 1;
        
      }
      if(citizen.region ==="Médenine"){
       
        Medenine = Medenine + 1;
        
      }
      if(citizen.region ==="Monastir"){
       
        Monastir = Monastir + 1;
        
      }
      if(citizen.region ==="Nabeul"){
       
        Nabeul = Nabeul + 1;
        
      }
      if(citizen.region ==="Sfax"){
       
        Sfax = Sfax + 1;
        
      }
      if(citizen.region ==="Sidi Bouzid"){
       
        Bouzid = Bouzid + 1;
        
      }
      if(citizen.region ==="Siliana"){
       
        Siliana = Siliana + 1;
        
      }
      if(citizen.region ==="Sousse"){
       
        Sousse = Sousse + 1;
        
      }
      if(citizen.region ==="Tataouine"){
       
        Tataouine = Tataouine + 1;
        
      }
      if(citizen.region ==="Tozeur"){
       
        Tozeur = Tozeur + 1;
        
      }
      if(citizen.region ==="Tunis"){
       
        Tunis = Tunis + 1;
        
      }
      if(citizen.region ==="Zaghouan"){
       
        Zaghouan = Zaghouan + 1;
        
      }
     
      
  jsonObjetTosend.Ariana = (Ariana/filledsurveys.length)*100;
  jsonObjetTosend.Beja = (Beja/filledsurveys.length)*100;
  jsonObjetTosend.Ben_Arous = (Ben_Arous/filledsurveys.length)*100;
  jsonObjetTosend.Bizerte = (Bizerte/filledsurveys.length)*100;
  jsonObjetTosend.Gabes = (Gabes/filledsurveys.length)*100;
  jsonObjetTosend.Gafsa = (Gafsa/filledsurveys.length)*100;
  jsonObjetTosend.Jendouba = (Jendouba/filledsurveys.length)*100;
  jsonObjetTosend.Kairouan = (Kairouan/filledsurveys.length)*100;

  jsonObjetTosend.Kasserine = (Kasserine/filledsurveys.length)*100;
  jsonObjetTosend.Kebili = (Kebili/filledsurveys.length)*100;
  jsonObjetTosend.Kef = (Kef/filledsurveys.length)*100;
  jsonObjetTosend.Mahdia = (Mahdia/filledsurveys.length)*100;
  jsonObjetTosend.Medenine = (Medenine/filledsurveys.length)*100;
  jsonObjetTosend.Monastir = (Monastir/filledsurveys.length)*100;
  jsonObjetTosend.Nabeul = (Nabeul/filledsurveys.length)*100;
  jsonObjetTosend.Sfax = (Sfax/filledsurveys.length)*100;

  jsonObjetTosend.Bouzid = (Bouzid/filledsurveys.length)*100;
  jsonObjetTosend.Siliana = (Siliana/filledsurveys.length)*100;
  jsonObjetTosend.Sousse = (Sousse/filledsurveys.length)*100;
  jsonObjetTosend.Tataouine = (Tataouine/filledsurveys.length)*100;
  jsonObjetTosend.Tozeur = (Tozeur/filledsurveys.length)*100;
  jsonObjetTosend.Tunis = (Tunis/filledsurveys.length)*100;
  jsonObjetTosend.Zaghouan = (Zaghouan/filledsurveys.length)*100;

     


    }
     
    

    console.log("ariana region : " + Ariana);
   
   });

  

  }
  
  


  



  /*var k=0; 
  var change = false;
  
    while(k<surveys.length && !change )
    {
      jsonObjetTosend.tabDate.push(surveys[i]);
      var title = surveys[i].title;
     


    }
  */

  setTimeout(function() {
    console.log("stats to  send " + JSON.stringify(jsonObjetTosend));
    res.json(jsonObjetTosend);
}, 2000);
       
      
    }
  });
};