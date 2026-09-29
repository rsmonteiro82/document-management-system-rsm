const API_PREFIX = '/api';

async function getErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function ensureSuccess(response) {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response;
}

export async function listDocuments() {
  const response = await ensureSuccess(await fetch(`${API_PREFIX}/documents`));
  const documents = await response.json();

  if (!Array.isArray(documents)) {
    throw new Error('A resposta do servidor não contém uma lista de documentos.');
  }

  return documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await ensureSuccess(await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  }));

  return response.json();
}

export async function downloadDocument(id) {
  const response = await ensureSuccess(await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(id)}/download`,
  ));
  const contentDisposition = response.headers.get('content-disposition') || '';
  const encodedFilename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainFilename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = plainFilename;

  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename);
    } catch {
      filename = plainFilename;
    }
  }

  return { blob: await response.blob(), filename };
}