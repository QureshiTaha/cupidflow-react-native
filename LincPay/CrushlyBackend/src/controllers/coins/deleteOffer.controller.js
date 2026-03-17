const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    const { offerId } = req.params;

    if (!offerId) {
      return res.status(400).json({ status: false, msg: 'offerId is required' });
    }

    try {
      const [offer] = await sqlQuery(
        `SELECT * FROM db_coin_offers WHERE offerId = ?`,
        [offerId]
      );

      if (!offer) {
        return res.status(404).json({ status: false, msg: 'Offer not found' });
      }

      await sqlQuery(
        `DELETE FROM db_coin_offers WHERE offerId = ?`,
        [offerId]
      );

      return res.status(200).json({ status: true, msg: 'Offer deleted successfully' });

    } catch (error) {
      console.error('Error deleting offer:', error);
      return res.status(500).json({ status: false, msg: 'Server Error', error: error.toString() });
    }
  };
};
