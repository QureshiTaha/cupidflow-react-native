const { sqlQuery } = require('../../Modules/sqlHandler');
const { v4: uuidv4 } = require('uuid');

module.exports = () => {
  return async (req, res) => {
    let { coinAmount, actualPrice, offerPrice } = req.body;

    if (!coinAmount || !actualPrice || !offerPrice) {
        return res.status(400).json({ status: false, msg: 'All fields are required' });
      } else if (isNaN(coinAmount) || isNaN(actualPrice) || isNaN(offerPrice)) {
        return res.status(400).json({ status: false, msg: 'coinAmount, actualPrice, and offerPrice must be numbers' });
      } else if (coinAmount <= 0 || actualPrice <= 0 || offerPrice <= 0) {
        return res.status(400).json({ status: false, msg: 'coinAmount, actualPrice, and offerPrice must be greater than 0' });
      } else if (offerPrice >= actualPrice) {
        return res.status(400).json({ status: false, msg: 'offerPrice must be less than actualPrice' });
      }


    const offerId = uuidv4();

    try {
      // Optional: Prevent duplicate active offer
      const [existing] = await sqlQuery(
        `SELECT id FROM db_coin_offers WHERE coinAmount = ? AND isActive = 1`,
        [coinAmount]
      );

      if (existing) {
        return res.status(409).json({
          status: false,
          msg: `An active offer already exists for ${coinAmount} coins`,
        });
      }

      await sqlQuery(
        `INSERT INTO db_coin_offers (offerId, coinAmount, actualPrice, offerPrice, isActive) VALUES (?, ?, ?, ?, 1)`,
        [offerId, coinAmount, actualPrice, offerPrice]
      );

      return res.status(201).json({
        status: true,
        msg: 'Offer added successfully',
        offerId,
      });
    } catch (error) {
      console.error('Error adding offer:', error);
      return res.status(500).json({
        status: false,
        msg: 'Internal Server Error',
        error: error.toString(),
      });
    }
  };
};
