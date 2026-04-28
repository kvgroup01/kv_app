import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT as string)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID as string)
  .setKey(process.env.VITE_APPWRITE_API_KEY as string);

const databases = new Databases(client);
const DB_ID = 'dashboard-kv';

async function createIndex(collectionId: string, key: string, attributes: string[]) {
  try {
    await databases.createIndex(DB_ID, collectionId, key, 'key', attributes);
    console.log(`✅ Índice ${key} criado na coleção ${collectionId}`);
  } catch (e: any) {
    if (e.code === 409) {
      console.log(`⏭️ Índice ${key} já existe na coleção ${collectionId}`);
    } else {
      console.error(`❌ Erro ao criar índice ${key} em ${collectionId}:`, e.message);
    }
  }
}

async function run() {
  console.log('Iniciando criação de índices...');

  // lead_entries
  await createIndex('lead_entries', 'lancamento_id', ['lancamento_id']);
  await createIndex('lead_entries', 'data', ['data']);
  await createIndex('lead_entries', 'escolaridade', ['escolaridade']);
  await createIndex('lead_entries', 'lancamento_data', ['lancamento_id', 'data']);

  // daily_metrics
  await createIndex('daily_metrics', 'cliente_id', ['cliente_id']);
  await createIndex('daily_metrics', 'data', ['data']);
  await createIndex('daily_metrics', 'criativo_id', ['criativo_id']);
  await createIndex('daily_metrics', 'criativo_data', ['criativo_id', 'data']);
  await createIndex('daily_metrics', 'cliente_data', ['cliente_id', 'data']);

  // campaigns
  await createIndex('campaigns', 'cliente_id', ['cliente_id']);

  // adsets
  await createIndex('adsets', 'campanha_id', ['campanha_id']);

  // ads
  await createIndex('ads', 'conjunto_id', ['conjunto_id']);
  await createIndex('ads', 'meta_ad_id', ['meta_ad_id']);

  // lancamentos
  await createIndex('lancamentos', 'cliente_id', ['cliente_id']);
  await createIndex('lancamentos', 'slug', ['slug']);

  // sync_jobs
  await createIndex('sync_jobs', 'lancamento_id', ['lancamento_id']);
  await createIndex('sync_jobs', 'status', ['status']);

  console.log('Finalizado.');
}

run();
