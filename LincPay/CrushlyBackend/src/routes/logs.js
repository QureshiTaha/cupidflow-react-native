const express = require('express');
const { logsController } = require('../controllers');

const { getLogsByTaskID, getLogsByUserID, addLogs } = logsController();

const router = express.Router();
router.route('/by-task/:taskID').get(getLogsByTaskID);
router.route('/by-task/:taskID/:page/:limit').get(getLogsByTaskID);

router.route('/by-user/:userID').get(getLogsByUserID);
router.route('/by-user/:userID/:page/:limit').get(getLogsByUserID);

router.route('/').post(addLogs);

module.exports = router;
