const sql = require('../../Modules/sqlHandler');
const sqlQuery = sql.query;

module.exports = () => {
  return async (req, res) => {
    const { commentId, commentText } = req.body;

    console.log("🔄 Edit comment request:", { commentId, commentText });

    if (!commentId) {
      return res.status(400).json({ status: false, msg: 'commentId is required' });
    }

    if (!commentText || commentText.trim() === '') {
      return res.status(400).json({ status: false, msg: 'commentText is required and cannot be empty' });
    }

    try {
      // Check if comment exists
      const getComment = await sqlQuery(`SELECT * FROM db_reel_comments WHERE commentId = '${commentId}'`);
      
      console.log("📊 Comment found:", getComment.length > 0);

      if (getComment.length === 0) {
        return res.status(404).json({ status: false, msg: 'Comment not found' });
      }

      // Update comment
      const updatedAt = new Date().toISOString();
    //   console.log("🔄 Updating comment with ID:", commentId);
      
   const updateResult = await sqlQuery(`
  UPDATE db_reel_comments 
  SET commentText = '${commentText.replace(/'/g, "''")}'
  WHERE commentId = '${commentId}'
`);

      
    //   console.log("✅ Update result:", updateResult);

      // Get updated comment with user details
      const updatedComment = await sqlQuery(`
        SELECT db_reel_comments.*, db_users.userFirstName, db_users.userSurname, db_users.profilePic
        FROM db_reel_comments
        LEFT JOIN db_users ON db_reel_comments.userId = db_users.userID
        WHERE commentId = '${commentId}'
      `);

    //   console.log("✅ Updated comment data:", updatedComment[0]);

      res.status(200).json({ 
        status: true, 
        msg: 'Comment updated successfully', 
        data: updatedComment[0] || null 
      });
    } catch (error) {
      console.error('❌ Error updating comment:', error);
      res.status(500).json({ status: false, msg: 'Internal Server Error', error: error.toString() });
    }
  };
};