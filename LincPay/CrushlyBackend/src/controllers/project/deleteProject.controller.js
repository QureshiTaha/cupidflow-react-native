const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const projectID = req.params.projectID;

      if (!projectID) {
        res.status(400).json({ success: false, message: 'projectID is required in Params' });
      } else {
        await sqlQuery(`DELETE FROM db_projects WHERE projectID = '${projectID}'`);

        res.status(200).json({ success: true, message: 'Project deleted successfully!' });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error Editing project StackTrace: ${error}` });
    }
  };
};
