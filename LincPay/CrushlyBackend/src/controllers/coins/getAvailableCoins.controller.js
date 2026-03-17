const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { page, limit } = req.query;

    const _page = parseInt(page) || 1;
    const _limit = parseInt(limit) || 30;
    const offset = (_page - 1) * _limit;

    try {
      const [totalCountResult] = await sqlQuery(`
        SELECT COUNT(*) as count FROM db_coin_store WHERE ownerId IS NULL
      `);

      const totalCount = totalCountResult?.count || 0;

      if (totalCount === 0) {
        return res.status(404).json({
          status: false,
          msg: 'No available coins found',
          availableCoinCount: 0
        });
      }

      const result = await sqlQuery(
        `
        SELECT cs.id, cs.coinStoreId, cs.ownerId, cs.transactionId, cs.purchasedAt
        FROM db_coin_store cs
        WHERE cs.ownerId IS NULL
        ORDER BY cs.purchasedAt DESC
        LIMIT ? OFFSET ?
        `,
        [_limit, offset]
      );

      if (result.length) {
        result[result.length - 1].haveMore = totalCount > _page * _limit;
        result[result.length - 1].totalCount = totalCount;
      }

      return res.status(200).json({
        status: true,
        msg: 'Available coins fetched successfully',
        data: result
      });

    } catch (error) {
      console.error('Error fetching available coins:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.message
      });
    }
  };
};
