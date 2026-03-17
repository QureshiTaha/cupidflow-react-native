const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { offerId } = req.params;
    if (!offerId) {
      return res.status(400).json({ status: false, msg: 'offerId is required' });
    }

    try {
      const [offer] = await sqlQuery(`SELECT * FROM db_coin_offers WHERE offerId = ?`, [offerId]);

      if (!offer) {
        return res.status(404).json({ status: false, msg: 'Offer not found' });
      }

      res.status(200).json({ status: true, data: offer });
    } catch (error) {
      res.status(500).json({ status: false, msg: 'Server Error', error: error.toString() });
    }
  };
};