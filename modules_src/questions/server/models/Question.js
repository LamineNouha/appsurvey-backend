'use strict';

import { NumberType, Ref, Model, Hook, Method, Static, String, Default, Validate, Index, Required, None, ArrayType, Date } from '../../../../config/lib/decorators';

var mongoose = require('mongoose'),
	path = require('path'),
  config = require(path.resolve('./config/config')),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator'),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test');


@Model
class Question {

	@String
	@Required('Content is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the question content')
	content;


	
	@Date
	updated;

	@Date
	@Default(Date.now)
	created;


	@Ref('Survey')
	survey;

	@ArrayType
	@Ref('Response')
	responses;

	// ======= Methods =========
	validateNotEmptyProperty(val) {
		return val.length;
	}

}

module.exports = Question
