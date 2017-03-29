'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization'),
  Event = mongoose.model('Event'),
  validator = require('validator');

var whitelistedFields = ['firstName', 'lastName', 'email', 'username'];

/**
 * Update user details
 */
exports.update = function (req, res) {
  // Init Variables
  var user = req.user;

  if (user) {
    // Update whitelisted fields only
    user = _.extend(user, _.pick(req.body, whitelistedFields));

    user.updated = Date.now();
    user.displayName = user.firstName + ' ' + user.lastName;

    user.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        req.login(user, function (err) {
          if (err) {
            res.status(400).send(err);
          } else {
            res.json(user);
          }
        });
      }
    });
  } else {
    res.status(401).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
  var user = req.user;
  var existingImageUrl;

  // Filtering to upload only images
  var multerConfig = config.uploads.profile.image;
  multerConfig.fileFilter = require(path.resolve('./config/lib/multer')).imageFileFilter;
  var upload = multer(multerConfig).single('newProfilePicture');

  if (user) {
    existingImageUrl = user.profileImageURL;
    uploadImage()
      .then(updateUser)
      .then(deleteOldImage)
      .then(login)
      .then(function () {
        res.json(user);
      })
      .catch(function (err) {
        res.status(422).send(err);
      });
  } else {
    res.status(401).send({
      message: 'User is not signed in'
    });
  }

  function uploadImage () {
    return new Promise(function (resolve, reject) {
      upload(req, res, function (uploadError) {
        if (uploadError) {
          reject(errorHandler.getErrorMessage(uploadError));
        } else {
          resolve();
        }
      });
    });
  }

  function updateUser () {
    return new Promise(function (resolve, reject) {
      user.profileImageURL = config.uploads.profile.image.dest + req.file.filename;
      user.save(function (err, theuser) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  function deleteOldImage () {
    return new Promise(function (resolve, reject) {
      if (existingImageUrl !== User.schema.path('profileImageURL').defaultValue) {
        fs.unlink(existingImageUrl, function (unlinkError) {
          if (unlinkError) {
            console.log(unlinkError);
            reject({
              message: 'Error occurred while deleting old profile picture'
            });
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  function login () {
    return new Promise(function (resolve, reject) {
      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          resolve();
        }
      });
    });
  }
};

/**
 * Send User
 */
exports.me = function (req, res) {
  User.findOne({_id: req.user._doc._id}).populate('events').populate('organizations').exec(function(err, user) {
    if(err) {
      res.status(400).send(err)
    } else {
      res.json(user)
    }
  })
};

/**
 * Follow organization
 */
exports.followOrganization = function(req, res) {
  var organizationId = req.body.organizationId
  User.findOne({_id: req.user._doc._id}).populate('organizations').exec(function(err, user) {
    if(err) {
      res.status(400).send(err)
    } else {
      if (user.organizations.filter(function(e) {return e._id == organizationId}).length <= 0) {
        Organization.findById(organizationId, function(err, organization) {
            if(err || !organization) {
              res.status(400).send('Organization not found');
            } else {
              user.organizations.push(organization.id)
              user.save(function(err) {
                if(err) {
                  res.status(400).send(err);
                } else {
                  res.json(user)
                }
              })
            }
        })
      } else {
        res.status(300).send({"message": "Already following this organization"});
      }
    }
  })
}

/**
 * Interest in event
 */
exports.interestEvent = function(req, res) {
  var eventId = req.body.eventId
  User.findOne({_id: req.user._doc._id}).populate('events').exec(function(err, user) {
    if(err) {
      res.status(400).send(err)
    } else {
      if (user.events.filter(function(e) {return e._id == eventId}).length <= 0) {
        Event.findById(eventId, function(err, event) {
            if(err || !event) {
              res.status(400).send('Event not found');
            } else {
              user.events.push(event.id)
              user.save(function(err) {
                if(err) {
                  res.status(400).send(err);
                } else {
                  console.log(event.nbInterested)
                  event.nbInterested += 1;
                  event.save(function(err) {
                    if(err) {
                      res.status(400).send(err);
                    } else {
                      res.json(user)
                    }
                  })
                }
              })
            }
        })
      } else {
        res.status(300).send({"message": "Already interrested in this event"});
      }
    }
  })
}
