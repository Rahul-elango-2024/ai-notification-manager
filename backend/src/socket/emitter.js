const { getIo } = require("./index");

const emitEvent = (event, data) => {
  const io = getIo();
  io.emit(event, data);
};

module.exports = {
  emitEvent,
};
