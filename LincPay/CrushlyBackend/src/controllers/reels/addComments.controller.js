const sql = require('../../Modules/sqlHandler');
const sqlQuery = sql.query;
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

module.exports = () => {
  return async (req, res) => {
    const { reelId, userID, commentText } = req.body;

    if (!reelId || !userID || !commentText) {
      return res.status(400).json({
        status: false,
        msg: 'reelId, userID, and commentText are required'
      });
    }

    try {
      const commentId = uuidv4();

      await sqlQuery(
        ` INSERT INTO db_reel_comments (commentId, reelId, userID, commentText) VALUES ('${commentId}', '${reelId}', '${userID}', '${commentText}')`
      );

      const GetTotalComments = await sqlQuery(
        `SELECT COUNT(*) AS totalComments FROM db_reel_comments WHERE reelId = '${reelId}'`
      );

      const totalComments = GetTotalComments[0]?.totalComments || 0;
      if (GetTotalComments.length > 0) {
        await sqlQuery(`
        UPDATE db_reels SET comments = '${GetTotalComments[0].totalComments}' WHERE reelId = '${reelId}'
      `);
      }

      res.status(201).json({
        status: true,
        msg: 'Comment added successfully',
        data: { commentId, reelId, userID, commentText, totalComments }
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ status: false, msg: 'Internal Server Error', error: error.toString() });
    }
  };
};
