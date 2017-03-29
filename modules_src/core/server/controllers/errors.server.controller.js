'use strict';

/**
 * Get unique error field name
 */
var getUniqueErrorMessage = function (err) {
  var output;

  try {
    var fieldName = err.errmsg.substring(err.errmsg.lastIndexOf('.$') + 2, err.errmsg.lastIndexOf('_1'));
    output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists';

  } catch (ex) {
    output = 'Unique field already exists';
  }

  return output;
};

/**
 * Get the error message from error object
 */
exports.getErrorMessage = function (err) {
  var message = '';
  console.log(err);
  if(err) {
    if (err.code !== undefined) {
      switch (err.code) {
        case  0 :
              message = err.message ;
              break  ;
        case 666 :
          message = err.message ;
              break ;
        case 11000:
        case 11001:
          message = getUniqueErrorMessage(err);
          break;
        default:

          message = err.message ||'Something went wrong';
      }
    } else {
      for (var errName in err.errors) {
        if (err.errors[errName].message) {
          message = err.errors[errName].message;
        }
      }
    }
  } else {
    message = "Error"
  }

  return message;
};
