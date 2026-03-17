const express = require('express');
const { verifyToken } = require('../Modules/authJwt');
const { projectController } = require('../controllers');

const {
  addProjectController,
  getProjectByIDController,
  deleteProjectController,
  editProjectController,
  getAllProjectsController
} = projectController();

const router = express.Router();
router.route('/').post(addProjectController);
router.route('/').get(getAllProjectsController);
router.route('/edit/:projectID').put(editProjectController);
router.route('/get/:projectID').get(getProjectByIDController);
router.route('/:projectID').delete(deleteProjectController);

module.exports = router;
