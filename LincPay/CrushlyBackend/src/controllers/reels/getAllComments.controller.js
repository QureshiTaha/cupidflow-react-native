const sql = require('../../Modules/sqlHandler');
const sqlQuery = sql.query;

module.exports = () => {
  return async (req, res) => {
    const { reelId } = req.params;
    const { page, limit } = req.query;

    const _page = page ? page : 1;
    const _limit = limit ? limit : 10;

    if (!reelId) {
      return res.status(400).json({
        status: false,
        msg: 'reelId is required'
      });
    }

    try {
      var comments = await sqlQuery(`
        SELECT db_reel_comments.*,db_users.userFirstName, db_users.userSurname, db_users.profilePic
        FROM db_reel_comments
        LEFT JOIN db_users ON db_reel_comments.userId = db_users.userID
        WHERE reelId = '${reelId}'
        ORDER BY commentedAt DESC
        LIMIT ${_limit} OFFSET ${(_page - 1) * _limit}
        `);

      var totalCount = await sqlQuery(`
        SELECT count(1) as count
        FROM db_reel_comments
        WHERE reelId = '${reelId}'
        `);
      if (comments.length) {
        comments[comments.length - 1].haveMore = totalCount[0].count > _page * _limit;
        comments[comments.length - 1].totalCount = totalCount[0].count;
      }

      res.status(200).json({
        status: true,
        msg: 'Comments fetched successfully',
        data: comments
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.toString()
      });
    }
  };
};
