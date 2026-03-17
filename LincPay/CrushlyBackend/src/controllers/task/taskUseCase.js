const { v4: uuidv4 } = require('uuid');
const sql = require('../../Modules/sqlHandler');
sqlQuery = sql.sqlQuery;
const moment = require('moment');

module.exports = {
  createTask: async (taskData) => {
    try {
      const taskID = uuidv4();
      const taskTitle = taskData.taskTitle || 'Untitled Task';
      const taskDescription = taskData.taskDescription || '';
      const taskStatus = taskData.taskStatus || 'not_assigned';
      const taskPriority = taskData.taskPriority || 'medium';
      const taskUserID = taskData.taskUserID;
      const taskProjectID = taskData.taskProjectID;
      if (!taskUserID || !taskProjectID) {
        console.error('Missing required fields: taskUserID or taskProjectID');
        return { success: false, message: 'Missing required fields' };
      }

      const query = `
          INSERT INTO db_tasks (
            taskID,
            taskProjectID,
            title,
            description,
            status,
            priority,
            created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

      const values = [taskID, taskProjectID, taskTitle, taskDescription, taskStatus, taskPriority, taskUserID];

      const result = await sqlQuery(query, values);

      if (result.affectedRows) {
        console.log(`Task created with ID: ${taskID}`);
        return {
          success: true,
          data: {
            taskID,
            taskProjectID,
            taskTitle,
            taskDescription,
            taskStatus,
            taskPriority,
            taskUserID
          }
        };
      } else {
        return { success: false, message: 'Failed to create task' };
      }
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, message: error.message };
    }
  },
  getTaskByID: async (taskID) => {
    try {
      const query = `SELECT * FROM db_tasks WHERE taskID = ?`;
      const result = await sqlQuery(query, [taskID]);
      if (result.length > 0) {
        return { success: true, data: result[0] };
      } else {
        return { success: false, message: 'Task not found' };
      }
    } catch (error) {
      console.error('Error getting task by ID:', error);
      return { success: false, message: error.message };
    }
  },
  checkIfExist: async (taskID) => {
    try {
      const query = `SELECT count(1) as count FROM db_tasks WHERE taskID =  ?`;
      const result = await sqlQuery(query, [taskID]);
      console.log(result[0].count);

      if (result.length > 0 && result[0].count > 0) {
        return { success: true, data: result[0] };
      } else {
        return { success: false, message: 'Task not found' };
      }
    } catch (error) {
      console.error('Error getting task by ID:', error);
      return { success: false, message: error.message };
    }
  },
  getAllAssignmentsByTaskID: async (taskID) => {
    try {
      const query = `SELECT * FROM db_task_assignments WHERE task_id = ?`;
      const result = await sqlQuery(query, [taskID]);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting task by ID:', error);
      return { success: false, message: error.message };
    }
  },
  assignTask: async ({ taskID, userID, assignedByUserID }) => {
    try {
      const assignedAt = moment().format('YYYY-MM-DD HH:mm:ss');
      const query = `INSERT INTO db_task_assignments (task_id, assigned_by, assigned_to, assigned_at) VALUES (?, ?, ?, ?)`;
      const result = await sqlQuery(query, [taskID, assignedByUserID, userID, assignedAt]);

      // Update Task status
      const updateQuery = `UPDATE db_tasks SET status = 'pending' WHERE taskID = ?`;
      await sqlQuery(updateQuery, [taskID]);

      if (result.affectedRows) {
        return { success: true, message: 'Task assigned successfully!' };
      } else {
        return { success: false, message: 'Failed to assign task' };
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      return { success: false, message: error.message };
    }
  },
  getAllUsersByTaskID: async (taskID) => {
    try {
      const query = `SELECT * FROM db_task_assignments WHERE task_id = ?`;
      const result = await sqlQuery(query, [taskID]);
      const userIDs = [];
      // Loop all assigned_to and assigned_by ID and get unique UserID
      for (let i = 0; i < result.length; i++) {
        if (!userIDs.includes(result[i].assigned_to)) {
          userIDs.push(result[i].assigned_to);
        }
        if (!userIDs.includes(result[i].assigned_by)) {
          userIDs.push(result[i].assigned_by);
        }
      }

      return { success: true, data: userIDs };
    } catch (error) {
      console.error('Error getting task by ID:', error);
      return { success: false, message: error.message };
    }
  }
};
