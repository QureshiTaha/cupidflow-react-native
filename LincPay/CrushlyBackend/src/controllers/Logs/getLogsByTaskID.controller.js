const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');
const logsUseCase = require('./logs.UseCase');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const taskID = req.params.taskID;

      if (!taskID) {
        res.status(400).json({ success: false, message: 'taskID is required in Params' });
      } else {
        const logs = await logsUseCase.getLogsByTaskID({ taskID, page: req.query.page, limit: req.query.limit });
        if (logs.success) {
          res.status(200).json({ success: true, message: 'Logs fetched successfully!', data: logs.data });
        } else {
          res.status(400).json({ success: false, message: logs.message });
        }
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error Editing project StackTrace: ${error}` });
    }
  };
};
