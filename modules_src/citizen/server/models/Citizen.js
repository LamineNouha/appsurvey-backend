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
class Citizen {

	@String
	@Required('sex is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the citizen sex')
	sex;

	@NumberType
	@Required('age is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the citizen age')
	age;

	@String
	@Required('social Level is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the citizen social Level')
	socLevel;

	@String
	@Required('education Level is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the citizen education Level')
	educLevel;

	@String
	@Required('profession is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the citizen education')
	profession;

	@String
	@Required('region is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the citizen region')
	region;

	@String
	@Required('locality is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the citizen locality')
	locality;

	
	@Date
	updated;

	@Date
	@Default(Date.now)
	created;


	

	// ======= Methods =========
	validateNotEmptyProperty(val) {
		return val.length;
	}

}

module.exports = Citizen
