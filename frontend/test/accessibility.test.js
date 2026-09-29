import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { listDocuments } from '../src/services/documentsApi.js';

const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let viteServer;

before(async () => {
  viteServer = await createServer({
    configFile: path.join(frontendDirectory, 'vite.config.js'),
    server: { middlewareMode: true },
    appType: 'custom',
  });
});

after(async () => {
  await viteServer?.close();
});

async function renderComponent(modulePath, props) {
  const { default: Component } = await viteServer.ssrLoadModule(modulePath);
  return renderToStaticMarkup(createElement(Component, props));
}

test('a página oferece landmarks e uma hierarquia de títulos identificável', async () => {
  const markup = await renderComponent('/src/App.jsx');

  assert.match(markup, /<main\b/);
  assert.match(markup, /<header\b/);
  assert.match(markup, /<footer\b/);
  assert.equal((markup.match(/<h1\b/g) || []).length, 1);
  assert.match(markup, /<h1[^>]*>Seus documentos<\/h1>/);
  assert.match(markup, /aria-label="DMS, início"/);
});

test('o seletor de arquivo possui rótulo associado e envio inicialmente indisponível', async () => {
  const markup = await renderComponent('/src/components/UploadComponent.jsx', {
    onUpload: async () => {},
    isUploading: false,
  });

  assert.match(markup, /<label\b[^>]*for="document-file"/);
  assert.match(markup, /<input\b[^>]*id="document-file"[^>]*type="file"/);
  assert.match(markup, /<button[^>]*disabled=""[^>]*>Enviar documento<\/button>/);
  assert.match(markup, /Procurar arquivos/);
});

test('o upload em andamento informa o estado e desabilita os controles', async () => {
  const markup = await renderComponent('/src/components/UploadComponent.jsx', {
    onUpload: async () => {},
    isUploading: true,
  });

  assert.match(markup, /<input\b[^>]*disabled=""/);
  assert.match(markup, /<button[^>]*disabled=""[^>]*>Enviando\.\.\.<\/button>/);
});

test('a lista anuncia carregamento e fornece uma mensagem útil quando vazia', async () => {
  const loadingMarkup = await renderComponent('/src/components/DocumentList.jsx', {
    documents: [],
    isLoading: true,
    downloadingId: null,
    onDownload: () => {},
  });
  assert.match(loadingMarkup, /role="status"/);
  assert.match(loadingMarkup, /Carregando documentos/);

  const emptyMarkup = await renderComponent('/src/components/DocumentList.jsx', {
    documents: [],
    isLoading: false,
    downloadingId: null,
    onDownload: () => {},
  });
  assert.match(emptyMarkup, /<h3>Nenhum documento ainda<\/h3>/);
  assert.match(emptyMarkup, /Os arquivos enviados aparecerão nesta lista/);
});

test('documentos são itens de lista com data semântica e ação nomeada', async () => {
  const markup = await renderComponent('/src/components/DocumentList.jsx', {
    documents: [{
      id: 'doc-1',
      originalName: 'relatorio.pdf',
      size: 1024,
      uploadedAt: '2026-09-29T14:25:00.000Z',
    }],
    isLoading: false,
    downloadingId: null,
    onDownload: () => {},
  });

  assert.match(markup, /<ul\b/);
  assert.match(markup, /<li\b/);
  assert.match(markup, /relatorio\.pdf/);
  assert.match(markup, /<time\b[^>]*dateTime="2026-09-29T14:25:00\.000Z"/);
  assert.match(markup, /<button[^>]*>.*Baixar<\/button>/);
});

test('a ação de download comunica seu estado e fica desabilitada durante a operação', async () => {
  const markup = await renderComponent('/src/components/DownloadButton.jsx', {
    onClick: () => {},
    isDownloading: true,
  });

  assert.match(markup, /<button[^>]*type="button"[^>]*disabled=""[^>]*>/);
  assert.match(markup, /Baixando/);
});

test('erros e confirmações da página usam regiões de anúncio acessíveis', async () => {
  const appSource = await readFile(path.join(frontendDirectory, 'src/App.jsx'), 'utf8');

  assert.match(appSource, /role="alert"/);
  assert.match(appSource, /role="status"/);
});

test('a lista de documentos trata respostas HTTP de erro com mensagem legível', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Falha ao carregar documentos.' } }),
    { status: 500, headers: { 'Content-Type': 'application/json' } },
  );

  await assert.rejects(listDocuments(), { message: 'Falha ao carregar documentos.' });
});

test('a lista aceita uma resposta de sucesso sem documentos', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response('[]', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  assert.deepEqual(await listDocuments(), []);
});