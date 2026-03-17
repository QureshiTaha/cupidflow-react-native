const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const { search, page, limit } = req.query;

      const _page = page ? page : 1;
      const _limit = limit ? limit : 10;
      const _search = search ? search : '';

      var allReels = await sqlQuery(
        `SELECT db_reels.*,db_users.profilePic,CONCAT(db_users.userFirstName," ",db_users.userSurname) as userName FROM db_reels   
          JOIN db_users on db_users.userID = db_reels.userID
          WHERE description like '%${_search}%' LIMIT ${_limit} OFFSET ${(_page - 1) * _limit}`
      );

      var totalCount = await sqlQuery(`SELECT count(1) as count FROM db_reels WHERE title like '%${_search}%'`);

      if (allReels.length) {
        allReels[allReels.length - 1].haveMore = totalCount[0].count > _page * _limit;
        allReels[allReels.length - 1].totalCount = totalCount[0].count;
      }
      res.status(200).json({
        status: true,
        msg: 'Successfully fetched Reels',
        data: allReels
      });
    } catch (error) {
      res.status(400).json({ success: false, message: `Error finding all the reels: ${error}` });
    }
  };
};
