// ----------------------
// The default data
var drinkLocation = [
  'La Cà - Ngô Thị Thu Minh ố ô ỳe ye',
  'La Cà - Đường Phố - Hoàng Sa - Bờ kè thoáng mát hợp vệ sinh ngon lắm anh êy',
  '1B - Thích Quảng Đức Bưởi da trắng, Cam Đào Mận Xoài đủ cả (heart)',
  'Nhậu thì ra 45 - Phan Đăng Lưu, thơm mũi mát mắt nha mấy anh'
];

var swearMe = [
  'sao anh chửi em?',
  'em vô tội',
  'ngon nhào vô đi!',
  'cám ơn, anh cũng vậy'
];

var confuse = [
  'xin lỗi, em bị ngu',
  'xin lỗi, em chỉ là con bot.',
  'à, hiểu, mà hỏi người khác đi nha',
  'trời xanh xanh ngát xanh gió tung tăng trên lá xanh!'
];

var bug = [
  'bug!!! BUG!!!!!',
  'lỗi nặng rồi!! CỨU với',
  'xong! chắc server chết rồi!'
];

var conversationGreeting = [
  'xin chào',
  'konichiwa',
  'hai hai',
  'hello',
  'chào anh'
];

var conversationBye = [
  'tạm biệt',
  'bái bai',
  'good bye'
];

var conversationKhen = [
  'chiện nhỏ',
  '(heart)',
  'cảm ơn',
  'mọi chuyện dễ cứ để em lo cho'
];

var data = {
  'drinkLocation': drinkLocation,
  'swearMe': swearMe,
  'confuse': confuse,
  'conversationGreeting': conversationGreeting,
  'conversationBye': conversationBye,
  'conversationKhen': conversationKhen,
  'bug': bug
};

class DatabaseCmd {
  constructor(db) {
    this._db = db;

    this.initialize = this.initialize.bind(this);
    this.action = this.action.bind(this);
    this.list = this.list.bind(this);

    this.initialize();
  }

  getData() {
    return data;
  }

  action(session, msg) {
    let data = msg.split('db: ')[1].split(' ');
    let cmd = data.shift().trim();
    let collection = data.shift().trim();
    switch (cmd) {
      case 'list':
        this
          .list(collection, data)
          .then((res)=>{
            session.endDialog(JSON.stringify(res), null, 2);
          })
          .catch(()=>session.endDialog('lấy ko được data. code lại đi'));
        break;
      case 'add':
        let value = data.join(' ');
        this.save(collection, value).then((res)=>session.endDialog(JSON.stringify(res), null, 2))
          .catch(()=>session.endDialog('ko save được rồi'));
        break;
      default:
        session.endDialog('unknown command');
        break;
    }
  }

  list(c) {
    // TODO fix query
    return this._db.collection(c).find({}).toArray();
  }

  save(c, v) {
    return this._db.collection(c).insertOne({'value':v});
  }

  initialize() {

    Object.keys(data).forEach(val => {
      console.log(`${val} : ${data[val]}`);
      this._db.collection(val).find({}).toArray().then((res) => {
        if (!res.length) this._db.collection(val).insert(data[val].map(s => ({'value' : s})));
        else
          data[val] = res.map(v => v.value);
      });
    });
  }
}

module.exports = {
  DatabaseCmd, data
};