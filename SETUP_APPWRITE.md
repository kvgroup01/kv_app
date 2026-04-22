# Guia de Configuração do Backend - AppWrite

O **Dashboard KV** utiliza como infraestrutura padrão de banco de dados, auth e storage o [AppWrite](https://appwrite.io/). Abaixo encontra-se o guia passo-a-passo exato para instanciar a infraestrutura na nuvem que corresponderá com o Frontend desenvolvido.

---

## 1. Criar o Projeto no AppWrite

1. Acesse o Cloud/Console do seu servidor AppWrite.
2. Clique em **Create Project**.
3. Nome: `Dashboard KV` (ou nome da Agência).
4. Anote o `Project ID`. Ele vai no `.env`.

---

## 2. Configurar o Banco de Dados (Database)

1. Vá no menu esquerdo inferior > **Databases**.
2. Clique em **Create database**.
3. **Name**: `Dashboard KV DB`
4. **Database ID** (CRÍTICO): `dashboard-kv`. *(Se usar outro, terá que alterar nas Constantes do React)*.

---

## 3. Estruturação das Coleções (Tabelas)

Entre no Database \`dashboard-kv\` e crie as coleções (Collections) a seguir.

### Coleção: `clientes`
Armazena a base de relatórios cadastrados.
*   **Collection ID:** `clientes`
*   **Attributes (Atributos):**
    *   `nome` (String, max 255) — Obrigatório
    *   `slug` (String, max 255) — Obrigatório
    *   `tipo_campanha` (String, enum: `whatsapp`, `leads`, `ambos`) — Obrigatório
    *   `pasta_id` (String, max 50) — Opcional
    *   `logo_url` (String, URL format, max 500) — Opcional
    *   `spreadsheet_id` (String, max 255) — Obrigatório
    *   `ativo` (Boolean, default: true) — Obrigatório
*   **Indexes:**
    *   Index Key: `idx_slug` / Type: `unique` / Attribute: `slug`

### Coleção: `pastas`
Tags organizacionais de clientes.
*   **Collection ID:** `pastas`
*   **Attributes:**
    *   `nome` (String, max 100) — Obrigatório
    *   `cor` (String, max 50) — Opcional

### Coleção: `orcamentos`
Faturamento, PIX e Recibos.
*   **Collection ID:** `orcamentos`
*   **Attributes:**
    *   `cliente_id` (String, max 50) — Opcional
    *   `cliente_nome` (String, max 255) — Obrigatório
    *   `valor_total` (Double / Float) — Obrigatório
    *   `status` (String, enum: `pendente`, `pago`, `cancelado`, default: `pendente`) — Obrigatório
    *   `token` (String, max 255) — Obrigatório
    *   `itens` (String, max 65000) — Obrigatório *(Será salvo um array codificado em JSON nativamente pelo Frontend)*.
    *   `pix_chave` (String, max 255) — Obrigatório
    *   `comprovante_url` (String, max 500) — Opcional
*   **Indexes:**
    *   Index Key: `idx_token` / Type: `unique` / Attribute: `token`

### Coleção: `pagamentos`
Registro histórico de conformidade para o painel de Finanças.
*   **Collection ID:** `pagamentos`
*   **Attributes:**
    *   `orcamento_id` (String) — Obrigatório
    *   `valor` (Double) — Obrigatório
    *   `data_pagamento` (Datetime) — Obrigatório
    *   `comprovante_url` (String) — Opcional
    
### Coleção: `convites`
Lista restrita do painel Configurações para Team Members.
*   **Collection ID:** `convites`
*   **Attributes:**
    *   `email` (String, email format) — Obrigatório
    *   `token` (String) — Obrigatório
    *   `expira_em` (Datetime) — Obrigatório
    *   `status` (String, enum: `pendente`, `aceito`, `revogado`) — Obrigatório
*   **Indexes:**
    *   Index Key: `idx_token_convite` / Type: `unique` / Attribute: `token`

---

## 4. Configurar as Permissões das Coleções

*Esta é a chave para o React Query ler/escrever sem falhar de permissão.*
Nas configurações (Settings) de cada coleção em **Permissions**:

Role Padrão de Adição: **Role `Users`** *(Ou Administradores restritos dependendo de como preferir isolar o Auth, mas caso queira acesso fácil logado, usar Auth Users)*.

Caso o AppWrite exija segurança a nível Documento, preencha as opções "Create", "Read", "Update" e "Delete" garantindo marcar \`Any\` ou \`Users\` para painéis privados. Para orçamentos e clientes públicos que vão ser encontrados pelos Slugs, Marque `Any` no `Read`.

---

## 5. Bucket de Storage (Comprovantes)

1. Va no menu esquerdo > **Storage**.
2. Clique em **Create bucket**.
3. **Name**: `Comprovantes`
4. **Bucket ID**: `comprovantes` (Mantenha este padrão).
5. Em **Settings**:
   *   Max file size: `5MB`
   *   Allowed file extensions: `jpg`, `jpeg`, `png`, `pdf`
   *   **Permissions**: Adicione `Any` e conceda apenas permissões de `Create` e `Read` nesta camada pública, para clientes conseguirem dar Drop de formulários não-logados sem ter acessos irrestritos.

---

## 6. Criando a API Key (Para funções ou escalabilidade back-end)

*(Somente se precisar atuar com Server ou Edge via Node.js futuramente)*
1. Vá na Página Inicial do Projeto no Appwrite > **Overview** > **Integrations** > **API Keys**.
2. **Name**: `KV Admin Key`
3. Selecione os "Scopes" (Escopos):
   *   `databases.read`, `databases.write`
   *   `files.read`, `files.write`
   *   `users.read`, `users.write`
4. Guarde o segredo Key e insira no seu server local se necessário.

---

## 7. Setup de Variáveis Ambiente (`.env`)

Crie o arquivo na raiz do seu repositório Vite (copie do `.env.example`) com as configs providenciadas pelo seu console AppWrite:

\`\`\`env
VITE_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1" # Mude se você hospedar na sua cloud
VITE_APPWRITE_PROJECT="[project_id_copiado]"
VITE_APPWRITE_DATABASE="dashboard-kv"

# Opcionais (Geração pública)
VITE_APP_URL="https://meudominio.com" 
\`\`\`

---

## 8. Criando o primeiro Administrador (Console)

O sistema do Frontend do `Login.tsx` não contém área de "Sign Up" ou Cadastro por questões de segurança (para ninguém infiltrar). Para criar o "Dono" do Dashboard KV:

1. No console AppWrite, clique em **Auth**.
2. Vá em **Users** > **Create User**.
3. Digite de forma livre lá um Nome, Email e Senha Segura.
4. Feito isso, logue usando as mesmas especificações no seu painel na porta `localhost:3000/login`.

Você está pronto para voar. 🚀
