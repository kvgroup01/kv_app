import * as sdk from 'node-appwrite'
import * as dotenv from 'dotenv'

dotenv.config()

const client = new sdk.Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID as string)
  .setKey(process.env.VITE_APPWRITE_API_KEY as string)

const databases = new sdk.Databases(client)
const DB_ID = 'dashboard-kv'

async function createLeadEntriesCollection() {
  const defaultPermissions = [
    sdk.Permission.read(sdk.Role.any()),
    sdk.Permission.write(sdk.Role.any()),
    sdk.Permission.update(sdk.Role.any()),
    sdk.Permission.delete(sdk.Role.any()),
  ]

  try {
    console.log('Criando coleção lead_entries...')
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
    console.log('✅ Coleção lead_entries criada com sucesso!')
  } catch (error: any) {
    if (error.code === 409) {
      console.log('⏭️ A coleção lead_entries já existe.')
    } else {
      console.error('❌ Erro ao criar coleção lead_entries:', error.message)
    }
  }
}

createLeadEntriesCollection()
