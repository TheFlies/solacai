global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const RestClient = require('another-rest-client');
const api = new RestClient('https://lottery-211509.appspot.com/predict');

function action(session, message) {
  console.log('xin số lotte');
  api.get().then(function (res) {
    console.log(`html: ${res}`);
    session.endDialog(res);
  }).catch(function (err) {
    console.log('err', err);
    session.endDialog('Lỗi rồi');
  });
}

module.exports = {
  action
};
