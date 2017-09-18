global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const RestClient = require('another-rest-client');
const api = new RestClient('https://www.googleapis.com/customsearch/v1');
const builder = require('botbuilder');

const validateWitAIMsg = require('./entities_processor').validateWitAIMsg
const util = require('./util');

/**
 * Attach an internet image and send it to user
 * @param {*} session current conversation session
 * @param {*} url The image url on Internet
 * @param {*} contentType MIME type of the image
 * @param {*} attachmentFileName Custom file name of attachment
 */
function buildImageAttachedMsg(session, url, contentType, attachmentFileName) {
  return new builder.Message(session)
    .addAttachment({
      contentUrl: url,
      contentType: contentType,
      name: attachmentFileName
    });
}

function imageResponsedHandler(session, images) {
  let defaultMsg;
  if (images && images.items) {
    const r = images.items[util.getRandomInt(0, images.items.length)];
    if (r) {
      const url = r.link;
      const type = r.mime;
      if (type != null) {
        defaultMsg = buildImageAttachedMsg(session, url, type, null);
      }
    }
  }
  return defaultMsg;
}

var num = 1;
var log = 'random';

/**
 * Compute 'find.image' message from wit.ai reponse data
 * @param {*} data 
 */
const computeMessage = (data) => {
  let find = validateWitAIMsg(data,'find','find.image');
  if (find) {
    const query = data.entities.query
      .filter( q => q.confidence>0.8 )
      .map( q => q.value)
      .join(' ');
    // number
    if (data.entities.number) {
      const number = data.entities.number
        .filter( q => q.confidence>0.8 )
        .map( q => parseInt(q.value))
        .reduce((max, f) => {
          return (f < max) ? max : f;
        }, 0)
      
      if (number) {
        console.log("found number: "+number);
        num = number;
      }
    }

    // logic
    if (data.entities.number) {
      const logic = data.entities.logic
      .find( q => q.confidence>0.8 );

      if (logic) {
        console.log("found logic: "+JSON.stringify(logic));
        log = logic.value;
      }
    }
    
    if (query) {
      return "tét hình "+query;
    }
  }
  throw new Error('Can\'t calculate the query for searching image!');
};

function action(session, message) {
  const kb = message.split('tét hình');
  if (kb.length >= 2 && kb[1].trim().length > 0) {
    session.send('em đang đi kiếm hình `'+kb[1]+'` nhe anh, đợi em 1 tí...');
    googleImageSearch(session, kb[1].trim());
  } else {
    session.endDialog("code lỗi rồi");
  }
}

function googleImageSearch(session, query) {
  console.log("searching on gu gồ");
  api.get({
    q: query,
    cx: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
    searchType: "image",
    fields: "items(link,mime)",
    key: process.env.GOOGLE_API_KEY
  }).then(function (res) {
    const defaultMsg = imageResponsedHandler(session, res) || "Hong lay duoc hình òi";
    session.endDialog(defaultMsg);
  }).catch(function (err) {
    console.log('err', err);
    session.endDialog("Lỗi rồi");
  });
}

module.exports = {
  googleImageSearch, action, computeMessage
};
