import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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
  if (action === 'list-tabs') {
    const { spreadsheetId } = req.query;
    if (!spreadsheetId) return res.status(400).json({ error: 'spreadsheetId obrigatório' });
    try {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Planilha não acessível. Verifique se está publicada na web.');
      const text = await r.text();
      if (!text.includes('google.visualization')) throw new Error('Planilha não acessível. Verifique se está publicada na web.');
      return res.status(200).json({ tabs: [], manual: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ─── ACTION: preview ────────────────────────────────────
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
                const d = new Date(data_raw);
                if (!isNaN(d.getTime())) {
                  data_formatada = d.toISOString().split('T')[0];
                } else {
                  const parts = data_raw.split('/');
                  if (parts.length === 3) {
                    data_formatada = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                  }
                }
              }

              if (email) {
                const { data: existing } = await supabase.from('lead_entries')
                  .select('id')
                  .eq('lancamento_id', lancamentoId)
                  .eq('email', email)
                  .eq('data', data_formatada)
                  .limit(1);
                  
                if (existing && existing.length > 0) { skipped++; return; }
              }

              const { error: insertErr } = await supabase.from('lead_entries').insert({
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
              }).select().single();
              
              if (insertErr) throw insertErr;
              
              imported++;

            } else if (tipo === 'pesquisa') {
              const email = getValue('email');

              if (email) {
                const { data: existing } = await supabase.from('survey_entries')
                  .select('id')
                  .eq('lancamento_id', lancamentoId)
                  .eq('email', email)
                  .limit(1);
                
                if (existing && existing.length > 0) { skipped++; return; }
              }

              let data_raw = getValue('data');
              let data_formatada = new Date().toISOString().split('T')[0];
              if (data_raw) {
                const d = new Date(data_raw);
                if (!isNaN(d.getTime())) data_formatada = d.toISOString().split('T')[0];
              }

              const { error: insertErr } = await supabase.from('survey_entries').insert({
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
              }).select().single();
              
              if (insertErr) throw insertErr;
              
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

  if (action === 'reclassify' && req.method === 'POST') {
    const { lancamentoId } = req.body;
    if (!lancamentoId) return res.status(400).json({ error: 'lancamentoId obrigatório' });

    try {
      const { data: lancamento, error: lancErr } = await supabase.from('lancamentos').select('*').eq('id', lancamentoId).single();
      if (lancErr || !lancamento.regras_qualificacao) {
        return res.status(400).json({ error: 'Lançamento sem regras de qualificação configuradas' });
      }
      const regras = typeof lancamento.regras_qualificacao === 'string' ? JSON.parse(lancamento.regras_qualificacao) : lancamento.regras_qualificacao;
      const criterio = regras.criterio || 'escolaridade';
      const escolaridadesOk = regras.escolaridades || [];
      const rendasOk = regras.rendas || [];

      const surveyMap = new Map<string, string>();
      const surveyPhoneMap = new Map<string, string>();
      let surveyOffset = 0;
      
      while (true) {
        const { data: surveys } = await supabase.from('survey_entries')
          .select('email, telefone, renda')
          .eq('lancamento_id', lancamentoId)
          .range(surveyOffset, surveyOffset + 499);
          
        if (!surveys || surveys.length === 0) break;
        
        for (const s of surveys) {
          const renda = s.renda || null;
          if (s.email) surveyMap.set(s.email.toLowerCase().trim(), renda);
          if (s.telefone) {
            const tel = s.telefone.replace(/\D/g, '').slice(-11);
            if (tel) surveyPhoneMap.set(tel, renda);
          }
        }
        
        if (surveys.length < 500) break;
        surveyOffset += 500;
      }

      let updated = 0, errors = 0, total = 0;
      let leadOffset = 0;

      while (true) {
        const { data: leads } = await supabase.from('lead_entries')
          .select('id, email, telefone, escolaridade, renda')
          .eq('lancamento_id', lancamentoId)
          .range(leadOffset, leadOffset + 499);
          
        if (!leads || leads.length === 0) break;

        total += leads.length;

        await Promise.all(leads.map(async (lead: any) => {
          try {
            let renda = lead.renda || null;
            if (!renda && lead.email) {
              renda = surveyMap.get(lead.email.toLowerCase().trim()) || null;
            }
            if (!renda && lead.telefone) {
              const tel = lead.telefone.replace(/\D/g, '').slice(-11);
              if (tel) renda = surveyPhoneMap.get(tel) || null;
            }

            const escQualificada = escolaridadesOk.length === 0 ||
              escolaridadesOk.includes(lead.escolaridade);
            const rendaQualificada = rendasOk.length === 0 ||
              rendasOk.includes(renda);

            let qualificado = false;
            if (criterio === 'escolaridade') qualificado = escQualificada;
            else if (criterio === 'renda') qualificado = rendaQualificada;
            else if (criterio === 'ambos_e') qualificado = escQualificada && rendaQualificada;
            else if (criterio === 'ambos_ou') qualificado = escQualificada || rendaQualificada;

            const { error: updErr } = await supabase.from('lead_entries').update({
              leads_qualificados: qualificado ? 1 : 0,
              leads_desqualificados: qualificado ? 0 : 1,
              renda: renda || lead.renda || null,
            }).eq('id', lead.id);
            
            if (updErr) throw updErr;
            
            updated++;
          } catch (e) {
            errors++;
          }
        }));

        if (leads.length < 500) break;
        leadOffset += 500;
      }

      return res.status(200).json({ updated, errors, total });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Action inválida' });
}
