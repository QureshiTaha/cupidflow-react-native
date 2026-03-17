const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');
const path = require('path');
const fs = require('fs');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    const { reelID } = req.params;
    if (!reelID) {
      res.status(400).json({ status: false, msg: 'reelID is Required' });
      return;
    }
    try {
      const Reel = await sqlQuery(`SELECT * FROM db_reels WHERE reelId = '${reelID}'`);

      if (Reel.length > 0) {
        console.log(path.join(__dirname, Reel[0].filepath));

        fs.unlink(path.join(__dirname + '/../../../', Reel[0].filepath), async (err) => {
          if (err) {
            return res.status(400).json({ success: false, message: 'File not found or already deleted' });
          } else {
            const deleteReel = await sqlQuery(`DELETE FROM db_reels WHERE reelId = '${reelID}'`);
            res.status(200).json({
              status: true,
              msg: 'Successfully deleted the reel',
              data: deleteReel
            });
            await sqlQuery(`UPDATE db_users SET posts = GREATEST(posts - 1, 0) WHERE userID = ?`, [Reel[0].userID]);
          }
        });
      } else {
        res.status(400).json({
          status: false,
          msg: 'Error in deleting the reel',
          data: deleteReel
        });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: `Error in deleting the reel: ${error}` });
    }
  };
};
