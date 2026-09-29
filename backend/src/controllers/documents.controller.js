class DocumentsController {
  constructor(service) {
    this.service = service;
  }

  upload = (req, res, next) => {
    try {
      const document = this.service.uploadDocument(req.file, this.getOwner(req));
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  };

  list = (req, res, next) => {
    try {
      res.json(this.service.listDocuments(this.getOwner(req)));
    } catch (error) {
      next(error);
    }
  };

  download = (req, res, next) => {
    try {
      const document = this.service.getDocumentForDownload(
        req.params.id,
        this.getOwner(req),
      );
      res.download(document.path, document.name);
    } catch (error) {
      next(error);
    }
  };

  getOwner(req) {
    return req.get('x-user-id') || 'anonymous';
  }
}

module.exports = DocumentsController;
