class DocumentsRepository {
  constructor() {
    this.documents = new Map();
  }

  save(document) {
    this.documents.set(document.id, document);
    return document;
  }

  findById(id) {
    return this.documents.get(id);
  }

  findByOwner(owner) {
    return [...this.documents.values()].filter((document) => document.owner === owner);
  }
}

module.exports = DocumentsRepository;
