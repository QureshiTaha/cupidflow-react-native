const { sqlQuery } = require('../../Modules/sqlHandler');
const { myConsole } = require('../../utils/myConsole');

module.exports = () => {
  return async (req, res) => {
    const userID = req.params.userID;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const paymentType = req.query.paymentType || null;

    try {
      // Build SQL dynamically based on paymentType
      let sql = '';
      let countSql = '';
      let params = [];
      let countParams = [];

      if (paymentType) {
        // Only db_coin_payments filtered by paymentType
        sql = `
          SELECT 
            p.paymentId AS coinTransactionId,
            'STORE' AS senderId,
            'Store' AS senderFirstName,
            '' AS senderSurname,
            p.userId AS receiverId,
            IFNULL(u.userFirstName, 'Unknown') AS receiverFirstName,
            IFNULL(u.userSurname, '') AS receiverSurname,
            p.createdAt AS transactionDate,
            p.coinCount,
            p.status,
            p.paymentType
          FROM db_coin_payments p
          LEFT JOIN db_users u ON p.userId = u.userID
          WHERE p.userId = ? AND p.paymentType = ?
          ORDER BY p.createdAt DESC
          LIMIT ? OFFSET ?
        `;
        params = [userID, paymentType, limit, offset];

        countSql = `
          SELECT COUNT(*) AS totalCount
          FROM db_coin_payments p
          WHERE p.userId = ? AND p.paymentType = ?
        `;
        countParams = [userID, paymentType];
      } else {
        // Original unified query (both tables)
        sql = `
          SELECT * FROM (
            SELECT 
              ct.coinTransactionId,
              ct.senderId,
              IFNULL(sender.userFirstName, 'Store') AS senderFirstName,
              IFNULL(sender.userSurname, '') AS senderSurname,
              ct.receiverId,
              IFNULL(receiver.userFirstName, 'Unknown') AS receiverFirstName,
              IFNULL(receiver.userSurname, '') AS receiverSurname,
              MAX(ct.transactionDate) AS transactionDate,
              SUM(ct.coinCount) AS coinCount,
              MAX(ct.status) AS status,
              NULL AS paymentType
            FROM db_coin_transaction ct
            LEFT JOIN db_users sender ON ct.senderId = sender.userID
            LEFT JOIN db_users receiver ON ct.receiverId = receiver.userID
            WHERE ct.senderId = ? OR ct.receiverId = ?
            GROUP BY ct.coinTransactionId, ct.senderId, ct.receiverId

            UNION ALL

            SELECT 
              p.paymentId AS coinTransactionId,
              'STORE' AS senderId,
              'Store' AS senderFirstName,
              '' AS senderSurname,
              p.userId AS receiverId,
              IFNULL(u.userFirstName, 'Unknown') AS receiverFirstName,
              IFNULL(u.userSurname, '') AS receiverSurname,
              p.createdAt AS transactionDate,
              p.coinCount,
              p.status,
              p.paymentType
            FROM db_coin_payments p
            LEFT JOIN db_users u ON p.userId = u.userID
            WHERE p.userId = ?
              AND NOT EXISTS (
                SELECT 1 
                FROM db_coin_transaction ct 
                WHERE ct.receiverId = p.userId 
                  AND ct.coinCount = p.coinCount 
                  AND DATE(ct.transactionDate) = DATE(p.createdAt)
              )
          ) AS combined
          ORDER BY transactionDate DESC
          LIMIT ? OFFSET ?
        `;
        params = [userID, userID, userID, limit, offset];

        countSql = `
          SELECT COUNT(*) AS totalCount
          FROM (
            SELECT ct.coinTransactionId, NULL AS paymentType
            FROM db_coin_transaction ct
            WHERE ct.senderId = ? OR ct.receiverId = ?

            UNION
            SELECT p.paymentId, p.paymentType
            FROM db_coin_payments p
            WHERE p.userId = ?
              AND NOT EXISTS (
                SELECT 1 
                FROM db_coin_transaction ct 
                WHERE ct.receiverId = p.userId 
                  AND ct.coinCount = p.coinCount 
                  AND DATE(ct.transactionDate) = DATE(p.createdAt)
              )
          ) AS totalCombined
        `;
        countParams = [userID, userID, userID];
      }

      const unifiedTransactions = await sqlQuery(sql, params);
      const totalCountResult = await sqlQuery(countSql, countParams);
      const totalCount = totalCountResult[0]?.totalCount || 0;
      const haveMore = offset + limit < totalCount;

      return res.status(200).json({
        status: true,
        totalTransactions: totalCount,
       data: unifiedTransactions.map((row, index) => {
  let transactionType = '';
  let transactionLabel = '';

  const senderIdLower = String(row.senderId || '').toLowerCase();
  const isStore =
    senderIdLower === 'store' || senderIdLower === 'purchased from store';
  const st = String(row.status || '').toLowerCase();
  const isWithdrawalRow =
    senderIdLower === 'withdraw' ||
    String(row.paymentType || '').toLowerCase() === 'debit';

  // 🔹 Withdrawals (db_coin_payments with paymentType = 'debit')
  if (isWithdrawalRow && row.receiverId === userID) {
    switch (st) {
      case 'processing':
        transactionType = 'pending';
        transactionLabel = 'Withdrawal Processing';
        break;
      case 'cancelled':
        transactionType = 'cancelled';
        transactionLabel = 'Withdrawal Cancelled';
        break;
      case 'failed':
      case 'withdraw-failed':
        transactionType = 'withdraw-failed';
        transactionLabel = 'Withdrawal Failed';
        break;
      case 'success':
      case 'withdraw-success':
        transactionType = 'withdraw-success';
        transactionLabel = 'Withdrawal Completed';
        break;
      default:
        transactionType = 'pending';
        transactionLabel = 'Withdrawal';
        break;
    }
  }
  // 🔹 P2P send (you sent coins to someone) — respect status
  else if (row.senderId === userID) {
    if (st === 'success' || st === 'completed') {
      transactionType = 'sent';
      transactionLabel = `Sent to ${row.receiverFirstName}`;
    } else if (st === 'processing' || st === 'pending') {
      transactionType = 'pending';
      transactionLabel = `Sending to ${row.receiverFirstName}`;
    } else if (st === 'failed') {
      transactionType = 'failed';
      transactionLabel = `Send failed to ${row.receiverFirstName}`;
    } else if (st === 'cancelled') {
      transactionType = 'cancelled';
      transactionLabel = `Send cancelled to ${row.receiverFirstName}`;
    } else {
      transactionType = 'sent';
      transactionLabel = `Sent to ${row.receiverFirstName}`;
    }
  }
  else if (row.receiverId === userID && isStore) {
    if (st === 'success' || st === 'completed') {
      transactionType = 'received';
      transactionLabel = 'Purchased from Store';
    } else if (st === 'processing') {
      transactionType = 'pending';
      transactionLabel = 'Pending Purchase';
    } else if (st === 'failed') {
      transactionType = 'failed';
      transactionLabel = 'Purchase Failed';
    } else if (st === 'cancelled') {
      transactionType = 'cancelled';
      transactionLabel = 'Purchase Cancelled';
    } else {
      transactionType = 'received';
      transactionLabel = 'Purchase';
    }
  }
  // 🔹 Incoming P2P (non-store) transfers to this user
  else if (row.receiverId === userID && !isStore) {
    if (st === 'success' || st === 'completed') {
      transactionType = 'received';
      transactionLabel = `Received from ${row.senderFirstName}`;
    } else if (st === 'processing' || st === 'pending') {
      transactionType = 'pending';
      transactionLabel = `Pending from ${row.senderFirstName}`;
    } else if (st === 'failed') {
      transactionType = 'failed';
      transactionLabel = `Transfer Failed from ${row.senderFirstName}`;
    } else if (st === 'cancelled') {
      transactionType = 'cancelled';
      transactionLabel = `Transfer Cancelled from ${row.senderFirstName}`;
    } else {
      transactionType = 'received';
      transactionLabel = `From ${row.senderFirstName}`;
    }
  }

  return {
    ...row,
    transactionType,
    transactionLabel,
    ...(index === unifiedTransactions.length - 1
      ? { haveMore, totalCount }
              : {}),
          };
        }),
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ status: false, msg: 'Internal Server Error' });
    }
  };
};
