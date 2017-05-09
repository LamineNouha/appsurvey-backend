'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  multer = require('multer'),
  Event = mongoose.model('Event'),
  Organization = mongoose.model('Organization'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config')),
  AWS = require('aws-sdk'),
  _ = require('underscore');

var whitelistedFields = ['title', 'description', 'address', 'lat', 'lon', 'capacity', 'startDate', 'endDate', 'nbInterested'];

/**
 * Create an event
 */
exports.create = function (req, res) {
  if(req.user) {
    var event = new Event(req.body);
    Organization.findOne({_id: req.user._doc._id}).populate('events').exec(function(err, organization) {
      if(err || !organization) {
        return res.status(422).send({
          message: "Organization not found"
        });
      } else {
        event.organization = mongoose.Types.ObjectId(req.user._doc._id);

        event.save(function (err) {
          if (err) {
            return res.status(400).send({
              message: "Event exist"
            });
          } else {
            organization.events.push(event)
            organization.save(function(err) {
              if(err) {
                return res.status(400).send({
                  message: "Cant save organization"
                });
              } else {
                res.json(event);
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
 * Show the current event
 */
exports.read = function (req, res) {
  var eventId = req.params.eventId
  Event.findOne({_id: eventId}).sort('-created').populate('organization').exec(function (err, events) {
    if (err) {
      return res.status(422).send({
        message: "Cannot find event"
      });
    } else {
      res.json(events);
    }
  });
};

/**
 * Update an event
 */
exports.update = function (req, res) {
  var event = req.event;

  if(event) {
    // Update whitelisted fields only
    event = _.extend(event, _.pick(req.body, whitelistedFields));

    event.updated = Date.now();

    event.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: "Cannot update event"
        });
      } else {
        res.json(event);
      }
    });

  } else {
    res.status(401).send({
      message: 'Event not found'
    });
  }

};

/**
 * Delete an event
 */
exports.delete = function (req, res) {
  var event = req.event;

  event.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: "Cannot delete event"
      });
    } else {
      res.json(event);
    }
  });
};

/**
 * List of Event
 */
exports.list = function (req, res) {
  var skip = req.query.skip ? parseInt(req.query.skip) : 0;
  var limit = req.query.limit ? parseInt(req.query.limit) : 15;
  Event.find().sort('-created').skip(skip).limit(limit).lean().populate('organization').exec(function (err, events) {
    if (err) {
      console.log(err)
      return res.status(422).send({
        message: "Cannot list events"
      });
    } else {
      if(req.user) {
        User.findOne({_id: req.user._doc._id}).populate('events').exec(function(err, user) {
          if(err || !user) {
            res.status(400).send(err)
          } else {
            events.forEach(function(part, index, array) {
              if (user.events.filter(function(e) {return e._id == events[index]._id.toString()}).length > 0) {
                events[index].isInterested = true
              } else {
                events[index].isInterested = false
              }
            })
            res.json(events);
          }
        })
      } else {
        res.json(events);
      }
    }
  });
};

/**
 * Update event picture
 */
exports.changeEventPicture = function (req, res) {
  var organization = req.user;
  if(organization) {
    var eventId = req.params.eventId;
    console.log(eventId)
    // Filtering to upload only images
    var multerConfig = config.uploads.eventUpload;
    console.log(multerConfig)
    multerConfig.fileFilter = require(path.resolve('./config/lib/multer')).imageFileFilter;
    var upload = multer(multerConfig).single('file');

    Event.findOne({_id : eventId}).populate('organization').exec(function(err, event) {
      if(err || !event) {
        res.status(400).send("Error")
      } else {
        if(event.organization._id.toString() == organization._doc._id) {
          console.log(event)
          uploadImage(event)
            .then(updateEvent)
            .then(null, deleteOldImage.bind(event.eventImageURL))
            .then(function () {
              res.json(event);
            })
            .catch(function (err) {
              res.status(422).send(err);
            });
        } else {
          res.status(400).send("You are not the orwner of the event")
        }
      }
    })


    function uploadImage (event) {
      return new Promise(function (resolve, reject) {
        upload(req, res, function (uploadError) {
          if (uploadError) {
            reject(errorHandler.getErrorMessage(uploadError));
          } else {
            resolve(event);
          }
        });
      });
    }

    function updateEvent (event) {
      return new Promise(function (resolve, reject) {
        fs.readFile(multerConfig.dest + req.file.filename, function(err, fileStream) {
          AWS.config.update({
              accessKeyId: "AKIAJ5RNU4IHID63UBXQ",
              secretAccessKey: "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",
              "region": "us-east-1"
          });
          var s3 = new AWS.S3({
              httpOptions: {
                timeout: 999999999
              }
            });
            s3.putObject({
              Bucket: "smartflora",
              Key: req.file.filename,
              Body: fileStream,
              ACL:'public-read'
            }, function (err, data) {
              if (err) {
                throw err;
              }
              console.log(data)
              event.eventImageURL = "https://s3.amazonaws.com/smartflora/" + req.file.filename;
              event.save(function (err, theevent) {
                if (err) {
                  reject(err);
                } else {
                  resolve(theevent);
                }
              });
            });
        })
      });
    }

    function deleteOldImage (theevent, existingImageUrl) {
      return new Promise(function (resolve, reject) {
        fs.unlink(existingImageUrl, function (unlinkError) {
          if (unlinkError) {
            console.log(unlinkError);
            reject({
              message: 'Error occurred while deleting old profile picture'
            });
          } else {
            resolve(theevent);
          }
        });
      });
    }
  } else {
    res.status(400).send("You need to be authenticated")
  }
};

/**
 * Event middleware
 */
exports.eventByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Event is invalid'
    });
  }

  Event.findById(id).populate('organization').exec(function (err, event) {
    if (err) {
      return next(err);
    } else if (!event) {
      return res.status(404).send({
        message: 'No event with that identifier has been found'
      });
    }
    req.event = event;
    next();
  });
};
