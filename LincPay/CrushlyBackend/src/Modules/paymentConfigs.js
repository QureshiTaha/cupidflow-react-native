const crypto = require('crypto');

function encryptString(plaintext, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'binary');
  encrypted += cipher.final('binary');
  const encryptedBuffer = Buffer.concat([iv, Buffer.from(encrypted, 'binary')]);
  return encryptedBuffer.toString('base64');
}

function decryptString(base64Data, key) {
  const dataBuffer = Buffer.from(base64Data, 'base64');
  const iv = dataBuffer.slice(0, 16);
  const encryptedText = dataBuffer.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
  let decrypted = decipher.update(encryptedText, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  // MERCHANT_ID: 'SLCOS00054BHO',
  MERCHANT_ID: 'SLCOS00018MUM',
  // ENCRYPTION_KEY: 'ovnusv5r5crakbr9nghqmb1kcjmgncog',
  ENCRYPTION_KEY: 'przrmdgi3muwpnm2qbnraj0ahy921rh4',
  PAYMENT_BASE_URL: 'https://pg.solwio.in/paymentrequest/seamless',
  PAYOUT_BASE_URL: 'https://payout.solwio.in/core-banking/initiate-payout',
  CALLBACK_URL: 'https://api-dating-app.iceweb.in/api/v1/payment/callback', // Update to your domain
  PAYOUT_CALLBACK_URL: 'https://api-dating-app.iceweb.in/api/v1/payment/callback-payout', // Update to your domain
  PAYOUT_API_KEY: '9t8MPIExEmsMg2P8Ckwa3M0HZbaaipqHEyYQzA',
  PAYOUT_SECRET: 'ElsueF2vIHDCeVkWn4GgcMKT4KDQP1sMY90pNZ',
  PAYOUT_THROUGH: 'BANK',
  PAYOUT_TRANSFER_TYPE: 'IMPS',
  encryptString,
  decryptString
};
