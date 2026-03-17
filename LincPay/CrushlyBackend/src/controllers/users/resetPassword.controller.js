const bcrypt = require('bcrypt');
const { sqlQuery } = require('../../Modules/sqlHandler');
const Mail = require('../../Modules/email'); 

module.exports = (dependencies) => {
  return async (req, res) => {
    const { userID, password } = req.body;

    if (!userID || !password) {
      return res.status(400).json({ status: false, msg: 'UserID and password are required' });
    }

    try {
      const user = await sqlQuery(
        'SELECT userPassword, userEmail FROM db_users WHERE userID = ? LIMIT 1',
        [userID]
      );

      if (user.length === 0) {
        return res.status(404).json({ status: false, msg: 'User not found' });
      }

      const existingHashedPassword = user[0].userPassword;
      const userEmail = user[0].userEmail;

      const isSamePassword = await bcrypt.compare(password, existingHashedPassword);
      if (isSamePassword) {
        return res.status(400).json({
          status: false,
          msg: 'New password must be different from the current password',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await sqlQuery(
        'UPDATE db_users SET userPassword = ? WHERE userID = ?',
        [hashedPassword, userID]
      );

      await Mail.send({
        userEmail,
        subject: 'Password Successfully Updated',
        body: `Hi, your account password was successfully updated. If this wasn’t you, please contact our support immediately.`,
        mailerType: 1,
      });

      return res.status(200).json({ status: true, msg: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset Password Error:', error);
      return res.status(500).json({
        status: false,
        msg: 'Server Error',
        error: error.message,
      });
    }
  };
};
