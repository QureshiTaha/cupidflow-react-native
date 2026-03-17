const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { offerId, coinAmount, actualPrice, offerPrice, isActive } = req.body;

    if (!offerId || !coinAmount || !actualPrice || !offerPrice) {
      return res.status(400).json({ status: false, msg: 'offerId, coinAmount, actualPrice, and offerPrice are required' });
    }

    if ([coinAmount, actualPrice, offerPrice].some(val => isNaN(val))) {
      return res.status(400).json({ status: false, msg: 'coinAmount, actualPrice, and offerPrice must be valid numbers' });
    }

    if (coinAmount <= 0 || actualPrice <= 0 || offerPrice <= 0) {
      return res.status(400).json({ status: false, msg: 'Values must be greater than zero' });
    }

    if (offerPrice >= actualPrice) {
      return res.status(400).json({ status: false, msg: 'offerPrice must be less than actualPrice' });
    }

    try {
      const [existing] = await sqlQuery(`SELECT * FROM db_coin_offers WHERE offerId = ?`, [offerId]);

      if (!existing) {
        return res.status(404).json({ status: false, msg: 'Offer not found' });
      }

      await sqlQuery(
        `UPDATE db_coin_offers 
         SET coinAmount = ?, actualPrice = ?, offerPrice = ?, isActive = ? 
         WHERE offerId = ?`,
        [coinAmount, actualPrice, offerPrice, isActive === false ? 0 : 1, offerId]
      );

      return res.status(200).json({ status: true, msg: 'Offer updated successfully' });
    } catch (error) {
      console.error('Error updating offer:', error);
      return res.status(500).json({ status: false, msg: 'Server Error', error: error.toString() });
    }
  };
};
