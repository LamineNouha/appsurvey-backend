'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

exports.Model = function Model(target) {
		target.prototype.Type = 'Model'
		if(!target.prototype.Schema) {
			target.prototype.Schema = {}
		}
}

exports.Hook = function Model(hookOrder, hookType, fun) {
	return function(target) {
		if(!target.prototype.Hooks) {
			target.prototype.Hooks = {}
		}

		if(hookOrder !== 'pre' && hookOrder !== 'post') {
			throw new Error('Hook order no supported')
		}

		if(['init', 'save', 'update', 'find', 'validate', 'remove'].indexOf(hookType) <= -1) {
			throw new Error('Hook order no supported')
		}

		target.prototype.Hooks[hookOrder] = {}
		target.prototype.Hooks[hookOrder].type = hookType
		target.prototype.Hooks[hookOrder].fun = fun

	}

}

exports.Method = function Method(target, key, descriptor) {
	if(!target.Methods) {
		target.Methods = {}
	}

	target.Methods[key] = target[key]

}

exports.Static = function Method(target, key, descriptor) {
	if(!target.Statics) {
		target.Statics = {}
	}

	target.Statics[key] = target[key]
}

exports.String = function String(target, key , descriptor) {

		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}

		if(target.Schema[key].type && Array.isArray(target.Schema[key].type)) {
			target.Schema[key].type[0] = {}
			target.Schema[key].type[0].type = String
		} else {
			target.Schema[key].type = String
		}

}

exports.Ref = function Ref(value) {
	return function(target, key, descriptor) {
		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}


		target.Schema[key].type = Schema.ObjectId
		target.Schema[key].ref = value
	}

}

exports.Default = function Default(value) {
	return function(target, key, descriptor) {

		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}
		if(typeof value === 'function') {
				target.Schema[key].default = value()
		} else {
				target.Schema[key].default = value
		}

	}
}

exports.ArrayType = function ArrayType(target, key , descriptor) {

		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}

		target.Schema[key].type = []


}

exports.Date = function Date(target, key , descriptor) {

		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}

		target.Schema[key].type = Date


}

exports.Index = function Index(target, key , descriptor) {

		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}

		target.Schema[key].index = {
			unique: true
		}


}

exports.None = function None(target, key , descriptor) {

		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}


}

exports.Validate = function Validate(fun, error) {
	return function(target, key , descriptor) {
		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}
		console.log(target[fun])
		target.Schema[key].validate = [target[fun], error]


	}
}

exports.Required = function Required(error) {
	return function(target, key , descriptor) {
		if(!target.Schema) {
			target.Schema = {}
		}

		if(!target.Schema[key])
			target.Schema[key] = {}

		target.Schema[key].required = error


	}
}
