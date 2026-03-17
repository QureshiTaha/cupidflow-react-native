const express = require('express');
const bodyParser = require('body-parser');
require('https').globalAgent.options.ca = require('ssl-root-cas').create();

const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.NODE_PORT || 5000;
const database = require('./Modules/config');
const routes = require('./routes');
var logger = require('morgan');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const http = require('http');
// var admin = require('firebase-admin');
// var serviceAccount = require('../taskmanagement-iceweb-firebase-adminsdk-fbsvc-d1d1672345.json');
const Mail = require('./Modules/email');
const {initializeSocket} = require('./Modules/socketManager');

module.exports = {
  start: async () => {
    if (process.env.ACCESS_LOGGING === 'false') {
      // check if file exists
      if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
      }
      app.use(logger('dev'));
      app.use(logger('combined', { stream: fs.createWriteStream('./logs/access.log', { flags: 'a' }) }));
      console.log('Logging enabled');
    } else {
      console.log('Logging disabled');
    }

    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });

    const corsOptions = {
      origin: '*',
      credentials: true, // access-control-allow-credentials:true
      optionSuccessStatus: 200
    };
    app.use(cors(corsOptions));

    app.get('/', (req, res) => {
      res.json('Welcome to API!');
    });

    app.post('/api/v1/mail/send', async (req, res) => {
      const { subject, body, userEmail, mailerType } = req.body;
      // mailerType 1 is gmail, 2 is iceweb
      try {
        Mail.send({ subject, body, userEmail, mailerType });
        console.log('Notification sent successfully');
        res.status(200).send('Notification sent successfully');
      } catch (error) {
        console.log('Error sending notification: ', error);
        res.status(500).send('Error sending notification');
      }
    });

    app.use('/uploads', express.static('uploads'));

    app.get('/reels/uploads/:filename', (req, res) => {
      const filePath = path.join(__dirname, '../uploads', req.params.filename);

      fs.stat(filePath, (err, stats) => {
        if (err) return res.sendStatus(404);

        const range = req.headers.range;
        const fileSize = stats.size;
        const contentType = "video/mp4";

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = (end - start) + 1;

          const file = fs.createReadStream(filePath, { start, end });


          res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable"
          });
          file.pipe(res);
        } else {
          // Fallback: send full file
          res.writeHead(200, {
            "Accept-Ranges": "bytes",
            "Content-Length": fileSize,
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable"
          });

          fs.createReadStream(filePath).pipe(res);
        }
      });
    });

    app.use(API_PREFIX, routes);
    var server = http.createServer(app);
    initializeSocket(server);

    server.listen(port, () => {
      console.log('\x1b[32m%s\x1b[0m', `Node environment started listening on port:${port}`);
    });

    // app.listen(port, () => {
    //   console.log('\x1b[32m%s\x1b[0m', `Node environment started listening on port:${port}`);
    // });
  }
};
