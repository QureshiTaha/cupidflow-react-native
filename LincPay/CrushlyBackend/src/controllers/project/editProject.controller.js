const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const projectID = req.params.projectID;
      const projectName = req.body.projectName;
      const projectDescription = req.body.projectDescription;

      if (!projectID ) {
        res.status(400).json({ success: false, message: 'projectID is required in Params' });
      } else {
        // Keys to update
        const keys = [];

        // Values to update
        const values = [];

        if (projectName) {
          keys.push('name');
          values.push(projectName);
        }

        if (projectDescription) {
          keys.push('description');
          values.push(projectDescription);
        }

        if (keys.length === 0) {
          res.status(400).json({ success: false, message: 'No fields to update' });
        } else {
          await sqlQuery(
            `UPDATE db_projects SET ${keys.map((key, index) => `${key} = ?`).join(', ')} WHERE projectID = ?`,
            [...values, projectID]
          );

          const project = await sqlQuery(`SELECT * FROM db_projects WHERE projectID = '${projectID}'`);

          if (project.length === 0) {
            res.status(400).json({ success: false, message: 'Error Editing project' });
          } else {
            res.status(200).json({ success: true, message: 'Project edited successfully!', data: project });
          }
        }
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error Editing project StackTrace: ${error}` });
    }
  };
};
