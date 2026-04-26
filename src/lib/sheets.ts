import type { Campanha, Conjunto, Criativo, MetricaDiaria, LeadGrupo } from './types';

const getApiKey = () => import.meta.env.VITE_GOOGLE_API_KEY;

export async function fetchSheet(spreadsheetId: string, range: string): Promise<string[][]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('VITE_GOOGLE_API_KEY não está configurada no .env');
    return [];
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados do Google Sheets: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.values || [];
}

export async function fetchCampanhas(spreadsheetId: string): Promise<Campanha[]> {
  const values = await fetchSheet(spreadsheetId, "CAMPANHAS!A2:D");
  return values.map(row => ({
    $id: row[0] || '',
    nome: row[1] || '',
    tipo: (row[2] || '') as Campanha['tipo'],
    status: row[3] || '',
  }));
}

export async function fetchConjuntos(spreadsheetId: string): Promise<Conjunto[]> {
  const values = await fetchSheet(spreadsheetId, "CONJUNTOS!A2:E");
  return values.map(row => ({
    $id: row[0] || '',
    campanha_id: row[1] || '',
    nome: row[2] || '',
    publico_descricao: row[3] || '',
    escolaridade: row[4] || '',
  }));
}

export async function fetchCriativos(spreadsheetId: string): Promise<Criativo[]> {
  const values = await fetchSheet(spreadsheetId, "CRIATIVOS!A2:E");
  return values.map(row => ({
    $id: row[0] || '',
    conjunto_id: row[1] || '',
    nome: row[2] || '',
    thumbnail_url: row[3] || '',
    link_anuncio: row[4] || '',
  }));
}

export async function fetchMetricasDiarias(spreadsheetId: string, from: Date, to: Date): Promise<MetricaDiaria[]> {
  const values = await fetchSheet(spreadsheetId, "METRICAS_DIARIAS!A2:J");
  
  const fromTime = from.getTime();
  const toTime = to.getTime();

  return values
    .filter(row => {
      if (!row[0]) return false;
      const [year, month, day] = row[0].split('-');
      const rowDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
      return rowDate >= fromTime && rowDate <= toTime;
    })
    .map(row => ({
      data: row[0],
      criativo_id: row[1] || '',
      investimento: parseFloat(row[2]) || 0,
      impressoes: parseInt(row[3]) || 0,
      alcance: parseInt(row[4]) || 0,
      cliques: parseInt(row[5]) || 0,
      conversas: parseInt(row[6]) || 0,
      leads_qualificados: parseInt(row[7]) || 0,
      leads_desqualificados: parseInt(row[8]) || 0,
      vendas: parseInt(row[9]) || 0,
    }));
}

export async function fetchLeadsGrupos(spreadsheetId: string, from: Date, to: Date): Promise<LeadGrupo[]> {
  const values = await fetchSheet(spreadsheetId, "LEADS_GRUPOS!A2:C");
  
  const fromTime = from.getTime();
  const toTime = to.getTime();
  
  return values
     .filter(row => {
      if (!row[0]) return false;
      const [year, month, day] = row[0].split('-');
      const rowDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
      return rowDate >= fromTime && rowDate <= toTime;
    })
    .map(row => ({
      data: row[0],
      leads_ensino_superior: parseInt(row[1]) || 0,
      leads_ensino_medio: parseInt(row[2]) || 0,
    }));
}
