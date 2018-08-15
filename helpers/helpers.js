'use strict';

module.exports.sanitizePhoneNumber = phonenumber => {
  phonenumber = phonenumber.replace(/ /g, '')
  if(phonenumber.startsWith('+1')) {
    phonenumber = phonenumber.replace('+1', '0')
  }
  if(phonenumber.startsWith('0')) {
    phonenumber = '+855' + phonenumber.substr(1)
  }
  if(phonenumber == null || (phonenumber.length !== 12 && phonenumber.length !== 13))
    throw Error(`Phonenumber needs to be 12 or 13 digits. Got ${phonenumber}`)
  return phonenumber
}

module.exports.getServiceProviderForPhoneNumber = phonenumber => {
  phonenumber = module.exports.sanitizePhoneNumber(phonenumber)
  if( phonenumber.startsWith('+85510') ||
      phonenumber.startsWith('+85515') ||
      phonenumber.startsWith('+85516') ||
      phonenumber.startsWith('+85569') ||
      phonenumber.startsWith('+85570') ||
      phonenumber.startsWith('+85581') ||
      phonenumber.startsWith('+85596') ||
      phonenumber.startsWith('+85598') ||
      phonenumber.startsWith('+85586') ||
      phonenumber.startsWith('+85587') ||
      phonenumber.startsWith('+85593'))
    return 'smart'
  else if( phonenumber.startsWith('+85511') ||
      phonenumber.startsWith('+85512') ||
      phonenumber.startsWith('+85517') ||
      phonenumber.startsWith('+85561') ||
      phonenumber.startsWith('+85576') ||
      phonenumber.startsWith('+85577') ||
      phonenumber.startsWith('+85578') ||
      phonenumber.startsWith('+85585') ||
      phonenumber.startsWith('+85589') ||
      phonenumber.startsWith('+85592') ||
      phonenumber.startsWith('+85595') ||
      phonenumber.startsWith('+85599'))
    return 'cellcard'
  else if( phonenumber.startsWith('+85531') ||
      phonenumber.startsWith('+85560') ||
      phonenumber.startsWith('+85566') ||
      phonenumber.startsWith('+85567') ||
      phonenumber.startsWith('+85568') ||
      phonenumber.startsWith('+85571') ||
      phonenumber.startsWith('+85588') ||
      phonenumber.startsWith('+85590') ||
      phonenumber.startsWith('+85597'))
    return 'metfone'
  else
    return 'unknown'
}
