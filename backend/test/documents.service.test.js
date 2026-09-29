const { test } = require('node:test');
const assert = require('node:assert/strict');

const DocumentsRepository = require('../src/repositories/documents.repository');
const {
  DocumentsService,
  DocumentNotFoundError,
} = require('../src/services/documents.service');

test('o serviço centraliza os metadados e filtra documentos por proprietário', () => {
  const repository = new DocumentsRepository();
  let id = 0;
  const service = new DocumentsService({
    repository,
    createId: () => `document-${id++}`,
    now: () => new Date('2026-01-01T00:00:00.000Z'),
    fileSystem: { existsSync: () => true },
  });

  service.uploadDocument({
    originalname: 'arquivo.txt',
    size: 10,
    path: '/tmp/arquivo.txt',
  }, 'user-1');
  service.uploadDocument({
    originalname: 'outro.txt',
    size: 20,
    path: '/tmp/outro.txt',
  }, 'user-2');

  assert.equal(service.listDocuments('user-1').length, 1);
  assert.equal(service.listDocuments('user-1')[0].uploadedAt, '2026-01-01T00:00:00.000Z');
});

test('o serviço usa o mesmo erro para documento ausente ou sem acesso', () => {
  const service = new DocumentsService({
    repository: new DocumentsRepository(),
    fileSystem: { existsSync: () => true },
  });

  assert.throws(
    () => service.getDocumentForDownload('missing', 'user-1'),
    DocumentNotFoundError,
  );
});
