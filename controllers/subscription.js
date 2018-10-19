  'use strict';
var request = require("request-promise")
var moment = require('moment')
const smart = require('../helpers/smart.js')
const helpers = require('../helpers/helpers.js')

module.exports.subscribe = (event, context, callback) => {
  // This comes from HTTP, so we expect the phonenumber and dateOfBirth to be in the query params
  let phonenumber = null
  try {
    phonenumber = helpers.sanitizePhoneNumber(event.queryStringParameters.phonenumber)
  } catch(error) {
    return callback(null, {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: `{"status": "error", "message": "${error}"}`
      });
  }
  let dateOfBirth = new Date(event.queryStringParameters.dateofbirth.replace(/(\d{2})-(\d{2})-(\d{4}).*/g, "$3-$2-$1"))
  if(helpers.getServiceProviderForPhoneNumber(phonenumber) == 'smart') {
    console.log(`Trying to subscribe ${phonenumber} with dateOfBirth ${dateOfBirth}`)
    smart.addOffering(phonenumber, new moment(dateOfBirth).add('107', 'weeks'))
      .then(status => {
         if(status === true) {
           console.log(`Subscribed ${phonenumber} successfully`)
           return callback(null, {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: '{"status": "ok"}'
            });
        }
        else return Promise.reject(`Subscribe failed (returned ${status})`)
      })
      .catch(err => {
        console.info(`Got error from subscribe: ${err}`);
        // If err is an Error, it's most likely a temporary issue, so we make sure to avoid these

        // Don't continue to retry for numbers that we cannot recover from
        if(!err instanceof Error && err.match('The subscriber payment type and offering payment type are different')) {
          return callback(null, {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: '{"status": "unrecoverable", "message": "User has wrong payment type. Please do not retry."}'
          });
        }
        else if(!err instanceof Error && err.match('The subscriber does not exist.')) {
          return callback(null, {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: '{"status": "unrecoverable", "message": "The subscriber does not exist. Please do not retry."}'
          });
        }
        return callback(null, {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: '{"status": "error", "message": "Could not subscribe"}'
        });
      })
  }
  else {
    callback(null, {
       statusCode: 200,
       headers: { 'Content-Type': 'application/json' },
       body: '{"status": "ok", "details":"Telco not supported"}'
     });
   }
}

module.exports.unsubscribe  = (event, context, callback) => {
  // This comes from HTTP, so we expect the phonenumber and dateOfBirth to be in the query params
  let phonenumber = null
  try {
    phonenumber = helpers.sanitizePhoneNumber(event.queryStringParameters.phonenumber)
  } catch(error) {
    return callback(null, {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: `{"status": "error", "message": "${error}"}`
      });
  }

  if(helpers.getServiceProviderForPhoneNumber(phonenumber) == 'smart') {
    console.log(`Trying to unsubscribe ${phonenumber}`)
    return smart.deleteOffering(phonenumber)
      .then(status => {
        if(status === true) {
          console.log(`Unsubscribed ${phonenumber} successfully`)
          return callback(null, {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: '{"status": "ok"}'
            });
        }
        else return Promise.reject(`Unsubscribe failed (returned ${status})`)
      })
      .catch(error => {
        console.info(`Got error from unsubscribe: ${error}`);
        return callback(null, {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: '{"status": "error", "message": "Could not unsubscribe"}'
        });
      })
  }
  else {
    callback(null, {
       statusCode: 200,
       headers: { 'Content-Type': 'application/json' },
       body: '{"status": "ok", "details": "Telco not supported"}'
     });
   }
}
