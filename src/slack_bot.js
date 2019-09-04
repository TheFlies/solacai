const supportTypes = [
  'url_verification',
  'app_mention'
]

const listen = () => {
  console.log('init slack bot he')
  let atok = process.env.SLACK_AUTH_TOKEN
  let btok = process.env.SLACK_BOT_USER_AUTH_TOKEN
  return (req, res, next) => {
    if (req.body && supportTypes.indexOf(req.body.type) >= 0) {
      switch (req.body.type) {
        case supportTypes[0]:
          res.send(req.body.challenge)
          break
        case supportTypes[1]:
          res.send('hello')
        default:
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
