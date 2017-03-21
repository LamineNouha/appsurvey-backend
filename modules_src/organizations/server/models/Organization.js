'use strict';

import { Model, Hook, Method, Static, String, Default, Validate, Index, Required, None, ArrayType, Date } from '../../../../config/lib/decorators';

var mongoose = require('mongoose'),
	path = require('path'),
  config = require(path.resolve('./config/config')),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator'),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test');


@Model
//@Hook('pre', 'save', hashPasswordHook)
//@Hook('pre', 'validate', testLocalPassword)
//@Method('hashPassword', hashPassword, false)
class Organization {

	@String
	@Default('')
	@Index
	@Validate('validateLocalStrategyProperty', 'Please fill in the organization name')
	organizationName;

	@String
	@Default('')
	@Index
	@Validate('validateLocalStrategyEmail', 'Please fill a valid email address')
	email;

	@String
	@Default('')
	address;

	@String
	@Default('')
	phone;

	@String
	@Default('')
	description;

	@String
	@Default('')
	fax;

	@String
	@Default('')
	password;

	@String
	salt;

	@String
	@Default('modules/organizations/client/img/profile/default.png')
	profileImageURL;

	@String
	@Required('Provider is required')
	provider;

	@None
	providerData;

	@None
	additionalProvidersData;

	@String
	@ArrayType
	@Default(['organization'])
	roles;

	@Date
	updated;

	@Date
	@Default(Date.now)
	created;

	@String
	resetPasswordToken;

	@Date
	resetPasswordExpires;

	// ======= Methods =========

	/**
	 * Create instance method for authenticating user
	 */
	@Method
	authenticate(password) {
	  return this.password === this.hashPassword(password);
	};

	/**
	 * Create instance method for hashing a password
	 */
	@Method
	hashPassword(password) {
	  if (this.salt && password) {
	    return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64, 'SHA1').toString('base64');
	  } else {
	    return password;
	  }
	};


	/**
	 * Find possible not used OrganizationName
	 */
	@Static
	findUniqueOrganizationName(organizationName, suffix, callback) {
	  var _this = this;
	  var possibleOrganizationName = organizationName.toLowerCase() + (suffix || '');

	  _this.findOne({
	    organizationName: possibleOrganizationName
	  }, function (err, organization) {
	    if (!err) {
	      if (!organization) {
	        callback(possibleOrganizationName);
	      } else {
	        return _this.findUniqueOrganizationName(organizationName, (suffix || 0) + 1, callback);
	      }
	    } else {
	      callback(null);
	    }
	  });
	};


	/**
	* Generates a random passphrase that passes the owasp test
	* Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
	* NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
	*/
	@Static
	generateRandomPassphrase() {
	  return new Promise(function (resolve, reject) {
	    var password = '';
	    var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

	    // iterate until the we have a valid passphrase
	    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
	    while (password.length < 20 || repeatingCharacters.test(password)) {
	      // build the random password
	      password = generatePassword.generate({
	        length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
	        numbers: true,
	        symbols: false,
	        uppercase: true,
	        excludeSimilarCharacters: true
	      });

	      // check if we need to remove any repeating characters
	      password = password.replace(repeatingCharacters, '');
	    }

	    // Send the rejection back if the passphrase fails to pass the strength test
	    if (owasp.test(password).errors.length) {
	      reject(new Error('An unexpected problem occured while generating the random passphrase'));
	    } else {
	      // resolve with the validated passphrase
	      resolve(password);
	    }
	  });
	};

	/**
	 * A Validation function for local strategy email
	 */
	validateLocalStrategyEmail(email) {
	  return ((this.provider !== 'local' && !this.updated) || validator.isEmail(email, { require_tld: false }));
	};

	/**
	 * A Validation function for username
	 * - at least 3 characters
	 * - only a-z0-9_-.
	 * - contain at least one alphanumeric character
	 * - not in list of illegal usernames
	 * - no consecutive dots: "." ok, ".." nope
	 * - not begin or end with "."
	 */

	validateOrganizationName(organizationName) {
	  var organizationNameRegex = /^(?=[\w.-]+$)(?!.*[._-]{2})(?!\.)(?!.*\.$).{3,34}$/;
	  return (
	    this.provider !== 'local' ||
	    (organizationName && organizationNameRegex.test(organizationName) && config.illegalOrganizationName.indexOf(organizationName) < 0)
	  );
	};

	/**
	 * A Validation function for local strategy properties
	 */
	validateLocalStrategyProperty(property) {
	  return ((this.provider !== 'local' && !this.updated) || /^[A-Z]([a-zA-Z0-9]|[- @\.#&!])*$/.test(property));
	};
	/**
	* Validate name format
	*/
	validateOrganizationNameFormat(val){
	  return /^[A-Z]([a-zA-Z0-9]|[- @\.#&!])*$/.test(val) ;
	}

}

module.exports = Organization
