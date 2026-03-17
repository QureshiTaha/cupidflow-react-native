const moment = require('moment');
const sql = require('../../Modules/sqlHandler');
const sqlQuery = sql.query;
const { v4: uuidv4 } = require('uuid');

module.exports = (dependencies) => {
  return async (req, res) => {
    const { filePath, userID, title, description } = req.body
    console.log("DATA  = ",filePath, userID, title, description);
    

    if (!userID || !filePath || !title || !description) {
      res.status(400).json({
        status: false, msg: 'filePath, userID,title,description is Required'
      });
      return
    }
    try {

      var uploadData = {
        timeStamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        filePath,
        userID,
        title,
        description,
        reelId: uuidv4(),
      }
      await sqlQuery(`
      INSERT INTO db_reels (userID, filePath, timeStamp,reelId,title,description) 
      VALUES ('${uploadData.userID}', '${uploadData.filePath}', '${uploadData.timeStamp}','${uploadData.reelId}','${uploadData.title}','${uploadData.description}')`);

      await sqlQuery(
        `UPDATE db_users SET posts = posts + 1 WHERE userID = '${uploadData.userID}'`   ,
      );

      res.status(200).json({
        status: true,
        msg: 'Successfully added Reels',
        data: uploadData
      });

    } catch (error) {
      console.log(">>>", error);
      
      res.status(500).json({ success: false, message: `Error Editing task StackTrace: ${error}` });
    }
  };
};
