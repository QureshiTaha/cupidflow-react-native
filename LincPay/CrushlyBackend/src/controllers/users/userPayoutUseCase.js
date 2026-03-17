const { sqlQuery } = require('../../Modules/sqlHandler');
const moment = require('moment');
const bcrypt = require('bcrypt');



module.exports = {
  checkIfExist: async function ({ userID }) {
    try {
      const query = `SELECT d.*, c.count
          FROM db_userpayout_details d
          JOIN (
              SELECT COUNT(1) AS count
              FROM db_userpayout_details
              WHERE userID = '${userID}'
              ) c
          WHERE d.userID = '${userID}'; `;
      const result = await sqlQuery(query);
      console.log(result);
      
      if (result.length > 0 && result[0].count > 0) {
        return { success: true, data: result };
      } else {
        return { success: false, message: 'Payout Details not Exist' };
      }
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return { success: false, message: error.message };
    }
  },
  addPayoutDetails: async function ({ userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName, payout_toAccount, payout_toUpi, payout_meta }) {
    try {
      const query = `INSERT INTO db_userpayout_details (userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName, payout_toAccount, payout_toUpi, payout_meta) VALUES (?,?,?,?,?,?,?,?) `;
      const result = await sqlQuery(query, [userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName, payout_toAccount, payout_toUpi, payout_meta]);
      if (result.affectedRows) {
        return { success: true, message: 'Payout Details added successfully!' };
      } else {
        return { success: false, message: 'Failed to add Payout Details' };
      }
    } catch (error) {
      console.error('Error adding Payout Details:', error);
      return { success: false, message: error.message };
    }
  },
  updatePayoutDetails: async function ({ userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName, payout_toAccount, payout_toUpi, payout_meta }) {
    try {
      const query = `UPDATE db_userpayout_details SET payout_userEmail = ?, payout_ifscCode = ?, payout_mobileNumber = ?, payout_payeeName = ?, payout_toAccount = ?, payout_toUpi = ?, payout_meta = ? WHERE userID = ? `;
      const result = await sqlQuery(query, [payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName, payout_toAccount, payout_toUpi, payout_meta, userID]);
      if (result.affectedRows) {
        return { success: true, message: 'Payout Details updated successfully!' };
      } else {
        return { success: false, message: 'Failed to update Payout Details' };
      }
    } catch (error) {
      console.error('Error Updating Payout Details:', error);
      return { success: false, message: error.message };
    }
  },
  getPayoutDetailByUserID: async function ({ userID }) {
    try {
      const query = `SELECT * FROM db_userpayout_details WHERE userID =  '${userID}' `;
      const result = await sqlQuery(query);
      if (result.length > 0) {
        return { success: true, message: 'Payout Details found', data: result[0] };
      } else {
        return { success: false, message: 'Payout Details not Exist' };
      }
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return { success: false, message: error.message };
    }
  },
};
