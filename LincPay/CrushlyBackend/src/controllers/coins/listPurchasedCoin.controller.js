const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { page, limit } = req.query;

    const _page = parseInt(page) || 1;
    const _limit = parseInt(limit) || 30;
    const offset = (_page - 1) * _limit;

    try {
      const [countResult] = await sqlQuery(`
        SELECT COUNT(*) AS count
        FROM db_coin_store
        WHERE ownerId IS NOT NULL
      `);

      const totalCount = countResult?.count || 0;

      if (totalCount === 0) {
        return res.status(404).json({
          status: false,
          msg: 'No purchased coins found'
        });
      }

      const coins = await sqlQuery(`
        SELECT 
          cs.id, cs.coinStoreId, cs.ownerId, cs.transactionId, cs.purchasedAt,
          u.userFirstName, u.userSurname, u.userPhone
        FROM db_coin_store cs
        JOIN db_users u ON cs.ownerId = u.userID
        WHERE cs.ownerId IS NOT NULL
        ORDER BY cs.purchasedAt DESC
        LIMIT ? OFFSET ?
      `, [_limit, offset]);

      if (coins.length > 0) {
        coins[coins.length - 1].haveMore = totalCount > _page * _limit;
        coins[coins.length - 1].totalCount = totalCount;
      }

      return res.status(200).json({
        status: true,
        msg: 'Purchased coins fetched successfully',
        data: coins
      });

    } catch (error) {
      console.error('Error fetching purchased coins:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.toString()
      });
    }
  };
};
