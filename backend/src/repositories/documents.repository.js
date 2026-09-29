const fs = require('node:fs/promises');

const documents = new Map();

async function save(document) {
  documents.set(document.id, document);
  return document;
}

async function findAll() {
  return Array.from(documents.values());
}

async function findById(id) {
  return documents.get(id) || null;
}

async function removeStoredFile(filePath) {
  await fs.unlink(filePath);
}

module.exports = { save, findAll, findById, removeStoredFile };