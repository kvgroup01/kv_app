import { Client, Databases } from "node-appwrite";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env") });

let endpoint = process.env.VITE_APPWRITE_ENDPOINT;
if (endpoint && !endpoint.endsWith('/v1')) {
  endpoint = endpoint.endsWith('/') ? `${endpoint}v1` : `${endpoint}/v1`;
}
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing Appwrite credentials in environment");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const db = new Databases(client);
const DB_ID = "dashboard-kv";
const SYNC_JOBS_COLLECTION = "sync_jobs";

async function createSyncJobsCollection() {
  try {
    console.log(`Checking if collection ${SYNC_JOBS_COLLECTION} exists...`);
    try {
      await db.getCollection(DB_ID, SYNC_JOBS_COLLECTION);
      console.log(`Collection ${SYNC_JOBS_COLLECTION} already exists.`);
      console.log(`Deleting it to assume clean state...`);
      await db.deleteCollection(DB_ID, SYNC_JOBS_COLLECTION);
    } catch (e: any) {
      if (e.code !== 404) throw e;
    }
    
    console.log(`Creating collection ${SYNC_JOBS_COLLECTION}...`);
    await db.createCollection(DB_ID, SYNC_JOBS_COLLECTION, "Sync Jobs");
    console.log(`Collection created.`);

    console.log(`Creating attributes...`);
    await db.createStringAttribute(DB_ID, SYNC_JOBS_COLLECTION, "lancamento_id", 255, true);
    await db.createStringAttribute(DB_ID, SYNC_JOBS_COLLECTION, "status", 50, true);
    await db.createIntegerAttribute(DB_ID, SYNC_JOBS_COLLECTION, "etapa_atual", true);
    await db.createIntegerAttribute(DB_ID, SYNC_JOBS_COLLECTION, "total_etapas", true);
    await db.createIntegerAttribute(DB_ID, SYNC_JOBS_COLLECTION, "progresso", true);
    await db.createStringAttribute(DB_ID, SYNC_JOBS_COLLECTION, "erro", 1000, false);
    await db.createDatetimeAttribute(DB_ID, SYNC_JOBS_COLLECTION, "criado_em", false);
    await db.createDatetimeAttribute(DB_ID, SYNC_JOBS_COLLECTION, "atualizado_em", false);

    console.log(`Attributes creation queued. Wait a few moments for them to process.`);
  } catch (error) {
    console.error("Error creating sync_jobs collection:", error);
    process.exit(1);
  }
}

createSyncJobsCollection();
