const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const storageDirectory = path.resolve(__dirname, '../../storage');
const configuredFileSizeLimit = Number(process.env.MAX_FILE_SIZE_BYTES);
const fileSizeLimit = Number.isSafeInteger(configuredFileSizeLimit)
  && configuredFileSizeLimit > 0
  ? configuredFileSizeLimit
  : 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename: (req, file, callback) => {
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: fileSizeLimit, files: 1 },
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      error.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      error.code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_MULTIPART';
      error.message = error.code === 'FILE_TOO_LARGE'
        ? 'O arquivo excede o tamanho máximo permitido.'
        : 'A requisição de upload é inválida.';
    } else {
      error.statusCode = 400;
      error.code = 'INVALID_MULTIPART';
      error.message = 'A requisição multipart é inválida.';
    }

    next(error);
  });
}

router.post('/upload', handleUpload, documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;