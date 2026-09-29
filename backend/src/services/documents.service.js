const path = require('node:path');
const documentsRepository = require('../repositories/documents.repository');

function createServiceError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function createDocument(file) {
  if (!file) {
    throw createServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
  }

  if (file.size <= 0) {
    await documentsRepository.removeStoredFile(file.path);
    throw createServiceError(400, 'INVALID_FILE', 'O arquivo enviado está vazio.');
  }

  const originalName = path.basename(file.originalname.replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim() || 'document';

  const document = {
    id: file.filename,
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'local',
    storagePath: file.path,
  };

  try {
    await documentsRepository.save(document);
  } catch (error) {
    await documentsRepository.removeStoredFile(file.path).catch(() => {});
    throw createServiceError(500, 'STORAGE_ERROR', 'Não foi possível armazenar os metadados.');
  }

  return document;
}

async function listDocuments() {
  const documents = await documentsRepository.findAll();
  return documents.sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
}

async function getDocumentForDownload(id) {
  const document = await documentsRepository.findById(id);

  if (!document) {
    throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return {
    storagePath: document.storagePath,
    originalName: document.originalName,
  };
}

module.exports = { createDocument, listDocuments, getDocumentForDownload };