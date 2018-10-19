'use strict';
const request = require('request-promise')
const moment = require('moment')

module.exports.getAccessToken = () => {
  return request({
      method: 'POST',
      url: 'https://mife.smart.com.kh:8243/token',
      headers: {
        Authorization: 'Basic ' + process.env.SMART_AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        grant_type: 'client_credentials'
      },
      resolveWithFullResponse : true,
      json: true
    }).then(response =>{
      if(!response || !response.body.access_token || response.statusCode != 200)
        throw Error(`ERROR: (1) Unexpected return from Smart in token api! Smart returned HTTP ${response.statusCode}. Body: ${JSON.stringify(body)}`)

      return response.body.access_token
    })
    .catch(err => {
      throw Error(`ERROR: (2) Unexpected return from Smart in token api! err: ${JSON.stringify(err)}`)
    })
}

module.exports.isSubscribed = (phonenumber) => {
  return module.exports.getAccessToken()
    .then(token => {
      return request({
        method: 'POST', url: 'https://mife.smart.com.kh:8243/hwbssCustService/querySubCustInfo/v1.0',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: {
          ReqHeader: {
            Version: '1',
            BusinessCode: 'QueryCustInfo',
            TransactionId: event.requestContext.requestTimeEpoch,
            Channel: '28',
            PartnerId: '101',
            ReqTime: moment().format("YYYYMMDDHHmmss"),
            AccessUser: process.env.ACCESS_USER,
            AccessPassword: process.env.ACCESS_PASSWORD
          },
          AccessInfo: {
            ObjectIdType: '4',
            ObjectId: contact.urns[0]
          },
          IncludeOfferFlag: 1
        },
        json: true,
        resolveWithFullResponse: true,
      })
    })
    .then(response => {
      // If we didnt get a successful response
      if(response.QuerySubCustInfoRspMsg.RspHeader.ReturnCode !== '0000')
          return Promise.reject(response);
      // If the user is not active
      if(response.QuerySubCustInfoRspMsg.Subscriber.SubStatus != '2')
          return Promise.reject(response);

      // If the subscriber does not have our mHealth
      if(!response.QuerySubCustInfoRspMsg.Subscriber.
        SupplementaryOfferingList.GetSubOfferingInfo.some(
          element => element.OfferingId.OfferingId == "1089153310")) {
            return false
      }
      return true
    })
}

module.exports.addOffering = (phonenumber, expiry) => {
  return module.exports.getAccessToken()
    .then(token => {
      return request({
      method: 'PUT', url: 'https://mife.smart.com.kh:8243/offering/changeSupplementaryOffering/V1.0',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: {
        ReqHeader: {
          TransactionId: (new Date).getTime(),
          Channel: '28',
          PartnerId: '101',
          ReqTime: moment().format("YYYYMMDDHHmmss"),
          AccessUser: process.env.SMART_ACCESS_USER,
          AccessPassword: process.env.SMART_ACCESS_PASSWORD
        },
        AccessInfo: {
          ObjectIdType: '4',
          ObjectId: phonenumber.substr(4)
        },
        AddOffering:[
          {
            OfferingId: { OfferingId: 1089153310 },
            EffectiveMode: { Mode: '0' },
            ExpirationDate: expiry.format("YYYYMMDDHHmmss")
          }
        ]
      },
      resolveWithFullResponse: true,
      json: true })
    })
    .then(response => {
      if(!response || response.statusCode != 200 || !response.body.ChangeSupplementaryOfferingRspMsg)
        throw Error(`ERROR: (1) Unexpected return from Smart in addOffering! Smart returned HTTP ${response.statusCode} for phonenumber ${phonenumber.substr(4)}. Body: ${JSON.stringify(response.body)}`)

      // 0000 is success
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "0000")
        return true

      // 1057 means that the user is already subscribed to this offering
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "1057")
        return true

      // 1005 means that the subscriber has been removed from smart's database
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "1005")
        return response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnMsg

      // 1058 means that the user does not have enough money
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "1058")
        return response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnMsg

      // 9999 is a temporary error if they already have a pending transaction of some sort
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "9999")
        return response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnMsg

      throw Error(`ERROR: (2) Unexpected response from Smart in addOffering - ${response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode}, '${response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnMsg}'`)
    })
    .catch(err => {
      throw Error(`ERROR: (3) Unexpected return from Smart in addOffering! err: ${err}`)
    })
}

module.exports.deleteOffering = phonenumber => {
  return module.exports.getAccessToken()
    .then(token => {
      return request({
        method: 'PUT', url: 'https://mife.smart.com.kh:8243/offering/changeSupplementaryOffering/V1.0',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: {
          ReqHeader: {
            TransactionId: (new Date).getTime(),
            Channel: '28',
            PartnerId: '101',
            ReqTime: moment().format("YYYYMMDDHHmmss"),
            AccessUser: process.env.SMART_ACCESS_USER,
            AccessPassword: process.env.SMART_ACCESS_PASSWORD
          },
          AccessInfo: {
            ObjectIdType: '4',
            ObjectId: phonenumber.substr(4)
          },
          DeleteOffering:[
            {
              OfferingId: { OfferingId: 1089153310 },
              ExpireMode: { Mode: '0' },
            }
          ]
        },
        resolveWithFullResponse : true,
        json: true })
    })
    .then(response => {
      if(!response || response.statusCode != 200 || !response.body.ChangeSupplementaryOfferingRspMsg) {
        throw Error(`ERROR: (1) Unexpected return from Smart in deleteOffering! Smart returned HTTP ${response.statusCode}. response: ${JSON.stringify(response)}`)
      }

      // 1057 means that the offer is already active on the beneficiary. 0000 is success
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "0000")
          return true

      // 1009 means that the user was not subscribed to the offering, which is ok as well
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "1009")
          return true

      // 1005 means that the user does not exist, and thus cannot be unregistered :)
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "1005")
          return true

      // 9999 is a temporary error if they already have a pending transaction of some sort. This is also sent in case the user is barred, in which case we want to try again
      if(response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode == "9999")
        return response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnMsg

      throw Error(`ERROR: (2) Unexpected response from Smart in deleteOffering - ${response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnCode}, '${response.body.ChangeSupplementaryOfferingRspMsg.RspHeader.ReturnMsg}'`)
    })
    .catch(err => {
      throw Error(`ERROR: (3) Unexpected return from Smart in deleteOffering! err: ${err}`)
    })
}
