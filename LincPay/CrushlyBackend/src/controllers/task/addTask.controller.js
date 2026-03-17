const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');
const taskUseCase = require('./taskUseCase');
const userUseCase = require('../users/userUseCase');
const projectUseCase = require('../project/projectUseCase');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const taskID = uuidv4();
      const taskTitle = req.body.taskTitle || 'Untitled Task';
      const taskDescription = req.body.taskDescription || '';
      const taskStatus = req.body.taskStatus || 'not_assigned';
      const taskPriority = req.body.taskPriority || 'medium';
      const taskUserID = req.body.taskUserID;
      const taskProjectID = req.body.taskProjectID;
      console.log(req.body);

      if (!taskUserID || !taskProjectID) {
        console.error('Missing required fields: taskUserID or taskProjectID');
        return res
          .status(400)
          .json({ success: false, message: 'Missing required fields: taskUserID or taskProjectID' });
      }

      const validateUser = await userUseCase.getUserByUserID(taskUserID);
      const validateProjectID = await projectUseCase.getProjectByID(taskProjectID);
      console.log(validateProjectID);

      if (!validateUser.length) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }
      if (!validateProjectID.success) {
        return res.status(400).json({ success: false, message: 'Project not found' });
      }

      const task = await taskUseCase.createTask({
        taskID,
        taskTitle,
        taskDescription,
        taskStatus,
        taskPriority,
        taskUserID,
        taskProjectID
      });

      if (task.success) {
        res.status(200).json({
          success: true,
          message: 'Task created successfully!',
          data: {
            taskID,
            taskTitle,
            taskDescription,
            taskStatus,
            taskPriority,
            taskUserID,
            taskProjectID
          }
        });
      } else {
        res.status(400).json({ success: false, message: task.message });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error creating task StackTrace: ${error}` });
    }
  };
};
