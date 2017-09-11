var restify = require('restify');
var builder = require('botbuilder');
var Scraper = require('images-scraper')
, google = new Scraper.Google()
, bing = new Scraper.Bing()

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
    appId: "13a25d76-e2ba-455c-aef8-fc4ee079a4c2",
    appPassword: "4gT0TdkA57nwJi5Raoaj9wM"
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// ok bot
var bot = new builder.UniversalBot(connector);

//Bot on
bot.on('contactRelationUpdate', function(message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
            .address(message.address)
            .text("Chào anh %s... em là Ruồi", name || 'ấy');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('typing', function(message) {
    // User is typing
});

bot.dialog('/', function(session) {
    var msg = session.message.text.toLocaleLowerCase()
    console.log('>>> %s', msg)
    if (msg.indexOf('tét hình')>=0) {
        // var url = 'https://docs.microsoft.com/en-us/bot-framework/media/how-it-works/architecture-resize.png';
        // sendInternetUrl(session, url, 'image/png', 'BotFrameworkOverview.png');
        var kb = msg.split('tét hình');
        if (kb.length == 2 && kb[1]!=='tét hình') {
            google.list({
                keyword: kb[1],
                num: 3,
                detail: true,
                nightmare: {
                    show: true
                }
            })
            .then(function (res) {
                var r = res[getRandomInt(0,2)]
                console.log('first 10 results from google', res);
                if (r) {
                    var url = r.url;
                    var type = r.type || calType(r.format) || calType(url.substr(url.length - 3));
                    if (type != null) {
                        sendInternetUrl(session, url, type, null);
                    }
                } else
                    session.send("Hong lay duoc content type");
            }).catch(function(err) {
                console.log('err', err);
            });
        }
    }
});

function calType(type) {
    switch (type) {
        case 'jpg':
        case 'jpeg':
        return 'image/jpg';
        case 'png':
        return 'image/png';
        default:
        return null
    }
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sends attachment using an Internet url
function sendInternetUrl(session, url, contentType, attachmentFileName) {
    var msg = new builder.Message(session)
        .addAttachment({
            contentUrl: url,
            contentType: contentType,
            name: attachmentFileName
        });

    session.send(msg);
}