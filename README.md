# solacai

We training and support those intents (and their values):
- drink (drink.location) (impled)
- swear (swear.me,swear.other) (impled swear.me)
- find (image) (not impled, use "tét hình "+query instead)
- conversation (greeting)
- massage_location (massage.location)
- change_my_avatar (change.myavatar)

Flow:
- passive mode:
-> msg router
```javascript
const router = new MessageRouter();
// Order matters!
router.register(/^tét hình .*$/, FindImgCmd);
// router.register(/^tét láo .*$/, TestProactiveCmd);
router.register(/^hép .*$/, helpHandler);
router.register(/.*/, witAiHandler);
```
-> witAiHandler processors
```javascript
// entities processor
const iProcessor = new EntitiesProcessor();
// - complex command
iProcessor.register(FindImgCmd);
// - simple command
iProcessor.register(simpleProcessor, computeMsgDrinkLocation)
// default - return confuse
iProcessor.register(simpleProcessor, data => response.pickRan(response.data.confuse));

```
- proactive mode: NOT implemented

- cmds.register(FindImageCmd, AddReplyCmd, ... )
- WitML.register(drink, conversation, swear, ... )

Note: WitML might use some function of command for getting data/response?
