const request = require("request");
const helpers = require("./helpers/helpers.js")

var count = 0
var smart_subscribers = 0

let getResultPage = (url) => {
  request({
    method: 'GET',
    url: url,
    headers: { Authorization: `Token 4a7c45f23347ab416e0812a548d7e8fcf0a87daf` },
    qs: { group: '317f1a84-58f4-45b0-8aa1-889536641332' }, // Query only the main group
    json: true
  }, function (error, response, body) {
    if(error)
      throw new Error(error);
    if(response.statusCode != 200)
      throw new Error(`Push replied with status code ${response.statusCode}, message: ${body.detail}`);
    let contacts = []

    count += body.results.length

    body.results.forEach((element) => {
      // If the user doesn't have an URN, remove from all groups
      if(!element.urns.length) {
        console.log(`${element.uuid} has no urn, removing from all groups`)
        removeFromAllGroups(element.uuid)
        return
      }

      let phonenumber = element.urns[0].split(':')[1]
      // Make the phonenumber standard format
      if(phonenumber.startsWith('0')) {
        phonenumber = '+855' + phonenumber.substr(1)
      }

      // A bit of data sanitation - check that the createdOn field is there
      if(element.fields.dateofbirth == null) {
        console.log(`${element.uuid} has no dateofbirth, removing from all groups`)
        removeFromAllGroups(element.uuid)
        return
      }

      // Check if date of birth is more than 2 years ago, if so, move to cancel subscription
      let dateOfBirth = new Date(element.fields.dateofbirth.replace(/(\d{2})-(\d{2})-(\d{4}).*/g, "$3-$2-$1"))
      let twoYearsAgo = new Date() - 1000*60*60*24*7*107

      if(dateOfBirth < twoYearsAgo){
        // Move to cancel subscription group
        addToGroup(element.uuid, '43849796-4ca1-4a2f-a628-756d99ef4e3e')
      }

      // A bit of data sanitation - check that the createdOn field is there
      if(element.fields.createdon == null) {
        if(element.created_on == null) {
          console.log(`${element.uuid} has dateOfBirth but no createdon date, removing from all groups`)
          removeFromAllGroups(element.uuid)
          return
        }
        element.fields.createdon = element.created_on
      }

      let createdOn = new Date(element.fields.createdon.replace(/(\d{2})-(\d{2})-(\d{4}).*/g, "$3-$2-$1"))
      let sixWeeksAgo = new Date() - 1000*60*60*24*7*6
      // Check if subscriber was created more than 6 weeks ago
      // AND if subscriber is smart
      if(createdOn < sixWeeksAgo && helpers.getServiceProviderForPhoneNumber(phonenumber) == 'smart') {
          smart_subscribers++
          // move to confirm subscription group
          addToGroup(element.uuid, 'aa1f7d37-2692-4873-a246-c5abd5b2909b')
        }
    })

    console.log(`Contacts handled: ${count} (${smart_subscribers} have been moved to confirm subscription)`)

    if(body.next !== null) {
      getResultPage(body.next);
    }
  });
}

getResultPage('http://push.ilhasoft.mobi/api/v2/contacts.json');

let removeFromAllGroups = (uuid) => {
  console.log(`Removing ${uuid} from all groups`)
  request({
    url: 'http://push.ilhasoft.mobi/api/v2/contacts.json?uuid=' + uuid,
    method: 'POST',
    headers: { Authorization: `Token 4a7c45f23347ab416e0812a548d7e8fcf0a87daf` },
    json: {
      "groups": []
    }
  }, function (error, response, body) {
    if(response)
      console.log(`${uuid} removed from all groups`)
    else
      console.log(error)
  })
}

let addToGroup = (uuid, groupId) => {
  console.log(`Adding ${uuid} to group ${groupId}`)
  request({
    url: 'http://push.ilhasoft.mobi/api/v2/contacts.json?uuid=' + uuid,
    method: 'POST',
    headers: { Authorization: `Token 4a7c45f23347ab416e0812a548d7e8fcf0a87daf` },
    json: {
      "groups": [groupId]
    }
  }, function (error, response, body) {
    if(response)
      console.log(`${uuid} to group ${groupId}`)
    else
      console.log(error)
  })
}
