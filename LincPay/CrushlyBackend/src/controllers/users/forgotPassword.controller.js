const moment = require('moment');
const { sqlQuery } = require('../../Modules/sqlHandler');
const Mail = require('../../Modules/email');

module.exports = (dependencies) => {
  return async (req, res) => {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ status: false, msg: 'Email is required' });
    }

    try {
      const userCheck = await sqlQuery(
        'SELECT userID FROM db_users WHERE userEmail = ? AND userDeleted IS NULL LIMIT 1',
        [userEmail]
      );

      if (userCheck.length === 0) {
        return res.status(404).json({ status: false, msg: 'User not found' });
      }

      const userID = userCheck[0].userID;
      const otp = Math.floor(1000 + Math.random() * 9000);
      const now = new Date();

      let currentAttempt = 1;
      let newAttempt = 1;
      let coolDownTime = null;

      const existing = await sqlQuery(
        'SELECT attempt, coolDownTime FROM db_otp_verification WHERE userID = ? LIMIT 1',
        [userID]
      );

      if (existing.length > 0) {
        const { attempt, coolDownTime: prevCooldown } = existing[0];
        const cooldownDate = new Date(prevCooldown);
        const cooldownActive = cooldownDate > now;

        currentAttempt = attempt;

        if (cooldownActive && attempt % 3 === 0) {
          const waitMins = Math.ceil((cooldownDate - now) / (60 * 1000));
          return res.status(429).json({
            status: false,
            msg: `Too many failed attempts. Try again after ${waitMins} minute(s).`,
          });
        }

        newAttempt = attempt + 1;

        if (newAttempt % 3 === 0) {
          const stage = Math.floor(newAttempt / 3) - 1; // stage 0 = 3rd, stage 1 = 6th, etc.
          const waitMinutes = 5 * Math.pow(2, stage);
          coolDownTime = new Date(now.getTime() + waitMinutes * 60 * 1000);
        } else {
          coolDownTime = now;
        }
      } else {
        coolDownTime = new Date(now.getTime() + 5 * 60 * 1000);
      }

      await sqlQuery(
        `INSERT INTO db_otp_verification (userID, otp, attempt, dateUpdated, coolDownTime)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           otp = VALUES(otp),
           attempt = VALUES(attempt),
           dateUpdated = VALUES(dateUpdated),
           coolDownTime = VALUES(coolDownTime)`,
        [userID, otp, newAttempt, now, coolDownTime]
      );

      await Mail.send({
        userEmail,
        subject: 'Password Reset',
        body: `Hi, your OTP for password reset is: <b>${otp}</b>. It is valid for 5 minutes.`,
        mailerType: 1,
      });

      return res.status(200).json({
        status: true,
        msg: 'An OTP has been sent to your registered email address successfully.',
        userID,
      });
    } catch (error) {
      console.error('Forgot Password Error:', error);
      return res.status(500).json({
        status: false,
        msg: 'Server Error',
        error: error.message,
      });
    }
  };
};