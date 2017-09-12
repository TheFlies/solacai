var restify = require('restify');
var builder = require('botbuilder');

global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

var RestClient = require('another-rest-client');

var Wit = require('node-wit').Wit

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
  // appId: process.env.MICROSOFT_APP_ID,
  // appPassword: process.env.MICROSOFT_APP_PASSWORD
  appId: "13a25d76-e2ba-455c-aef8-fc4ee079a4c2",
  appPassword: "4gT0TdkA57nwJi5Raoaj9wM"
});

var googleApiToken = {
  ApiKey: "AIzaSyBjVKGXMBsr4qvlch462BJvqQ3rGxAY7Ks",
  CseKey: "008528348316169879039:krj0gf7qsui"
};

var witToken = {
  server: "FQXPSSZR3AOFSDEBGSZR7WPHF2O4DZ2H",
  appid: "59b77e9e-227c-4d0f-80e3-25c5f7f74c65"
}

var drinkLocation = [
  "La Cà - Ngô Thị Thu Minh ố ô ỳe ye",
  "La Cà - Đường Phố - Hoàng Sa - Bờ kè thoáng mát hợp vệ sinh ngon lắm anh êy",
  "1B - Thích Quảng Đức Bưởi da trắng, đùi thon eo nở (heart)",
  "Nhậu thì ra 45 - Phan Đăng Lưu, thơm mũi mát mắt nha mấy anh"
];

var swearMe = [
  "sao anh chửi em?",
  "em vô tội",
  "ngon nhào vô đi!",
  "cám ơn, anh cũng vậy"
];

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// ok bot
var bot = new builder.UniversalBot(connector);

var api = new RestClient('https://www.googleapis.com/customsearch/v1');

var witClient = new Wit({
  accessToken: witToken.server
})

//Bot on
bot.on('contactRelationUpdate', function (message) {
  if (message.action === 'add') {
    var name = message.user ? message.user.name : null;
    var reply = new builder.Message()
      .address(message.address)
      .text("Chào anh %s... em là Ruồi", name || 'ấy');
    bot.send(reply);
  } else {
    // delete their data
  }
});

bot.on('typing', function (message) {
  // User is typing
});

bot.dialog('/', function (session) {
  var msg = session.message.text.toLocaleLowerCase().replace("@ruồi sờ là cai", "").trim()
  console.log('>>> %s', msg)
  if (msg.indexOf('tét hình') >= 0) {
    // var url = 'https://docs.microsoft.com/en-us/bot-framework/media/how-it-works/architecture-resize.png';
    // sendInternetUrl(session, url, 'image/png', 'BotFrameworkOverview.png');
    session.send("đi kiếm hình là đi kiếm hình");
    var kb = msg.split('tét hình');
    if (kb.length >= 2 && kb[1].trim().length > 0) {
      api.get({
        q: kb[1].trim(), cx: googleApiToken.CseKey, searchType: "image", fields: "items(link,mime)",
        key: googleApiToken.ApiKey
      }).then(function (res) {
        if (res && res.items && res.items.length > 9) {
          var r = res.items[getRandomInt(0, 9)]
          console.log('first 10 results from google', res.items);
          if (r) {
            var url = r.url || r.link;
            var type = r.type || r.mime || calType(r.format) || calType(url.substr(url.length - 3));
            if (type != null) {
              sendInternetUrl(session, url, type, null);
            }
          } else
            session.send("Hong lay duoc hình òi");
        } else {
          session.send("Hết quota rồi anh ới...");
        }
      }).catch(function (err) {
        console.log('err', err);
        session.send("Lỗi này rồi: ", err);
      });
    } else {
      session.send("code lỗi rồi");
    }
  } else {
    witClient.message(msg, {})
      .then(function (res) {
        console.log("Res:" + JSON.stringify(res));
        var intents = res.entities.intent || res.entities.swear || null;
        var resMsg = getResponseMsg(intents) || "xin lỗi, em bị ngu.";

        console.log(">> response with: %s",resMsg)

        session.send(resMsg);
      })
      .catch(function (err) { 
        session.send("em bị ngu, đừng phá em. "+ JSON.stringify(err)); 
      })
  }
});

function calType(type) {
  switch (type) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpg';
    case 'png':
      return 'image/png';
    default:
      return null
  }
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sends attachment using an Internet url
function sendInternetUrl(session, url, contentType, attachmentFileName) {
  var msg = new builder.Message(session)
    .addAttachment({
      contentUrl: url,
      contentType: contentType,
      name: attachmentFileName
    });

  session.send(msg);
}

function getResponseMsg(intents) {
  var msg = null;
  if (intents && intents.length>0) {
    console.log("get first intent having confidence")
    var i = 0;
    while (intents[i] && intents[i].confidence < 0.9) {
      i++;
    }
    
    if (i < intents.length) {
      switch (intents[i].value) {
        case "drink.location": msg = pickRan(drinkLocation);
        break;
        case "swear.me": msg = pickRan(swearMe);
        break;
        default: break;
      }
    }
  }
  console.log("first intent having confidence "+msg)
  return msg;
}

function pickRan(dic) {
  var rnum = getRandomInt(0, dic.length - 1);
  console.log(rnum)
  return dic[rnum] || dic[0];
}