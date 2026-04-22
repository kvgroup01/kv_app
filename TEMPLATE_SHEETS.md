# Guia do Google Sheets - Template e Integração

Este documento fornece as instruções de como o Gestor de Tráfego ou Administrador deve estruturar, preencher e disponibilizar as planilhas de relatórios diários de cada cliente no Google Sheets para que o **Dashboard KV** consiga importá-las corretamente.

---

## 1. Como iniciar uma nova Planilha

Sempre que entrar um novo cliente, você não precisa criar tudo do zero.
1. Abra a [Planilha Template Oficial](#) *(insira aqui o link caso tenha uma central no seu drive)*.
2. No menu superior, clique em **Arquivo > Fazer uma cópia**.
3. Nomeie como "Relatório de Performance - [Nome do Cliente]".
4. Salve dentro da sua nova pasta compartilhada estrutural do Google Drive.

---

## 2. Estrutura Abas e Colunas Obrigatórias

O Painel lê exatamente as abas nomeadas e colunas na primeira linha (Header). Não altere os nomes em MAIÚSCULO.

### Aba: `CAMPANHAS`
Traz a listagem agregada e histórica das campanhas.
*   **Colunas:** `id`, `nome`, `status`, `investimento`, `impressoes`, `cliques`, `conversas`, `leads`.
*   **Exemplo:** `1` | `[FaceAds] Captação Whats` | `Ativa` | `1500.50` | `45000` | `1200` | `35` | `0`

### Aba: `CONJUNTOS`
Traz a variação dos públicos alvos que compõem as Campanhas.
*   **Colunas:** `id`, `campanha_id`, `nome`, `status`, `investimento`, `impressoes`, `cliques`, `conversas`, `leads`.
*   **Exemplo:** `101` | `1` | `LAL 1% Compradores` | `Ativa` | `750.25` | `20000` | `600` | `15` | `0`

### Aba: `CRIATIVOS`
Desempenho isolado das peças e copys, vinculado aos conjuntos.
*   **Colunas:** `id`, `conjunto_id`, `nome`, `thumbnail_url`, `status`, `investimento`, `impressoes`, `cliques`, `conversas`, `leads`.
*   **Exemplo:** `5001` | `101` | `Video_Vendas_01` | `https://imgur...` | `Ativa` | `300.00` | `5000` | `250` | `10` | `0`

### Aba: `METRICAS_DIARIAS`
**A aba mais importante para gráficos de data (Série histórica)**. Registra as flutuações diárias para montar a curvatura de performance.
*   **Colunas:** `id`, `data`, `campanha_id`, `investimento`, `impressoes`, `alcance`, `cliques`, `conversas`, `leads`, `qualificados`, `desqualificados`.
*   **Exemplo:** `1001` | `2025-06-15` | `1` | `35.20` | `1200` | `1100` | `45` | `2` | `0` | `0` | `0`

### Aba: `LEADS_GRUPOS` *(Específico para "Lançamentos e Leads")*
Registra contagens simplificadas do volume de leads por segmento se for pertinente à operação.
*   **Colunas:** `data`, `ensino_superior`, `ensino_medio`
*   **Exemplo:** `2025-06-15` | `1240` | `485`

---

## 3. Regras de Formatação Constantes

Para que o robô faça a leitura exata, alguns combinados de digitação são obrigatórios:

1. **Formato de Datas (ISO):** O Google Sheets tenta formatar com "/". Force as colunas de data no formato **Texto ou Data Internacional ISO**: `YYYY-MM-DD` (Ex: `2025-08-25`). 
2. **Moeda e Pontuação Monetária:** O sistema não lê R$. Os valores decimais devem usar **ponto e não vírgula**, sem formatações de milhar. Digite `1420.50` (mil quatrocentos e vinte e cinquenta).
3. **IDs Relacionais:** Toda campanha, conjunto ou criativo tem um \`id\`. Eles devem bater (se a campanha é \`1\`, o conjunto deverá apontar em seu \`campanha_id\` o valor \`1\`). Podem ser puramente sequenciais (`1`, `2`, `3`...).

---

## 4. Compartilhar a planilha publicamente

Para que a API da plataforma que faz parsing de planilhas acesse os dados (pois o sistema atual evita OAuth custom para cada view pública), você deve:
1. Clicar no botão **Compartilhar** (Canto superior direito)
2. Alterar o Acesso Geral para: **"Qualquer pessoa com o link"**.
3. Definir o cargo para: **"Visualizador"** (Assim ninguém além de você altera, mas a API consegue ler).
4. Clique em **Concluído**.

---

## 5. Capturando o Spreadsheet ID

Na URL do seu navegador, quando o Google Sheets estiver aberto, ele terá uma estrutura como esta:
\`https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0\`

O Spreadsheet ID é a sequência alfanumérica contida **entre `/d/` e `/edit`**.
*   **Neste exemplo:** `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

---

## 6. Cadastrando o Cliente no Dashboard KV

Por fim, integre essa URL ao sistema:
1. Entre no Painel (`/admin`).
2. Vá em **Clientes > Novo Cliente**.
3. Preencha nome e defina o formato de Layout.
4. No campo **"ID da Planilha Google"**, cole a Hash (`1BxiMVs0XRA...`) copiada no Passo 5.
5. Salve! Ao clicar em "Ver Dashboard", ele vai varrer em tempo real de forma assíncrona as abas preenchidas e gerar a interface.
