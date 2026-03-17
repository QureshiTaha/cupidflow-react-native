const { sqlQuery } = require('../../Modules/sqlHandler');

const followUseCase = {

  checkIfFollowing: async function (followBy, followTo) {
    try {
      const query = `SELECT count(1) as count FROM db_followers WHERE followBy = ? AND followTo = ?`;
      const result = await sqlQuery(query, [followBy, followTo]);

      if (result.length > 0 && result[0].count > 0) {
        return { success: true, data: true }; 
      } else {
        return { success: true, data: false }; 
      }
    } catch (error) {
      console.error('Error checking following status:', error);
      return { success: false, message: error.message };
    }
  },

  followUser: async function (followBy, followTo) {
    try {
      if (followBy === followTo) {
        return { success: false, message: "User can't follow themselves" };
      }
      const check = await this.checkIfFollowing(followBy, followTo);
      if (!check.success) return check;
      if (check.data) return { success: false, message: 'Already following this user' };

      const query = `INSERT INTO db_followers (followBy, followTo, followAt) VALUES (?, ?, NOW())`;
      await sqlQuery(query, [followBy, followTo]);

      return { success: true, message: 'Successfully followed user' };
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false, message: error.message };
    }
  },

};

module.exports = followUseCase;
