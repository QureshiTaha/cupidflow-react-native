const bcrypt = require('bcrypt');
const sql = require('../../Modules/sqlHandler');
const jwt = require('jsonwebtoken');
const sqlQuery = sql.query;

module.exports = (dependencies) => {
  return async (req, res, next) => {
    const userPassword = req.body.userPassword;
    const userEmail = req.body.userEmail;

    let dataStore = {};
    try {
      if (!userPassword || !userEmail) {
        throw new Error('Please enter valid email and password');
      } else {
        async function CheckPassword(hash, userPassword) {
          const password = userPassword;
          const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.compare(password, hash, function (err, result) {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
          return hashedPassword;
        }

        async function getData() {
          return new Promise((resolve, reject) => {
            sqlQuery(`SELECT * FROM db_users WHERE userEmail = '${userEmail}' AND (userDeleted IS NULL OR userDeleted != 1)`)
              .then((result) => {
                console.log(result);
                if (result.length < 1) {
                  reject('Invalid Email');
                } else {
                  CheckPassword(result[0].userPassword, userPassword)
                    .then((checkPw) => {
                      if (checkPw) {
                        dataStore.UserData = result[0];
                        resolve(result);
                      } else {
                        reject('Invalid Password');
                      }
                    })
                    .catch(reject);
                }
              })
              .catch(reject);
          });
        }
        await getData();

        const accessToken = jwt.sign({ id: dataStore.UserData.userID }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN
        });
        console.log('accessToken', accessToken);

        // Generate Refresh Token
        const refreshToken = jwt.sign({ id: dataStore.UserData.userID }, process.env.JWT_REFRESH_SECRET, {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        });
        console.log('refreshToken', refreshToken);

        // Store tokens in db_sessions
        await sqlQuery(`
        INSERT INTO db_sessions (userID, refreshToken, accessToken) 
        VALUES ('${dataStore.UserData.userID}', '${refreshToken}', '${accessToken}')
        ON DUPLICATE KEY UPDATE refreshToken = '${refreshToken}', accessToken = '${accessToken}'
      `);

        dataStore.accessToken = accessToken;
        dataStore.refreshToken = refreshToken;
        dataStore.UserData.userPassword = '******';
        res.send({ status: true, msg: 'success', data: dataStore });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ status: false, msg: error.toString() });
    }
  };
};
