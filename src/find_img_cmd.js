global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const RestClient = require('another-rest-client');
const api = new RestClient('https://www.googleapis.com/customsearch/v1');
const builder = require('botbuilder');

const validateWitAIMsg = require('./entities_processor').validateWitAIMsg
const util = require('./util');

var num = 0;
var log = 'random';
function clearNum() {
  num = 0;
  log = 'random';
}

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

function getRandomArrayElements(arr, count) {
  var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
  while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

function imagesResponsedHandler(session, images, log, num) {
  let defaultMsgs = [];
  if (images && images.items) {
    let logic = log || 'random';
    let number = num || 1;
    if (number>images.items.length) {
      number = images.items.length;
    }

    let imgs;
    switch (log) {
      case 'first':
      imgs = images.items.slice(0,number);
      break;
      
      case 'last':
      imgs = images.items.slice(Math.max(images.items.length - number, 1));
      break;

      case 'random':
      default:
      imgs = getRandomArrayElements(images.items, number);
      break;
    }

    defaultMsgs = imgs
      .filter( i => i.mime != null)
      .map( i => buildImageAttachedMsg(session, i.link, i.mime));
  }
  return defaultMsgs;
}

function imageResponsedHandler(session, images) {
  let defaultMsg = "Hong lay duoc hình òi";
  if (images && images.items) {
    const r = util.pickRan(images.items);
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
 * Compute 'find.image' message from wit.ai reponse data
 * @param {*} data 
 */
const computeMessage = (data) => {
  let find = validateWitAIMsg(data,'find','find.image');
  if (find) {
    const query = data.entities.query
      .filter( q => q.confidence>0.9 )
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
    if (data.entities.logic) {
      const logic = data.entities.logic
      .filter( q => q.confidence>0.8 )
      .map( q => q.value )[0];

      if (logic) {
        console.log("found logic: "+JSON.stringify(logic));
        log = logic;
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
    if (num) {
      console.log('get '+log+' '+num+' images');
      const msgs = imagesResponsedHandler(session, res, log, num);
      msgs.forEach(function(element,index) {
        setTimeout(function() {
          element.text('hình thứ '+(index+1));
          session.send(element);
        }, index*1500);
      }, this);
      session.endDialog();
    } else {
      const defaultMsg = imageResponsedHandler(session, res);
      session.endDialog(defaultMsg);
    }
    clearNum();
  }).catch(function (err) {
    console.log('err', err);
    session.endDialog("Lỗi rồi");
    clearNum();
  });
}

module.exports = {
  googleImageSearch, action, computeMessage
};
