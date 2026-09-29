const fs = require('node:fs');
const crypto = require('node:crypto');

class DocumentNotFoundError extends Error {
  constructor() {
    super('Documento não encontrado');
    this.name = 'DocumentNotFoundError';
  }
}

class DocumentsService {
  constructor({
    repository,
    fileSystem = fs,
    createId = crypto.randomUUID,
    now = () => new Date(),
  }) {
    this.repository = repository;
    this.fileSystem = fileSystem;
    this.createId = createId;
    this.now = now;
  }

  uploadDocument(file, owner) {
    if (!file) {
      throw new Error('Arquivo é obrigatório');
    }

    const document = {
      id: this.createId(),
      name: file.originalname,
      size: file.size,
      uploadedAt: this.now().toISOString(),
      owner,
      path: file.path,
    };

    return this.repository.save(document);
  }

  listDocuments(owner) {
    return this.repository.findByOwner(owner);
  }

  getDocumentForDownload(id, owner) {
    const document = this.repository.findById(id);
    if (!document || document.owner !== owner) {
      throw new DocumentNotFoundError();
    }

    if (!this.fileSystem.existsSync(document.path)) {
      throw new DocumentNotFoundError();
    }

    return document;
  }
}

module.exports = { DocumentsService, DocumentNotFoundError };
