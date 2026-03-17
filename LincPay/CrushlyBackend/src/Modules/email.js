const sql = require('./sqlHandler');
const sqlQuery = sql.query;
var nodemailer = require('nodemailer');
module.exports = {
  send: async function ({ subject, body, userID, userEmail, mailerType }) {
    try {
      const transporter =
        mailerType == 1 ?
          nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'digitalelpis009+noreply@gmail.com',
              pass: 'grzk etqn ndws uoaj'
              // user: 'lincpaysolution+noreply@gmail.com',
              // pass: 'fvya yykr sqwe pccm'
            }
          }) :
          nodemailer.createTransport({
            host: 'mail.iceweb.in',
            port: 587,
            secure: false,
            auth: {
              // user: process.env.NODEMAILER_EMAIL ||  'taskmanagement@iceweb.in',
              user: process.env.NODEMAILER_EMAIL || 'taskmanagement@iceweb.in',
              pass: process.env.NODEMAILER_KEY || 'grzk etqn ndws uoaj'
            },
            tls: {
              rejectUnauthorized: false
            }
          });

      receiverEmail = process.env.NODEMAILER_EMAIL || 'taskmanagement@iceweb.in';
      if (!userEmail && !userID) return { success: false, message: 'Missing required fields: userID or userEmail' };
      if (userEmail) {
        receiverEmail = userEmail;
      } else if (userID) {
        const userEmailQuery = await sqlQuery(`SELECT userEmail FROM db_users WHERE userID = "${userID}"`);
        if (userEmailQuery.length > 0) {
          receiverEmail = userEmailQuery[0].userEmail;
        }
      }

      const mailOptions = {
        from: mailerType == 1 ? 'noreply@Blush <digitalelpis009+noreply@gmail.com>' : 'noreply@Blush <taskmanagement@iceweb.in>',
        to: receiverEmail.toString().trim(),
        subject: subject || '📩 Message from Blush',
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@iceweb.in>, <https://iceweb.in/unsubscribe>'
        },
        html: `
          <div style="font-family: Arial, sans-serif; background: #f6f6f6; padding: 30px;">
            <table width="100%" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <tr>
                <td style="background: #0d6efd; padding: 20px; color: white; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Welcome To Dilmil</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin-top: 0;">${subject || 'You’ve Got a New Message'}</h2>
                  <p style="font-size: 16px; color: #333333; line-height: 1.5;">
                    ${body || 'Here is the content of your message.'}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                  &copy; ${new Date().getFullYear()} Blush by iceweb.in. All rights reserved.
                </td>
              </tr>
            </table>
          </div>`
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);

          return { success: false, message: error.message };
        } else {
          if (info.response.includes("queued")) {
            // resending
            console.log("..MAil in Queue..");

          }
          console.log('Email sent info.response \n: ' + info.response);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
};
