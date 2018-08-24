/**
 * Simple, order matters, and dummy message routing
 * original code by Huy Le: https://runkit.com/huylenq/59ba42457e8de600126d3810
 */
class EntitiesProcessor {
  constructor() {
    this._handlers = [];
    this.register = this.register.bind(this);
    this.process = this.process.bind(this);
  }

  register(handler, computeMessage) {
    this._handlers.push({
      computeMessage: computeMessage || handler.computeMessage,
      action: handler.action
    });
  }

  process(session, data) {
    console.log('wit data: \n'+JSON.stringify(data, null, 2));
    for (let handler of this._handlers) {
      // getting the message
      try {
        const msg = handler.computeMessage(data);
        if (msg) {
          return handler.action(session, msg);
        }
      } catch (e) {
        console.log(`Skipping through next handler. ${e.message}`);
        // ignored
      }
    }
    console.warn('A data passed through router with no matched handler.\n', JSON.stringify(data, null, 2));
  }
}

/**
 * validate the wit.ai response
 * @param {*} data The response from wit.ai
 * @param {*} entity The entity that we want to validate
 * @param {*} value The value that we want to process
 */
const validateWitAIMsg = (data, entity, value) => {
  if (!data || !data.entities || !data.entities[entity]) {
    throw new Error('This is not `' + entity + '` entity');
  }
  const e = data.entities[entity].reduce((max, f) => ((f.confidence < max.confidence) ? f : max), data.entities[entity][0]);

  if (!e || value != e['value']) {
    throw new Error('Not enough confidence or not ' + value);
  }

  return e;
};

module.exports = {
  EntitiesProcessor, validateWitAIMsg 
};