import { useRef, useState } from 'react';
import { formatFileSize } from '../utils/fileFormatting.js';

export default function UploadComponent({ onUpload, isUploading }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    try {
      await onUpload(file);
      setFile(null);
      inputRef.current.value = '';
    } catch {
      // O componente raiz apresenta o erro da API.
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`file-dropzone${file ? ' has-file' : ''}`} htmlFor="document-file">
        <span className="upload-symbol" aria-hidden="true">↑</span>
        <span className="dropzone-title">{file ? 'Arquivo selecionado' : 'Escolha um arquivo'}</span>
        <span className="dropzone-hint">ou procure no seu dispositivo</span>
        <span className="file-picker">Procurar arquivos</span>
        <input
          ref={inputRef}
          id="document-file"
          name="file"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          disabled={isUploading}
        />
      </label>

      {file && (
        <div className="selected-file" aria-live="polite">
          <span className="file-type-mark" aria-hidden="true">FILE</span>
          <span className="selected-file-name" title={file.name}>{file.name}</span>
          <span className="selected-file-size">{formatFileSize(file.size)}</span>
        </div>
      )}

      <button className="primary-button upload-button" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
    </form>
  );
}