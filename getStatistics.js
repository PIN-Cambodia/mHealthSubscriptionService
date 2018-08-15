'use strict'
const push = require('./helpers/push.js')
const helpers = require('./helpers/helpers.js')

const pendingTelcoPaymentGroup = '1c18f094-b0dd-4d37-b13b-8a83c022541f'
const pendingConfirmationFromUserGroup = 'aa1f7d37-2692-4873-a246-c5abd5b2909b'
const cancelSubscriptionGroup = '43849796-4ca1-4a2f-a628-756d99ef4e3e'
const primaryGroup = '317f1a84-58f4-45b0-8aa1-889536641332'

// This file is made as the Push webhook is unstable, so instead of calling the subscription controller
// directly over HTTP, we shuffle contacts around in groups in push and read from the groups.

let lifetimeSubscribers = 0
let activeSubscribers = 0
let payingSubscribers = 0
let pendingPayment = 0
let pendingSubscriptionConfirmation = 0
let pendingCancelation = 0
let canceledService = 0
let smartSubscribers = 0
let cellcardSubscribers = 0
let metfoneSubscribers = 0
let landlines = 0

push.forEachContact(null, (contact, next) => {
  try {
    let phonenumber = contact.urns[0].split(':')[1]
    if(helpers.getServiceProviderForPhoneNumber(phonenumber) == 'smart')
      smartSubscribers++
    if(helpers.getServiceProviderForPhoneNumber(phonenumber) == 'cellcard')
      cellcardSubscribers++
    if(helpers.getServiceProviderForPhoneNumber(phonenumber) == 'metfone')
      metfoneSubscribers++
    if(helpers.getServiceProviderForPhoneNumber(phonenumber) == 'unknown')
      landlines++

    lifetimeSubscribers++
    if(contact.groups.filter(e => e.uuid == primaryGroup).length) {
      activeSubscribers++
      if(contact.fields.subscriptionupdatedat != null)
        payingSubscribers++
    }
    if(contact.groups.filter(e => e.uuid == pendingTelcoPaymentGroup).length)
      pendingPayment++
    if(contact.groups.filter(e => e.uuid == pendingConfirmationFromUserGroup).length)
      pendingSubscriptionConfirmation++
    if(contact.groups.filter(e => e.uuid == cancelSubscriptionGroup).length)
      pendingCancelation++
    if(contact.groups.length == 0 && contact.fields.subscriptionupdatedat != null)
      canceledService++
  } catch(error) {
    console.log(error)
  }

  next()
}, () => {
  console.log(`Lifetime Subscribers: ${lifetimeSubscribers} (${smartSubscribers} Smart, ${cellcardSubscribers} Cellcard, ${metfoneSubscribers} Metfone, ${landlines} unknown)`)
  console.log(`Currently active subscribers: ${activeSubscribers}`)
  console.log(`Currently paying subscribers: ${payingSubscribers}`)
  console.log(`Currently pending payment from telco: ${pendingPayment}`)
  console.log(`Currently pending subscription confirmation from user: ${pendingSubscriptionConfirmation}`)
  console.log(`Currently pending cancelation at telco: ${pendingCancelation}`)
  console.log(`Actively chose not to subscribe/couldn't be reached for subscription confirmation: ${canceledService}`)
})
