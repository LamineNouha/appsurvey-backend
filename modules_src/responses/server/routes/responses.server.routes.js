'use strict';

/**
 * Module dependencies
 */
var categories = require('../controllers/categories.server.controller');

module.exports = function (app) {
  // Category collection routes
  app.route('/api/categories')
    .get(categories.list)
    .post(categories.create);

  // Single category routes
  app.route('/api/categories/:categoryId')
    .get(categories.read)
    .put(categories.update)
    .delete(categories.delete);

  // Finish by binding the category middleware
  app.param('categoryId', categories.categoryByID);
};
