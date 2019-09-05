const { WebClient } = require('@slack/web-api')


// -----------------------
// wit client
const Wit = require('node-wit').Wit
const witClient = new Wit({
  accessToken: process.env.WIT_SERVER_ACCESS_TOKEN
})

const FindImgCmd = require('./find_img_cmd')
const lottCmd = require('./lott_cmd')

// wit.ai entities processor
const EntitiesProcessor = require('./entities_processor').EntitiesProcessor
const validateWitAIMsg = require('./entities_processor').validateWitAIMsg
// util for random answers
const util = require('./util')
const mainProcessor = new EntitiesProcessor()

const slackProcessor = {
  action: (producer, msg) => {
    producer.send(msg)
  }
}

const computeMsgDrinkLocation = (data, answers) => {
  validateWitAIMsg(data, 'drink', 'drink.location')
  return util.pickRan(answers.drinkLocation)
}

const computeMsgSwearMe = (data, answers) => {
  validateWitAIMsg(data, 'swear', 'swear.me')
  return util.pickRan(answers.swearMe)
}

const computeMsgConversationGreeting = (data, answers) => {
  validateWitAIMsg(data, 'conversation', 'conversation.greeting')
  return util.pickRan(answers.conversationGreeting)
}

const computeMsgConversationBye = (data, answers) => {
  validateWitAIMsg(data, 'conversation', 'conversation.bye')
  return util.pickRan(answers.conversationBye)
}

const computeMsgConversationKhen = (data, answers) => {
  validateWitAIMsg(data, 'conversation', 'conversation.khen')
  return util.pickRan(answers.conversationKhen)
}

mainProcessor.register(FindImgCmd)
mainProcessor.register(lottCmd)

mainProcessor.register(slackProcessor, computeMsgDrinkLocation)
mainProcessor.register(slackProcessor, computeMsgSwearMe)
mainProcessor.register(slackProcessor, computeMsgConversationGreeting)
mainProcessor.register(slackProcessor, computeMsgConversationBye)
mainProcessor.register(slackProcessor, computeMsgConversationKhen)

// let atok = process.env.SLACK_AUTH_TOKEN
let btok = process.env.SLACK_BOT_USER_AUTH_TOKEN
const web = new WebClient(btok)

// handler
const botHandler = {
  action: (producer, msg) => {
    // --------------- processing using available ML wit.ai
    let input_msg = producer.invalidateMessage(msg)

    witClient.message(input_msg, {})
      .then(function (res) {
        mainProcessor.process(producer, res)
      })
      .catch(function (err) {
        console.error('This should not happened, but seem we still having error.', err)
        producer.send(util.pickRan(producer.data.bug) + '\n' + JSON.stringify(err, Object.keys(err)))
      })
  }
}

const MessageRouter = require('./message_router')
const router = new MessageRouter()
router.register(/.*/, botHandler)

const MessageProducer = require('./msg_producer').MessageProducer

const supportTypes = [
  'url_verification',
  'app_mention'
]

const listen = (answers) => {
  let verify = process.env.SLACK_VERIFICATION_TOKEN
  return (req, res, next) => {
    if (req.body && verify === req.body.token) {
      let typ = (req.body.event && req.body.event.type) || req.body.type
      switch (typ) {
        case supportTypes[0]:
          res.send(req.body.challenge)
          break
        case supportTypes[1]:
          res.send(200)
          let payload = req.body
          if (payload.event.type === 'app_mention' && 'bot_message' !== payload.event.subtype) {
            router.handle(new MessageProducer(web.chat, 'slackbot', answers, payload.event), payload.event.text)
          }
          break
        default:
          res.send(200)
          break
      }

      // i got it, stop next
      next(false)
    } else {
      // you not slack, next
      next()
    }
  }
}

module.exports = {
  listen
}
