const getLogsByTaskID = require('./getLogsByTaskID.controller');
const getLogsByUserID = require('./getLogsByUserID.controller');
const addLogs = require('./addLogs.controller');
module.exports = (dependencies) => {
  return {
    getLogsByTaskID: getLogsByTaskID(dependencies),
    getLogsByUserID: getLogsByUserID(dependencies),
    addLogs: addLogs(dependencies)
  };
};
