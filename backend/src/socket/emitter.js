const { getIo } = require("./index");

const emitEvent = (event, data) => {
  try {
    getIo().emit(event, data);
  } catch (error) {
    console.warn(`Socket event '${event}' was not delivered:`, error.message);
  }
};

module.exports = {
  emitEvent,
};
