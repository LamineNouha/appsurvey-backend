'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization'),
  multer = require('multer'),
  Category = mongoose.model('Category'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  config = require(path.resolve('./config/config'));

var whitelistedFields = ['title', 'description'];

/**
 * Create an category
 */
exports.create = function (req, res) {
  if(req.user) {
    var category = new Category(req.body);
    Category.create(category, function(err, category) {
      if(err || !category) {
        res.status(400).send({
          message: "Bad request"
        })
      } else {
        res.json(category);
      }
    });
  } else {
    return res.status(403).send({
      message: "You need to authenticated"
    });
  }
};

/**
 * Show a category
 */
exports.read = function (req, res) {
  var categoryId = req.params.categoryId
  Category.findOne({_id: categoryId}).populate('events').sort('-created').exec(function (err, category) {
    if (err || !category) {
      return res.status(422).send({
        message: "Cannot find category"
      });
    } else {
      res.json(category);
    }
  });
};

/**
 * Update an category
 */
exports.update = function (req, res) {
  var category = req.category;

  if(category) {
    // Update whitelisted fields only
    category = _.extend(category, _.pick(req.body, whitelistedFields));

    category.updated = Date.now();

    category.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: "Cannot update category"
        });
      } else {
        res.json(category);
      }
    });

  } else {
    res.status(401).send({
      message: 'Category not found'
    });
  }

};

/**
 * Delete an category
 */
exports.delete = function (req, res) {
  var category = req.category;

  category.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: "Cannot delete category"
      });
    } else {
      res.json(category);
    }
  });
};

/**
 * List of Categories
 */
exports.list = function (req, res) {
  Category.find().sort('-created').populate('events').lean().exec(function (err, categories) {
    if (err) {
      return res.status(422).send({
        message: "Cannot list categories"
      });
    } else {
      console.log(categories.events)
      res.json(categories);
    }
  });
};

/**
 * Category middleware
 */
exports.categoryByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Category is invalid'
    });
  }

  Category.findById(id).exec(function (err, category) {
    if (err) {
      return next(err);
    } else if (!category) {
      return res.status(404).send({
        message: 'No category with that identifier has been found'
      });
    }
    req.category = category;
    next();
  });
};
