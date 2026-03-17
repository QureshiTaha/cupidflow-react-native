const moment = require('moment');
const database = require('../../Modules/config');

module.exports = (dependencies) => {
  return async (req, res) => {
    try {
      const {
        userID,
        userFirstName,
        userSurname,
        userPhone,
        userAddressLine1,
        userAddressLine2,
        userAddressPostcode,
        userGender,
        userDateOfBirth,
        userAccountApproved,
        userMeta,
        userRole,
        fcmToken,
        totalFollowers,
        profilePic,
        userBio,
      } = req.body;

      if (!userID) {
        throw new Error('UserID not found');
      }
      //If userMeta is Not Object
      if (userMeta && typeof userMeta !== 'object') {
        throw new Error('userMeta must be an object');
      }
      const con = database(); // Assuming this returns a valid connection object

      let updateFields = [];
      let values = [];

      if (userFirstName) {
        updateFields.push('userFirstName = ?');
        values.push(userFirstName);
      }
      if (userSurname) {
        updateFields.push('userSurname = ?');
        values.push(userSurname);
      }
      if(userPhone){
        updateFields.push('userPhone = ?')
        values.push(userPhone);
      }
      if (userAddressLine1) {
        updateFields.push('userAddressLine1 = ?');
        values.push(userAddressLine1);
      }
      if (userAddressLine2) {
        updateFields.push('userAddressLine2 = ?');
        values.push(userAddressLine2);
      }
      if (userAddressPostcode) {
        updateFields.push('userAddressPostcode = ?');
        values.push(userAddressPostcode);
      }
      if (userGender) {
        updateFields.push('userGender = ?');
        values.push(userGender);
      }
      if (userDateOfBirth) {
        updateFields.push('userDateOfBirth = ?');
        values.push(userDateOfBirth);
      }
      if (userAccountApproved) {
        updateFields.push('userAccountApproved = ?');
        values.push(userAccountApproved);
      }
      if (userRole) {
        updateFields.push('userRole = ?');
        values.push(userRole);
      }
      if (userMeta) {
        updateFields.push('userMeta = ?');
        values.push(JSON.stringify(userMeta));
      }
      if (fcmToken) {
        updateFields.push('fcmToken = ?');
        values.push(fcmToken);
      }
      if (totalFollowers) {
        updateFields.push('totalFollowers = ?');
        values.push(totalFollowers);
      }
      if (profilePic) {
        updateFields.push('profilePic = ?');
        values.push(profilePic);
      }
      
      if (userBio) {
        updateFields.push('userBio = ?');
        values.push(userBio);
      }

      if (updateFields.length === 0) {
        return res.send({ status: true, msg: 'No fields to update', data: {} });
      }

      const query = `
                UPDATE db_users SET
                ${updateFields.join(', ')}
                WHERE userID = ?;
            `;

      values.push(userID);

      await new Promise((resolve, reject) => {
        con.query(query, values, function (err, result, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      const dataStore = {
        userID,
        userFirstName,
        userSurname,
        userAddressLine1,
        userAddressLine2,
        userAddressPostcode,
        userGender,
        userDateOfBirth,
        userRole,
        userAccountApproved,
        userMeta,
        fcmToken,
        totalFollowers,
        userPhone,
        profilePic,
        userBio,
      };

      res.send({ status: true, msg: 'success', data: dataStore });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, msg: 'Internal Server Error' });
    }
  };
};
