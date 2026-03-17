const { sqlQuery } = require('../../Modules/sqlHandler');
const { v4: uuidv4 } = require('uuid');

module.exports = () => {
  return async (req, res) => {
    const { senderId, receiverId, count } = req.body;

    if (!senderId || !receiverId || !count) {
      return res.status(400).json({
        status: false,
        msg: 'senderId, receiverId, and count are required'
      });
    }

    const numCount = Number(count);
    if (!Number.isInteger(numCount) || numCount <= 0) {
      return res.status(400).json({
        status: false,
        msg: 'count must be a positive integer'
      });
    }

    let transactionStarted = false;
    try {
      await sqlQuery('START TRANSACTION');
      transactionStarted = true;

      const [sender] = await sqlQuery(
        `SELECT 1 FROM db_users WHERE userID = ? AND userDeleted IS NULL LIMIT 1`,
        [senderId]
      );
      const [receiver] = await sqlQuery(
        `SELECT 1 FROM db_users WHERE userID = ? AND userDeleted IS NULL LIMIT 1`,
        [receiverId]
      );

      if (!sender || !receiver) {
        await sqlQuery('ROLLBACK');
        return res.status(404).json({
          status: false,
          msg: sender ? 'Receiver not found' : 'Sender not found'
        });
      }

      const coinsToTransfer = await sqlQuery(
        `SELECT coinStoreId FROM db_coin_store 
        WHERE ownerId = ? 
        LIMIT ${numCount} 
        FOR UPDATE`,
        [senderId]
      );


      if (coinsToTransfer.length < numCount) {
        await sqlQuery('ROLLBACK');
        return res.status(400).json({
          status: false,
          msg: `You only have ${coinsToTransfer.length} coins available`
        });
      }


      const coinIds = coinsToTransfer.map(c => c.coinStoreId);

      const coinTransactionId = uuidv4(); // will be reused in db_coin_store
      const orderNo = 'ORD-' + Date.now();
      const status = 'success';
      const amount = 0;

      await sqlQuery(
        `UPDATE db_coin_store 
       SET ownerId = ?, transactionId = ?, purchasedAt = NOW()
        WHERE coinStoreId IN (?)`,
        [receiverId, coinTransactionId, coinIds]
      );

      await sqlQuery(
        `UPDATE db_coin_store 
        SET ownerId = ?, transactionId = ?, purchasedAt = NOW()
        WHERE coinStoreId IN (${coinIds.map(() => '?').join(',')})`,
        [receiverId, coinTransactionId, ...coinIds]
      );


      await sqlQuery(
        `INSERT INTO db_coin_transaction 
          (coinTransactionId, orderNo, status, senderId, receiverId, coinCount, amount, transactionDate, metaData)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [coinTransactionId, orderNo, status, senderId, receiverId, coinIds.length, amount, JSON.stringify({})]
      );

      await sqlQuery('COMMIT');
      transactionStarted = false;

      return res.status(200).json({
        status: true,
        msg: `${coinIds.length} coins transferred successfully`,
        transferredCoins: coinIds
      });

    } catch (error) {
      if (transactionStarted) {
        await sqlQuery('ROLLBACK').catch(rollbackError => {
          console.error('Rollback failed:', rollbackError);
        });
      }

      console.error('Transfer error:', error);
      return res.status(500).json({
        status: false,
        msg: 'Transfer failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};