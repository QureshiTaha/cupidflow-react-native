const { sqlQuery } = require('../../Modules/sqlHandler');
const { v4: uuidv4 } = require('uuid');

module.exports = () => {
  return async (req, res) => {
    const { userID, count } = req.body;

    if (!userID || !count) {
      return res.status(400).json({ status: false, msg: 'userID and count are required' });
    }

    if (isNaN(count) || count <= 0) {
      return res.status(400).json({ status: false, msg: 'Count must be a positive number' });
    }

    try {
      const [userResult] = await sqlQuery(
        `SELECT * FROM db_users WHERE userID = ? AND userDeleted IS NULL LIMIT 1`,
        [userID]
      );

      if (!userResult) {
        return res.status(404).json({ status: false, msg: 'User not found or deleted' });
      }

      const coinsResult = await sqlQuery(
        `SELECT coinStoreId FROM db_coin_store WHERE ownerId IS NULL LIMIT ? FOR UPDATE`,
        [parseInt(count)]
      );

      if (coinsResult.length === 0) {
        return res.status(400).json({
          status: false,
          msg: 'No coins available in stock. Please contact admin or wait for restock.'
        });
      }

      if (coinsResult.length < count) {
        return res.status(400).json({
          status: false,
          msg: `Only ${coinsResult.length} coins available for purchase right now`
        });
      }

      const paymentId = uuidv4();
      const coinStoreIds = coinsResult.map(c => c.coinStoreId);
      const placeholders = coinStoreIds.map(() => '?').join(',');

      const coinTransactionId = uuidv4();
      const paymentMethod = 'UPI';
      const status = 'processing';  // ✅ initial status
      const amount = parseFloat((count * 1).toFixed(2));

      await sqlQuery('START TRANSACTION');

      await sqlQuery(
        `UPDATE db_coin_store 
     SET ownerId = ?, transactionId = ?, purchasedAt = NOW() 
  WHERE coinStoreId IN (${placeholders})`,
        [userID, coinTransactionId, ...coinStoreIds]    // use coinTransactionId here
      );


      const senderId = 'Purchased from Store';
      const orderNo = 'ORD-' + Date.now();

      const insertValues = [];
      const insertParams = [];

      for (const coin of coinsResult) {
        insertValues.push('(?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)');
        insertParams.push(coinTransactionId, orderNo, 'success', coin.coinStoreId, senderId, userID, 1, amount, null);
      }

      await sqlQuery(`
      INSERT INTO db_coin_transaction
      (coinTransactionId, orderNo, status, senderId, receiverId, coinCount, amount, transactionDate, metaData)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`
        , [coinTransactionId, orderNo, 'processing', senderId, userID, count, amount, JSON.stringify({})]);


      await sqlQuery(
        `INSERT INTO db_coin_payments 
        (paymentId, userId, amount, coinCount, paymentMethod,paymentType, status, transactionId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [paymentId, userID, amount, count, paymentMethod, 'credit', status, coinTransactionId]
      );

      await sqlQuery('COMMIT');

      return res.status(200).json({
        status: true,
        msg: `${count} coin(s) purchased successfully`,
        coinTransactionId,
        paymentId,
        coinIds: coinStoreIds
      });


    } catch (error) {
      await sqlQuery('ROLLBACK');
      console.error('Purchase error:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal server error',
        error: error.message
      });
    }
  };
};