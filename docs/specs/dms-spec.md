# Especificação - Document Management System

## 1. Objetivo

Oferecer uma aplicação web simples para enviar, listar e baixar documentos, mantendo os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos metadados dos documentos enviados.
- Download de um documento por identificador.
- Associação de documentos a um usuário, condicionada à definição de identidade e autorização.
- Interface React para upload, listagem e download, consumindo a API por `fetch`.
- Backend Express organizado em rotas, controllers, services e repositories.

### Fora do escopo

- Armazenamento em nuvem ou uso de provedores externos.
- Banco de dados ou persistência durável dos metadados nesta fase.
- Versionamento, edição ou exclusão de documentos.
- Autenticação e autorização: não há mecanismo definido nesta fase.
- Compartilhamento de documentos entre usuários.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o envio de um arquivo por requisição, usando `multipart/form-data` e o campo `file`. |
| RF-02 | Após um upload válido, o sistema deve gravar o conteúdo localmente, criar metadados e retornar o documento criado. |
| RF-03 | O sistema deve listar os metadados dos documentos disponíveis em memória. O escopo por usuário depende da decisão de identidade descrita em [Decisões pendentes](#9-decisões-pendentes). |
| RF-04 | O sistema deve permitir obter o conteúdo de um documento por seu identificador, como download com o nome original. |
| RF-05 | O sistema deve rejeitar requisições sem arquivo ou com estrutura multipart inválida e responder com erro HTTP apropriado. |
| RF-06 | O sistema deve responder com erro apropriado quando o identificador não existir no repositório em memória ou quando houver falha no armazenamento local. |
| RF-07 | A API não deve expor o caminho físico do arquivo nem confiar no nome enviado pelo cliente para definir o caminho de armazenamento. |
| RF-08 | O sistema deve associar cada documento a um identificador de dono confiável quando a origem dessa identidade for definida. A API não deve aceitar um `owner` arbitrário do corpo do upload. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O conteúdo dos uploads deve ser gravado no filesystem local em `backend/storage`, usando Multer com `diskStorage`. Não usar armazenamento externo. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. Reiniciar o processo elimina o índice de metadados, mesmo que os arquivos continuem no disco; recuperação de arquivos órfãos não faz parte desta versão. |
| RNF-03 | A configuração de execução deve respeitar 12-Factor e usar variáveis de ambiente, incluindo `PORT`. O diretório de arquivos permanece `backend/storage` nesta especificação. |
| RNF-04 | O backend deve permanecer em JavaScript CommonJS e seguir o fluxo `routes -> controllers -> services -> repositories`; camadas internas não devem depender de Express. |
| RNF-05 | O frontend deve usar React + Vite, componentes funcionais e `fetch` para acessar a API pelo prefixo `/api`. |
| RNF-06 | Erros não devem revelar stack traces, caminhos locais ou detalhes internos de filesystem nas respostas HTTP. |
| RNF-07 | A aplicação deve tratar nomes de arquivo recebidos como entrada não confiável e usar identificador gerado pelo servidor para compor o nome físico. |

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único opaco, gerado pelo servidor. Recomenda-se UUID v4. |
| `originalName` | string | Sim | Nome original informado no upload, preservado para exibição e download; não deve ser usado como caminho físico. |
| `size` | integer | Sim | Tamanho do conteúdo em bytes. Deve ser maior que zero para um upload válido. |
| `uploadedAt` | string | Sim | Data e hora de criação em ISO 8601, normalizada para UTC. |
| `owner` | string | Sim, após decisão de identidade | Identificador do usuário dono, obtido de contexto confiável. A origem e a autorização estão pendentes. |

Exemplo de metadados retornados pela API (o valor de `owner` é ilustrativo):

```json
{
  "id": "7a1e9a9b-8b0c-4fe5-bd21-a3bff2fc66b8",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-29T14:25:00.000Z",
  "owner": "user-id"
}
```

### Dados internos de armazenamento

O repositório pode manter, além dos metadados públicos, um nome físico gerado pelo servidor ou outra referência interna necessária para localizar o arquivo. Esse dado não integra a resposta da API. O caminho deve ser resolvido dentro de `backend/storage`, sem concatenar diretamente entradas do cliente.

## 6. Contratos de API

Os caminhos abaixo são os caminhos registrados pelo backend. No desenvolvimento, o frontend usa o proxy Vite e chama os mesmos endpoints com prefixo `/api`; o proxy remove esse prefixo antes de encaminhar ao backend.

Formato padrão para erros JSON:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

As mensagens são destinadas ao usuário e devem estar em português. Respostas de erro não incluem detalhes internos.

### `POST /upload`

- **Entrada:** `multipart/form-data`, com exatamente um arquivo no campo `file`.
- **Sucesso:** `201 Created`, `Content-Type: application/json`, corpo com os metadados do documento criado conforme o modelo acima.
- **Erros previstos:**
  - `400 Bad Request`, `FILE_REQUIRED` ou `INVALID_MULTIPART`, quando o arquivo estiver ausente ou a requisição multipart for inválida.
  - `413 Payload Too Large`, `FILE_TOO_LARGE`, se for configurado e excedido um limite de tamanho.
  - `415 Unsupported Media Type`, `FILE_TYPE_NOT_ALLOWED`, se uma política de tipos permitidos for definida e violada.
  - `500 Internal Server Error`, `STORAGE_ERROR`, se não for possível gravar o arquivo ou registrar seus metadados.
- **Consistência:** se a gravação do arquivo ocorrer, mas a criação dos metadados falhar, a implementação deve tentar remover o arquivo recém-gravado para evitar conteúdo sem referência. A falha de limpeza deve ser registrada no servidor sem expor paths na resposta.

Os limites de tamanho e a política de tipos/extensões ainda precisam ser definidos antes da implementação. Não presumir uma lista de formatos permitidos.

### `GET /documents`

- **Entrada:** sem corpo. Filtros e paginação não fazem parte do contrato inicial.
- **Sucesso:** `200 OK`, `Content-Type: application/json`, corpo como array de metadados:

```json
[
  {
    "id": "7a1e9a9b-8b0c-4fe5-bd21-a3bff2fc66b8",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-09-29T14:25:00.000Z",
    "owner": "user-id"
  }
]
```

- A ordenação recomendada é por `uploadedAt` decrescente.
- O escopo da lista (todos os documentos ou somente os do usuário atual) depende da decisão de identidade/autorização; não considerar um identificador enviado livremente pelo cliente como identidade confiável.
- Sem documentos, retornar `200 OK` com `[]`.
- **Erro previsto:** `500 Internal Server Error`, `INTERNAL_ERROR`, em falha inesperada ao consultar o repositório.

### `GET /documents/:id/download`

- **Entrada:** `id` na URL.
- **Sucesso:** `200 OK`, corpo binário do arquivo, `Content-Disposition: attachment` com o nome original e tipo de conteúdo apropriado ou `application/octet-stream` quando não for possível determiná-lo com segurança.
- **Erros previstos:**
  - `400 Bad Request`, `INVALID_DOCUMENT_ID`, quando o identificador tiver formato inválido, caso o formato adotado permita validação sintática.
  - `404 Not Found`, `DOCUMENT_NOT_FOUND`, quando não houver metadados para o identificador.
  - `500 Internal Server Error`, `STORAGE_ERROR`, quando houver metadados, mas o arquivo não puder ser lido.
- O caminho físico nunca deve ser enviado ao cliente. O nome original deve ser codificado/formatado com segurança no cabeçalho de download.

## 7. Decisões arquiteturais

### Backend

- `routes/`: declara os endpoints, aplica o middleware de upload Multer e delega aos controllers.
- `controllers/`: traduz requisições HTTP em chamadas de serviço, realiza validações básicas da entrada e converte resultados/erros em respostas HTTP.
- `services/`: aplica regras de negócio, coordena upload, criação/listagem de metadados e recuperação de documento.
- `repositories/`: mantém os metadados em memória e fornece operações de consulta necessárias aos serviços. O filesystem dos arquivos continua local e é operado por Multer com `diskStorage`.
- O controller pode receber o arquivo já gravado pelo middleware e repassar ao serviço apenas os dados necessários; serviços e repositórios não devem conhecer objetos `req` ou `res`.
- O middleware deve usar nome físico gerado no servidor. A associação entre ID e arquivo deve ser feita por referência interna controlada, nunca por caminho recebido do cliente.

### Frontend

- Componentes funcionais React para upload, listagem e ação de download.
- Um serviço de API centraliza chamadas `fetch` para `/api/upload`, `/api/documents` e `/api/documents/:id/download`.
- Upload usa `FormData`; não definir manualmente o cabeçalho `Content-Type` do multipart, para que o navegador inclua o boundary.
- Download trata a resposta como `Blob` e apresenta o nome recebido pela resposta.

### Armazenamento e ciclo de vida

- Multer usa `diskStorage` no diretório local `backend/storage`; nenhum provedor remoto é permitido.
- Metadados vivem em memória e não sobrevivem ao reinício. Nesta fase, após reinício, arquivos no disco sem metadados não são localizáveis pelas rotas da API.
- IDs e nomes físicos são gerados pelo servidor; o nome original é somente metadado e sugestão de nome para download.
- As rotas DMS desta especificação são contratos planejados, ainda não implementados. O estado atual do backend inclui somente `GET /health`.

## 8. Plano de execução

As etapas abaixo descrevem implementação futura; a entrega desta especificação não executa alterações de backend ou frontend.

1. **Backend e armazenamento:** criar rotas, controllers, services e repositories; configurar Multer `diskStorage` para `backend/storage`; implementar upload, listagem, download, validações e mapeamento de erros.
2. **Testes do backend:** usar `node:test` para cobrir upload válido/inválido, listagem vazia e preenchida, download existente/inexistente, falhas de armazenamento e ausência de exposição de caminhos internos.
3. **Frontend:** criar componentes de upload, listagem e download, serviço `fetch` sob `/api` e integrar a tela principal com estados de carregamento e erro.
4. **Validação integrada:** iniciar backend e frontend, executar `npm test` no backend e verificar manualmente upload, exibição na lista e download de arquivo.
5. **Revisão dos limites:** confirmar a decisão de identidade e visibilidade por usuário, bem como limites de tamanho e política de tipos, antes de considerar a funcionalidade pronta para uso multiusuário.

## 9. Decisões pendentes

As decisões abaixo não estão definidas nos requisitos existentes e precisam ser resolvidas antes da implementação correspondente:

- **Identidade e autorização:** como obter `owner` de um contexto confiável e como autorizar acesso a documentos. Não há autenticação definida; portanto, a especificação não recomenda aceitar `owner` de cabeçalho ou corpo livremente informado.
- **Visibilidade da listagem e download:** confirmar se cada usuário vê/acessa somente seus documentos ou se a aplicação opera inicialmente como usuário único. Isso depende da decisão de identidade.
- **Restrições de upload:** definir limite máximo de bytes e política de tipos/extensões aceitos. A implementação deve configurar limites explícitos no Multer depois dessa decisão.
- **Variáveis de ambiente:** confirmar variáveis além de `PORT`, caso os limites de upload precisem ser configuráveis. O diretório permanece `backend/storage` conforme a restrição atual.
- **Falhas parciais:** definir procedimento operacional para arquivos órfãos se a remoção compensatória após falha de metadados também falhar. Metadados continuam voláteis nesta fase.