const documentsService = require('../services/documents.service');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

async function upload(req, res) {
  const document = await documentsService.createDocument(req.file);
  res.status(201).json(toPublicDocument(document));
}

async function list(req, res) {
  const documents = await documentsService.listDocuments();
  res.status(200).json(documents.map(toPublicDocument));
}

async function download(req, res, next) {
  const document = await documentsService.getDocumentForDownload(req.params.id);

  res.download(document.storagePath, document.originalName, (error) => {
    if (error) {
      if (res.headersSent) {
        return next(error);
      }

      const storageError = new Error('Não foi possível ler o arquivo armazenado.');
      storageError.statusCode = 500;
      storageError.code = 'STORAGE_ERROR';
      return next(storageError);
    }
  });
}

module.exports = { upload, list, download };