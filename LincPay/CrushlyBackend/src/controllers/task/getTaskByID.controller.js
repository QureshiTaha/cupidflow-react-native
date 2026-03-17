const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');
const taskUseCase = require('./taskUseCase');
const userUseCase = require('../users/userUseCase');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      let sendData = {};
      const taskID = req.params.taskID;
      const task = await taskUseCase.getTaskByID(taskID);
      sendData = { ...task.data };

      const taskAssignments = await taskUseCase.getAllAssignmentsByTaskID(taskID);
      if (taskAssignments.success) {
        sendData.assignments = [];
        // task.data.assignments = taskAssignments.data;
        for (let index = 0; index < taskAssignments.data.length; index++) {
          const assignment = taskAssignments.data[index];
          let assignedBy_user = await userUseCase.getUserByUserID(assignment.assigned_by);
          let assignedTo_user = await userUseCase.getUserByUserID(assignment.assigned_to);
          assignedTo_user.assigned_at = moment(assignment.assigned_at).format('YYYY-MM-DD HH:mm:ss');

          assignment.assigned_by = assignedBy_user;
          assignment.assigned_to = assignedTo_user;

          sendData.assignments.push(assignment);
        }
      }

      if (task.success) {
        res.status(200).json({ success: true, message: 'Task found successfully!', data: sendData });
      } else {
        res.status(400).json({ success: false, message: task.message });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `zError finding task StackTrace: ${error}` });
    }
  };
};
