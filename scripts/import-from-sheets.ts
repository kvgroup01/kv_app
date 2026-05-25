import * as sdk from 'node-appwrite';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Parse command line arguments
// Example: npx tsx import-from-sheets.ts --spreadsheet=1Bxi... --lancamento=abc123 --aba=LEADS
const args = process.argv.slice(2);
const params: Record<string, string> = {};

for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    if (key && value) {
      params[key] = value;
    }
  }
}

const SPREADSHEET_ID = params.spreadsheet;
const LANCAMENTO_ID = params.lancamento;
const ABA = params.aba;

if (!SPREADSHEET_ID || !LANCAMENTO_ID || !ABA) {
  console.error("Uso incorreto. Exemplo:");
  console.error("npx tsx import-from-sheets.ts --spreadsheet=ID_DA_PLANILHA --lancamento=ID_LANCAMENTO --aba=NOME_ABA");
  process.exit(1);
}

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.error("A variável de ambiente VITE_GOOGLE_API_KEY não está definida.");
  process.exit(1);
}

// Configuração do Appwrite
let endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
if (endpoint && !endpoint.endsWith('/v1')) {
  endpoint = endpoint.endsWith('/') ? `${endpoint}v1` : `${endpoint}/v1`;
}

const client = new sdk.Client()
  .setEndpoint(endpoint)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.VITE_APPWRITE_API_KEY!);

const databases = new sdk.Databases(client);
const DB_ID = 'dashboard-kv';

// Auxiliar para datas
function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  // Se já for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr;
  }
  // Se for DD/MM/YYYY
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return dateStr;
}

async function runImport() {
  console.log(`Iniciando importação da planilha ${SPREADSHEET_ID}, aba ${ABA}...`);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ABA}?key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.error) {
      console.error(`Erro da API do Google Sheets: ${data.error.message}`);
      process.exit(1);
    }
    
    const rows = data.values;
    if (!rows || rows.length === 0) {
      console.log('Nenhum dado encontrado na planilha.');
      process.exit(0);
    }
    
    // A primeira linha é o cabeçalho
    const headers = rows[0].map((h: string) => h.toLowerCase().trim());
    
    // Map headers array indexes
    const dataIdx = headers.findIndex((h: string) => h === 'data');
    const nomeIdx = headers.findIndex((h: string) => h === 'nome');
    const emailIdx = headers.findIndex((h: string) => h === 'email');
    const escolaridadeIdx = headers.findIndex((h: string) => h === 'escolaridade');
    const telefoneIdx = headers.findIndex((h: string) => h === 'telefone');
    const sourceIdx = headers.findIndex((h: string) => h === 'utm_source');
    const campaignIdx = headers.findIndex((h: string) => h === 'utm_campaign');
    const mediumIdx = headers.findIndex((h: string) => h === 'utm_medium');
    const termIdx = headers.findIndex((h: string) => h === 'utm_term');
    const contentIdx = headers.findIndex((h: string) => h === 'utm_content');

    let inserted = 0;
    const BATCH_SIZE = 50;
    const validRows = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Pula linhas vazias
      if (!row || row.length === 0 || (!row[nomeIdx] && !row[emailIdx] && !row[telefoneIdx])) {
        continue;
      }
      validRows.push({ rowIndex: i, row });
    }

    console.log(`Processando ${validRows.length} linhas validas em batches de ${BATCH_SIZE}...`);

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async ({ rowIndex, row }) => {
        const rawDate = dataIdx !== -1 ? row[dataIdx] : '';
        const formattedDate = parseDate(rawDate);
        
        const payload = {
          lancamento_id: LANCAMENTO_ID,
          data: formattedDate || undefined,
          nome: nomeIdx !== -1 ? row[nomeIdx] : undefined,
          email: emailIdx !== -1 ? row[emailIdx] : undefined,
          escolaridade: escolaridadeIdx !== -1 ? row[escolaridadeIdx] : undefined,
          telefone: telefoneIdx !== -1 ? row[telefoneIdx] : undefined,
          utm_source: sourceIdx !== -1 ? row[sourceIdx] : undefined,
          utm_campaign: campaignIdx !== -1 ? row[campaignIdx] : undefined,
          utm_medium: mediumIdx !== -1 ? row[mediumIdx] : undefined,
          utm_term: termIdx !== -1 ? row[termIdx] : undefined,
          utm_content: contentIdx !== -1 ? row[contentIdx] : undefined,
        };
        
        try {
          await databases.createDocument(
            DB_ID,
            'lead_entries',
            sdk.ID.unique(),
            payload
          );
          return true;
        } catch (err: any) {
          console.error(`Erro ao salvar linha ${rowIndex}:`, err.message);
          return false;
        }
      });

      const results = await Promise.all(batchPromises);
      inserted += results.filter(Boolean).length;
      console.log(`Lote ${(i / BATCH_SIZE) + 1} / ${Math.ceil(validRows.length / BATCH_SIZE)} concluído. Leads inseridos: ${inserted}/${validRows.length}`);
    }
    
    console.log(`✅ Importação concluída! ${inserted} leads importados.`);
    
  } catch (error: any) {
    console.error(`Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

runImport();
