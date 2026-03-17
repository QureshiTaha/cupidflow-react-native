const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const projectID = req.params.projectID;

      if (!projectID) {
        res.status(400).json({ success: false, message: 'projectID is required in Params' });
      } else {
        const project = await sqlQuery(`SELECT * FROM db_projects WHERE projectID = '${projectID}'`);

        if (project.length === 0) {
          res.status(400).json({ success: false, message: 'Project not found' });
        } else {
          res.status(200).json({ success: true, message: 'Project found successfully!', data: project });
        }
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error Editing project StackTrace: ${error}` });
    }
  };
};
