'use strict'
const subscriptionController = require('./subscription.js')
const push = require('../helpers/push.js')
const request = require("request-promise")

const cancelSubscriptionGroup = '43849796-4ca1-4a2f-a628-756d99ef4e3e'
const confirmSubscriptionGroup = '1c18f094-b0dd-4d37-b13b-8a83c022541f'
const primaryGroup = '317f1a84-58f4-45b0-8aa1-889536641332'

// This file is made as the Push webhook is unstable, so instead of calling the subscription controller
// directly over HTTP, we shuffle contacts around in groups in push and read from the groups.

module.exports.subscribe = (event, context, callback) => {
  // Get contacts in the pending to cancel subscribe groups
  push.forEachContact({ group: confirmSubscriptionGroup }, (contact, next) => {
    // Subscribe them using the other service
    subscriptionController.subscribe(
      {queryStringParameters:
        {
          phonenumber: contact.urns[0].replace('tel:', ''),
          dateofbirth: contact.fields.dateofbirth
        }
      },
      null,
      (error, success) => {
        if(error)
          throw Error(error)

        if(success.statusCode != 200)
          next()
        else
          return push.addToGroup(contact.uuid, primaryGroup)
            .then(response => {
              console.log(`Successfully moved ${contact.uuid} to primary group`)
              next()
            })
            .catch(error => {
              console.log(`Could not add user ${contact.uuid} to group, got error: ${error}`)
              next()
            })
      })
    })
}

module.exports.unsubscribe = (event, context, callback) => {
  // Get contacts in the pending to cancel subscribe groups
  push.forEachContact({ group: cancelSubscriptionGroup }, (contact, next) => {
    subscriptionController.unsubscribe(
      {queryStringParameters: {phonenumber: contact.urns[0].replace('tel:', ''),}},
      null,
      (error, success) => {
        if(error)
          throw Error(error)

        if(success.statusCode != 200)
          next()
        else
          return push.removeFromAllGroups(contact.uuid)
            .then(response => {
              console.log(`Successfully removed ${contact.uuid} from all groups`)
              next()
            })
            .catch(error => {
              console.log(`Could not remove user ${contact.uuid} from all groups, got error: ${error}`)
              next()
            })
      })
    })
}
