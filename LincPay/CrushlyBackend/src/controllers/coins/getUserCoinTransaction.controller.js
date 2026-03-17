const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
    return async (req, res) => {
        try {
            const { userID } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            if (!userID) {
                return res.status(400).json({
                    status: false,
                    msg: "userID is required",
                });
            }

            const transactions = await sqlQuery(
                `
                SELECT 
                    ct.coinTransactionId,
                    ct.orderNo,
                    ct.status,
                    ct.coinCount,
                    ct.amount,
                    ct.transactionDate,
                    ct.metaData,

                    -- Sender object
                    JSON_OBJECT(
                        'userID', sender.userID,
                        'firstName', IFNULL(sender.userFirstName, 'Store'),
                        'surname', IFNULL(sender.userSurname, ''),
                        'email', sender.userEmail,
                        'profilePic', sender.profilePic
                    ) AS sender,

                    -- Receiver object
                    JSON_OBJECT(
                        'userID', receiver.userID,
                        'firstName', IFNULL(receiver.userFirstName, 'Unknown'),
                        'surname', IFNULL(receiver.userSurname, ''),
                        'email', receiver.userEmail,
                        'profilePic', receiver.profilePic
                    ) AS receiver

                FROM db_coin_transaction ct
                LEFT JOIN db_users sender ON ct.senderId = sender.userID
                LEFT JOIN db_users receiver ON ct.receiverId = receiver.userID
                WHERE ct.senderId = ? OR ct.receiverId = ?
                ORDER BY ct.transactionDate DESC
                LIMIT ? OFFSET ?
                `,
                [userID, userID, limit, offset]
            );

            const totalResult = await sqlQuery(
                `
                SELECT COUNT(*) as totalCount
                FROM db_coin_transaction
                WHERE senderId = ? OR receiverId = ?
                `,
                [userID, userID]
            );

            const totalCount = totalResult[0]?.totalCount || 0;
            const totalPages = Math.ceil(totalCount / limit);
            const hasMore = page < totalPages;

            if (!transactions || transactions.length === 0) {
                return res.status(404).json({
                    status: false,
                    msg: "No transactions found for this user",
                });
            }

            return res.status(200).json({
                status: true,
                msg: "Transactions fetched successfully",
                pagination: {
                    page,
                    limit,
                    totalPages,
                    totalCount,
                    hasMore
                },
                data: transactions.map(tx => {
                    const sender = JSON.parse(tx.sender);
                    const receiver = JSON.parse(tx.receiver);

                    let transactionType = "store";
                    let transactionLabel = "Coins purchased from Store";

                    if (sender?.userID === userID) {
                        transactionType = "sent";
                        transactionLabel = "Coins sent to another user";
                    } else if (receiver?.userID === userID) {
                        transactionType = "received";
                        if (sender?.firstName === "Store") {
                            transactionLabel = "Coins received from Store";
                        } else {
                            transactionLabel = "Coins received from another user";
                        }
                    }

                    return {
                        ...tx,
                        sender,
                        receiver,
                        metaData: tx.metaData ? JSON.parse(tx.metaData) : {},
                        transactionType,
                        transactionLabel
                    };
                }),

            });
        } catch (error) {
            console.error("Error fetching user coin transactions:", error);
            return res.status(500).json({
                status: false,
                msg: "Internal server error",
            });
        }
    };
};
