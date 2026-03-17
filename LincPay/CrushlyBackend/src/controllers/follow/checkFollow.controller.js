const followUseCase = require('./followUseCase');

module.exports = () => {
  return async (req, res) => {
    const { followBy, followTo } = req.body;

    if (!followBy || !followTo) {
      return res.status(400).json({
        success: false,
        message: 'followBy and followTo are required'
      });
    }

    try {
      const result = await followUseCase.checkIfFollowing(followBy, followTo);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Error checking follow status',
          error: result.message
        });
      }

      return res.status(200).json({
        success: true,
        isFollowing: result.data,
        message: result.data
          ? 'User is following the target user'
          : 'User is not following the target user'
      });

    } catch (error) {
      console.error('Error in checkFollow API:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.toString()
      });
    }
  };
};
