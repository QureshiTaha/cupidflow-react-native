const sql = require('../../Modules/sqlHandler');
const sqlQuery = sql.query;

module.exports = () => {
  return async (req, res) => {
    const { commentId } = req.body;

    if (!commentId) {
      return res.status(400).json({ status: false, msg: 'commentId is required' });
    }

    try {
      const getComment = await sqlQuery(` SELECT reelId FROM db_reel_comments WHERE commentId = '${commentId}'`);

      if (getComment.length === 0) {
        return res.status(400).json({ status: false, msg: 'Comment not found' });
      }

      const reelId = getComment[0].reelId;

      await sqlQuery(` DELETE FROM db_reel_comments WHERE commentId = '${commentId}' `);

      const getTotalComments = await sqlQuery(` SELECT COUNT(*) AS totalComments FROM db_reel_comments WHERE reelId = '${reelId}'`);

      if (getTotalComments.length > 0) {
        await sqlQuery(` UPDATE db_reels SET comments = '${getTotalComments[0].totalComments}' WHERE reelId = '${reelId}'`);
      }

      res.status(200).json({ status: true, msg: 'Comment deleted and count updated successfully', data: null });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ status: false, msg: 'Internal Server Error', error: error.toString() });
    }
  };
};
