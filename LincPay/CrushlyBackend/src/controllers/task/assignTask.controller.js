const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');
const notification = require('../../Modules/notification');
const taskUseCase = require('./taskUseCase');
const userUseCase = require('../users/userUseCase');
const projectUseCase = require('../project/projectUseCase');
const logsUseCase = require('../Logs/logs.UseCase');

module.exports = (dependencies) => {
  return async (req, res) => {
    try {
      const { taskID, userID, assignedByUserID } = req.body;

      if (!taskID || !userID || !assignedByUserID) {
        return res
          .status(400)
          .json({ success: false, message: 'Missing required fields: taskID or userID or assignedByUserID' });
      }

      const task = await taskUseCase.checkIfExist(taskID);
      const user = await userUseCase.getUserByUserID(userID);
      const assignedByUser = await userUseCase.getUserByUserID(assignedByUserID);
      if (!task.success) {
        return res.status(400).json({ success: false, message: 'Task not found' });
      } else if (!user.length) {
        return res.status(400).json({ success: false, message: 'User not found' });
      } else if (!assignedByUser.length) {
        return res.status(400).json({ success: false, message: 'assignedByUser not found' });
      }

      const assignTask = await taskUseCase.assignTask({ taskID, userID, assignedByUserID });
      if (assignTask.success) {
        // Add to logs
        await logsUseCase.addLogs({
          taskID,
          userID,
          message: `${assignedByUser[0].userFirstName} ${assignedByUser[0].userSurname} assigned task to ${user[0].userFirstName} ${user[0].userSurname}`,
          log_type: 'system'
        });

        // Send Push Notification
        notification.push({
          title: 'Task Assigned',
          body: `Task ${task.data.title} has been assigned to you by ${assignedByUser[0].userFirstName} ${assignedByUser[0].userSurname}.`,
          userID: user[0].userID,
          data: JSON.stringify({
            taskID: task.data.taskID,
            title: task.data.title,
            description: task.data.description,
            status: task.data.status,
            priority: task.data.priority,
            due_date: task.data.due_date,
            assigned_by: assignedByUser[0].userID,
            assigned_to: user[0].userID,
            assigned_at: moment().format('YYYY-MM-DD HH:mm:ss')
          })
        });
        res.status(200).json({ success: true, message: 'Task assigned successfully!' });
      } else {
        res.status(400).json({ success: false, message: assignTask.message });
      }
    } catch (error) {}
  };
};
