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
    const allDocs: any[] = [];
    let cursor: string | null = null;
    const PAGE_SIZE = 1000;

    while (true) {
      const queries: any[] = [
        Query.equal('lancamento_id', lancamentoId as string),
        Query.limit(PAGE_SIZE),
        Query.orderDesc('$createdAt'),
      ];

      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      const docs = await db.listDocuments(DB, 'lead_entries', queries);
      allDocs.push(...docs.documents);

      if (docs.documents.length < PAGE_SIZE) break;
      cursor = docs.documents[docs.documents.length - 1].$id;
    }

    return res.status(200).json({ leads: allDocs });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: error.message });
  }
}
