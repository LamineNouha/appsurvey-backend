'use strict';

import { Virtual, NumberType, Ref, Model, Hook, Method, Static, String, Default, Validate, Index, Required, None, ArrayType, Date, BooleanType } from '../../../../config/lib/decorators';

var mongoose = require('mongoose'),
	path = require('path'),
  config = require(path.resolve('./config/config')),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator'),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test');


@Model
class Response {

	@String
	@Required('Choice is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the response Choice')
	choice;

	@Date
	updated;

	@Date
	@Default(Date.now)
	created;
	

	@Ref('Question')
	question;

	@BooleanType
	@Required('checked is required')
	checked;
	

	// ======= Methods =========
	validateNotEmptyProperty(val) {
		return val.length;
	}

}

module.exports = Response
