const { v4: uuidv4 } = require('uuid');
const sql = require('../../Modules/sqlHandler');
sqlQuery = sql.sqlQuery;
const moment = require('moment');

module.exports = {
  addLogs: async function (data) {
    try {
      if (!data.userID || !data.message) {
        console.error('Missing required fields: userID, message');
        return { success: false, message: 'Missing required fields userID, message' };
      }
      const query = `INSERT INTO db_logs (logID,userID, taskID, log_type, message, timestamp ) VALUES (?,?,?,?,?,?)`;
      const result = await sqlQuery(query, [
        uuidv4(),
        data.userID,
        data.taskID ? data.taskID : null,
        data.log_type ? data.log_type : 'system',
        data.message,
        moment().format('YYYY-MM-DD HH:mm:ss')
      ]);
      if (result.affectedRows) {
        return { success: true, message: 'Log added successfully!' };
      } else {
        return { success: false, message: 'Failed to add log' };
      }
    } catch (error) {
      console.error('Error adding log:', error);
      return { success: false, message: error.message };
    }
  },
  getLogsByTaskID: async function ({ taskID, page, limit }) {
    try {
      const _page = page ? page : 1;
      const _limit = limit ? limit : 10;
      const query = `SELECT * FROM db_logs WHERE taskID = ? ORDER BY timestamp DESC LIMIT ${_limit} OFFSET ${
        (_page - 1) * _limit
      }`;
      const result = await sqlQuery(query, [taskID]);
      const totalCount = await sqlQuery(`SELECT count(1) as count FROM db_logs WHERE taskID = ?`, [taskID]);
      if (result.length > 0) {
        return { success: true, data: { logs: result, totalCount: totalCount[0].count } };
      } else {
        return { success: false, message: 'Logs not found' };
      }
    } catch (error) {
      console.error('Error getting logs by task ID:', error);
      return { success: false, message: error.message };
    }
  },

  getLogsByUserID: async function ({ userID, page = 1, limit = 10 }) {
    try {
      const _limit = Number(limit);
      const _offset = (Number(page) - 1) * _limit;

      const query = `
        SELECT 
          dl.*, 
          IF(dl.log_type = 'system', 'system', CONCAT(u.userFirstName, ' ', u.userSurname)) AS userName
        FROM db_logs dl
        LEFT JOIN db_users u 
          ON dl.userID = u.userID AND dl.log_type = 'user'
        WHERE 
          dl.userID = ? 
          OR dl.taskID IN (
            SELECT DISTINCT task_id 
            FROM db_task_assignments 
            WHERE assigned_by = ? OR assigned_to = ?
          )
        ORDER BY dl.timestamp DESC
        LIMIT ? OFFSET ?
      `;

      const result = await sqlQuery(query, [userID, userID, userID, _limit, _offset]);

      const countQuery = `
        SELECT COUNT(*) AS count
        FROM db_logs dl
        WHERE 
          dl.userID = ? 
          OR dl.taskID IN (
            SELECT DISTINCT task_id 
            FROM db_task_assignments 
            WHERE assigned_by = ? OR assigned_to = ?
          )
      `;

      const totalCountResult = await sqlQuery(countQuery, [userID, userID, userID]);

      return {
        success: true,
        data: {
          logs: result,
          totalCount: totalCountResult[0]?.count || 0
        }
      };
    } catch (error) {
      console.error('Error getting logs by user ID:', error);
      return { success: false, message: error.message };
    }
  }
};
