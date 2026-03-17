const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { userID } = req.params;
    const { page, limit } = req.query;
    if (!userID) {
      return res.status(400).json({
        status: false,
        msg: 'userID is required'
      });
    }

    const _page = parseInt(page) || 1;
    const _limit = parseInt(limit) || 10;
    const offset = (_page - 1) * _limit;

    try {
      const [countResult] = await sqlQuery(
        `
        SELECT COUNT(*) AS count FROM db_followers WHERE followTo = ?
      `,
        [userID]
      );

      const totalCount = countResult?.count || 0;

      if (totalCount === 0) {
        return res.status(200).json({
          status: false,
          msg: 'No followers found',
          data: []
        });
      }

      const followersList = await sqlQuery(
        `SELECT 
          u.userID,
          u.userFirstName,
          u.userSurname,
          u.profilePic,
          EXISTS (
            SELECT 1 
            FROM db_followers 
            WHERE followBy = ? AND followTo = u.userID
          ) AS isFollowing
        FROM db_followers f
        JOIN db_users u ON u.userID = f.followBy
        WHERE f.followTo = ?
        ORDER BY f.followAt DESC
        LIMIT ? OFFSET ?
        `,
        [userID, userID, _limit, offset]
      );

      if (followersList.length > 0) {
        followersList[followersList.length - 1].haveMore = totalCount > _page * _limit;
        followersList[followersList.length - 1].totalCount = totalCount;
      }

      return res.status(200).json({
        status: true,
        msg: 'Followers list fetched successfully',
        data: followersList
      });
    } catch (error) {
      console.error('Error fetching followers list:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.toString()
      });
    }
  };
};
