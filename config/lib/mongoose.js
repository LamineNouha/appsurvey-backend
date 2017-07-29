'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  chalk = require('chalk'),
  path = require('path'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// Load the mongoose models
module.exports.loadModels = function (callback) {
  // Globbing model files
  config.files.server.models.forEach(function (modelPath) {
    var modelClazz = require(path.resolve(modelPath));
    if(modelClazz.prototype.Type === 'Model' && modelClazz.prototype.Schema) {
        var modelSchema = new Schema(modelClazz.prototype.Schema)
        // load methods
        if(modelClazz.prototype.Methods) {
          for (var property in modelClazz.prototype.Methods) {
            if (modelClazz.prototype.Methods.hasOwnProperty(property)) {
                modelSchema.methods[property] = modelClazz.prototype.Methods[property]
            }
          }
        }
        // load statics
        if(modelClazz.prototype.Statics) {
          for (var property in modelClazz.prototype.Statics) {
            if (modelClazz.prototype.Methods.hasOwnProperty(property)) {
                modelSchema.statics[property] = modelClazz.prototype.Statics[property]
            }
          }
        }
        // laod Hooks
        if(modelClazz.prototype.Hooks) {
          for(var property in modelClazz.prototype.Hooks) {
            if(modelClazz.prototype.Hooks.hasOwnProperty(property)) {
              modelSchema[property](modelClazz.prototype.Hooks[property].type, modelClazz.prototype[modelClazz.prototype.Hooks[property].fun])
            }
          }
        }
        // laod Virtuals
        if(modelClazz.prototype.Virtuals) {
          for(var property in modelClazz.prototype.Virtuals) {
            if(modelClazz.prototype.Virtuals.hasOwnProperty(property)) {
              modelSchema.virtual(property, modelClazz.prototype.Virtuals[property])
            }
          }
        }

        mongoose.model(modelClazz.name, modelSchema);
    }
  });

  if (callback) callback();
};

// Initialize Mongoose
module.exports.connect = function (cb) {
  var _this = this;

  var db = mongoose.connect(config.db.uri, config.db.options, function (err) {
    // Log Error
    if (err) {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.log(err);
    } else {

      // Enabling mongoose debug mode if required
      mongoose.set('debug', config.db.debug);

      // Call callback FN
      if (cb) cb(db);
    }
  });
};

module.exports.disconnect = function (cb) {
  mongoose.disconnect(function (err) {
    console.info(chalk.yellow('Disconnected from MongoDB.'));
    cb(err);
  });
};
