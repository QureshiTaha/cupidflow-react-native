const { v4: uuidv4 } = require('uuid');
const {
    encryptString, decryptString, MERCHANT_ID,
    ENCRYPTION_KEY, PAYOUT_API_KEY, PAYOUT_SECRET,
    PAYOUT_THROUGH,
    PAYOUT_TRANSFER_TYPE,
    PAYOUT_BASE_URL
} = require('../../Modules/paymentConfigs');
const { getUserByUserID } = require('../users/userUseCase');
const { getOfferByOfferId, totalUserCoinsCount, withdrawCoins } = require('../coins/coinUseCase');
const { myConsole } = require('../../utils/myConsole');
const userPayoutUseCase = require('../users/userPayoutUseCase');
const { default: axios } = require('axios');

module.exports = (dependencies) => {
    return async (req, res) => {
        console.log("\n-=-=-=- Payout Initiated -=-=-=-\n");
        const { checkIfExist, getPayoutDetailByUserID } = userPayoutUseCase;
        try {
            // Validate required fields from request body
            const { userID, coinCount } = req.body;

            if (!userID || !coinCount) {
                return res.status(400).json({
                    status: false,
                    message: 'Missing required fields: userID, coinCount'
                });
            }
            const user_ = await getUserByUserID(userID);
            if (!user_.length) {
                return res.status(405).json({ status: false, message: 'Invalid User | User Not Found', data: user_ });
            }
            const user = user_[0];
            const payoutDetail = await getPayoutDetailByUserID({ userID });

            if (!payoutDetail.success) {
                return res.status(406).json({ status: false, message: 'Payout Details are missing | please add payout details', data: payoutDetail });
            }

            const { payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName, payout_toAccount, payout_toUpi, payout_meta } = payoutDetail.data;
            // check if any missing fields
            if (!payout_userEmail || !payout_ifscCode || !payout_mobileNumber || !payout_payeeName || !payout_toAccount || !payout_toUpi) {
                return res.status(406).json({ status: false, message: 'Some Payout Details are missing | please add payout details', data: payoutDetail });
            }

            // Check coins OF user
            const totalCoins = await totalUserCoinsCount({ userID });
            console.log("TotalCoins", totalCoins);

            if (totalCoins < coinCount) {
                return res.status(410).json({ status: false, message: 'Not enough coins to withdraw', data: { totalCoins } });
            }

            const reference_id = 'DEBIT-REF' + Date.now().toString().toUpperCase();
            const OneCoinValue = 1; // in rupee 
            const PlatformFee = 0; // in rupee
            const transactionCharge = 3; //in percent
            const totalCoinValue = coinCount * OneCoinValue; // in rupee
            const transferAmount = totalCoinValue - (totalCoinValue * transactionCharge / 100) + PlatformFee;
            const purposeMessage = `PayoutForCoins${coinCount}`;


            // Set -store -payment and -transaction tables
            const withDraw = await withdrawCoins({ userID, coinCount, amount: transferAmount, reference_id, PAYOUT_TRANSFER_TYPE });
            console.log("withDraw", { userID, coinCount, amount: transferAmount, reference_id, PAYOUT_TRANSFER_TYPE });
            if (!withDraw.success) return res.status(500).json(withDraw);


            const payoutRequest =
            {
                "apikey": PAYOUT_API_KEY,
                "beneficiaryDetails": {
                    "emailAddress": payout_userEmail,
                    "ifscCode": payout_ifscCode,
                    "mobileNumber": payout_mobileNumber,
                    "payeeName": payout_payeeName
                },
                "mid": MERCHANT_ID,
                "payoutThrough": PAYOUT_THROUGH,
                "purposeMessage": purposeMessage,
                "referenceId": reference_id,
                "secrete": PAYOUT_SECRET,
                "toAccount": payout_toAccount,
                "toUpi": payout_toUpi,
                "transferAmount": transferAmount,
                "transferType": PAYOUT_TRANSFER_TYPE
            };
            myConsole("payoutRequest", payoutRequest);

            //Gateway
            const gatewayResponse = await axios.post(PAYOUT_BASE_URL, payoutRequest)
                .then((response) => {
                    // console.log("Payout Initiated", response);
                    return { status: true, message: 'Success', data: response.data };
                })
                .catch((error) => {
                    console.error("Payment initiation error:", error);
                    return {
                        status: false,
                        message: 'Payment initiation failed',
                        error: error
                    }
                });

            if (!gatewayResponse.status) {
                return res.status(500).json(gatewayResponse);
            }





            // send mail


            return res.status(200).json({ status: true, message: 'Success', data: gatewayResponse });

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