global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const RestClient = require('another-rest-client');
const api = new RestClient('https://lottery-211509.appspot.com/predict');

const validateWitAIMsg = require('./entities_processor').validateWitAIMsg;

function action(session, message) {
  console.log('xin số lotte');
  api.get().then(function (res) {
    console.log(`html: ${res}`);
    session.endDialog(res.replace('</br>', '\n'));
  }).catch(function (err) {
    console.log('err', err);
    session.endDialog('Lỗi rồi');
  });
}

/**
 * Compute 'find.image' message from wit.ai reponse data
 * @param {*} data 
 */
const computeMessage = (data) => {
  let find = validateWitAIMsg(data, 'find', 'find.lottery');
  if (find) {
    const query = data.entities.query
      .filter( q => q.confidence>0.75 );
    
    if (query.length>0) {
      return 'vietlott';
    }
  }
  throw new Error('Can\'t validate message');
};

module.exports = {
  action, computeMessage
};
