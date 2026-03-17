const userUseCase = require('./userUseCase');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const { userID } = req.params;
      if (!userID) {
        return res.status(400).json({ status: false, msg: 'userID is required' });
      }
      const userDetails = await userUseCase.getUserByUserID(userID);
      if (!userDetails || userDetails.length === 0) {
        return res.status(404).json({ status: false, msg: 'User not found' });
      }
      res.status(200).json({ status: true, msg: 'Success', data: userDetails });
    } catch (error) {
      console.error('Error fetching user by userID:', error);
      res.status(500).json({ status: false, msg: 'Server error', error: error.toString() });
    }
  };
};
