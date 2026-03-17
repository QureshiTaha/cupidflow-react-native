const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const { search, page, limit } = req.query;

      const _page = page ? page : 1;
      const _limit = limit ? limit : 10;
      const _search = search ? `%${search}%` : '';

      // Prepare the base query
      let query = `
        SELECT 
          db_tasks.*, 
          CONCAT(TRIM(COALESCE(db_users.userFirstName, '')), ' ', TRIM(COALESCE(db_users.userSurname, ''))) AS created_by_UserName, 
          db_projects.name AS projectName 
        FROM db_tasks
        LEFT JOIN db_users ON db_tasks.created_by = db_users.userID
        LEFT JOIN db_projects ON db_tasks.taskProjectID = db_projects.projectID
      `;

      // Add search condition if provided
      if (_search) {
        query += ` WHERE (db_tasks.title LIKE ? OR db_tasks.description LIKE ?) `;
      }

      query += `
        ORDER BY db_tasks.created_at DESC
        LIMIT ? OFFSET ?
      `;

      // Parameters for the query
      const params = _search ? [_search, _search, _limit, (_page - 1) * _limit] : [_limit, (_page - 1) * _limit];

      const tasks = await sqlQuery(query, params);

      if (tasks.length === 0) {
        res.status(400).json({ success: false, message: 'Tasks not found' });
      } else {
        res.status(200).json({ success: true, message: 'Tasks found successfully!', data: tasks });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error fetching tasks. StackTrace: ${error}` });
    }
  };
};
