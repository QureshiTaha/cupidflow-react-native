const express = require('express');
const { coinsController } = require('../controllers'); 

const {
    addCoinsController, 
    sendCoinController,
    purchaseCoinController,
    userTotalCoinController,
    getTotalCoinStoreController,
    getAvailableCoinsController,
    listPurchasedCoinController,
    coinHistoryController,
    createOfferController,
    updateOfferController,
    deleteOfferController,
    getAllOffersController,
    getOfferByIdController,
    userTransactionController,
    getUserCoinTransactionController
} = coinsController();

const router = express.Router();

router.route('/add-coin').post(addCoinsController);
router.route('/send-coin').post(sendCoinController);
router.route('/purchase-coin').post(purchaseCoinController);
router.route('/user-total-coin/:userID').get(userTotalCoinController);  
router.route('/total-coin-store').get(getTotalCoinStoreController);
router.route('/available-coins').get(getAvailableCoinsController);
router.route('/purchased-coins').get(listPurchasedCoinController);
router.route('/coin-history/:coinStoreId').get(coinHistoryController);
router.route('/create-offer').post(createOfferController);
router.route('/update-offer').post(updateOfferController);
router.route('/delete-offer/:offerId').delete(deleteOfferController);
router.route('/all-offers').get(getAllOffersController);
router.route('/offer/:offerId').get(getOfferByIdController);
router.route('/user-transaction/:userID').get(userTransactionController);
router.route('/user-coin-transactions/:userID').get(getUserCoinTransactionController);
module.exports = router;