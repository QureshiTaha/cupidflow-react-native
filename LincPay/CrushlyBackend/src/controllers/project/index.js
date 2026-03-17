const addProjectController = require('./addProject.controller');
const editProjectController = require('./editProject.controller');
const deleteProjectController = require('./deleteProject.controller');
const getProjectByIDController = require('./getProjectByID.controller');
const getAllProjectsController = require('./getAllProjects.controller');
module.exports = (dependencies) => {
  return {
    getAllProjectsController: getAllProjectsController(dependencies),
    addProjectController: addProjectController(dependencies),
    editProjectController: editProjectController(dependencies),
    deleteProjectController: deleteProjectController(dependencies),
    getProjectByIDController: getProjectByIDController(dependencies),
  };
};
