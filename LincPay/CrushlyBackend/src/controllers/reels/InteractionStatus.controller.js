const sql = require('../../Modules/sqlHandler');
const sqlQuery = sql.query;

module.exports = () => {
  return async (req, res) => {
    const { reelId, userID } = req.params;

    if (!reelId || !userID) {
      return res.status(400).json({
        status: false,
        msg: 'reelId and userID are required'
      });
    }

    try {
      const likeResult = await sqlQuery(`
        SELECT 1 FROM db_reel_likes
        WHERE reelId = '${reelId}' AND userID = '${userID}'
        LIMIT 1
      `);

      const commentResult = await sqlQuery(`
        SELECT * FROM db_reel_comments
        WHERE reelId = '${reelId}' AND userID = '${userID}'
        LIMIT 1
      `);

      const isLiked = likeResult.length > 0;
      const isCommented = commentResult.length > 0;

      return res.status(200).json({
        status: true,
        msg: 'Interaction status retrieved',
        data: {
          reelId,
          userID,
          isLiked,
          isCommented,
          comment: commentResult
        }
      });
    } catch (error) {
      console.error('Error checking interaction status:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.toString()
      });
    }
  };
};
