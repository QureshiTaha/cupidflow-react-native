const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

ffmpeg.setFfprobePath(ffprobePath); // Use bundled ffprobe binary
ffmpeg.setFfmpegPath(ffmpegPath); // Use bundled ffmpeg binary

const uploadsDir = path.join(__dirname, 'uploads');

// Helper: Check if a file is a video
function isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    return videoExtensions.includes(path.extname(filename).toLowerCase());
}

// Generate thumbnail for a single video if not already present
function generateThumbnailIfMissing(videoFile) {
    const videoPath = path.join(uploadsDir, videoFile);
    const thumbnailName = `${videoFile}-thumbnail.png`;
    const thumbnailPath = path.join(uploadsDir, thumbnailName);

    if (fs.existsSync(thumbnailPath)) {
        console.log(`✅ Thumbnail already exists for ${videoFile}`);
        return;
    }

    ffmpeg(videoPath)
        .on('end', () => {
            console.log(`✅ Thumbnail generated for ${videoFile}`);
        })
        .on('error', (err) => {
            console.error(`❌ Error generating thumbnail for ${videoFile}:`, err.message);
        })
        .screenshots({
            timestamps: ['10%'],
            filename: thumbnailName,
            folder: uploadsDir,
            size: '320x240'
        });
}

// Read directory and process videos
fs.readdir(uploadsDir, (err, files) => {
    if (err) {
        return console.error('❌ Error reading uploads directory:', err);
    }

    files.filter(isVideoFile).forEach(generateThumbnailIfMissing);
});
