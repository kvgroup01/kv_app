import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT!)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.VITE_APPWRITE_API_KEY!);

const db = new Databases(client);
const DB = 'dashboard-kv';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { lancamentoId } = req.query;
  if (!lancamentoId) {
    return res.status(400).json({ error: 'lancamentoId obrigatório' });
  }

  try {
    const result = await db.listDocuments(DB, 'lead_entries', [
      Query.equal('lancamento_id', lancamentoId as string),
      Query.orderDesc('$createdAt'),
      Query.limit(1),
    ]);

    return res.status(200).json({
      total: result.total,
      latest: result.documents[0] || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
