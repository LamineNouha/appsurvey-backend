'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Event = mongoose.model('Event'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

var whitelistedFields = ['title', 'description', 'address', 'lat', 'lon', 'capacity', 'startDate', 'endDate', 'nbInterested'];

/**
 * Create an event
 */
exports.create = function (req, res) {

  var event = new Event(req.body);
  event.organization = mongoose.Types.ObjectId(req.user._doc._id);

  console.log(event)

  event.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(event);
    }
  });
};

/**
 * Show the current event
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var event = req.event ? req.event.toJSON() : {};

  // Add a custom field to the Event, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Event model.
  event.isCurrentUserOwner = !!(req.user && event.organization && event.organization._id.toString() === req.user._id.toString());

  res.json(event);
};

/**
 * Update an event
 */
exports.update = function (req, res) {
  var event = req.event;

  if(event) {
    // Update whitelisted fields only
    event = _.extend(event, _.pick(req.body, whitelistedFields));

    event.updated = Date.now();

    event.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(event);
      }
    });

  } else {
    res.status(401).send({
      message: 'Event not found'
    });
  }

};

/**
 * Delete an event
 */
exports.delete = function (req, res) {
  var event = req.event;

  event.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(event);
    }
  });
};

/**
 * List of Event
 */
exports.list = function (req, res) {
  Event.find().sort('-created').lean().populate('organization').exec(function (err, events) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      User.findOne({_id: req.user._doc._id}).populate('events').exec(function(err, user) {
        if(err) {
          res.status(400).send(err)
        } else {
          events.forEach(function(part, index, array) {
            if (user.events.filter(function(e) {return e._id == events[index]._id.toString()}).length > 0) {
              events[index].isInterested = true
            } else {
              events[index].isInterested = false
            }
          })
          res.json(events);
        }
      })
    }
  });
};

/**
 * Event middleware
 */
exports.eventByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Event is invalid'
    });
  }

  Event.findById(id).populate('organization').exec(function (err, event) {
    if (err) {
      return next(err);
    } else if (!event) {
      return res.status(404).send({
        message: 'No event with that identifier has been found'
      });
    }
    req.event = event;
    next();
  });
};
