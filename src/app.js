const dotenv = require('dotenv');
// There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
dotenv.load();

const restify = require('restify');
const builder = require('botbuilder');

const Wit = require('node-wit').Wit;

// my commands
const FindImgCmd = require('./find_img_cmd');
// const TestProactiveCmd = require('./proactive_cmd');
// response
const response = require('./response');
const data = response.data;
// message router
const MessageRouter = require('./message_router');
// wit.ai entities processor
const EntitiesProcessor = require('./entities_processor').EntitiesProcessor;
const validateWitAIMsg = require('./entities_processor').validateWitAIMsg;

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

const witToken = {
  server: process.env.WIT_SERVER_ACCESS_TOKEN,
  appid: process.env.WIT_APP_ID,
};

//-----------------------

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// wit client
const witClient = new Wit({
  accessToken: witToken.server
});

/**
 * a simple processor that end the session with message. For complex processor, create
 * a Command which implement action(session, message) function. Read FindImgCmd as example.
 */
const simpleProcessor = { action: (session, msg) => session.endDialog(msg) };

const computeMsgDrinkLocation = (data) => {
  validateWitAIMsg(data, "drink", "drink.location");
  return response.pickRan(response.data.drinkLocation);
};

const computeMsgSwearMe = (data) => {
  validateWitAIMsg(data, "swear", "swear.me");
  return response.pickRan(response.data.swearMe);
};

const computeMsgConversationGreeting = (data) => {
  validateWitAIMsg(data, "conversation", "conversation.greeting");
  return response.pickRan(response.data.conversationGreeting);
}

const computeMsgConversationBye = (data) => {
  validateWitAIMsg(data, "conversation", "conversation.bye");
  return response.pickRan(response.data.conversationBye);
}

// entities processor
const iProcessor = new EntitiesProcessor();
// - complex command
iProcessor.register(FindImgCmd);
// - simple command
iProcessor.register(simpleProcessor, computeMsgDrinkLocation)
iProcessor.register(simpleProcessor, computeMsgSwearMe)
iProcessor.register(simpleProcessor, computeMsgConversationGreeting)
iProcessor.register(simpleProcessor, computeMsgConversationBye)
// default - return confuse
iProcessor.register(simpleProcessor, data => response.pickRan(response.data.confuse));

// router
const witAiHandler = {
  action: (session, msg) => {
    // --------------- processing using available ML wit.ai
    witClient.message(msg, {})
      .then(function (res) {
        iProcessor.process(session, res)
      })
      .catch(function (err) {
        console.error("This should not happened, but seem we still having error.", err);
        session.endDialog(response.pickRan(response.data.bug) + "<br/>\n" + JSON.stringify(err, Object.keys(err)));
      });
  }
};

const helpHandler = {
  action: (session, msg) => {
    session.endDialog(" Hướng dẫn là hong có hướng dẫn :D.")
  }
}

const router = new MessageRouter();

// Order matters!
router.register(/^tét hình .*$/, FindImgCmd);
// router.register(/^tét láo .*$/, TestProactiveCmd);
router.register(/^hép .*$/, helpHandler);
router.register(/.*/, witAiHandler);

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
  console.log("Message json: \n: "+JSON.stringify(session.message, null, 1));
  let msg = session.message.text;
  let entities = session.message.entities;
  let sourceEvent = session.message.sourceEvent;
  msg = removeBotInformation(session.message.address.bot, entities, sourceEvent, msg);
  router.handle(session, msg);
});

bot.dialog('proactiveDialog', function (session, args) {

  savedAddress = session.message.address;

  var message = 'Mấy anh ơi, 5 giây nữa em gửi 1 cái message nha...';
  session.send(message);

  setTimeout(() => {
    startProactiveDialog(savedAddress);
  }, 5000);
})
.triggerAction({
  matches: /^(@bướm )?tét láo$/i,
  confirmPrompt: "Anh có chắc hong? Hình như anh đang kẹt? Làm cái này là mất cái đang kẹt luôn á nha..."
});

// initiate a dialog proactively 
function startProactiveDialog(address) {
  bot.beginDialog(address, "*:survey");
}

// handle the proactive initiated dialog
bot.dialog('survey', function (session, args, next) {
  if (session.message.text.match(/^(@bướm )?nghỉ đi$/i)) {
    session.send("Ôh, ngon rồi, em đi đây...");
    session.endDialog();
  } else {
    session.send('Muốn nghỉ thì gõ "@bướm nghỉ đi" nha mấy anh');
  }
});

function removeBotInformation(bot, entities, sourceEvent, msg) {
  let ret = msg;
  if (bot) {
    if (entities && sourceEvent && sourceEvent.text) {
      let st = sourceEvent.text;
      if (st.replace(/<\/?[^>]+(>|$)/g, "") === ret) {
        let hashAt = entities.filter( (m) => m.mentioned && bot.id === m.mentioned.id )[0];
        if (hashAt) {
          console.log('Oh we got mentioned - '+JSON.stringify(hashAt))
          ret = st.replace(hashAt.text, "").replace(/<\/?[^>]+(>|$)/g, "");
        }
      }
    }

    return ret
      .replace("@" + bot.name, "").trim()
      .replace("@" + bot.id, "").trim()
      .replace("@Ruồi Sờ Là Cai", "").trim(); // still need to remove cached old name
  }

  return msg;
}
