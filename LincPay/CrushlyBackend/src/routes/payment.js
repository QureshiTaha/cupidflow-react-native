const express = require('express');
const { paymentController } = require('../controllers');

const {
  callBackHandler,
  paymentInitiate,
  payoutInitiate,
  payoutCallBackHandler
} = paymentController();

const router = express.Router();

router.route('/initiate').post(paymentInitiate);
router.route('/payout-initiate').post(payoutInitiate);
router.route('/callback').post(callBackHandler);
router.route('/callback-payout').post(payoutCallBackHandler);

module.exports = router;
