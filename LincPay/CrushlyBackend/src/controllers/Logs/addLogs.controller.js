const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');
const logsUseCase = require('./logs.UseCase');
const taskUseCase = require('../task/taskUseCase');
const notification = require('../../Modules/notification');

module.exports = (dependencies) => {
  return async (req, res) => {
    const { taskID, userID, message, log_type } = req.body;
    console.log(taskID, userID, message, log_type);

    const result = await logsUseCase.addLogs({ taskID, userID, message, log_type });

    const allUserIDs = await taskUseCase.getAllUsersByTaskID(taskID);
    
    if (allUserIDs.success && allUserIDs.data.length) {
      for (let i = 0; i < allUserIDs.data.length; i++) {
        console.log('Sending to', allUserIDs.data[i]);
        if (allUserIDs.data[i] !== userID) {
          await notification.push({
            title: 'New Message on task',
            body: `${message}`,
            userID: allUserIDs.data[i],
            data: {
              type: 'task_message',
              taskID,
            }
          });
        }
      }
    }

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  };
};
