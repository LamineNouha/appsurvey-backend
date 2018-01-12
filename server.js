'use strict';

/**
 * Module dependencies.
 */
require("babel-core/register");
require("babel-polyfill");
var app = require('./config/lib/app');
var server = app.start();
