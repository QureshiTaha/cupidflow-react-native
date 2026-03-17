const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const { sqlQuery } = require('../../Modules/sqlHandler');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
// Function to generate thumbnail
const waitForFile = (filePath, retries = 5, delay = 300) => {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      if (fs.existsSync(filePath)) {
        return resolve(true);
      }
      if (attempt <= 0) {
        return reject(new Error(`File not found: ${filePath} `));
      }
      setTimeout(() => check(attempt - 1), delay);
    };
    check(retries);
  });
};

const generateThumbnail = async (videoPath, thumbnailName) => {
  const thumbnailDir = path.join(__dirname, '../../../uploads');
  console.log('Generating thumbnail...');
  console.log(videoPath, thumbnailName);
  
  await waitForFile(videoPath);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on('end', () => {
        console.log('✅ Thumbnail generated!');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        reject(err);
      })
      .screenshots({
        timestamps: ['10%'],
        filename: thumbnailName,
        folder: thumbnailDir,
        size: '320x240'
      });
  });
};

// Single file upload controller
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded!'
    });
  }

  // Validation
  if (!req.body.userID) return res.status(400).json({ success: false, message: 'UserID is required' });
  const user = await sqlQuery(`SELECT id FROM db_users WHERE userID = '${req.body.userID}'`);
  if (user.length === 0) {
    // User not found, delete uploaded file
    fs.unlink(path.join(__dirname, '../../../uploads', req.file.filename), (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'File not found or already deleted' });
      }
    });
    return res.status(400).json({ success: false, message: 'User not found' });
  } else {
    // Check if the uploaded file is a video and generate a thumbnail
    if (req.file.mimetype.startsWith('video/')) {
      const videoPath = path.join(__dirname, '../../../uploads', req.file.filename);
      const thumbnailPath = path.join(__dirname, '../../../uploads', `${req.file.filename}-thumbnail.png`);


      try {
        // Generate the thumbnail
        await generateThumbnail(videoPath, `${req.file.filename}-thumbnail.png`);

        // Store video and thumbnail paths in the database
        await sqlQuery(
          `INSERT INTO db_uploads (userID, filePath, thumbnailPath) VALUES ('${req.body.userID}', '/uploads/${req.file.filename}-thumbnail.png', '/uploads/${req.file.filename}-thumbnail.png')`
        );

        res.status(200).json({
          success: true,
          message: 'Video uploaded and thumbnail generated successfully!',
          filePath: `/uploads/${req.file.filename}`,
          thumbnailPath: `/uploads/${req.file.filename}-thumbnail.png`
        });
      } catch (error) {
        // Delete video file if thumbnail generation fails
        console.log(error);

        fs.unlink(path.join(__dirname, '../../../uploads', req.file.filename), () => { });
        return res.status(500).json({ success: false, message: 'Error generating thumbnail' });
      }
    } else {
      // If it's not a video, just store it in the database without generating a thumbnail
      await sqlQuery(
        `INSERT INTO db_uploads (userID, filePath) VALUES ('${req.body.userID}', '/uploads/${req.file.filename}')`
      );

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully!',
        filePath: `/uploads/${req.file.filename}`
      });
    }
  }
};

// Multiple file upload controller
const uploadMultipleFiles = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded!'
    });
  }

  // Validation
  if (!req.body.userID) return res.status(400).json({ success: false, message: 'UserID is required' });
  const user = await sqlQuery(`SELECT id FROM db_users WHERE userID = '${req.body.userID}'`);
  if (user.length === 0) {
    // User not found, delete uploaded files
    req.files.forEach((file) => {
      fs.unlink(path.join(__dirname, '../../../uploads', file.filename), (err) => {
        if (err) {
          return res.status(400).json({ success: false, message: 'File not found or already deleted' });
        }
      });
    });
    return res.status(400).json({ success: false, message: 'User not found' });
  } else {
    const filePaths = [];
    for (const file of req.files) {
      // Check if the uploaded file is a video and generate a thumbnail
      if (file.mimetype.startsWith('video/')) {
        const videoPath = path.join(__dirname, '../../../uploads', file.filename);

        try {
          // Generate the thumbnail for each video
          await generateThumbnail(videoPath, `${req.file.filename}-thumbnail.png`);

          // Store the video and thumbnail paths in the database
          await sqlQuery(
            `INSERT INTO db_uploads (userID, filePath, thumbnailPath) VALUES ('${req.body.userID}', '/uploads/${file.filename}', '/uploads/${req.file.filename}-thumbnail.png')`
          );

          filePaths.push({ filePath: `/uploads/${file.filename}`, thumbnailPath: `/uploads/${req.file.filename}-thumbnail.png` });
        } catch (error) {
          // Delete video file if thumbnail generation fails
          fs.unlink(path.join(__dirname, '../../../uploads', file.filename), () => { });
          return res.status(500).json({ success: false, message: 'Error generating thumbnail for video' });
        }
      } else {
        // If it's not a video, just store it in the database without generating a thumbnail
        await sqlQuery(
          `INSERT INTO db_uploads (userID, filePath) VALUES ('${req.body.userID}', '/uploads/${file.filename}')`
        );
        filePaths.push(`/uploads/${file.filename}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully!',
      filePaths
    });
  }
};

// Delete a single file
const deleteFile = (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, '../../../uploads', fileName);
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'File not found or already deleted' });
    }
    res.json({ success: true, message: 'File deleted successfully' });
  });
};

// Delete multiple files
const deleteMultipleFiles = (req, res) => {
  const { files } = req.body; // Expect an array of filenames

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files provided' });
  }

  let errors = [];
  files.forEach((fileName) => {
    const filePath = path.join(__dirname, '../../../uploads', fileName);

    fs.unlink(filePath, (err) => {
      if (err) errors.push(fileName);
    });
  });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Some files could not be deleted', failedFiles: errors });
  }

  res.json({ success: true, message: 'Files deleted successfully' });
};

module.exports = { uploadFile, uploadMultipleFiles, deleteFile, deleteMultipleFiles };
