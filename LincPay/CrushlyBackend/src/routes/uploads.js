const express = require('express');
const router = express.Router();
const { upload } = require('../Modules/uploadHandler');
const {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles
} = require('../controllers/uploads/upload.controller');

// Route for single file upload
router.post('/upload', upload.single('file'), uploadFile);
router.post('/uploads', upload.array('files', 5), uploadMultipleFiles); // Allow max 5 files

router.delete('/delete/:fileName', deleteFile);
router.post('/delete-multiple', deleteMultipleFiles);

module.exports = router;
