'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  Organization = mongoose.model('Organization'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = function (req, res, next) {
  async.waterfall([
    // Generate random token
    function (done) {
      crypto.randomBytes(20, function (err, buffer) {
        var token = buffer.toString('hex');
        done(err, token);
      });
    },
    // Lookup organization by organizationName
    function (token, done) {
      if (req.body.organizationName) {
        Organization.findOne({
          organizationName: req.body.organizationName.toLowerCase()
        }, '-salt -password', function (err, organization) {
          if (err || !organization) {
            return res.status(400).send({
              message: 'No account with that organizationName has been found'
            });
          } else if (organization.provider !== 'local') {
            return res.status(400).send({
              message: 'It seems like you signed up using your ' + organization.provider + ' account'
            });
          } else {
            organization.resetPasswordToken = token;
            organization.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            organization.save(function (err) {
              done(err, token, organization);
            });
          }
        });
      } else {
        return res.status(422).send({
          message: 'Organization field must not be blank'
        });
      }
    },
    function (token, organization, done) {

      var httpTransport = 'http://';
      if (config.secure && config.secure.ssl === true) {
        httpTransport = 'https://';
      }
      var baseUrl = req.app.get('domain') || httpTransport + req.headers.host;
      res.render(path.resolve('modules/organizations/server/templates/reset-password-email'), {
        name: organization.organizationName,
        appName: config.app.title,
        url: baseUrl + '/api/organizations/auth/reset/' + token
      }, function (err, emailHTML) {
        done(err, emailHTML, organization);
      });
    },
    // If valid email, send reset email using service
    function (emailHTML, organization, done) {
      var mailOptions = {
        to: organization.email,
        from: config.mailer.from,
        subject: 'Password Reset',
        html: emailHTML
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        if (!err) {
          res.send({
            message: 'An email has been sent to the provided email with further instructions.'
          });
        } else {
          return res.status(400).send({
            message: 'Failure sending email'
          });
        }

        done(err);
      });
    }
  ], function (err) {
    if (err) {
      return next(err);
    }
  });
};

/**
 * Reset password GET from email token
 */
exports.validateResetToken = function (req, res) {
  Organization.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function (err, organization) {
    if (err || !organization) {
      return res.redirect('/password/reset/invalid');
    }

    res.redirect('/password/reset/' + req.params.token);
  });
};

/**
 * Reset password POST from email token
 */
exports.reset = function (req, res, next) {
  // Init Variables
  var passwordDetails = req.body;

  async.waterfall([

    function (done) {
      Organization.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function (err, organization) {
        if (!err && organization) {
          if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
            organization.password = passwordDetails.newPassword;
            organization.resetPasswordToken = undefined;
            organization.resetPasswordExpires = undefined;

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
                    // Remove sensitive data before return authenticated user
                    organization.password = undefined;
                    organization.salt = undefined;

                    res.json(organization);

                    done(err, organization);
                  }
                });
              }
            });
          } else {
            return res.status(422).send({
              message: 'Passwords do not match'
            });
          }
        } else {
          return res.status(400).send({
            message: 'Password reset token is invalid or has expired.'
          });
        }
      });
    },
    function (organization, done) {
      res.render('modules/organizations/server/templates/reset-password-confirm-email', {
        name: user.organizationName,
        appName: config.app.title
      }, function (err, emailHTML) {
        done(err, emailHTML, organization);
      });
    },
    // If valid email, send reset email using service
    function (emailHTML, organization, done) {
      var mailOptions = {
        to: organization.email,
        from: config.mailer.from,
        subject: 'Your password has been changed',
        html: emailHTML
      };

      smtpTransport.sendMail(mailOptions, function (err) {
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) {
      return next(err);
    }
  });
};

/**
 * Change Password
 */
exports.changePassword = function (req, res, next) {
  // Init Variables
  var passwordDetails = req.body;

  if (req.organization) {
    if (passwordDetails.newPassword) {
      Organization.findById(req.organization.id, function (err, organization) {
        if (!err && organization) {
          if (organization.authenticate(passwordDetails.currentPassword)) {
            if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
              organization.password = passwordDetails.newPassword;

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
                      res.send({
                        message: 'Password changed successfully'
                      });
                    }
                  });
                }
              });
            } else {
              res.status(422).send({
                message: 'Passwords do not match'
              });
            }
          } else {
            res.status(422).send({
              message: 'Current password is incorrect'
            });
          }
        } else {
          res.status(400).send({
            message: 'Organization is not found'
          });
        }
      });
    } else {
      res.status(422).send({
        message: 'Please provide a new password'
      });
    }
  } else {
    res.status(401).send({
      message: 'Organization is not signed in'
    });
  }
};
