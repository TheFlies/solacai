var dotenv = require('dotenv');
// There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
dotenv.load();

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
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var googleApiToken = {
  ApiKey: process.env.GOOGLE_API_KEY,
  CseKey: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
};

var witToken = {
  server: process.env.WIT_SERVER_ACCESS_TOKEN,
  appid: process.env.WIT_APP_ID,
}

var drinkLocation = [
  "La Cà - Ngô Thị Thu Minh ố ô ỳe ye",
  "La Cà - Đường Phố - Hoàng Sa - Bờ kè thoáng mát hợp vệ sinh ngon lắm anh êy",
  "1B - Thích Quảng Đức Bưởi da trắng, Cam Đào Mận Xoài đủ cả (heart)",
  "Nhậu thì ra 45 - Phan Đăng Lưu, thơm mũi mát mắt nha mấy anh"
];

var swearMe = [
  "sao anh chửi em?",
  "em vô tội",
  "ngon nhào vô đi!",
  "cám ơn, anh cũng vậy"
];

var confuse = [
  "xin lỗi, em bị ngu",
  "tôi không có nhà, vui lòng thử lại sau",
  "quán nay đóng cửa vài phút, lát ghé nha",
  "đừng chọc em"
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
            var url = r.link;
            var type = r.mime;
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
        var intents = res.entities.drink || res.entities.swear || res.entities.find || null;
        var query = res.entities.query || null;
        var resMsg = getResponseMsg(intents, query, session) || pickRan(confuse);

        if (resMsg && !res.entities.find) session.send(resMsg);
      })
      .catch(function (err) {
        session.send("em bị ngu, đừng phá em. "+ JSON.stringify(err));
      })
  }
});

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

function getResponseMsg(intents, query, session) {
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
        case "find.image": if (query && query[0].confidence>=0.9) {
          api.get({
            q: query[0].value, cx: googleApiToken.CseKey, searchType: "image", fields: "items(link,mime)",
            key: googleApiToken.ApiKey
          }).then(function (res) {
            if (res && res.items && res.items.length > 9) {
              var r = res.items[getRandomInt(0, 9)]
              console.log('first 10 results from google', res.items);
              if (r) {
                var url = r.link;
                var type = r.mime;
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
        }
        break;
        default: break;
      }
    }
  }
  return msg;
}

function pickRan(dic) {
  var rnum = getRandomInt(0, dic.length - 1);
  return dic[rnum] || dic[0];
}