/**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * Using Math.round() will give you a non-uniform distribution!
   */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random message in the Array
 * @param {*Array} dic The arrays of possible reply messages
 */
function pickRan(dic) {
  var rnum = getRandomInt(0, dic.length - 1);
  return dic[rnum] || dic[0];
}

function removeBotInformation(bot, entities, sourceEvent, msg) {
  let ret = msg
  if (bot) {
    if (entities && sourceEvent && sourceEvent.text) {
      let st = sourceEvent.text
      if (st.replace(/<\/?[^>]+(>|$)/g, '') === ret) {
        let hashAt = entities.filter((m) => m.mentioned && bot.id === m.mentioned.id)[0]
        if (hashAt) {
          console.log('Oh we got mentioned - ' + JSON.stringify(hashAt))
          ret = st.replace(hashAt.text, '').replace(/<\/?[^>]+(>|$)/g, '')
          console.log('cleaned return value: ' + ret)
        }
      }
    }

    return ret
      .replace('@' + bot.name, '')
      .replace('@' + bot.id, '')
      .replace('Edited previous message:', '')
      .replace(/<e_m[^>]*>.*<\/e_m>/, '')
      .replace('@Ruồi Sờ Là Cai', '').trim() // still need to remove cached old name
  }

  return msg
}

module.exports = {
  pickRan
};
