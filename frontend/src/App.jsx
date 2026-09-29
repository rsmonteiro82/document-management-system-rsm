import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentsApi.js';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refreshDocuments() {
    setIsLoading(true);
    setError('');

    try {
      setDocuments(await listDocuments());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function handleUpload(file) {
    setIsUploading(true);
    setError('');
    setNotice('');

    try {
      const createdDocument = await uploadDocument(file);
      setDocuments((currentDocuments) => [
        createdDocument,
        ...currentDocuments.filter((document) => document.id !== createdDocument.id),
      ]);
      setNotice(`${createdDocument.originalName} foi enviado.`);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setError('');

    try {
      const { blob, filename } = await downloadDocument(document.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = filename || document.originalName;
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DMS</span>
        </a>
        <span className="topbar-context">Espaço de documentos</span>
        <span className="local-indicator"><span /> Armazenamento local</span>
      </header>

      <section className="page-heading" id="inicio">
        <div>
          <p className="eyebrow">BIBLIOTECA</p>
          <h1>Seus documentos</h1>
          <p className="page-description">Envie e acesse seus arquivos em um só lugar.</p>
        </div>
        <div className="document-count" aria-live="polite">
          <strong>{documents.length}</strong>
          <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
        </div>
      </section>

      {error && <div className="feedback feedback-error" role="alert">{error}</div>}
      {notice && <div className="feedback feedback-success" role="status">{notice}</div>}

      <div className="library-layout">
        <aside className="upload-panel" aria-labelledby="upload-heading">
          <div className="section-heading">
            <span className="section-index">01</span>
            <h2 id="upload-heading">Adicionar arquivo</h2>
          </div>
          <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
          <p className="storage-note">Os arquivos são armazenados localmente.</p>
        </aside>

        <section className="documents-panel" aria-labelledby="documents-heading">
          <div className="section-heading documents-heading">
            <div>
              <span className="section-index">02</span>
              <h2 id="documents-heading">Arquivos enviados</h2>
            </div>
            <button
              className="refresh-button"
              type="button"
              onClick={refreshDocuments}
              disabled={isLoading}
              title="Atualizar lista"
            >
              <span aria-hidden="true">↻</span>
              Atualizar
            </button>
          </div>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            downloadingId={downloadingId}
            onDownload={handleDownload}
          />
        </section>
      </div>

      <footer className="page-footer">
        <span>DMS</span>
        <span>Os metadados permanecem disponíveis enquanto o servidor estiver em execução.</span>
      </footer>
    </main>
  );
}
