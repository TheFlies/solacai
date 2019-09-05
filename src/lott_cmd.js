global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const predictUrl = process.env.VIETLOFT_PREDICT_URL;
const RestClient = require('another-rest-client');
const api = new RestClient(predictUrl);

const validateWitAIMsg = require('./entities_processor').validateWitAIMsg;

function action(producer) {
  api.get().then(function (res) {
    console.log(`html: ${res}`);
    producer.send(res.replace('</br>', '\n'))
  }).catch(function (err) {
    producer.send('Lỗi rồi');
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
