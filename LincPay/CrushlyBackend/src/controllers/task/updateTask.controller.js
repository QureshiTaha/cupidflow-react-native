const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');
const taskUseCase = require('./taskUseCase');
const logsUseCase = require('../Logs/logs.UseCase');
const userUseCase = require('../users/userUseCase');
const notification = require('../../Modules/notification');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const taskID = req.params.taskID;

      const { title, description, status, priority, due_date, userID } = req.body;

      if (!userID) {
        res.status(400).json({ success: false, message: 'userID is required' });
        return;
      }

      if (!taskID) {
        res.status(400).json({ success: false, message: 'taskID is required in Params' });
      }

      let query = 'UPDATE db_tasks SET ';

      if (title) {
        query += `title = '${title}', `;
      }

      if (description) {
        query += `description = '${description}', `;
      }

      if (status) {
        query += `status = '${status}', `;
        const user = await userUseCase.getUserByUserID(userID);

        // Add to logs
        await logsUseCase.addLogs({
          taskID,
          userID,
          message: `${user[0].userFirstName} ${user[0].userSurname} updated task status to ${status}`,
          log_type: 'system'
        });

        const allUserIDs = await taskUseCase.getAllUsersByTaskID(taskID);

        if (allUserIDs.success && allUserIDs.data.length) {
          for (let i = 0; i < allUserIDs.data.length; i++) {
            if (allUserIDs.data[i] !== userID) {

              await notification.push({
                title: 'Task Status Updated',
                body: `${user[0].userFirstName} ${user[0].userSurname} updated task status to ${status}`,
                userID: allUserIDs.data[i],
                data: {
                  type: 'task_status_updated',
                  taskID,
                  status
                }
              });
            }
          }
        }
      }

      if (priority) {
        query += `priority = '${priority}', `;
      }

      if (due_date) {
        query += `due_date = '${moment(due_date).format('YYYY-MM-DD HH:mm:ss')}', `;
      }

      query += `updated_at = '${moment().format('YYYY-MM-DD HH:mm:ss')}' `;

      query += `WHERE taskID = '${taskID}' `;

      const result = await sqlQuery(query);

      if (result.affectedRows) {
        res.status(200).json({ success: true, message: 'Task updated successfully!' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to update task' });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error Updating task StackTrace: ${error}` });
    }
  };
};
