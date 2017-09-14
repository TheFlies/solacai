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
-> msg comming

    cmds.process(msg)
      .then((res) ->
         reply(res)
      ).catch((err) ->
         witML.process(msg)
             then((res) ->
                 reply(res)
             ).catch((err) ->
                 reply(confused)
             )
      )

- proactive mode: NOT implemented

- cmds.register(FindImageCmd, AddReplyCmd, ... )
- WitML.register(drink, conversation, swear, ... )

Note: WitML might use some function of command for getting data/response?
