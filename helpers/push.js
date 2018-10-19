'use strict'
const request = require('request-promise')

module.exports.forEachContact = (qs, callback, finalCallback, invokeNextCallback, nextPageUrl) => {
  let handleContactsPage = (url) => {
    return request({ method: 'GET',
      url: url,
      qs: qs,
      headers: {
        'Content-Type': 'application/json',
         Authorization: `Token ${process.env.PUSH_ACCESS_TOKEN}`
       } ,
       json: true
    })
    .then(response => {
      if(!response.results.length)
        return "No contacts found"

      console.log(`Got page with ${response.results.length} contacts`)

      let handlerIterator = index => {
        if(index == response.results.length) {
          if(response.next !== null) {
            return invokeNextCallback? invokeNextCallback(response.next) : handleContactsPage(response.next);
          }
          return finalCallback ? finalCallback() : "No more contacts pending"
        }

        callback(response.results[index], () => handlerIterator(index+1))
      }

      return handlerIterator(0)
    })
  }

  return handleContactsPage(nextPageUrl ? nextPageUrl : 'http://push.ilhasoft.mobi/api/v2/contacts.json')
}

module.exports.addToGroup = (uuid, group) => {
  return request({ method: 'POST',
    url: 'https://push.ilhasoft.mobi/api/v2/contacts.json',
    qs: { uuid: uuid },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${process.env.PUSH_ACCESS_TOKEN}`
    },
    body: { groups: [ group ] },
    json: true
  })
}

module.exports.removeFromAllGroups = (uuid) => {
  return request({ method: 'POST',
    url: 'https://push.ilhasoft.mobi/api/v2/contacts.json',
    qs: { uuid: uuid },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${process.env.PUSH_ACCESS_TOKEN}`
    },
    body: { groups: [ ] },
    json: true
  })
}
