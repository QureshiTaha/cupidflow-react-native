const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { page, limit } = req.query;

    const _page = parseInt(page) || 1;
    const _limit = parseInt(limit) || 30;
    const offset = (_page - 1) * _limit;

    try {
      const totalCountResult = await sqlQuery(`SELECT COUNT(*) as count FROM db_coin_store`);
      const totalCount = totalCountResult[0]?.count || 0;

      const result = await sqlQuery(`
        SELECT 
          cs.id,
          cs.coinStoreId, cs.ownerId, cs.transactionId, cs.purchasedAt,
          CASE 
            WHEN cs.ownerId IS NULL THEN TRUE 
            ELSE FALSE 
          END AS isAvailable,
          u.userFirstName, u.userSurname, u.userPhone
        FROM db_coin_store cs
        LEFT JOIN db_users u ON cs.ownerId = u.userID
        ORDER BY cs.purchasedAt DESC
        LIMIT ? OFFSET ?
      `, [_limit, offset]);

      if (result.length > 0) {
        result[result.length - 1].haveMore = totalCount > _page * _limit;
        result[result.length - 1].totalCount = totalCount;
      }

      return res.status(200).json({
        status: true,
        msg: 'Coin records fetched successfully',
        data: result
      });

    } catch (error) {
      console.error('Error fetching coin records:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.message
      });
    }
  };
};
