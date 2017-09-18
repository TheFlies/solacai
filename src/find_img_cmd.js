global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const RestClient = require('another-rest-client');
const api = new RestClient('https://www.googleapis.com/customsearch/v1');
const builder = require('botbuilder');

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
  if (images && images.items && images.items.length > 9) {
    const r = images.items[util.getRandomInt(0, 9)];
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

/**
 * Compute 'find' message from wit.ai reponse data
 * @param {*} data 
 */
const computeMessage = (data) => {
  if (!data.entities.find) {
    throw new Error('This is not `find` entity');
  }
  const find = data.entities.find.reduce( (max, f) => { 
    return (f.confidence < max.confidence)?f:max;
  }, data.entities.find[0]);

  if (find) {
    const query = data.entities.query
      .filter( q => q.confidence>0.8 )
      .map( q => q.value)
      .join(' ');
    return "tét hình "+query;
  } else {
    throw new Error('Can\'t find image query!');
  }

};

function action(session, message) {
  session.send("đi kiếm hình là đi kiếm hình");
  const kb = message.split('tét hình');
  if (kb.length >= 2 && kb[1].trim().length > 0) {
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
    console.log("got response from gu gồ");
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
