const { decryptString, ENCRYPTION_KEY } = require("../../Modules/paymentConfigs");
const { v4: uuidv4 } = require('uuid');

module.exports = (dependencies) => {
    return async (req, res) => {
        try {
            console.log(req.body);

            const decrypt = decryptString(req.body.data, ENCRYPTION_KEY);
            console.log("decrypt", decrypt);

            // {
            //     "txnId": "ZP_C37899CBEF1FB48B3EC41",
            //     "amount": "1.0",
            //     "mid": "SLCOS00054BHO",
            //     "currency": "INR",
            //     "userVpa": "7972755589@axl",
            //     "orderNo": "ORD1755173054350",
            //     "paymentType": "DQR",
            //     "txnDate": "2025-08-14 17:34:14.79"
            //     "txnRespCode": "200",
            //     "txnStatus": "success",
            //     "custRefNo": "792103894742",
            //     "udf1": "string",
            //     "udf2": "string",
            //     "udf3": "UPI",
            //     "udf4": "QR",
            //     "respUrl": "https://api-dating-app.iceweb.in/api/v1/payment/callback"
            // }

            const parsedData = JSON.parse(decrypt);
            console.log('parsedData', parsedData)
            // Get transaction details by orderId
            const [transaction] = await sqlQuery(
                `SELECT * FROM db_coin_transaction WHERE orderNo = ?`,
                [parsedData.orderNo]
            );
            console.log("senderId going into payments:", transaction);
            if (!transaction) {
                return res.status(404).json({
                    status: false,
                    msg: "Transaction not found",
                });
            }

            await sqlQuery(
                `UPDATE db_coin_transaction 
                SET coinTransactionId = ?, status = ?, metaData = ?
                WHERE orderNo = ?`,
                [
                    parsedData.txnId,
                    parsedData.txnStatus,
                    JSON.stringify(parsedData),
                    parsedData.orderNo
                ]
            );
            const [coinStore] = await sqlQuery(
                `SELECT * FROM db_coin_store WHERE transactionId = ? OR ownerId IS NULL LIMIT 1`,
                [transaction.coinTransactionId]
            );

            if (coinStore) {
                await sqlQuery(
                    `UPDATE db_coin_store
                    SET ownerId = ?, transactionId = ?
                    WHERE transactionId = ?`,
                    [transaction.receiverId, parsedData.txnId, transaction.coinTransactionId]
                );
            }

            const paymentId = uuidv4();
            await sqlQuery(
                `INSERT INTO db_coin_payments
                (paymentId, userId, amount, coinCount, paymentMethod,paymentType, status, transactionId, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    paymentId,
                    transaction.receiverId,
                    parsedData.amount,
                    transaction.coinCount,
                    "LP_UPI",
                    "credit",
                    parsedData.txnStatus,
                    parsedData.txnId,
                ]
            );
            return res.status(200).json({
                status: true,
                msg: 'Transaction & payment updated successfully',
            });
        } catch (error) {
            console.error("Decryption error:", error);
            return res.status(500).json({
                status: false,
                msg: 'Invalid encrypted data'
            });
        }
    }
};