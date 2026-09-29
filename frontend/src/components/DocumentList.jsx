import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/fileFormatting.js';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
}

export default function DocumentList({ documents, isLoading, downloadingId, onDownload }) {
  if (isLoading && documents.length === 0) {
    return <p className="list-state" role="status">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <h3>Nenhum documento ainda</h3>
        <p>Os arquivos enviados aparecerão nesta lista.</p>
      </div>
    );
  }

  return (
    <div className="document-list-wrap" aria-busy={isLoading}>
      <div className="document-list-labels" aria-hidden="true">
        <span>Nome</span>
        <span>Tamanho</span>
        <span>Enviado em</span>
        <span />
      </div>
      <ul className="document-list">
        {documents.map((document) => (
          <li className="document-row" key={document.id}>
            <div className="document-name-cell">
              <span className="document-icon" aria-hidden="true">DOC</span>
              <div className="document-name-copy">
                <span className="document-name" title={document.originalName}>{document.originalName}</span>
                <span className="document-subtitle">Documento</span>
              </div>
            </div>
            <span className="document-size" data-label="Tamanho">{formatFileSize(document.size)}</span>
            <time className="document-date" data-label="Enviado em" dateTime={document.uploadedAt}>
              {formatDate(document.uploadedAt)}
            </time>
            <div className="document-action">
              <DownloadButton
                onClick={() => onDownload(document)}
                isDownloading={downloadingId === document.id}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}