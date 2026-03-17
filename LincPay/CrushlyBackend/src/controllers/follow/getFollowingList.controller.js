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
      const [countResult] = await sqlQuery(`
        SELECT COUNT(*) AS count FROM db_followers WHERE followBy = ?
      `, [userID]);

      const totalCount = countResult?.count || 0;

      if (totalCount === 0) {
        return res.status(200).json({
          status: false,
          msg: 'No followings found',
          data: []
        });
      }

      const followingList = await sqlQuery(`
        SELECT 
          u.userID,
          u.userFirstName,
          u.userSurname,
          u.userPhone,
          u.userEmail,
          u.profilePic,
          u.userGender,
          EXISTS (
            SELECT 1 
            FROM db_followers 
            WHERE followBy = u.userID AND followTo = ? 
          ) AS isFollowing
        FROM db_followers f
        JOIN db_users u ON f.followTo = u.userID
        WHERE f.followBy = ?
        ORDER BY f.followAt DESC
        LIMIT ? OFFSET ?
      `, [userID, userID, _limit, offset]);

      if (followingList.length > 0) {
        followingList[followingList.length - 1].haveMore = totalCount > _page * _limit;
        followingList[followingList.length - 1].totalCount = totalCount;
      }

      return res.status(200).json({
        status: true,
        msg: 'Following list fetched successfully',
        data: followingList,
      });

    } catch (error) {
      console.error('Error fetching following list:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.toString()
      });
    }
  };
};