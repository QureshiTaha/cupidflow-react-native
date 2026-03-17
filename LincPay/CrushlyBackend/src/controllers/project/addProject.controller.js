const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const projectID = uuidv4();
      const projectName = req.body.projectName;
      const projectDescription = req.body.projectDescription;

      if (!projectName || !projectDescription) {
        res.status(400).json({ success: false, message: 'projectName and projectDescription are required' });
      } else {
        await sqlQuery(
          `INSERT INTO db_projects (projectID, name, description) VALUES ('${projectID}', '${projectName}', '${projectDescription}')`
        );

        const project = await sqlQuery(`SELECT * FROM db_projects WHERE projectID = '${projectID}'`);

        if (project.length === 0) {
          res.status(400).json({ success: false, message: 'Error adding project' });
        } else {
          res.status(200).json({ success: true, message: 'Project added successfully!', data: project });
        }
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error adding project StackTrace: ${error}` });
    }
  };
};
