const express = require('express');
const multer = require('multer');
const { rateLimit } = require('express-rate-limit');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const DocumentsRepository = require('../repositories/documents.repository');
const { DocumentsService, DocumentNotFoundError } = require('../services/documents.service');
const DocumentsController = require('../controllers/documents.controller');

const storageDirectory = process.env.STORAGE_DIR || path.resolve(__dirname, '../../storage');
fs.mkdirSync(storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
    },
  }),
});

const repository = new DocumentsRepository();
const service = new DocumentsService({ repository });
const controller = new DocumentsController(service);
const router = express.Router();
const limitDownloads = rateLimit({
  windowMs: 60_000,
  limit: 60,
  message: { error: 'Limite de downloads excedido' },
});

router.post('/upload', upload.single('file'), controller.upload);
router.get('/documents', controller.list);
router.get('/documents/:id/download', limitDownloads, controller.download);

router.use((error, req, res, next) => {
  if (error instanceof DocumentNotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (error.message === 'Arquivo é obrigatório') {
    return res.status(400).json({ error: error.message });
  }

  return next(error);
});

module.exports = router;
