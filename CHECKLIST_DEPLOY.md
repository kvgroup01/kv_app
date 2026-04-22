# Checklist de Implantação e Testes - Dashboard KV

Este documento serve como guia definitivo para dar o pontapé inicial no sistema, validar todas as funcionalidades e resolver prováveis engasgos na infraestrutura.

## 1. PRIMEIROS PASSOS

Para colocar o projeto no ar do absoluto zero, siga esta ordem extara:

### 1.1 Instalação e Execução
Na raiz do seu projeto (onde está o `package.json`), abra o terminal e rode:
```bash
npm install
npm run dev
```
O projeto estará rodando localmente (normalmente em `http://localhost:3000` ou similar).

### 1.2 Criação do Primeiro Usuário (AppWrite)
Como não há uma tela de registro pública (por segurança), o primeiro administrador deve ser criado manualmente:
1. Acesse seu painel do **AppWrite Console**.
2. Vá em **Auth** > **Users**.
3. Clique em **Create user**.
4. Defina um Nome, E-mail e Senha segura.
5. *Dica:* Esses serão os dados que você usará na tela de Login do seu sistema.

### 1.3 Configuração do Arquivo `.env`
Crie um arquivo chamado `.env` na raiz do projeto contendo as seguintes credenciais:
```env
# URL da sua API AppWrite (ex: https://cloud.appwrite.io/v1)
VITE_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"

# ID do Projeto no AppWrite
VITE_APPWRITE_PROJECT_ID="seu-project-id-aqui"

# URL base da sua aplicação (usado para gerar links copiáveis)
VITE_APP_URL="http://localhost:3000"
```

### 1.4 Primeira Planilha de Cliente
1. Cópia: Faça uma cópia do arquivo de template do Sheets.
2. Formato: Siga as formatações rigorosas das abas (Datas em `YYYY-MM-DD`, números com pontos sem caracteres de moeda `R$`).
3. Permissão de Acesso: É mandatório clicar em **Compartilhar** > **Qualquer pessoa com o link** e definir como **Leitor**.
4. Setup no software: Ao acessar a tela de **Novo Cliente** no painel administrativo, cole a `Spreadsheet ID` retirada diretamente da URL da planilha.

---

## 2. CHECKLIST DE TESTE

Use os botões de seleção abaixo para certificar que todo o fluxo de ponta a ponta está ocorrendo com sucesso:

- [ ] Login com email e senha funciona
- [ ] Redireciona para `/admin` após login com sucesso
- [ ] Criar novo cliente com `spreadsheet_id`
- [ ] Acessar `/dashboard/:slug` do cliente gerado e ver dados carregarem
- [ ] Trocar período no `DateRangePicker` atualiza dados do Dashbaord instantaneamente
- [ ] Criar orçamento preenchendo todos os itens e validando a Chave PIX
- [ ] Acessar o ambiente de checkout público `/orcamento/:token` gerado e verificar os layouts
- [ ] Fazer Upload de um comprovante no ambiente público (Garante se altera o estado para "pago")
- [ ] Painel Financeiro exibe pagamento listado na aba com status de confirmado/pago
- [ ] Modulo de "Equipe": Enviar convite via e-mail e conferir persistência no banco
- [ ] Painel de "Pastas": Criar pasta colorida e Mover Cliente x com flexibilidade

---

## 3. PROBLEMAS COMUNS E SOLUÇÕES

### Erro de CORS com AppWrite no console (Vermelho Fundo de Tela)
**Causa:** O AppWrite recusa receber requisições de domínios que ele desconhece como medida de segurança nativa.
**Solução:** Acesse AppWrite Console > O seu Projeto > Aba **Overview** > Role até a aba inferior de **Platforms** > Add Platform -> Web app -> Adicione seu domínio raiz `localhost` sem a porta (só localhost) ou o domínio de deploy final (`seo-dash.com`).

### O Dashboard do Cliente fica carregando eternamente (Planilha não carrega)
**Causa:** A Planilha que você atribuiu no cadastro do cliente não está com a permissão correta.
**Solução:** Abra o seu Google Sheets, verifique se a permissão em azul "Compartilhar" indica *Restrito*. Deve obrigatóriamente estar `"Qualquer pessoa com o link - Leitor"`.

### O QR Code PIX inválido no leitor de celular do Orçamento
**Causa:** Chave colada errada com espaços visíveis, ou falha no encoder com campos ultrapassando caracteres.
**Solução:** Verifique se as partes fixas no payload do seu arquivo `src/lib/utils.ts` têm nomes limitados a carácteres base. Além disso, verifique no painel de administração o campo Chave PIX, e retire quaisquer espaços presentes na extremidade. 

### O Upload de comprovantes falha imediatamente e fica travado no Loading
**Causa:** Permissões do Banco de Dados `Storage` do Appwrite.
**Solução:** Acesse seu AppWrite Console > **Storage** > No bucket "comprovantes", abra a engrenagem Settings. Nas Permissões (Permissions - Appwrite), defina que `Any` pode possuir cargo `Create`, `Read` e `Update`. 
