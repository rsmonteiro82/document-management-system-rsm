export default function DownloadButton({ onClick, isDownloading }) {
  return (
    <button
      className="download-button"
      type="button"
      onClick={onClick}
      disabled={isDownloading}
    >
      <span aria-hidden="true">↓</span>
      {isDownloading ? 'Baixando' : 'Baixar'}
    </button>
  );
}