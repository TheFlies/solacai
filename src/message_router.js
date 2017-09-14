/**
 * Simple, order matters, and dummy message routing
 */
class MessageRouter {
    constructor() {
        this._handlers = [];
        this.register = this.register.bind(this);
        this.handle = this.handle.bind(this);
    }

    register(pattern, handler) {
        this._handlers.push({
            pattern: new RegExp(pattern),
            action: handler.action || handler
        });
    }

    handle(session, message) {
        for (let handler of this._handlers) {
            try {
                if (message && message.match(handler.pattern)) {
                    return handler.action(session, message);
                }
            } catch (e) {
                console.error(`Error occured on message ${message}! Skipping through next handler.`, e);
            }
        }
        console.warn('A message passed through router with no matched handler.', message);
    }
}

module.exports = 
    MessageRouter;