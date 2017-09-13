global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

var RestClient = require('another-rest-client');
var api = new RestClient('https://www.googleapis.com/customsearch/v1');
var builder = require('botbuilder');

var util = require('./util')

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
  var defaultMsg;
  if (images && images.items && images.items.length > 9) {
    var r = images.items[util.getRandomInt(0, 9)]
    if (r) {
      var url = r.link;
      var type = r.mime;
      if (type != null) {
        defaultMsg = buildImageAttachedMsg(session, url, type, null);
      }
    }
  }
  return defaultMsg;
}

function processed(session, msg) {
  if (msg.indexOf('tét hình') >= 0) {
    session.send("đi kiếm hình là đi kiếm hình")
    var kb = msg.split('tét hình')
    if (kb.length >= 2 && kb[1].trim().length > 0) {
      googleImageSearch(session, kb[1].trim())
    } else {
      session.endDialog("code lỗi rồi")
    }

    return true;
  } else {
    return false;
  }
}

function googleImageSearch(session, query) {
  console.log("searching on gu gồ")
  api.get({
    q: query, 
    cx: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID, 
    searchType: "image", 
    fields: "items(link,mime)",
    key: process.env.GOOGLE_API_KEY
  }).then(function (res) {
    console.log("got response from gu gồ")
    var defaultMsg = imageResponsedHandler(session, res) || "Hong lay duoc hình òi"
    session.endDialog(defaultMsg);
  }).catch(function (err) {
    console.log('err', err)
    session.endDialog("Lỗi rồi")
  });
}

module.exports = {
  processed, googleImageSearch
}