const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { followBy, followTo } = req.body;

    if (!followBy || !followTo) {
      return res.status(400).json({
        status: false,
        msg: 'Both followBy and followTo (userIDs) are required'
      });
    }

    if (followBy === followTo) {
      return res.status(400).json({
        status: false,
        msg: 'User cannot unfollow themselves'
      });
    }

    try {
      // Ensure both users exist and are not deleted
      const users = await sqlQuery(
        `SELECT userID FROM db_users 
         WHERE userID IN (?, ?) 
         AND (userDeleted IS NULL OR userDeleted = 0)`,
        [followBy, followTo]
      );

      if (users.length !== 2) {
        return res.status(404).json({
          status: false,
          msg: 'One or both users not found or deleted'
        });
      }

      // Check if follow relationship exists
      const [existingFollow] = await sqlQuery(
        `SELECT id FROM db_followers WHERE followBy = ? AND followTo = ?`,
        [followBy, followTo]
      );

      if (!existingFollow) {
        return res.status(404).json({
          status: false,
          msg: 'Not following this user'
        });
      }

      // Delete follow record
      await sqlQuery(
        `DELETE FROM db_followers WHERE followBy = ? AND followTo = ?`,
        [followBy, followTo]
      );

      // Decrement counters
      await sqlQuery(`UPDATE db_users SET totalFollowers = totalFollowers - 1 WHERE userID = ? AND totalFollowers > 0`, [followTo]);
      await sqlQuery(`UPDATE db_users SET followings = followings - 1 WHERE userID = ? AND followings > 0`, [followBy]);

      return res.status(200).json({
        status: true,
        msg: 'Unfollowed successfully'
      });

    } catch (error) {
      console.error('Error during unfollow:', error);
      return res.status(500).json({
        status: false,
        
        msg: 'Internal Server Error',
        error: error.toString()
      });
    }
  };
};
