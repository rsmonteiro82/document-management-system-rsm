const documentsService = require('../services/documents.service');

async function upload(req, res, next) {
  try {
    const document = await documentsService.createDocument(req.file);
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentsService.listDocuments();
    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
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
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, list, download };