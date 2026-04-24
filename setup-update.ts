import * as sdk from 'node-appwrite'
import * as dotenv from 'dotenv'
dotenv.config()

let endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
if (endpoint && !endpoint.endsWith('/v1')) {
  endpoint = endpoint.endsWith('/') ? `${endpoint}v1` : `${endpoint}/v1`;
}

const client = new sdk.Client()
  .setEndpoint(endpoint)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.VITE_APPWRITE_API_KEY!)

const databases = new sdk.Databases(client)
const DB_ID = 'dashboard-kv'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function runUpdate() {
  console.log(`🚀 Iniciando atualização da base de dados no endpoint: ${endpoint}`);

  // ATUALIZAÇÃO DA COLEÇÃO CLIENTES
  console.log('⏳ Adicionando novos campos na coleção clientes...');
  const novosCamposClientes = [
    { id: 'fonte_dados', type: 'string', size: 50, required: false, default: 'appwrite' },
    { id: 'meta_ad_account_id', type: 'string', size: 255, required: false },
    { id: 'meta_access_token', type: 'string', size: 2000, required: false }
  ];

  for (const campo of novosCamposClientes) {
    try {
      await databases.createStringAttribute(DB_ID, 'clientes', campo.id, campo.size, campo.required, campo.default);
      console.log(`✅ Campo '${campo.id}' criado com sucesso na coleção 'clientes'.`);
    } catch (error: any) {
      if (error.code === 409) {
        console.log(`⏭️ Campo '${campo.id}' já existe na coleção 'clientes'.`);
      } else {
        console.log(`❌ Erro ao criar '${campo.id}': ${error.message}`);
      }
    }
  }

  // ATUALIZAÇÕES ADICIONAIS DE CAMPOS (Opcional, mas recomendado para os conjuntos/criativos que foram modificados)
  console.log('⏳ Adicionando novos campos opcionais em adsets e ads...');
  try {
    await databases.createStringAttribute(DB_ID, 'adsets', 'publico_descricao', 1000, false);
    console.log(`✅ Campo 'publico_descricao' adicionado em 'adsets'.`);
  } catch(e: any) { if (e.code !== 409) console.log(`❌ Erro em 'publico_descricao':`, e.message); }
  
  try {
    await databases.createStringAttribute(DB_ID, 'ads', 'tipo_midia', 50, false);
    console.log(`✅ Campo 'tipo_midia' adicionado em 'ads'.`);
  } catch(e: any) { if (e.code !== 409) console.log(`❌ Erro em 'tipo_midia':`, e.message); }
  
  try {
    await databases.createStringAttribute(DB_ID, 'ads', 'status', 50, false);
    console.log(`✅ Campo 'status' adicionado em 'ads'.`);
  } catch(e: any) { if (e.code !== 409) console.log(`❌ Erro em 'status (ads)':`, e.message); }

  console.log('\n🚀 Checagem/Criação das 5 Novas Coleções (campaigns, adsets, ads, daily_metrics, manual_inputs)...');
  
  const defaultPermissions = [
    sdk.Permission.read(sdk.Role.any()),
    sdk.Permission.create(sdk.Role.users()),
    sdk.Permission.update(sdk.Role.users()),
    sdk.Permission.delete(sdk.Role.users()),
  ]

  // PASSO 10 — Coleção campaigns
  try {
    await databases.createCollection(DB_ID, 'campaigns', 'Campanhas', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'campaigns', 'id', 255, true)
    await databases.createStringAttribute(DB_ID, 'campaigns', 'cliente_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'campaigns', 'nome', 255, true)
    await databases.createStringAttribute(DB_ID, 'campaigns', 'tipo', 50, true)
    await databases.createStringAttribute(DB_ID, 'campaigns', 'status', 50, false)
    await databases.createStringAttribute(DB_ID, 'campaigns', 'fonte_dados', 50, false, 'appwrite')
    console.log('✅ Coleção campaigns recriada/verificada')
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Coleção campaigns já existe');
    else console.log('❌ Erro campaigns:', error.message);
  }

  // PASSO 11 — Coleção adsets
  try {
    await databases.createCollection(DB_ID, 'adsets', 'Conjuntos', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'adsets', 'id', 255, true)
    await databases.createStringAttribute(DB_ID, 'adsets', 'campanha_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'adsets', 'nome', 255, true)
    await databases.createStringAttribute(DB_ID, 'adsets', 'escolaridade', 50, false)
    console.log('✅ Coleção adsets recriada/verificada')
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Coleção adsets já existe');
    else console.log('❌ Erro adsets:', error.message);
  }

  // PASSO 12 — Coleção ads
  try {
    await databases.createCollection(DB_ID, 'ads', 'Criativos', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'ads', 'id', 255, true)
    await databases.createStringAttribute(DB_ID, 'ads', 'conjunto_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'ads', 'nome', 255, true)
    await databases.createStringAttribute(DB_ID, 'ads', 'thumbnail_url', 1000, false)
    await databases.createStringAttribute(DB_ID, 'ads', 'link_anuncio', 1000, false)
    console.log('✅ Coleção ads recriada/verificada')
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Coleção ads já existe');
    else console.log('❌ Erro ads:', error.message);
  }

  // PASSO 13 — Coleção daily_metrics
  try {
    await databases.createCollection(DB_ID, 'daily_metrics', 'Métricas Diárias', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'daily_metrics', 'cliente_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'daily_metrics', 'criativo_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'daily_metrics', 'data', 50, true)
    await databases.createFloatAttribute(DB_ID, 'daily_metrics', 'investimento', true)
    await databases.createIntegerAttribute(DB_ID, 'daily_metrics', 'impressoes', true)
    await databases.createIntegerAttribute(DB_ID, 'daily_metrics', 'alcance', true)
    await databases.createIntegerAttribute(DB_ID, 'daily_metrics', 'cliques', true)
    await databases.createIntegerAttribute(DB_ID, 'daily_metrics', 'conversas', false, 0)
    await databases.createIntegerAttribute(DB_ID, 'daily_metrics', 'leads_qualificados', false, 0)
    await databases.createIntegerAttribute(DB_ID, 'daily_metrics', 'leads_desqualificados', false, 0)
    await databases.createIntegerAttribute(DB_ID, 'daily_metrics', 'vendas', false, 0)
    await databases.createStringAttribute(DB_ID, 'daily_metrics', 'fonte', 50, false, 'webhook')
    console.log('✅ Coleção daily_metrics recriada/verificada')
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Coleção daily_metrics já existe');
    else console.log('❌ Erro daily_metrics:', error.message);
  }

  // PASSO 14 — Coleção manual_inputs
  try {
    await databases.createCollection(DB_ID, 'manual_inputs', 'Inputs Manuais', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'manual_inputs', 'cliente_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'manual_inputs', 'data', 50, true)
    await databases.createFloatAttribute(DB_ID, 'manual_inputs', 'investimento_total_contratado', true)
    await databases.createIntegerAttribute(DB_ID, 'manual_inputs', 'leads_no_grupo_superior', true)
    await databases.createIntegerAttribute(DB_ID, 'manual_inputs', 'leads_no_grupo_medio', true)
    console.log('✅ Coleção manual_inputs recriada/verificada')
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Coleção manual_inputs já existe');
    else console.log('❌ Erro manual_inputs:', error.message);
  }

  // PASSO 15 — Coleção lancamentos
  try {
    await databases.createCollection(DB_ID, 'lancamentos', 'Lançamentos', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'cliente_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'nome', 255, true)
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'slug', 255, true)
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'tipo', 50, true) // leads | ambos
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'status', 50, true) // rascunho | ativo | encerrado
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'palavra_chave_meta', 255, false) 
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'meta_account_id', 255, false)
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'meta_access_token', 2000, false)
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'colunas_webhook', 5000, false) // JSON array
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'webhook_url', 1000, false)
    await databases.createStringAttribute(DB_ID, 'lancamentos', 'configuracao_secoes', 10000, false)
    await databases.createDatetimeAttribute(DB_ID, 'lancamentos', 'criado_em', false)
    await databases.createDatetimeAttribute(DB_ID, 'lancamentos', 'publicado_em', false)
    console.log('✅ Coleção lancamentos criada')
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Coleção lancamentos já existe');
    else console.log('❌ Erro lancamentos:', error.message);
  }

  // PASSO 16 — Coleção meta_accounts
  try {
    await databases.createCollection(DB_ID, 'meta_accounts', 'Contas Meta Ads', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'meta_accounts', 'nome', 255, true)
    await databases.createStringAttribute(DB_ID, 'meta_accounts', 'meta_account_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'meta_accounts', 'meta_access_token', 2000, true)
    await databases.createDatetimeAttribute(DB_ID, 'meta_accounts', 'criado_em', false)
    console.log('✅ Coleção meta_accounts criada')
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Coleção meta_accounts já existe');
    else console.log('❌ Erro meta_accounts:', error.message);
  }

  // PASSO 17 — Coleção lead_entries
  try {
    await databases.createCollection(DB_ID, 'lead_entries', 'Lead Entries', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'lancamento_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'data', 50, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'nome', 255, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'email', 255, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'escolaridade', 255, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'telefone', 255, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'utm_source', 255, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'utm_campaign', 255, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'utm_medium', 255, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'utm_term', 255, false)
    await databases.createStringAttribute(DB_ID, 'lead_entries', 'utm_content', 255, false)
    console.log('✅ Coleção lead_entries criada')
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Coleção lead_entries já existe');
    else console.log('❌ Erro lead_entries:', error.message);
  }

  console.log('\n✅ Atualização finalizada. Sinta-se à vontade para revisar seu Dashboard no Appwrite.')
}

runUpdate()
