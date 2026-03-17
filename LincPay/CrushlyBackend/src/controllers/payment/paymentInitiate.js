const { v4: uuidv4 } = require('uuid');
const {
    encryptString, decryptString, MERCHANT_ID,
    ENCRYPTION_KEY, PAYMENT_BASE_URL, CALLBACK_URL
} = require('../../Modules/paymentConfigs');
const { getUserByUserEmail } = require('../users/userUseCase');
const { getOfferByOfferId, getAvailableCoins, purchaseCoins } = require('../coins/coinUseCase');
const { myConsole } = require('../../utils/myConsole');

module.exports = (dependencies) => {
    return async (req, res) => {
        try {
            // Validate required fields from request body
            const { emailId, userID, offerId } = req.body;

            if (!emailId || !userID || !offerId) {
                return res.status(400).json({
                    status: false,
                    message: 'Missing required fields: offerId, emailId, userID'
                });
            }

            const order_id = 'ORD' + Date.now().toString().toUpperCase();

            const user = await getUserByUserEmail(emailId);

            if (!user.status) {
                return res.status(404).json({ status: false, message: 'User not found' });
            }
            const offer = await getOfferByOfferId(offerId);
            if (!offer) {
                return res.status(404).json({ status: false, message: 'Offer not found' });
            }

            const availableCoins = await getAvailableCoins(1, 30, offer.coinAmount);
            if (!availableCoins.success || availableCoins.availableCoinCount === 0) {
                return res.status(400).json({
                    status: false,
                    code: "NO_COINS_AVAILABLE",
                    message: "No coins available in the system. Please try again later."
                });
            }

            if (availableCoins.availableCoinCount < offer.coinAmount) {
                return res.status(400).json({
                    status: false,
                    code: "INSUFFICIENT_COINS",
                    message: `Not enough coins available. Required: ${offer.coinAmount}, Available: ${availableCoins.availableCoinCount}`
                });
            }

            const paymentRequest = {
                "mid": MERCHANT_ID,
                "enckey": ENCRYPTION_KEY,
                "orderNo": order_id,
                "amount": `${parseFloat(offer.offerPrice).toFixed(2)}`,
                "currency": "INR",
                "txnReqType": "Slupi",
                "emailId": `${emailId}`,
                "dateOfReg": new Date().toISOString().split('T')[0],
                "customerVpa": 'quershi.t2000-1@okaxis',
                "name": `${user.data.userFirstName} ${user.data.userSurname}`,
                "userId": userID,
                "mobileNo": user.data.userPhone || "0000000000",
                "respUrl": CALLBACK_URL,
                "udf1": `${offerId}`,
                "udf2": "string",
                "udf3": "string",
                "udf4": "string",
                "udf5": "string",
                "udf6": "string",
                "udf7": "string",
                "udf8": "string",
                "udf9": "string",
                "udf10": "string",
                "udf11": "string",
                "udf12": "string",
                "udf13": "string",
                "udf14": "string",
                "userVpa": "string"
            };

            await purchaseCoins(user.data.userID, offer.coinAmount, order_id, paymentRequest);

            const encryptedPayload = encryptString(JSON.stringify(paymentRequest), ENCRYPTION_KEY);
            const paymentUrl = `${PAYMENT_BASE_URL}?payload=${encodeURIComponent(encryptedPayload)}&mid=${MERCHANT_ID}`;
            console.log("\npaymentRequest", paymentRequest);
            console.log("\nencryptedPayload", encryptedPayload);
            res.status(200).json({
                status: true,
                url: paymentUrl,
                MID: MERCHANT_ID,
                encryptedPayload: encryptedPayload,
                paymentUrl: PAYMENT_BASE_URL,
                paymentRequest: paymentRequest
            });

        } catch (error) {
            console.error("Payment initiation error:", error);
            res.status(500).json({
                status: false,
                message: 'Payment initiation failed',
                error: error.message
            });
        }
    }
}