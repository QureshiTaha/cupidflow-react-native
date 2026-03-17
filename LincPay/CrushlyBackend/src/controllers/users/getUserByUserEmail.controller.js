const userUseCase = require('./userUseCase');

module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const { userEmail } = req.params;
      const userDetails = await userUseCase.getUserByUserEmail(userEmail);

      if (!userDetails.status) {
        return res.status(404).json({
          status: false,
          message: userDetails.message || 'User not found',
        });
      }

      res.status(200).json({
        status: true,
        msg: 'success',
        data: userDetails.data, 
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };
};
