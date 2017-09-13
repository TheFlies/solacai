const dotenv = require('dotenv');
// There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
dotenv.load();

const restify = require('restify');
const builder = require('botbuilder');

global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const RestClient = require('another-rest-client');

const Wit = require('node-wit').Wit;

// my commands
const FindImgCmd = require('./find_img_cmd');
// response
const response = require('./response');
const data = response.data;

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const googleApiToken = {
  ApiKey: process.env.GOOGLE_API_KEY,
  CseKey: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
};

const witToken = {
  server: process.env.WIT_SERVER_ACCESS_TOKEN,
  appid: process.env.WIT_APP_ID,
};

//-----------------------

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// google api
const api = new RestClient('https://www.googleapis.com/customsearch/v1');;

// wit client
const witClient = new Wit({
  accessToken: witToken.server
});

// ok bot
const bot = new builder.UniversalBot(connector, [
  function (session) {
    session.beginDialog('default');
  }
]);

// ------------ Bot event handler
bot.on('contactRelationUpdate', function (message) {
  if (message.action === 'add') {
    const name = message.user ? message.user.name : null;
    const reply = new builder.Message()
      .address(message.address)
      .text("Chào anh %s... em là %s", name || 'ấy', message.address.bot.name || 'bum búm');
    bot.send(reply);
  } else {
    // delete their data
  }
});

// ------------ Bot default handler
bot.dialog('default', function (session) {
  let msg = session.message.text; //.toLocaleLowerCase().replace("@ruồi sờ là cai", "").trim()
  msg = removeBotInformation(session.message.address.bot, msg);
  // ------------- procesing commands
  // find images command
  if (!FindImgCmd.processed(session, msg)) {
    // --------------- processing using available ML wit.ai
    witClient.message(msg, {})
    .then(function (res) {
      console.log('wit api returned JSON: \n'+JSON.stringify(res));
      const intents = res.entities.drink || res.entities.swear || res.entities.find || res.entities.conversation || [];
      const query = res.entities.query || null;
      const resMsg = response.getMessage(intents, query, session) || response.pickRan(data.confuse);
      if (resMsg && !res.entities.find) {
        console.log("we don't need find anything so returned.");
        session.endDialog(resMsg);
      }
    })
    .catch(function (err) {
      console.log("error happened.", err);
      session.endDialog(response.pickRan(data.confuse));
    });
  }
});

function removeBotInformation(bot, msg) {
  if (bot) {
    return msg
      .replace("@"+bot.name, "").trim()
      .replace("@"+bot.id, "").trim()
      .replace("@Ruồi Sờ Là Cai", ""); // still need to remove cached old name
  }

  return msg;
}
