import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';
import type { Cliente, Pasta, Convite, Orcamento, Pagamento, Lancamento, MetaAccount } from './types';

// Garantir que a URL termine com /v1 (corrige erro de rota 404 HTML caso a env file tenha falhado)
let endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
if (endpoint && !endpoint.endsWith('/v1')) {
  endpoint = endpoint.endsWith('/') ? `${endpoint}v1` : `${endpoint}/v1`;
}

// O client usa as variáveis de ambiente normais do Vite
export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DB_ID = 'dashboard-kv';
export const COLLECTIONS = {
  clientes: 'clientes',
  pastas: 'pastas',
  convites: 'convites',
  orcamentos: 'orcamentos',
  pagamentos: 'pagamentos',
  usuarios_admin: 'usuarios_admin',
};

// --- Auth ---
export async function getCurrentUser() {
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
}

export async function login(email: string, pass: string) {
  try {
    return await account.createEmailPasswordSession(email, pass);
  } catch (error: any) {
    if (error?.type === 'general_route_not_found' || error?.code === 404 || error?.message?.includes('JSON')) {
      console.log("Tentando fallback de REST API nativa devido a incompatibilidade de versão do SDK...");
      
      const response = await fetch(`${client.config.endpoint}/account/sessions/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': client.config.project,
        },
        body: JSON.stringify({ email, password: pass })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas ou erro no Appwrite');
      }
      return data;
    }
    throw error;
  }
}

export async function logout() {
  return await account.deleteSession('current');
}

export async function atualizarNomeUsuario(nome: string) {
  return await account.updateName(nome);
}

export async function atualizarSenha(nova: string, atual: string) {
  return await account.updatePassword(nova, atual);
}

export async function atualizarFotoPerfil(file: File) {
  // Cria um bucket 'perfis' se ele existir, ou usa um padrão
  const upload = await storage.createFile('perfis', ID.unique(), file);
  const url = storage.getFileView('perfis', upload.$id).toString();
  
  // Appwrite não tem um campo 'profilePhoto' nativo no Account, 
  // mas podemos guardar no prefs ou apenas retornar a URL para o front lidar
  await account.updatePrefs({ photoUrl: url });
  return url;
}

// --- Clientes ---
export async function listarClientes(): Promise<Cliente[]> {
  const docs = await databases.listDocuments(DB_ID, COLLECTIONS.clientes, [
     Query.orderAsc('nome')
  ]);
  return docs.documents as unknown as Cliente[];
}

export async function buscarCliente(id: string): Promise<Cliente> {
  const doc = await databases.getDocument(DB_ID, COLLECTIONS.clientes, id);
  return doc as unknown as Cliente;
}

export async function buscarClientePorSlug(slug: string): Promise<Cliente> {
  const docs = await databases.listDocuments(DB_ID, COLLECTIONS.clientes, [
    Query.equal('slug', slug),
    Query.limit(1)
  ]);
  if (docs.documents.length === 0) throw new Error('Cliente não encontrado');
  return docs.documents[0] as unknown as Cliente;
}

export async function criarCliente(data: Omit<Cliente, '$id' | '$createdAt'>): Promise<Cliente> {
  const doc = await databases.createDocument(DB_ID, COLLECTIONS.clientes, ID.unique(), data);
  return doc as unknown as Cliente;
}

export async function atualizarCliente(id: string, data: Partial<Cliente>): Promise<Cliente> {
  const doc = await databases.updateDocument(DB_ID, COLLECTIONS.clientes, id, data);
  return doc as unknown as Cliente;
}

export async function deletarCliente(id: string): Promise<void> {
  await databases.deleteDocument(DB_ID, COLLECTIONS.clientes, id);
}

// --- Pastas ---
export async function listarPastas(): Promise<Pasta[]> {
  const docs = await databases.listDocuments(DB_ID, COLLECTIONS.pastas);
  return docs.documents as unknown as Pasta[];
}

export async function criarPasta(nome: string, cor: string): Promise<Pasta> {
  const doc = await databases.createDocument(DB_ID, COLLECTIONS.pastas, ID.unique(), { nome, cor });
  return doc as unknown as Pasta;
}

export async function deletarPasta(id: string): Promise<void> {
  await databases.deleteDocument(DB_ID, COLLECTIONS.pastas, id);
}

// --- Convites ---
export async function criarConvite(email: string): Promise<Convite> {
  const expira_em = new Date();
  expira_em.setHours(expira_em.getHours() + 48);

  const doc = await databases.createDocument(DB_ID, COLLECTIONS.convites, ID.unique(), {
    email,
    token: ID.unique(),
    status: 'pendente',
    expira_em: expira_em.toISOString(),
  });
  return doc as unknown as Convite;
}

export async function listarConvites(): Promise<Convite[]> {
  const docs = await databases.listDocuments(DB_ID, COLLECTIONS.convites);
  return docs.documents as unknown as Convite[];
}

export async function revogarConvite(id: string): Promise<void> {
  await databases.updateDocument(DB_ID, COLLECTIONS.convites, id, { status: 'expirado' });
}

// --- Orçamentos ---
export async function criarOrcamento(
  data: Omit<Orcamento, '$id' | '$createdAt' | 'token' | 'status' | 'link_expira_em' | 'pix_qrcode' | 'valor_total'>
): Promise<Orcamento> {
  const token = ID.unique();
  const expira_em = new Date();
  expira_em.setDate(expira_em.getDate() + 7);

  const valor_total = data.itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);
  
  const { gerarPayloadPix } = await import('./utils');
  const pix_qrcode = gerarPayloadPix(data.pix_chave, valor_total, 'Gestor de Tráfego', 'São Paulo');

  const doc = await databases.createDocument(DB_ID, COLLECTIONS.orcamentos, ID.unique(), {
    ...data,
    itens: JSON.stringify(data.itens),
    token,
    status: 'pendente',
    valor_total,
    pix_qrcode,
    link_expira_em: expira_em.toISOString(),
  });
  return doc as unknown as Orcamento;
}

export async function buscarOrcamento(id: string): Promise<Orcamento> {
  const doc = await databases.getDocument(DB_ID, COLLECTIONS.orcamentos, id);
  return doc as unknown as Orcamento;
}

export async function listarOrcamentos(): Promise<Orcamento[]> {
  const docs = await databases.listDocuments(DB_ID, COLLECTIONS.orcamentos, [
     Query.orderDesc('$createdAt')
  ]);
  return docs.documents as unknown as Orcamento[];
}

export async function buscarOrcamentoPorToken(token: string): Promise<Orcamento> {
  const docs = await databases.listDocuments(DB_ID, COLLECTIONS.orcamentos, [
    Query.equal('token', token),
    Query.limit(1)
  ]);
  if (docs.documents.length === 0) throw new Error('Orçamento não encontrado ou expirado');
  return docs.documents[0] as unknown as Orcamento;
}

export async function atualizarStatusOrcamento(id: string, status: Orcamento['status']): Promise<Orcamento> {
  const doc = await databases.updateDocument(DB_ID, COLLECTIONS.orcamentos, id, { status });
  return doc as unknown as Orcamento;
}

export async function deletarOrcamento(id: string): Promise<void> {
  await databases.deleteDocument(DB_ID, COLLECTIONS.orcamentos, id);
}

// --- Pagamentos ---
export async function confirmarPagamento(orcamento_id: string, arquivoFile: File, observacao?: string): Promise<Pagamento> {
  const upload = await storage.createFile('comprovantes', ID.unique(), arquivoFile);
  const url = storage.getFileView('comprovantes', upload.$id).toString();

  const pagamento = await databases.createDocument(DB_ID, COLLECTIONS.pagamentos, ID.unique(), {
    orcamento_id,
    comprovante_url: url,
    confirmado_em: new Date().toISOString(),
    observacao: observacao || null,
  });

  await atualizarStatusOrcamento(orcamento_id, 'pago');

  return pagamento as unknown as Pagamento;
}

export async function listarPagamentos(): Promise<Pagamento[]> {
   const docs = await databases.listDocuments(DB_ID, COLLECTIONS.pagamentos, [
     Query.orderDesc('confirmado_em')
  ]);
  return docs.documents as unknown as Pagamento[];
}

// --- Integração Dashboard (Appwrite) ---

export async function fetchCampanhasAppwrite(cliente_id: string) {
  const docs = await databases.listDocuments(DB_ID, 'campaigns', [
    Query.equal('cliente_id', cliente_id),
    Query.limit(100)
  ]);
  return docs.documents;
}

export async function fetchConjuntosAppwrite(cliente_id: string) {
  // O conjunto não tem cliente_id diretamente, mas podemos pegar apenas listando os disponíveis
  // Para escalar melhor, seria ideal adicionar cliente_id no adsets, mas vamos contornar buscando todos 
  // os que pertencem às campanhas do cliente.
  const campaigns = await fetchCampanhasAppwrite(cliente_id);
  const campIds = campaigns.map(c => c.id);
  if (!campIds.length) return [];
  
  const docs = await databases.listDocuments(DB_ID, 'adsets', [
    Query.limit(500) // Assumindo que filtragem local será necessária ou todos pertencem às camps
  ]);
  return docs.documents.filter((d: any) => campIds.includes(d.campanha_id));
}

export async function fetchCriativosAppwrite(cliente_id: string) {
  const conjuntos = await fetchConjuntosAppwrite(cliente_id);
  const conjIds = conjuntos.map(c => c.id);
  if (!conjIds.length) return [];

  const docs = await databases.listDocuments(DB_ID, 'ads', [
    Query.limit(1000)
  ]);
  return docs.documents.filter((d: any) => conjIds.includes(d.conjunto_id));
}

export async function fetchMetricasAppwrite(cliente_id: string, from: Date, to: Date) {
  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const docs = await databases.listDocuments(DB_ID, 'daily_metrics', [
    Query.equal('cliente_id', cliente_id),
    Query.greaterThanEqual('data', fromStr),
    Query.lessThanEqual('data', toStr),
    Query.limit(1000)
  ]);
  return docs.documents;
}

export async function fetchManualInputsAppwrite(cliente_id: string, from: Date, to: Date) {
  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const docs = await databases.listDocuments(DB_ID, 'manual_inputs', [
    Query.equal('cliente_id', cliente_id),
    Query.greaterThanEqual('data', fromStr),
    Query.lessThanEqual('data', toStr),
    Query.limit(500)
  ]);
  return docs.documents;
}

// --- Lançamentos ---
export async function listarLancamentos(clienteId?: string): Promise<Lancamento[]> {
  const queries = [Query.orderDesc('criado_em')];
  if (clienteId) {
    queries.push(Query.equal('cliente_id', clienteId));
  }
  const docs = await databases.listDocuments(DB_ID, 'lancamentos', queries);
  return docs.documents as unknown as Lancamento[];
}

export async function buscarLancamento(id: string): Promise<Lancamento> {
  const doc = await databases.getDocument(DB_ID, 'lancamentos', id);
  return doc as unknown as Lancamento;
}

export async function buscarLancamentoPorSlug(clienteSlug: string, lancamentoSlug: string): Promise<Lancamento> {
  const cliente = await buscarClientePorSlug(clienteSlug);
  const docs = await databases.listDocuments(DB_ID, 'lancamentos', [
    Query.equal('cliente_id', cliente.$id!),
    Query.equal('slug', lancamentoSlug),
    Query.limit(1)
  ]);
  if (docs.documents.length === 0) throw new Error('Lançamento não encontrado');
  return docs.documents[0] as unknown as Lancamento;
}

export async function criarLancamento(data: Partial<Lancamento>): Promise<Lancamento> {
  const id = ID.unique();
  const webhook_url = `${window.location.origin}/api/webhook/${id}`;
  const now = new Date().toISOString();
  
  const doc = await databases.createDocument(DB_ID, 'lancamentos', id, {
    ...data,
    webhook_url,
    criado_em: now
  });
  return doc as unknown as Lancamento;
}

export async function atualizarLancamento(id: string, data: Partial<Lancamento>): Promise<Lancamento> {
  const doc = await databases.updateDocument(DB_ID, 'lancamentos', id, data);
  return doc as unknown as Lancamento;
}

export async function publicarLancamento(id: string): Promise<Lancamento> {
  const publicado_em = new Date().toISOString();
  const doc = await databases.updateDocument(DB_ID, 'lancamentos', id, { 
    status: 'ativo', 
    publicado_em 
  });
  return doc as unknown as Lancamento;
}

export async function encerrarLancamento(id: string): Promise<Lancamento> {
  const doc = await databases.updateDocument(DB_ID, 'lancamentos', id, { 
    status: 'encerrado' 
  });
  return doc as unknown as Lancamento;
}

export async function deletarLancamento(id: string): Promise<void> {
  await databases.deleteDocument(DB_ID, 'lancamentos', id);
}

// --- Meta Accounts ---
export async function listarMetaAccounts(): Promise<MetaAccount[]> {
  const docs = await databases.listDocuments(DB_ID, 'meta_accounts', [
    Query.orderDesc('criado_em')
  ]);
  return docs.documents as unknown as MetaAccount[];
}

export async function criarMetaAccount(data: Omit<MetaAccount, '$id'>): Promise<MetaAccount> {
  const doc = await databases.createDocument(DB_ID, 'meta_accounts', ID.unique(), {
    ...data,
    criado_em: new Date().toISOString()
  });
  return doc as unknown as MetaAccount;
}

export async function deletarMetaAccount(id: string): Promise<void> {
  await databases.deleteDocument(DB_ID, 'meta_accounts', id);
}

export async function validarMetaToken(accountId: string, token: string): Promise<{ 
  valido: boolean, 
  account_id?: string, 
  nome_conta?: string 
}> {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${accountId}?fields=name,account_status&access_token=${token}`);
    const data = await response.json();
    
    if (data.error) {
      return { valido: false, nome_conta: undefined };
    }
    
    return {
      valido: true,
      account_id: accountId,
      nome_conta: data.name
    };
  } catch (err) {
    return { valido: false };
  }
}

export async function testarFiltroCampanhas(accountId: string, token: string, palavraChave: string): Promise<{
  nome: string,
  status: string, 
  gasto: string
}[]> {
  const response = await fetch(`https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=name,status,insights{spend}&access_token=${token}`);
  const data = await response.json();
  
  if (data.error || !data.data) {
    throw new Error(data.error?.message || 'Erro ao buscar campanhas');
  }
  
  return data.data
    .filter((camp: any) => camp.name.includes(palavraChave))
    .map((camp: any) => ({
      nome: camp.name,
      status: camp.status,
      gasto: camp.insights?.data?.[0]?.spend || '0.00'
    }));
}
