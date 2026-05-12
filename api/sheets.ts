import { Client, Databases, Query, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT!)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.VITE_APPWRITE_API_KEY!);

const db = new Databases(client);
const DB = 'dashboard-kv';

async function fetchSheetData(spreadsheetId: string, sheet: string) {
  const encodedSheet = encodeURIComponent(sheet);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodedSheet}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
  return JSON.parse(json);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { action } = req.query;

  // ─── ACTION: list-tabs ───────────────────────────────────
  // GET /api/sheets?action=list-tabs&spreadsheetId=ID
  // Retorna { tabs: string[] }
  if (action === 'list-tabs') {
    const { spreadsheetId } = req.query;
    if (!spreadsheetId) return res.status(400).json({ error: 'spreadsheetId obrigatório' });
    try {
      // Buscar todas as abas via feed JSON público
      const url = `https://spreadsheets.google.com/feeds/worksheets/${spreadsheetId}/public/basic?alt=json`;
      const r = await fetch(url);
      if (!r.ok) {
         throw new Error(`Erro ao acessar planilha. Status code: ${r.status}`);
      }
      const data = await r.json();
      const tabs = data.feed?.entry?.map((e: any) => e.title.$t) || [];
      return res.status(200).json({ tabs });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ─── ACTION: preview ────────────────────────────────────
  // GET /api/sheets?action=preview&spreadsheetId=ID&sheet=NomeDaAba
  // Retorna { columns: string[], rows: string[][], total: number }
  if (action === 'preview') {
    const { spreadsheetId, sheet } = req.query;
    if (!spreadsheetId || !sheet) return res.status(400).json({ error: 'Parâmetros obrigatórios' });
    try {
      const data = await fetchSheetData(spreadsheetId as string, sheet as string);
      const columns = data.table.cols.map((c: any) => c.label || c.id);
      const rows = (data.table.rows || []).slice(0, 5).map((row: any) =>
        row.c.map((cell: any) => cell?.v?.toString() || '')
      );
      return res.status(200).json({ columns, rows, total: data.table.rows?.length || 0 });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ─── ACTION: import ──────────────────────────────────────
  // POST /api/sheets?action=import
  // Body: { lancamentoId, tipo: 'leads' | 'pesquisa', spreadsheetId, sheet, mapeamento: Record<string, string> }
  // Retorna { imported: number, skipped: number, errors: number }
  if (action === 'import' && req.method === 'POST') {
    const { lancamentoId, tipo, spreadsheetId, sheet, mapeamento } = req.body;
    if (!lancamentoId || !tipo || !spreadsheetId || !sheet || !mapeamento) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios' });
    }
    try {
      const data = await fetchSheetData(spreadsheetId, sheet);
      const columns = data.table.cols.map((c: any) => c.label || c.id);
      const allRows = (data.table.rows || []).map((row: any) =>
        row.c.map((cell: any) => cell?.v?.toString() || '')
      );

      let imported = 0, skipped = 0, errors = 0;
      const BATCH = 50;

      for (let i = 0; i < allRows.length; i += BATCH) {
        const batch = allRows.slice(i, i + BATCH);
        await Promise.all(batch.map(async (row: string[]) => {
          try {
            // Mapear colunas para campos usando o mapeamento fornecido
            const getValue = (campo: string) => {
              const colName = mapeamento[campo];
              if (!colName || colName === 'nao_mapear') return null;
              const idx = columns.indexOf(colName);
              return idx >= 0 ? row[idx] || null : null;
            };

            if (tipo === 'leads') {
              const email = getValue('email');
              let data_raw = getValue('data');
              let data_formatada = new Date().toISOString().split('T')[0];
              if (data_raw) {
                // Tentar parsear data em vários formatos
                const d = new Date(data_raw);
                if (!isNaN(d.getTime())) {
                  data_formatada = d.toISOString().split('T')[0];
                } else {
                  // Formato dd/mm/yyyy
                  const parts = data_raw.split('/');
                  if (parts.length === 3) {
                    data_formatada = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                  }
                }
              }

              // Verificar duplicata
              if (email) {
                const existing = await db.listDocuments(DB, 'lead_entries', [
                  Query.equal('lancamento_id', lancamentoId),
                  Query.equal('email', email),
                  Query.equal('data', data_formatada),
                  Query.limit(1),
                ]);
                if (existing.documents.length > 0) { skipped++; return; }
              }

              await db.createDocument(DB, 'lead_entries', ID.unique(), {
                lancamento_id: lancamentoId,
                nome: getValue('nome'),
                email,
                telefone: getValue('telefone'),
                escolaridade: getValue('escolaridade'),
                renda: getValue('renda'),
                utm_source: getValue('utm_source'),
                utm_campaign: getValue('utm_campaign'),
                utm_medium: getValue('utm_medium'),
                utm_content: getValue('utm_content'),
                utm_term: getValue('utm_term'),
                data: data_formatada,
                leads_qualificados: 0,
                leads_desqualificados: 0,
              });
              imported++;

            } else if (tipo === 'pesquisa') {
              const email = getValue('email');

              // Verificar duplicata por email
              if (email) {
                const existing = await db.listDocuments(DB, 'survey_entries', [
                  Query.equal('lancamento_id', lancamentoId),
                  Query.equal('email', email),
                  Query.limit(1),
                ]);
                if (existing.documents.length > 0) { skipped++; return; }
              }

              let data_raw = getValue('data');
              let data_formatada = new Date().toISOString().split('T')[0];
              if (data_raw) {
                const d = new Date(data_raw);
                if (!isNaN(d.getTime())) data_formatada = d.toISOString().split('T')[0];
              }

              await db.createDocument(DB, 'survey_entries', ID.unique(), {
                lancamento_id: lancamentoId,
                typeform_response_id: crypto.randomUUID(),
                nome: getValue('nome'),
                telefone: getValue('telefone'),
                email,
                escolaridade: getValue('escolaridade'),
                renda: getValue('renda'),
                idade: getValue('idade'),
                genero: getValue('genero'),
                estado: getValue('estado'),
                profissao: getValue('profissao'),
                data: data_formatada,
              });
              imported++;
            }
          } catch (e) {
            errors++;
          }
        }));
      }

      return res.status(200).json({ imported, skipped, errors });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Action inválida' });
}
