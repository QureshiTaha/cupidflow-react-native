const jwt = require('jsonwebtoken');
const sql = require('./sqlHandler');
const sqlQuery = sql.query;

module.exports = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    // Check if refresh token exists in db_sessions
    const result = await sqlQuery(`SELECT * FROM db_sessions WHERE refreshToken = '${refreshToken}'`);
    if (result.length < 1) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const session = result[0];

    // Verify the refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
      }

      // Generate a new access token
      const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });

      // Update the access token in db_sessions
      await sqlQuery(`UPDATE db_sessions SET accessToken = '${newAccessToken}' WHERE id = '${session.id}'`);

      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
