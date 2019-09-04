const { WebClient } = require('@slack/web-api')

// let atok = process.env.SLACK_AUTH_TOKEN
let btok = process.env.SLACK_BOT_USER_AUTH_TOKEN
const web = new WebClient(btok)

const supportTypes = [
  'url_verification',
  'app_mention'
]

const listen = () => {
  let verify = process.env.SLACK_VERIFICATION_TOKEN
  return (req, res, next) => {
    console.log(btok)
    if (req.body && verify === req.body.token) {
      switch (req.body.event.type) {
        case supportTypes[0]:
          res.send(req.body.challenge)
          break
        case supportTypes[1]:
          res.send(200)

          let payload = req.body
          if (payload.event.type === 'app_mention' && 'bot_message' !== payload.event.subtype) {
            if (payload.event.text.includes('test')) {
              web.chat.postMessage({ channel: payload.event.channel, text: ' echo!' })
                .then(() => console.log('sent'))
                .catch(err => console.error(err))
            }
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
