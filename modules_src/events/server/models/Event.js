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
class Event {

	@String
	@Required('Title is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the event title')
	title;

	@String
	@Required('Address is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the event address')
	address;

	@String
	@Required('Description is required')
	@Validate('validateNotEmptyProperty', 'Please fill in the event description')
	description;

	@NumberType
	@Required('Latitude is required')
	lat;

	@NumberType
	@Required('Longitude is required')
	lon;

	@String
	eventImageURL;

	@String
	@Required('The capacity is required')
	capacity;

	@NumberType
	@Default(0)
	nbInterested;

	@Date
	updated;

	@Date
	@Default(Date.now)
	created;

	@Date
	@Required('StartDate is required')
	startDate;

	@Date
	@Required('EndDate is required')
	endDate;

	@Ref('Organization')
	organization;

	@ArrayType
	@Ref('Category')
	@Required('Categories are required')
	categories;

	// ======= Methods =========
	validateNotEmptyProperty(val) {
		return val.length;
	}

}

module.exports = Event
