const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const taskID = req.params.taskID;

      if (!taskID) {
        res.status(400).json({ success: false, message: 'taskID is required in Params' });
      } else {
        await sqlQuery(`DELETE FROM db_tasks WHERE taskID = '${taskID}'`);

        res.status(200).json({ success: true, message: 'Task deleted successfully!' });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error Editing task StackTrace: ${error}` });
    }
  };
};
