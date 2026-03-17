const sql = require('../../Modules/sqlHandler');
const sqlQuery = sql.query;

module.exports = (dependencies) => {
  return async (req, res) => {
    const { reelId, userID } = req.body;

    if (!reelId || !userID) {
      return res.status(400).json({
        status: false,
        msg: 'reelId and userID is required'
      });
    }

    try {
      const checkIfAlreadyLiked = await sqlQuery(
        `SELECT * FROM db_reel_likes WHERE reelId = '${reelId}' AND userID = '${userID}'`
      );

      if (checkIfAlreadyLiked.length < 0) {
        return res.status(400).json({
          status: false,
          msg: 'You have not liked this Reel'
        });
      }
      // dislike to Reel
      await sqlQuery(`DELETE FROM db_reel_likes WHERE reelId = '${reelId}' AND userID = '${userID}'`);
      const GetTotalLikes = await sqlQuery( `SELECT COUNT(*) AS totalLikes FROM db_reel_likes WHERE reelId = '${reelId}'`);
      if (GetTotalLikes.length > 0) {
        await sqlQuery(`UPDATE db_reels SET likes = '${GetTotalLikes[0].totalLikes}' WHERE reelId = '${reelId}'`);
      }

      res.status(200).json({ status: true, msg: 'Successfully disliked the reel', data: { likes: GetTotalLikes[0].totalLikes }
      });
    } catch (error) {
      console.error('Error while dislike reel:', error);
      return res.status(500).json({ status: false, msg: 'Internal server error', error: error.toString() });
    }
  };
};
