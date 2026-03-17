const userUseCase = require('./userUseCase');
module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const { userID } = req.params;
      if (!userID) res.status(400).json({ status: false, msg: 'userID is required' });

      const data = await userUseCase.deleteUser({ userID });
      res.status(200).send({ status: true, msg: 'success', data: data });
    } catch (error) {
      console.log(error);

      res.status(400).json({ status: false, msg: 'Error While Deleting user' });
    }
  };
};
