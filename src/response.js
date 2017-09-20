var FindImgCmd = require('./find_img_cmd');
var util = require('./util');

var solacaiDatabase;

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
  "xin lỗi, em chỉ là con bot.",
  "à, hiểu, mà hỏi người khác đi nha",
  "trời xanh xanh ngát xanh gió tung tăng trên lá xanh!"
];

var bug = [
  "bug!!! BUG!!!!!",
  "lỗi nặng rồi!! CỨU với",
  "xong! chắc server chết rồi!"
];

var conversationGreeting = [
  "xin chào",
  "konichiwa",
  "hai hai",
  "hello",
  "chào anh"
];

var conversationBye = [
  "tạm biệt",
  "bái bai",
  "good bye"
];

var data = {
  "drinkLocation": drinkLocation,
  "swearMe": swearMe,
  "confuse": confuse,
  "conversationGreeting": conversationGreeting,
  "conversationBye": conversationBye,
  "bug": bug
};

/**
 * Pick a random message in the Array
 * @param {*Array} dic The arrays of possible reply messages
 */
function pickRan(dic) {
  var rnum = util.getRandomInt(0, dic.length - 1);
  return dic[rnum] || dic[0];
}

function setDatabase(db) {
  solacaiDatabase = db;

  let dcol = db.collection('drinkLocation');
  // initialize db if empty
  dcol.find({}, function(err, dls) {
    data.drinkLocation = [];
    dls.each((err, dl) => {
      data.drinkLocation.push(dl);
    });
    if (data.drinkLocation.length==0) {
      data.drinkLocation = drinkLocation.map((s) => {return {"value":s};} );
    }
  });
}

function list(c, q) {
  // TODO fix query
  return solacaiDatabase.collection(c).find({}).toArray();
}

module.exports = {
  data, pickRan, setDatabase, list
}
