
// ⚙️ Creds In future move to ENV
const CLIENT_ID = '709069936897-t3hh04bo2f96ai5lqsv6ddgq9chj4aj9.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_SECRET || ''; // from Google Console
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback'; // or your domain
const DEEP_LINK_URI = 'myapp://login';

module.exports = (dependencies) => {
    return async (req, res, next) => {
        const code = req.query.code;

        try {
            const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            });

            const id_token = tokenRes.data.id_token;
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: [
                "709069936897-t3hh04bo2f96ai5lqsv6ddgq9chj4aj9.apps.googleusercontent.com"
            ],
            });

            const payload = ticket.getPayload();
            console.log("✅ Google User:", payload);

            // ➡️ Send to app via deep link
            const redirectURL = `${DEEP_LINK_URI}?token=${id_token}`;
            return res.redirect(redirectURL);
        } catch (err) {
            console.error('Google Auth Error:', err);
            return res.status(500).send('Authentication failed');
        }
    }
};