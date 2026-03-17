const { OAuth2Client } = require('google-auth-library');
const userUseCase = require('./userUseCase');
const { sqlQuery } = require('../../Modules/sqlHandler');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const utils = require('../../Modules/utils');
const Mail = require('../../Modules/email');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// ⚙️ Creds In future move to ENV
const CLIENT_ID = '709069936897-t3hh04bo2f96ai5lqsv6ddgq9chj4aj9.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

// Function to save user image from URL to disk
const saveImage = async (url, userId) => {
    const dir = path.join(__dirname, '../../../uploads/');
    const fileName = `${userId}.jpg`;
    const filePath = path.join(dir, fileName);

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error('Failed to download image'));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Image saved to ${filePath}`);

                resolve(`/uploads/${fileName}`);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

// Helper to insert user data into the database
const insertNewUser = async (payload, imagePath) => {
    async function hashPassword(userPassword) {
        const password = userPassword;
        const saltRounds = 10;
        const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.genSalt(saltRounds, (err, salt) => {
                bcrypt.hash(password, salt, function (err, hash) {
                    if (err) reject(err);
                    resolve(hash);
                });
            });
        });
        return hashedPassword;
    }
    const userPassword = utils.passwordGenerator();
    const userHashedPassword = await hashPassword(userPassword);
    const userEmail = payload.email;
    const userFirstName = payload.given_name || '';
    const userSurname = payload.family_name || '';
    const userID = uuidv4();

const query = `
        INSERT INTO db_users (
            userID, userEmail, userFirstName, userSurname, profilePic,
            userPassword, userMeta, userAddressLine1, userAddressLine2, userAddressPostcode
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


const values = [
    userID,
    payload.email,
    userFirstName,
    userSurname,
    imagePath,
    userHashedPassword,
    JSON.stringify({ ...payload, imagePath }),
    '', // userAddressLine1
    '', // userAddressLine2
    ''  // userAddressPostcode
];


    console.log("Sending Mail...");
    await Mail.send({
        userEmail: userEmail,
        subject: 'Welcome to Dilmil! 🎉',
        body: 'Hello ' + userFirstName + ' ' + userSurname + ',<br><br>Welcome to Dilmil! 🎉<br><br>You can now log in to your account using the following credentials:<br><br>Email: <strong>' + userEmail + '</strong><br>Password: <strong>' + userPassword + '</strong>',
        mailerType: 1
    });
    console.log('User Created with Creds :', userEmail, userPassword);


    const x = await sqlQuery(query, values);
    console.log(x);

};

// Main middleware function to handle Google authentication
module.exports = (dependencies) => {
    return async (req, res, next) => {
        const { credential } = req.body;

        try {
            // Verify the Google token
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: [
                "709069936897-t3hh04bo2f96ai5lqsv6ddgq9chj4aj9.apps.googleusercontent.com"
            ],
            });

            const payload = ticket.getPayload();
            console.log("✅ Google User Recieved:", payload);

            // Save user image if available


            // Check if user exists in the database
            const user = await userUseCase.getUserByUserEmail(payload.email);
            console.log("user", user);

            if (user.length === 0 || !user.status) {
                let savedImage = '';
                if (payload.picture) {
                    savedImage = await saveImage(payload.picture, payload.sub);
                }
                // Insert new user if doesn't exist
                await insertNewUser(payload, savedImage);
            }

            let NewUser = await userUseCase.getUserByUserEmail(payload.email);
            if (NewUser.length ) {
                NewUser = NewUser[0];
            }
            
            // Respond with user data
            let userData = { ...NewUser, googleID: payload.sub }
            const accessToken = jwt.sign({ id: NewUser.userID }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            });
            console.log('accessToken', accessToken);

            // Generate Refresh Token
            const refreshToken = jwt.sign({ id: NewUser.userID }, process.env.JWT_REFRESH_SECRET, {
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
            });
            console.log('refreshToken', refreshToken);

            // Store tokens in db_sessions
            await sqlQuery(`
                    INSERT INTO db_sessions (userID, refreshToken, accessToken) 
                    VALUES ('${NewUser.userID}', '${refreshToken}', '${accessToken}')
                    ON DUPLICATE KEY UPDATE refreshToken = '${refreshToken}', accessToken = '${accessToken}'
                  `);

            userData.userPassword = '******';

            res.json({
                status: true,
                msg: 'success',
                data: { userData, accessToken, refreshToken },
            });
        } catch (err) {
            console.error("Authentication Error:", err);
            res.status(401).json({
                message: 'Invalid token',
                error: err.message || err.toString()
            });
        }
    };
};
