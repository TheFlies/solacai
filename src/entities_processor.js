/**
 * Simple, order matters, and dummy message routing
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
    for (let handler of this._handlers) {
      // getting the message
      try {
        const msg = handler.computeMessage(data);
        if (msg) {
          return handler.action(session, msg);
        }
      } catch (e) {
        // console.error('can\'t handle data.',e);
        // ignored
      }
    }
    console.warn('A data passed through router with no matched handler.\n', JSON.stringify(data, null, 2));
  }
}

module.exports = EntitiesProcessor;