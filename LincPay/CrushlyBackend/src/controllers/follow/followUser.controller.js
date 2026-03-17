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
        msg: 'User cannot follow themselves'
      });
    }

    try {
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

      const [existingFollow] = await sqlQuery(
        `SELECT id FROM db_followers WHERE followBy = ? AND followTo = ?`,
        [followBy, followTo]
      );

      if (existingFollow) {
        return res.status(409).json({
          status: false,
          msg: 'Already following this user'
        });
      }

      await sqlQuery(
        `INSERT INTO db_followers (followBy, followTo) VALUES (?, ?)`,
        [followBy, followTo]
      );

      await sqlQuery(`UPDATE db_users SET totalFollowers = totalFollowers + 1 WHERE userID = ?`, [followTo]);
      await sqlQuery(`UPDATE db_users SET followings = followings + 1 WHERE userID = ?`, [followBy]);

      return res.status(201).json({
        status: true,
        msg: 'Follow created successfully'
      });

    } catch (error) {
      console.error('Error creating follow:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.toString()
      });
    }
  };
};
