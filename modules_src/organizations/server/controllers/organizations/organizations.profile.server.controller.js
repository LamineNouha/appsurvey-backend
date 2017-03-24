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
 * Send Organization
 */
exports.me = function (req, res) {
  // Sanitize the user - short term solution. Copied from core.server.controller.js
  // TODO create proper passport mock: See https://gist.github.com/mweibel/5219403
  var safeOrganizationObject = null;
  if (req.organization) {
    safeOrganizationObject = {
      organizationName: validator.escape(req.organization.organizationName),
      address: validator.escape(req.organization.address),
      phone: validator.escape(req.organization.phone),
      description: validator.escape(req.organization.description),
      fax: validator.escape(req.organization.fax),
      provider: validator.escape(req.organization.provider),
      created: req.user.created.toString(),
      roles: req.organization.roles,
      profileImageURL: req.organization.profileImageURL,
      email: validator.escape(req.organization.email),
      additionalProvidersData: req.organization.additionalProvidersData
    };
  }

  res.json(safeOrganizationObject || null);
};
