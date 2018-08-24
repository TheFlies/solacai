const dotenv = require('dotenv');
// There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
dotenv.load();

const restify = require('restify');
const builder = require('botbuilder');

const Wit = require('node-wit').Wit;

// my commands
const mongodb = require('mongodb');
const FindImgCmd = require('./find_img_cmd');
const DatabaseCmd = require('./database_cmd').DatabaseCmd;
const lottCmd = require('./lott_cmd');

// util
const util = require('./util');

// message router
const MessageRouter = require('./message_router');
// wit.ai entities processor
const EntitiesProcessor = require('./entities_processor').EntitiesProcessor;
const validateWitAIMsg = require('./entities_processor').validateWitAIMsg;

// Setup MongoDB
const uri = process.env.PROD_MONGODB;
const mongoClient = mongodb.MongoClient;

// Setup Restify Server
const server = restify.createServer();
var databaseCmd;
mongoClient.connect(uri).then((db) => {
  databaseCmd = new DatabaseCmd(db);
  // start server after DB connection is ready
  server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
  });


  // Create chat connector for communicating with the Bot Framework Service
  const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
  });

  // -----------------------
  // wit client
  const witClient = new Wit({
    accessToken: process.env.WIT_SERVER_ACCESS_TOKEN
  });

  // Listen for messages from users 
  server.post('/api/messages', connector.listen());

  const replyDataSource = databaseCmd.getData();

  /**
   * a simple processor that end the session with message. For complex processor, create
   * a Command which implement action(session, message) function. Read FindImgCmd as example.
   */
  const simpleProcessor = {
    action: (session, msg) => session.endDialog(msg)
  };

  const computeMsgDrinkLocation = (data) => {
    validateWitAIMsg(data, 'drink', 'drink.location');
    return util.pickRan(replyDataSource.drinkLocation);
  };

  const computeMsgSwearMe = (data) => {
    validateWitAIMsg(data, 'swear', 'swear.me');
    return util.pickRan(replyDataSource.swearMe);
  };

  const computeMsgConversationGreeting = (data) => {
    validateWitAIMsg(data, 'conversation', 'conversation.greeting');
    return util.pickRan(replyDataSource.conversationGreeting);
  };

  const computeMsgConversationBye = (data) => {
    validateWitAIMsg(data, 'conversation', 'conversation.bye');
    return util.pickRan(replyDataSource.conversationBye);
  };

  const computeMsgConversationKhen = (data) => {
    validateWitAIMsg(data, 'conversation', 'conversation.khen');
    return util.pickRan(replyDataSource.conversationKhen);
  };

  // entities processor
  const iProcessor = new EntitiesProcessor();
  // - complex command
  iProcessor.register(FindImgCmd);
  iProcessor.register(lottCmd);
  // - simple command
  iProcessor.register(simpleProcessor, computeMsgDrinkLocation);
  iProcessor.register(simpleProcessor, computeMsgSwearMe);
  iProcessor.register(simpleProcessor, computeMsgConversationGreeting);
  iProcessor.register(simpleProcessor, computeMsgConversationBye);
  iProcessor.register(simpleProcessor, computeMsgConversationKhen);
  // default - return confuse
  iProcessor.register(simpleProcessor, () => util.pickRan(replyDataSource.confuse));

  // router
  const witAiHandler = {
    action: (session, msg) => {
      // --------------- processing using available ML wit.ai
      witClient.message(msg, {})
        .then(function (res) {
          iProcessor.process(session, res);
        })
        .catch(function (err) {
          console.error('This should not happened, but seem we still having error.', err);
          session.endDialog(util.pickRan(replyDataSource.bug) + '<br/>\n' + JSON.stringify(err, Object.keys(err)));
        });
    }
  };

  const helpHandler = {
    action: (session, msg) => {

      // Send a greeting and show help.
      var card = new builder.ThumbnailCard(session)
        .title('Con bướm xinh')
        .subtitle('Con bướm xinh con bướm xinh, con bướm đa tình.')
        .images([
          builder.CardImage.create(session, 'http://9mobi.vn/cf/images/2015/03/nkk/hinh-nen-co-gai-cho-dien-thoai-6.jpg')
        ]);

      var msg = new builder.Message(session).text(' hướng dẫn đi sau nha :D.').attachments([card]);
      session.send(msg);
      session.endDialog(`Gõ: 
1. tét hình query : tìm hình trên gu gồ với \`\`\`query\`\`\`
2. hép : hiện lên cái này
3. vietlott: lấy số VietLott, trúng nhớ bao em nha
3. tùm lum cũng được em trả lời nha mấy anh
                        `);
    }
  };

  const router = new MessageRouter();

  // Order matters!
  router.register(/^tét hình .*$/, FindImgCmd);
  router.register(/^db: .*$/, databaseCmd);
  router.register(/^vietlott$/, lottCmd);
  router.register(/^hép.*$/, helpHandler);
  router.register(/.*/, witAiHandler);

  // ok bot
  let inMemoryStorage = new builder.MemoryBotStorage();
  const bot = new builder.UniversalBot(connector, [
    function (session) {
      session.beginDialog('default');
    }
  ]).set('storage', inMemoryStorage); // register in-memory storage

  // ------------ Bot event handler
  bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
      const name = message.user ? message.user.name : null;
      const reply = new builder.Message()
        .address(message.address)
        .text('Chào anh %s... em là %s', name || 'ấy', message.address.bot.name || 'bum búm');
      bot.send(reply);
    } else {
      // delete their data
    }
  });

  // ------------ Bot default handler
  bot.dialog('default', function (session) {
    // console.log('Message json: \n: '+JSON.stringify(session.message, null, 1));
    let msg = session.message.text;
    let entities = session.message.entities;
    let sourceEvent = session.message.sourceEvent;
    msg = removeBotInformation(session.message.address.bot, entities, sourceEvent, msg);
    router.handle(session, msg);
  });

  bot.dialog('proactiveDialog', function (session) {

    savedAddress = session.message.address;

    var message = 'Mấy anh ơi, 5 giây nữa em gửi 1 cái message nha...';
    session.send(message);

    setTimeout(() => {
      startProactiveDialog(savedAddress);
    }, 5000);
  }).triggerAction({
    matches: /^(@bướm )?tét láo$/i,
    confirmPrompt: 'Anh có chắc hong? Hình như anh đang kẹt? Làm cái này là mất cái đang kẹt luôn á nha...'
  });

  // initiate a dialog proactively 
  function startProactiveDialog(address) {
    bot.beginDialog(address, '*:survey');
  }

  // handle the proactive initiated dialog
  bot.dialog('survey', function (session) {
    if (session.message.text.match(/^(@bướm )?nghỉ đi$/i)) {
      session.send('Ôh, ngon rồi, em đi đây...');
      session.endDialog();
    } else {
      session.send('Muốn nghỉ thì gõ \'@bướm nghỉ đi\' nha mấy anh');
    }
  });

  function removeBotInformation(bot, entities, sourceEvent, msg) {
    let ret = msg;
    if (bot) {
      if (entities && sourceEvent && sourceEvent.text) {
        let st = sourceEvent.text;
        if (st.replace(/<\/?[^>]+(>|$)/g, '') === ret) {
          let hashAt = entities.filter((m) => m.mentioned && bot.id === m.mentioned.id)[0];
          if (hashAt) {
            console.log('Oh we got mentioned - ' + JSON.stringify(hashAt));
            ret = st.replace(hashAt.text, '').replace(/<\/?[^>]+(>|$)/g, '');
            console.log('cleaned return value: ' + ret);
          }
        }
      }

      return ret
        .replace('@' + bot.name, '')
        .replace('@' + bot.id, '')
        .replace('Edited previous message:', '')
        .replace(/<e_m[^>]*>.*<\/e_m>/, '')
        .replace('@Ruồi Sờ Là Cai', '').trim(); // still need to remove cached old name
    }

    return msg;
  }
});