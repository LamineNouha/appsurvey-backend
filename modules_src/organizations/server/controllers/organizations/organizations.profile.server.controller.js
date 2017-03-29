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
  validator = require('validator');

var whitelistedFields = ['organizationName', 'email', 'address', 'phone', 'description', 'fax'];

/**
 * Update organization details
 */
exports.update = function (req, res) {
  // Init Variables
  var organization = req.organization;

  if (organization) {
    // Update whitelisted fields only
    organization = _.extend(organization, _.pick(req.body, whitelistedFields));

    organization.updated = Date.now();

    organization.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        req.login(organization, function (err) {
          if (err) {
            res.status(400).send(err);
          } else {
            res.json(organization);
          }
        });
      }
    });
  } else {
    res.status(401).send({
      message: 'Organization is not signed in'
    });
  }
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
  var organization = req.organization;
  var existingImageUrl;

  // Filtering to upload only images
  var multerConfig = config.uploads.profile.image;
  multerConfig.fileFilter = require(path.resolve('./config/lib/multer')).imageFileFilter;
  var upload = multer(multerConfig).single('newProfilePicture');

  if (organization) {
    existingImageUrl = organization.profileImageURL;
    uploadImage()
      .then(updateUser)
      .then(deleteOldImage)
      .then(login)
      .then(function () {
        res.json(organization);
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

  function updateOrganisation () {
    return new Promise(function (resolve, reject) {
      organization.profileImageURL = config.uploads.profile.image.dest + req.file.filename;
      organization.save(function (err, theorganization) {
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
      if (existingImageUrl !== Organization.schema.path('profileImageURL').defaultValue) {
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
      req.login(organization, function (err) {
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
  Organization.findOne({_id: req.user._doc._id}).populate('events').exec(function(err, organization) {
    if(err || !organization) {
      res.status(400).send(err)
    } else {
      res.json(organization)
    }
  })
};

/**
 * Show organization infos
 */
exports.read = function (req, res) {
  var organizationId = req.params.organizationId
  Organization.findOne({_id: organizationId}).sort('-created').populate('events').exec(function (err, organization) {
    if (err || !organization) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(organization);
    }
  });
};

/**
* List of Organization
*/
exports.list = function (req, res) {
 Organization.find().sort('-created').populate('events').lean().exec(function (err, organizations) {
   if (err) {
     return res.status(422).send({
       message: errorHandler.getErrorMessage(err)
     });
   } else {
     if(req.user) {
       User.findOne({_id: req.user._doc._id}).populate('organizations').exec(function(err, user) {
         if(err || !user) {
           res.status(400).send(err)
         } else {
           organizations.forEach(function(part, index, array) {
             if (user.organizations.some(function(e) { return e._id == organizations[index]._id.toString() })) {
               organizations[index].isFollowing = true
             } else {
               organizations[index].isFollowing = false
             }
           })
           res.json(organizations);
         }
       })
     } else {
       res.json(organizations);
     }
   }
 });
};
