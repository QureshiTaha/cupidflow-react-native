const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { coinStoreId } = req.params;

    if (!coinStoreId) {
      return res.status(400).json({
        status: false,
        msg: 'coinStoreId is required'
      });
    }

    try {
      const [coin] = await sqlQuery(
        `
        SELECT  cs.id, cs.coinStoreId, cs.ownerId, cs.transactionId, cs.purchasedAt,
          CASE WHEN cs.ownerId IS NULL THEN TRUE ELSE FALSE END AS isAvailable,
          u.userFirstName, u.userSurname, u.userPhone
        FROM db_coin_store cs
        LEFT JOIN db_users u ON cs.ownerId = u.userID
        WHERE cs.coinStoreId = ?
        `,
        [coinStoreId]
      );

      if (!coin) {
        return res.status(404).json({
          status: false,
          msg: 'Coin not found'
        });
      }

      return res.status(200).json({
        status: true,
        msg: 'Coin tracked successfully',
        data: coin
      });

    } catch (error) {
      console.error('Error tracking coin:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.toString()
      });
    }
  };
};
