const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = () => {
  return async (req, res) => {
    try {
      const offers = await sqlQuery(`SELECT * FROM db_coin_offers`);
      res.status(200).json({ status: true, data: offers });
    } catch (error) {
      res.status(500).json({ status: false, msg: 'Server Error', error: error.toString() });
    }
  };
};