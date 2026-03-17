const userUseCase = require('./userUseCase');

module.exports = (dependencies) => {
  return async (req, res) => {
    try {
      const { search = "" } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { users, totalCount } = await userUseCase.getAllUsers(search, limit, offset);

      let userDetails = users;
      if (users.length > 0) {
        userDetails[userDetails.length - 1].haveMore = totalCount > offset + limit;
        userDetails[userDetails.length - 1].totalCount = totalCount;
      }

      res.send({ status: true, msg: 'success', data: userDetails, totalCount: totalCount, haveMore: totalCount > offset + limit });

    } catch (error) {
      console.error(error);
      res.status(400).json({ message: "No users found" });
    }
  };
};
