const builder = require('botbuilder')

const MSBOT = 'msbot'
const SLACKBOT = 'slackbot'

const ME = process.env.SLACK_ME_TEXT

/**
 * Attach an internet image and send it to user
 * @param {*} session current conversation session
 * @param {*} url The image url on Internet
 * @param {*} contentType MIME type of the image
 * @param {*} attachmentFileName Custom file name of attachment
 */
function buildMSImageAttachedMsg(session, url, contentType, attachmentFileName) {
  return new builder.Message(session)
    .addAttachment({
      contentUrl: url,
      contentType: contentType,
      name: attachmentFileName
    })
}

function buildSlackImgAttachedMsg(channel, url) {
  return {
    channel,
    text: url
  }
}

class MessageProducer {
  constructor(producer, botType, answers, event) {
    this._producer = producer
    this._bot_type = botType
    this._event = event

    this.answers = answers
  }

  get() {
    return this._producer
  }

  makeImgAttachedMsg(url, contentType, attachmentFileName) {
    if (this._bot_type === 'msbot') {
      return new builder.Message(this._producer)
        .addAttachment({
          contentUrl: url,
          contentType: contentType,
          name: attachmentFileName
        })
    } else {
      return buildSlackImgAttachedMsg(this._event.channel, url)
    }
  }

  send(msgs, end) {
    switch (this._bot_type) {
      case MSBOT: this._mssend(msgs, end)
      break
      case SLACKBOT: this._slacksend(msgs)
      break
      default: throw new Exception('Your bot is not supported')
    }
  }

  invalidateMessage(msg) {
    let ret = msg
      .replace(ME, '').trim()
    return ret
  }

  _mssend(msgs, end) {
    if (typeof msgs === 'array') {
      let lastIdx = msgs.length - 1
      for (let i = 0; i < msgs.length - 1; i++) {
        this._producer.send(msgs[i])
      }
      this._producer.endDialog(msgs[lastIdx])
    } else {
      this._producer.sfunc = end ? this._producer.send : this._producer.endDialog
      this._producer.sfunc(msgs)
    }
  }

  _slacksend(msgs) {
    if (typeof msgs === 'array') {
      let lastIdx = msgs.length - 1
      for (let i = 0; i < msgs.length - 1; i++) {
        this._producer.postMessage({ channel: this._event.channel, text: msgs[i] })
      }
      this._producer.postMessage({ channel: this._event.channel, text: msgs[lastIdx] })
    } else {
      this._producer.postMessage({ channel: this._event.channel, text: msgs })
    }
  }
}

const makeProducer = (data, type) => new MessageProducer(data, type)

module.exports = {
  MessageProducer,
  makeProducer
}
