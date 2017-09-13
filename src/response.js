var FindImgCmd = require('./find_img_cmd')
var util = require('./util')

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

/**
   * Attach an internet image and send it to user
   * @param {*} session current conversation session
   * @param {*} url The image url on Internet
   * @param {*} contentType MIME type of the image
   * @param {*} attachmentFileName Custom file name of attachment
   */
function buildImageAttachedMsg(session, url, contentType, attachmentFileName) {
  return new builder.Message(session)
    .addAttachment({
      contentUrl: url,
      contentType: contentType,
      name: attachmentFileName
    });
}

module.exports = {
  data: {
    "drinkLocation": drinkLocation,
    "swearMe": swearMe,
    "confuse": confuse
  },
  imageResponsedHandler: function (session, images) {
    var defaultMsg;
    if (images && images.items && images.items.length > 9) {
      var r = images.items[util.getRandomInt(0, 9)]
      if (r) {
        var url = r.link;
        var type = r.mime;
        if (type != null) {
          defaultMsg = buildImageAttachedMsg(session, url, type, null);
        }
      }
    }
    return defaultMsg;
  },
  /**
   * Pick a random message in the Array
   * @param {*Array} dic The arrays of possible reply messages
   */
  pickRan: function (dic) {
    var rnum = util.getRandomInt(0, dic.length - 1);
    return dic[rnum] || dic[0];
  },

  getMessage: function (intents, query, session) {
    var msg = null;

    if (intents && intents.length > 0) {
      var i = 0;
      while (intents[i] && intents[i].confidence < 0.9) {
        i++;
      }

      if (i < intents.length) {
        switch (intents[i].value) {
          case "drink.location": msg = this.pickRan(this.drinkLocation);
            break;
          case "swear.me": msg = this.pickRan(this.swearMe);
            break;
          case "find.image":
            console.log("query: " + JSON.stringify(query[0]))
            if (query[0] && query[0].confidence >= 0.7) {
              FindImgCmd.googleImageSearch(session, query[0].value);
            }
            break;
          default: break;
        }
      }
    }
    return msg;
  }
}