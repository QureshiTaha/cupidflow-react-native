const userUseCase = require('./userUseCase');
const mail = require('../../Modules/email');
const utils = require('../../Modules/utils');
module.exports = (dependencies) => {
  return async (req, res, next) => {
    try {
      const { userID, userPassword } = req.body;
      if (!userID) res.status(400).json({ success: false, message: 'No users found' });
      const newPassword = userPassword || utils.passwordGenerator();

      const data = await userUseCase.updatePassword({ userID, userPassword: newPassword });
      mail.send({ subject: 'Password Changed', body: 'Your Password Has Changed <br> Your New Password is: <strong>' + newPassword + '</strong> <br> You Can Login Now', userID, mailerType: 1 });
      res.status(200).send({ status: true, msg: 'success', data: data });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Error Resetting Password' });
    }
  };
};
