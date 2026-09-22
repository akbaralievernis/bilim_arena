class GameLog {
  constructor() {
    this.history = [];
  }

  addEvent(type, message, data = {}, isPublic = true) {
    const event = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      type,
      message,
      data,
      isPublic
    };
    this.history.push(event);
    return event;
  }

  getLogs(isGameOver) {
    if (isGameOver) return this.history;
    return this.history.filter(event => event.isPublic);
  }
}

export default GameLog;
