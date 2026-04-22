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
const storage = new sdk.Storage(client)
const DB_ID = 'dashboard-kv'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const defaultPermissions = [
  sdk.Permission.read(sdk.Role.any()),
  sdk.Permission.create(sdk.Role.users()),
  sdk.Permission.update(sdk.Role.users()),
  sdk.Permission.delete(sdk.Role.users()),
]

async function run() {
  console.log(`🚀 Iniciando setup no endpoint: ${endpoint}`);

  // PASSO 1 — Criar banco
  try {
    await databases.create(DB_ID, 'Dashboard KV')
    console.log('✅ Banco de dados criado')
  } catch (error: any) {
    console.log('⏭️ Banco de dados já existe ou erro: ' + (error.message || 'desconhecido'))
  }

  // PASSO 2 — Coleção clientes
  try {
    await databases.createCollection(DB_ID, 'clientes', 'Clientes', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'clientes', 'nome', 255, true)
    await databases.createStringAttribute(DB_ID, 'clientes', 'slug', 255, true)
    await databases.createStringAttribute(DB_ID, 'clientes', 'tipo_campanha', 100, false)
    await databases.createStringAttribute(DB_ID, 'clientes', 'logo_url', 1000, false)
    await databases.createStringAttribute(DB_ID, 'clientes', 'spreadsheet_id', 255, false)
    await databases.createStringAttribute(DB_ID, 'clientes', 'pasta_id', 100, false)
    await databases.createBooleanAttribute(DB_ID, 'clientes', 'ativo', false, true)
    
    await sleep(2000) // Delay necessário para o Appwrite indexar os atributos
    await databases.createIndex(DB_ID, 'clientes', 'idx_slug', 'unique', ['slug'])
    console.log('✅ Coleção clientes criada')
  } catch (error) {
    console.log('⏭️ Coleção clientes já existe, garantindo permissões...')
    await databases.updateCollection(DB_ID, 'clientes', 'Clientes', defaultPermissions)
  }

  // PASSO 3 — Coleção pastas
  try {
    await databases.createCollection(DB_ID, 'pastas', 'Pastas', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'pastas', 'nome', 255, true)
    await databases.createStringAttribute(DB_ID, 'pastas', 'cor', 50, false)
    console.log('✅ Coleção pastas criada')
  } catch (error) {
    console.log('⏭️ Coleção pastas já existe, garantindo permissões...')
    await databases.updateCollection(DB_ID, 'pastas', 'Pastas', defaultPermissions)
  }

  // PASSO 4 — Coleção convites
  try {
    await databases.createCollection(DB_ID, 'convites', 'Convites', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'convites', 'email', 255, true)
    await databases.createStringAttribute(DB_ID, 'convites', 'token', 255, true)
    await databases.createStringAttribute(DB_ID, 'convites', 'status', 50, false)
    await databases.createStringAttribute(DB_ID, 'convites', 'expira_em', 50, false)
    
    await sleep(2000)
    await databases.createIndex(DB_ID, 'convites', 'idx_token', 'unique', ['token'])
    console.log('✅ Coleção convites criada')
  } catch (error) {
    console.log('⏭️ Coleção convites já existe, garantindo permissões...')
    await databases.updateCollection(DB_ID, 'convites', 'Convites', defaultPermissions)
  }

  // PASSO 5 — Coleção orcamentos
  try {
    await databases.createCollection(DB_ID, 'orcamentos', 'Orcamentos', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'orcamentos', 'cliente_id', 255, false)
    await databases.createStringAttribute(DB_ID, 'orcamentos', 'cliente_nome', 255, true)
    await databases.createStringAttribute(DB_ID, 'orcamentos', 'token', 255, true)
    await databases.createStringAttribute(DB_ID, 'orcamentos', 'itens', 5000, true)
    await databases.createFloatAttribute(DB_ID, 'orcamentos', 'valor_total', true)
    await databases.createStringAttribute(DB_ID, 'orcamentos', 'status', 50, false)
    await databases.createStringAttribute(DB_ID, 'orcamentos', 'pix_chave', 255, false)
    await databases.createStringAttribute(DB_ID, 'orcamentos', 'pix_qrcode', 5000, false)
    await databases.createStringAttribute(DB_ID, 'orcamentos', 'link_expira_em', 50, false)
    
    await sleep(2000)
    await databases.createIndex(DB_ID, 'orcamentos', 'idx_token', 'unique', ['token'])
    console.log('✅ Coleção orcamentos criada')
  } catch (error) {
    console.log('⏭️ Coleção orcamentos já existe, garantindo permissões...')
    await databases.updateCollection(DB_ID, 'orcamentos', 'Orcamentos', defaultPermissions)
  }

  // PASSO 6 — Coleção pagamentos
  try {
    await databases.createCollection(DB_ID, 'pagamentos', 'Pagamentos', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'pagamentos', 'orcamento_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'pagamentos', 'comprovante_url', 1000, true)
    await databases.createStringAttribute(DB_ID, 'pagamentos', 'confirmado_em', 50, false)
    await databases.createStringAttribute(DB_ID, 'pagamentos', 'observacao', 2000, false)
    console.log('✅ Coleção pagamentos criada')
  } catch (error) {
    console.log('⏭️ Coleção pagamentos já existe, garantindo permissões...')
    await databases.updateCollection(DB_ID, 'pagamentos', 'Pagamentos', defaultPermissions)
  }

  // PASSO 7 — Coleção usuarios_admin
  try {
    await databases.createCollection(DB_ID, 'usuarios_admin', 'Usuarios Admin', defaultPermissions)
    await databases.createStringAttribute(DB_ID, 'usuarios_admin', 'appwrite_user_id', 255, true)
    await databases.createStringAttribute(DB_ID, 'usuarios_admin', 'nome', 255, false)
    await databases.createStringAttribute(DB_ID, 'usuarios_admin', 'email', 255, true)
    await databases.createStringAttribute(DB_ID, 'usuarios_admin', 'role', 50, false)
    console.log('✅ Coleção usuarios_admin criada')
  } catch (error) {
    console.log('⏭️ Coleção usuarios_admin já existe, garantindo permissões...')
    await databases.updateCollection(DB_ID, 'usuarios_admin', 'Usuarios Admin', defaultPermissions)
  }

  // PASSO 8 e 9 — Bucket comprovantes com permissões
  try {
    await storage.createBucket(
      'comprovantes', 
      'Comprovantes', 
      defaultPermissions, 
      false, 
      true, 
      5242880, 
      ['jpg', 'jpeg', 'png', 'pdf']
    )
    console.log('✅ Bucket comprovantes criado')
  } catch (error) {
    console.log('⏭️ Bucket comprovantes já existe, garantindo permissões...')
    await storage.updateBucket(
       'comprovantes', 
       'Comprovantes', 
       defaultPermissions, 
       false, 
       true, 
       5242880, 
       ['jpg', 'jpeg', 'png', 'pdf']
    )
  }

  console.log('🚀 Setup completo!')
}

run()
