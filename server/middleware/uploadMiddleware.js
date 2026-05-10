const multer    = require('multer');
const path      = require('path');
const { sendError } = require('../utils/responseHelper');

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB  = 10;

// Use memoryStorage so the buffer can be streamed straight to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Only ${ALLOWED_MIME.join(', ')} are allowed.`),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

/**
 * Wraps multer single-file upload and converts MulterError to a clean API response.
 * @param {string} fieldName - The form-data field name, defaults to 'image'.
 */
const uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    const handler = upload.single(fieldName);
    handler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 400, `File too large. Max size is ${MAX_SIZE_MB} MB.`);
        }
        return sendError(res, 400, err.message);
      }
      if (err) return next(err);
      next();
    });
  };
};

module.exports = { uploadSingle };
