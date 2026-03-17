const { decryptString, ENCRYPTION_KEY } = require("../../Modules/paymentConfigs");
const { v4: uuidv4 } = require('uuid');
const { myConsole } = require("../../utils/myConsole");

module.exports = (dependencies) => {
    return async (req, res) => {
        try {
            myConsole("\n Payout - Req Body -", req.body);
            //              {
            // "attempt": "1",
            // "transactionStatus": "success",
            // "referenceId": "DEBIT-REF1756903537792",
            // "txnId": "BX20250903124539046273A6659bf83afe4",
            // "providerMessage": "",
            // "transferType": "IMPS",
            // "bankReferenceNumber": "524618341805",
            // "beneficiaryName": "Mohammed Taha Qureshi",
            // "amount": "1.94"
            //  }
            const { attempt, transactionStatus, referenceId, txnId, providerMessage, transferType, bankReferenceNumber, beneficiaryName, amount } = req.body;
            await sqlQuery(
                `UPDATE db_coin_transaction 
                SET  status = ?, metaData = ?
                WHERE coinTransactionId = ?`,
                [
                    'withdraw-success',
                    JSON.stringify(req.body),
                    referenceId
                ]
            );

            // await sqlQuery('INSERT INTO db_coin_payments (paymentId, userId, coinCount,amount, createdAt, paymentType, status) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
            //      [txnId, userID, coinCount, amount, 'debit', 'processing']);

            await sqlQuery('UPDATE db_coin_payments SET amount = ?, status = ? where transactionId = ?',
                [amount, transactionStatus, referenceId]);


            return res.status(200).json({
                status: true,
                msg: 'Payout Callback received successfully',
                data: req.body
            });
        } catch (error) {
            console.log("error/exception occurred\n stacktrace", error);

            return res.status(500).json({
                status: false,
                msg: 'error/exception occurred\n stacktrace: ' + error,
            });
        }
    }
};