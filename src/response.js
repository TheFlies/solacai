var FindImgCmd = require('./find_img_cmd');
var util = require('./util');

//----------------------
// The response dictionary
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

var conversationGreeting = [
  "xin chào",
  "konichiwa",
  "hai hai",
  "hello",
  "chào anh"
];

var data = {
  "drinkLocation": drinkLocation,
  "swearMe": swearMe,
  "confuse": confuse,
  "conversationGreeting": conversationGreeting
};

/**
 * Pick a random message in the Array
 * @param {*Array} dic The arrays of possible reply messages
 */
function pickRan(dic) {
  var rnum = util.getRandomInt(0, dic.length - 1);
  return dic[rnum] || dic[0];
}

function getMessage(intents, query, session) {
  var msg = null;

  if (intents && intents.length > 0) {
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
        case "find.image":
          console.log("query: " + JSON.stringify(query[0]));
          if (query[0] && query[0].confidence >= 0.7) {
            FindImgCmd.googleImageSearch(session, query[0].value);
          }
          break;
        case "conversation.greeting": msg = pickRan(conversationGreeting)
        break;
        default: break;
      }
    }
  }
  return msg;
}

module.exports = {
  data, pickRan, getMessage
}
