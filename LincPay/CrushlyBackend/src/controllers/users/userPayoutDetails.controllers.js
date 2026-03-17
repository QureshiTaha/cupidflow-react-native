const userPayoutUseCase = require('./userPayoutUseCase');

module.exports = (dependencies) => {
    const { checkIfExist, addPayoutDetails, updatePayoutDetails,getPayoutDetailByUserID } = userPayoutUseCase;
    return {
        addPayoutDetails: async (req, res) => {
            try {

                const { userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName,
                    payout_toAccount, payout_toUpi, payout_meta,
                } = req.body;
                if (!userID || !payout_userEmail || !payout_ifscCode || !payout_mobileNumber || !payout_payeeName || !payout_toAccount || !payout_toUpi) {
                    return res.status(400).json({ success: false, message: 'Missing some required fields | userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName, payout_toAccount, payout_toUpi' });
                }

                const isExist = await checkIfExist({ userID }); //checkIfExist

                if (isExist.success) return res.status(500).json({ status: false, message: 'Payout Details already exist' });

                const result = await addPayoutDetails({
                    userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName,
                    payout_toAccount, payout_toUpi, payout_meta,
                });
                res.status(result.success ? 200 : 500).json(result);
            } catch (error) {
                console.error('Error adding Payout Details | stacktrace:\n', error);
                return res.status(500).json({ success: false, message: error.message });
            }
        },
        updatePayoutDetails: async (req, res) => {
            try {
                const { userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName,
                    payout_toAccount, payout_toUpi, payout_meta,
                } = req.body;
                if (!userID || !payout_userEmail || !payout_ifscCode || !payout_mobileNumber || !payout_payeeName || !payout_toAccount || !payout_toUpi) {
                    return res.status(400).json({ success: false, message: 'Missing some required fields | userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName, payout_toAccount, payout_toUpi' });
                }
                const isExist = await checkIfExist({ userID }); //checkIfExist

                if (!isExist.success) return res.status(500).json({ status: false, message: 'Payout Details not exist' });

                const result = await updatePayoutDetails({
                    userID, payout_userEmail, payout_ifscCode, payout_mobileNumber, payout_payeeName,
                    payout_toAccount, payout_toUpi, payout_meta,
                });
                res.status(result.success ? 200 : 500).json(result);
            } catch (error) {
                console.error('Error updating Payout Details | stacktrace:\n', error);
                return res.status(500).json({ success: false, message: error.message });
            }
        },
        getPayoutDetails: async (req, res) => {
            try {
                const { userID } = req.params;
                const result = await getPayoutDetailByUserID({ userID });
                res.status(result.success ? 200 : 500).json(result);
            } catch (error) {
                console.error('Error getting Payout Details | stacktrace:\n', error);
                return res.status(500).json({ success: false, message: error.message });
            }
        },
    }
};

