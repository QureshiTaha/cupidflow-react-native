const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const { search, page, limit } = req.query;
      const { userID } = req.params;

      if (!userID) return res.status(400).json({ success: false, message: 'UserID is required' });

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
        LEFT JOIN db_task_assignments ON db_tasks.taskID = db_task_assignments.task_id
        WHERE db_task_assignments.assigned_to = ? || db_task_assignments.assigned_by = ? || db_tasks.created_by = ?
      `;

      // Add search condition if provided
      if (_search) {
        query += ` AND (db_tasks.title LIKE ? OR db_tasks.description LIKE ?) `;
      }

      query += `
        ORDER BY db_tasks.created_at DESC
        LIMIT ? OFFSET ?
      `;

      if (_search) {
        params = [userID, userID, userID, _search, _search, _limit, (_page - 1) * _limit];
      } else {
        params = [userID, userID, userID, _limit, (_page - 1) * _limit];
      }

      const tasks = await sqlQuery(query, params);

      // // remove with duplicate task ID
      filterTasks = tasks.filter((task, index) => {
        return tasks.findIndex((t) => t.taskID === task.taskID) === index;
      });
      

      if (tasks.length === 0) {
        res.status(400).json({ success: false, message: 'Tasks not found' });
      } else {
        res.status(200).json({ success: true, message: 'Tasks found successfully!', data: filterTasks });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error fetching tasks. StackTrace: ${error}` });
    }
  };
};
