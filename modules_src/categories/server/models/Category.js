'use strict';

import { Virtual, NumberType, Ref, Model, Hook, Method, Static, String, Default, Validate, Index, Required, None, ArrayType, Date } from '../../../../config/lib/decorators';

var mongoose = require('mongoose'),
	path = require('path'),
  config = require(path.resolve('./config/config')),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator'),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test');


@Model
class Category {

	@String
	@Required('Title is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the event title')
	title;

	@String
	@Required('Description is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the event description')
	description;

	@Date
	updated;

	@Date
	@Default(Date.now)
	created;

	@Virtual('Event', '_id', 'categories')
	events;

	// ======= Methods =========
	validateNotEmptyProperty(val) {
		return val.length;
	}

}

module.exports = Category
