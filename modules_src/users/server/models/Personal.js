'use strict';

import {
    Model,
    Ref,
    Hook,
    Method,
    Static,
    String,
    Default,
    Validate,
    Index,
    Required,
    None,
    ArrayType,
    Date
} from '../../../../config/lib/decorators';

var mongoose = require('mongoose'),
    path = require('path'),
    config = require(path.resolve('./config/config')),
    Schema = mongoose.Schema,
    crypto = require('crypto'),
    validator = require('validator'),
    generatePassword = require('generate-password'),
    owasp = require('owasp-password-strength-test');


@Model
@Hook('pre', 'save', 'hashPasswordHook')
@Hook('pre', 'validate', 'testLocalPassword')
class Personal {


    @String
    @Default('')
    @Index
    @Validate('validateLocalStrategyEmail', 'Please fill a valid email address')
    email;

    @String
    @Default('')
    password;


    @String
    @Default('assets/images/placeholder.jpg')
    profileImageURL;


    @ArrayType
    @String
    @Default(['user'])
    roles;


    @String
    @Required('Provider is required')
    provider;

    @Date
    updated;

    @Date
    @Default(Date.now)
    created;

    @String
    @Default("test")
    resetPasswordToken;

    @String
    salt;

    @Date
    resetPasswordExpires;

    @Ref('User')
	user;


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
        return ((this.provider !== 'local' && !this.updated) || validator.isEmail(email, {require_tld: false}));
    };

    /**
     * A Validation function for local strategy properties
     */
    validateLocalStrategyProperty(property) {
        return ((this.provider !== 'local' && !this.updated) || property.length);
    };

    /**
     * Hook a pre save method to hash the password
     */
    hashPasswordHook(next) {
        if (this.password && this.isModified('password')) {
            this.salt = crypto.randomBytes(16).toString('base64');
            this.password = this.hashPassword(this.password);
        }

        next();
    }

    /**
     * Hook a pre validate method to test the local password
     */
    testLocalPassword(next) {
        if (this.provider === 'local' && this.password && this.isModified('password')) {
            var result = owasp.test(this.password);
            if (result.errors.length) {
                var error = result.errors.join(' ');
                this.invalidate('password', error);
            }
        }

        next();
    }

}

module.exports = Personal
