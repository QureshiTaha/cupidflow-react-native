const { sqlQuery } = require('../../Modules/sqlHandler');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  getAllOffers: async () => {
    try {
      return await sqlQuery(`SELECT * FROM db_coin_offers WHERE isActive = ?`, ["1"]);
    } catch (err) {
      console.error('Error fetching all offers:', err);
      throw err;
    }
  },
  getOfferByOfferId: async (offerId) => {
    try {
      const [offer] = await sqlQuery(`SELECT * FROM db_coin_offers WHERE offerId = ?`, [offerId]);
      return offer || null;
    } catch (err) {
      console.error('Error fetching offer by ID:', err);
      throw err;
    }
  },
  createOffer: async (coinAmount, actualPrice, offerPrice) => {
    try {
      const [existing] = await sqlQuery(
        `SELECT id FROM db_coin_offers WHERE coinAmount = ? AND isActive = 1`,
        [coinAmount]
      );
      if (existing) throw new Error(`Active offer already exists for ${coinAmount} coins`);

      const offerId = uuidv4();
      await sqlQuery(
        `INSERT INTO db_coin_offers (offerId, coinAmount, actualPrice, offerPrice, isActive) VALUES (?, ?, ?, ?, 1)`,
        [offerId, coinAmount, actualPrice, offerPrice]
      );
      return { offerId };
    } catch (err) {
      console.error('Error creating offer:', err);
      throw err;
    }
  },
  updateOffer: async (offerId, coinAmount, actualPrice, offerPrice, isActive = true) => {
    try {
      if (!offerId || !coinAmount || !actualPrice || !offerPrice)
        throw new Error('offerId, coinAmount, actualPrice, and offerPrice are required');

      if ([coinAmount, actualPrice, offerPrice].some(val => isNaN(val)))
        throw new Error('coinAmount, actualPrice, and offerPrice must be valid numbers');

      if (offerPrice >= actualPrice)
        throw new Error('offerPrice must be less than actualPrice');

      const [existing] = await sqlQuery(`SELECT * FROM db_coin_offers WHERE offerId = ?`, [offerId]);
      if (!existing) throw new Error('Offer not found');

      await sqlQuery(
        `UPDATE db_coin_offers SET coinAmount = ?, actualPrice = ?, offerPrice = ?, isActive = ? WHERE offerId = ?`,
        [coinAmount, actualPrice, offerPrice, isActive ? 1 : 0, offerId]
      );

      return { success: true, msg: 'Offer updated successfully' };
    } catch (err) {
      console.error('Error updating offer:', err);
      throw err;
    }
  },
  addCoins: async (count) => {
    try {
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < count; i++) {
        const coinStoreId = uuidv4();
        const batchIndex = Math.floor(i / batchSize);
        batches[batchIndex] = batches[batchIndex] || [];
        batches[batchIndex].push(`('${coinStoreId}')`);
      }

      for (const batch of batches) {
        await sqlQuery(`INSERT INTO db_coin_store (coinStoreId) VALUES ${batch.join(', ')}`);
      }

      return { success: true, msg: 'Coins added successfully' };
    } catch (err) {
      console.error('Error adding coins:', err);
      throw err;
    }
  },
  getAvailableCoins: async (page = 1, limit = 30, requiredCoins = null) => {
    try {
      const countResult = await sqlQuery(
        `SELECT COUNT(*) AS count FROM db_coin_store WHERE ownerId IS NULL`
      );
      const totalCount = countResult?.[0]?.count || 0;

      if (totalCount === 0) {
        return { success: false, code: "NO_COINS_AVAILABLE", msg: 'No available coins', availableCoinCount: 0, data: [] };
      }

      const offset = (page - 1) * limit;
      const result = await sqlQuery(
        `SELECT id, coinStoreId, ownerId, transactionId, purchasedAt
        FROM db_coin_store
        WHERE ownerId IS NULL
        ORDER BY purchasedAt DESC
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      if (result.length) {
        result[result.length - 1].haveMore = totalCount > page * limit;
        result[result.length - 1].totalCount = totalCount;
      }

      return {
        success: true,
        code: (requiredCoins && totalCount < requiredCoins) ? "INSUFFICIENT_COINS" : "ENOUGH_COINS",
        msg: (requiredCoins && totalCount < requiredCoins)
          ? `Not enough coins available. Required: ${requiredCoins}, Available: ${totalCount}`
          : 'Available coins fetched',
        availableCoinCount: totalCount,
        data: result
      };
    } catch (err) {
      console.error('Error fetching available coins:', err);
      throw err;
    }
  },

  purchaseCoins: async (userID, count, orderNo, metaData) => {
    if (!userID || !count) throw new Error('userID and count are required');
    if (isNaN(count) || count <= 0) throw new Error('Count must be a positive number');

    let transactionStarted = false;
    try {
      const [userResult] = await sqlQuery(
        `SELECT * FROM db_users WHERE userID = ? AND userDeleted IS NULL LIMIT 1`,
        [userID]
      );
      if (!userResult) throw new Error('User not found or deleted');

      const coinsResult = await sqlQuery(
        `SELECT coinStoreId FROM db_coin_store WHERE ownerId IS NULL LIMIT ? FOR UPDATE`,
        [parseInt(count)]
      );
      if (coinsResult.length === 0) throw new Error('No coins available in stock');
      if (coinsResult.length < count) throw new Error(`Only ${coinsResult.length} coins available`);


      const coinStoreIds = coinsResult.map(c => c.coinStoreId);
      const placeholders = coinStoreIds.map(() => '?').join(',');

      const paymentId = uuidv4();
      const transactionId = uuidv4();

      await sqlQuery('START TRANSACTION');
      transactionStarted = true;

      await sqlQuery(
        `UPDATE db_coin_store 
         SET ownerId = ?, transactionId = ?, purchasedAt = NOW() 
         WHERE coinStoreId IN (${placeholders})`,
        [userID, transactionId, ...coinStoreIds]
      );

      const senderId = 'Purchased from Store';
      // const orderNo = uuidv4();

      const totalCoins = coinsResult.length;
      const totalAmount = parseFloat((totalCoins * 1).toFixed(2));

      await sqlQuery(
        `INSERT INTO db_coin_transaction 
        (coinTransactionId, orderNo, status, senderId, receiverId, coinCount, amount, transactionDate, metaData)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          transactionId,
          orderNo,
          'processing',
          senderId,
          userID,
          totalCoins,
          totalAmount,
          JSON.stringify(metaData)
        ]
      );

      await sqlQuery('COMMIT');
      transactionStarted = false;

      return { success: true, msg: `${count} coin(s) purchased successfully`, transactionId, paymentId, coinIds: coinStoreIds };
    } catch (err) {
      if (transactionStarted) await sqlQuery('ROLLBACK').catch(e => console.error('Rollback failed', e));
      console.error('Purchase error:', err);
      throw err;
    }
  },

  getPurchasedCoins: async (page = 1, limit = 30) => {
    try {
      const offset = (page - 1) * limit;
      const [[{ count: totalCount }]] = await sqlQuery(`SELECT COUNT(*) AS count FROM db_coin_store WHERE ownerId IS NOT NULL`);
      if (totalCount === 0) return { success: true, msg: 'No purchased coins', data: [] };

      const coins = await sqlQuery(
        `SELECT cs.id, cs.coinStoreId, cs.ownerId, cs.transactionId, cs.purchasedAt,
                u.userFirstName, u.userSurname, u.userPhone
         FROM db_coin_store cs
         JOIN db_users u ON cs.ownerId = u.userID
         WHERE cs.ownerId IS NOT NULL
         ORDER BY cs.purchasedAt DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      if (coins.length > 0) {
        coins[coins.length - 1].haveMore = totalCount > page * limit;
        coins[coins.length - 1].totalCount = totalCount;
      }

      return { success: true, msg: 'Purchased coins fetched', data: coins };
    } catch (err) {
      console.error('Error fetching purchased coins:', err);
      throw err;
    }
  },
  getCoinHistory: async (coinStoreId) => {
    try {
      return await sqlQuery(
        `SELECT id, coinTransactionId, orderNo, status, coinId, senderId, receiverId,
                coinCount, amount, transactionDate, metaData
         FROM db_coin_transaction
         WHERE coinId = ?
         ORDER BY transactionDate DESC`,
        [coinStoreId]
      );
    } catch (err) {
      console.error('Error fetching coin history:', err);
      throw err;
    }
  },
  getTotalCoinStore: async (userId) => {
    try {
      const [[{ totalCoins }]] = await sqlQuery(
        `SELECT COALESCE(SUM(coinCount),0) AS totalCoins
         FROM db_coin_transaction
         WHERE receiverId = ?`,
        [userId]
      );
      return totalCoins || 0;
    } catch (err) {
      console.error('Error fetching total coin store:', err);
      throw err;
    }
  },
  totalUserCoinsCount: async ({ userID }) => {
    try {
      const ac = await sqlQuery(
        `SELECT 
            s.ownerId,
            COUNT(s.id) AS availableCoins
        FROM db_coin_store s
        JOIN db_coin_transaction t 
            ON s.transactionId = t.coinTransactionId AND t.status = 'success'
        WHERE s.ownerId = ?  
        GROUP BY s.ownerId;`,
        [userID]
      );
      const availableCoins = ac && ac.length > 0 ? ac[0].availableCoins : 0;
      return availableCoins || 0;
      // return availableCoins || 0;
    } catch (err) {
      console.error('Error fetching total user coins count:', err);
      throw err;
    }
  },
  getUserTotalCoins: async (userID, page = 1, limit = 10) => {
    try {
      const _page = page > 0 ? page : 1;
      const _limit = limit > 0 ? limit : 10;
      const offset = (_page - 1) * _limit;

      const [userInfo] = await sqlQuery(
        `SELECT u.userID, u.userFirstName, u.userSurname, u.userPhone, COUNT(cs.id) AS totalCoins
         FROM db_users u
         LEFT JOIN db_coin_store cs ON u.userID = cs.ownerId
         WHERE u.userID = ?
         GROUP BY u.userID`,
        [userID]
      );

      if (!userInfo) return null;

      const coins = await sqlQuery(
        `SELECT id, coinStoreId, transactionId, purchasedAt
         FROM db_coin_store
         WHERE ownerId = ?
         ORDER BY purchasedAt DESC
         LIMIT ? OFFSET ?`,
        [userID, _limit, offset]
      );

      const totalCount = userInfo.totalCoins;
      const haveMore = totalCount > _page * _limit;

      if (coins.length > 0) {
        coins[coins.length - 1].haveMore = haveMore;
        coins[coins.length - 1].totalCount = totalCount;
      }

      return {
        user: {
          userID: userInfo.userID,
          firstName: userInfo.userFirstName,
          surname: userInfo.userSurname,
          phone: userInfo.userPhone
        },
        data: coins
      };
    } catch (err) {
      console.error('Error fetching user total coins:', err);
      throw err;
    }
  },
  sendCoins: async (senderId, receiverId, count) => {
    if (!senderId || !receiverId || !count) throw new Error('senderId, receiverId, and count are required');
    const numCount = Number(count);
    if (!Number.isInteger(numCount) || numCount <= 0) throw new Error('count must be positive integer');

    let transactionStarted = false;
    try {
      await sqlQuery('START TRANSACTION');
      transactionStarted = true;

      const [sender] = await sqlQuery(`SELECT 1 FROM db_users WHERE userID=? AND userDeleted IS NULL LIMIT 1`, [senderId]);
      const [receiver] = await sqlQuery(`SELECT 1 FROM db_users WHERE userID=? AND userDeleted IS NULL LIMIT 1`, [receiverId]);
      if (!sender || !receiver) throw new Error(sender ? 'Receiver not found' : 'Sender not found');

      const coinsToTransfer = await sqlQuery(
        `SELECT coinStoreId FROM db_coin_store WHERE ownerId=? LIMIT ? FOR UPDATE`,
        [senderId, numCount]
      );
      if (coinsToTransfer.length < numCount) throw new Error(`You only have ${coinsToTransfer.length} coins available`);

      const coinIds = coinsToTransfer.map(c => c.coinStoreId);

      await sqlQuery(
        `UPDATE db_coin_store SET ownerId=? WHERE coinStoreId IN (?)`,
        [receiverId, coinIds]
      );

      const transactionId = uuidv4();
      const orderNo = uuidv4();

      await sqlQuery(
        `INSERT INTO db_coin_transaction 
        (coinTransactionId, orderNo, status, senderId, receiverId, coinCount, amount, transactionDate, metaData)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [transactionId, orderNo, 'success', senderId, receiverId, coinIds.length, 0, JSON.stringify({})]
      );

      await sqlQuery('COMMIT');
      transactionStarted = false;

      return { success: true, msg: `${coinIds.length} coins transferred`, transferredCoins: coinIds };
    } catch (err) {
      if (transactionStarted) await sqlQuery('ROLLBACK').catch(e => console.error('Rollback failed', e));
      console.error('Send coins error:', err);
      throw err;
    }
  },
  getUserTransactionHistory: async (userID, page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;

      const transactions = await sqlQuery(`
        SELECT * FROM (
          SELECT ct.coinTransactionId, ct.senderId,
                 IFNULL(sender.userFirstName,'Store') AS senderFirstName,
                 IFNULL(sender.userSurname,'') AS senderSurname,
                 ct.receiverId,
                 IFNULL(receiver.userFirstName,'Unknown') AS receiverFirstName,
                 IFNULL(receiver.userSurname,'') AS receiverSurname,
                 MAX(ct.transactionDate) AS transactionDate,
                 SUM(ct.coinCount) AS coinCount
          FROM db_coin_transaction ct
          LEFT JOIN db_users sender ON ct.senderId = sender.userID
          LEFT JOIN db_users receiver ON ct.receiverId = receiver.userID
          WHERE ct.senderId=? OR ct.receiverId=?
          GROUP BY ct.coinTransactionId, ct.senderId, ct.receiverId
          UNION ALL
          SELECT p.paymentId AS coinTransactionId, 'STORE' AS senderId, 'Store' AS senderFirstName, '' AS senderSurname,
                 p.userId AS receiverId, IFNULL(u.userFirstName,'Unknown') AS receiverFirstName,
                 IFNULL(u.userSurname,'') AS receiverSurname, p.createdAt AS transactionDate, p.coinCount
          FROM db_coin_payments p
          LEFT JOIN db_users u ON p.userId = u.userID
          WHERE p.userId=?
        ) AS combined
        ORDER BY transactionDate DESC
        LIMIT ? OFFSET ?`,
        [userID, userID, userID, limit, offset]
      );

      const [[{ totalCount }]] = await sqlQuery(`
        SELECT (
          (SELECT COUNT(DISTINCT coinTransactionId) FROM db_coin_transaction WHERE senderId=? OR receiverId=?) +
          (SELECT COUNT(*) FROM db_coin_payments WHERE userId=?)
        ) AS totalCount`,
        [userID, userID, userID]
      );

      const haveMore = (offset + limit) < totalCount;
      return transactions.map(row => ({ ...row, haveMore, totalCount }));
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      throw err;
    }
  },
  withdrawCoins: async (data) => {
    console.log(data);

    const { userID, coinCount, amount, reference_id, PAYOUT_TRANSFER_TYPE } = data;
    if (!userID || !coinCount || !amount || !reference_id || !PAYOUT_TRANSFER_TYPE) throw new Error('userID, coinCount, reference_id and amount are required');
    const numAmount = amount

    let transactionStarted = false;
    try {
      await sqlQuery('START TRANSACTION');
      transactionStarted = true;
      const [user] = await sqlQuery('SELECT 1 FROM db_users WHERE userID = ? AND userDeleted IS NULL LIMIT 1', [userID]);
      if (!user) throw new Error('User not found or deleted');

      const coin = await sqlQuery('SELECT coinStoreId FROM db_coin_store WHERE ownerId = ? order by id desc LIMIT ?', [userID, coinCount]);
      if (!coin) throw new Error('Coin not found or not owned by user');


      for (let i = 0; i < coinCount; i++) {
        await sqlQuery('UPDATE db_coin_store SET ownerId = NULL, transactionId = Null, purchasedAt = Null WHERE coinStoreId = ?', [coin[i].coinStoreId]);
      }
      const transactionId = reference_id;
      const orderNo = `DEBIT-${new Date().getTime()}`
      const paymentId = uuidv4();

      await sqlQuery(
        'INSERT INTO db_coin_transaction (coinTransactionId, orderNo, status, senderId, receiverId, coinCount, amount, transactionDate, metaData) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)',
        [transactionId, orderNo, 'processing', 'withdraw', userID, coinCount, numAmount, JSON.stringify({})]
      );
      await sqlQuery('INSERT INTO db_coin_payments (paymentId,paymentMethod, userId, coinCount,amount, createdAt, transactionId, paymentType, status) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?,?)', [paymentId, PAYOUT_TRANSFER_TYPE, userID, coinCount, numAmount, transactionId, 'debit', 'processing']);

      await sqlQuery('COMMIT');
      transactionStarted = false;

      return { success: true, msg: 'Coins withdrawn successfully' };
    } catch (err) {
      if (transactionStarted) await sqlQuery('ROLLBACK').catch(e => console.error('Rollback failed', e));
      console.error('Withdraw coins error:', err);
      return { success: false, msg: err.message };
    }
  }
};
