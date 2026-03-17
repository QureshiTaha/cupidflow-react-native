const { v4: uuidv4 } = require('uuid');
const sql = require('../../Modules/sqlHandler');
sqlQuery = sql.sqlQuery;
const moment = require('moment');

module.exports = {
  getProjectByID: async (projectID) => {
    try {
      const query = `SELECT * FROM db_projects WHERE projectID = ?`;
      const result = await sqlQuery(query, [projectID]);
      if (result.length > 0) {
        return { success: true, data: result[0] };
      } else {
        return { success: false, message: 'Task not found' };
      }
    } catch (error) {
      console.error('Error getting task by ID:', error);
      return { success: false, message: error.message };
    }
  }
};
