const addCoinsController = require('./addCoin.controller');
const sendCoinController = require('./sendCoin.controller');
const purchaseCoinController = require('./purchaseCoin.controller');
const userTotalCoinController = require('./userTotalCoin.controller');
const getTotalCoinStoreController = require('./getTotalCoinStore.controller');
const getAvailableCoinsController = require('./getAvailableCoins.controller');
const listPurchasedCoinController = require('./listPurchasedCoin.controller');
const coinHistoryController = require('./coinHistory.controller');
const createOfferController = require('./createOffer.controller');
const updateOfferController = require('./updateOffer.controller');
const deleteOfferController = require('./deleteOffer.controller');
const getAllOffersController = require('./getAllOffers.controller');
const getOfferByIdController = require('./getOfferById.controller');
const userTransactionController = require('./userTransactionHistory.controller');
const getUserCoinTransactionController = require('./getUserCoinTransaction.controller');

module.exports = (dependencies) => {
  return {
    addCoinsController: addCoinsController(dependencies),
    sendCoinController: sendCoinController(dependencies),
    purchaseCoinController: purchaseCoinController(dependencies),
    userTotalCoinController: userTotalCoinController(dependencies),
    getTotalCoinStoreController: getTotalCoinStoreController(dependencies),
    getAvailableCoinsController: getAvailableCoinsController(dependencies),
    listPurchasedCoinController: listPurchasedCoinController(dependencies),
    coinHistoryController: coinHistoryController(dependencies),
    createOfferController: createOfferController(dependencies),
    updateOfferController: updateOfferController(dependencies),
    deleteOfferController: deleteOfferController(dependencies),
    getAllOffersController: getAllOffersController(dependencies),
    getOfferByIdController: getOfferByIdController(dependencies),
    userTransactionController: userTransactionController(dependencies),
    getUserCoinTransactionController: getUserCoinTransactionController(dependencies),
  };
};


