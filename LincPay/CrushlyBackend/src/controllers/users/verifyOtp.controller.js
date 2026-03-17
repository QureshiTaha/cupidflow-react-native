const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');

module.exports = (dependencies) => {
  return async (req, res) => {
    const { userID, otp } = req.body;

    if (!userID || !otp) {
      return res.status(400).json({ status: false, msg: 'UserID and OTP are required' });
    }

    try {
      const otpRecords = await sqlQuery(
        'SELECT otp, attempt, dateUpdated, coolDownTime FROM db_otp_verification WHERE userID = ? LIMIT 1',
        [userID]
      );

      if (otpRecords.length === 0) {
        return res.status(404).json({ status: false, msg: 'OTP not found. Please request a new one.' });
      }

      const record = otpRecords[0];
      const now = new Date();
      const expiryTime = new Date(new Date(record.dateUpdated).getTime() + 5 * 60 * 1000);

      if (now > expiryTime) {
        return res.status(400).json({ status: false, msg: 'OTP expired. Please request a new one.' });
      }

      if (String(otp) !== String(record.otp)) {
        await sqlQuery(
          'UPDATE db_otp_verification SET attempt = attempt + 1, dateUpdated = ? WHERE userID = ?',
          [now, userID]
        );

        return res.status(400).json({ status: false, msg: 'Invalid OTP. Please try again.' });
      }

      await sqlQuery('DELETE FROM db_otp_verification WHERE userID = ?', [userID]);

      return res.status(200).json({ status: true, msg: 'OTP verified successfully' });

    } catch (error) {
      console.error('Verify OTP Error:', error);
      return res.status(500).json({ status: false, msg: 'Server error', error: error.message });
    }
  };
};
