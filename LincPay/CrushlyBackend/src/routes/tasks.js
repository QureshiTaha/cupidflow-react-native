const express = require('express');
const { taskController } = require('../controllers');

const { getAllTasksController, addTaskController,updateTaskController, getTaskByIDController, deleteTaskController, assignTaskController,TaskAssignedToMeController } =
  taskController();

const router = express.Router();
router.route('/').get(getAllTasksController);
router.route('/assigned-to-me/:userID').get(TaskAssignedToMeController);
router.route('/').post(addTaskController);
router.route('/get/:taskID').get(getTaskByIDController);
router.route('/:taskID').put(updateTaskController);
router.route('/:taskID').delete(deleteTaskController);
router.route('/assign').post(assignTaskController);

module.exports = router;

