const sql = require('./sqlHandler');
const sqlQuery = sql.query;
var admin = require('firebase-admin');
module.exports = {
  push: async function ({ title, body, userID, data }) {
    try {
      // GET FCM by userID
      const fcmTokenQuery = await sqlQuery(`SELECT fcmToken FROM db_users WHERE userID = "${userID}"`);
      if (fcmTokenQuery.length > 0) {
        const fcmToken = fcmTokenQuery[0].fcmToken;
        if (fcmToken) {
          const message = {
            notification: {
              title,
              body
            },
            data,
            token: fcmToken
          };
          await admin.messaging().send(message);
          return { success: true, message: 'Notification sent successfully' };
        } else {
          return { success: false, message: 'No FCM token found for the user' };
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
};
