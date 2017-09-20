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

module.exports = {
  pickRan
};
