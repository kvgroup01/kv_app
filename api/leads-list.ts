import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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
    const PAGE_SIZE = 1000;
    const offset = parseInt(req.query.offset as string) || 0;
    const { data, count, error } = await supabase
      .from('lead_entries')
      .select('*', { count: 'exact' })
      .eq('lancamento_id', lancamentoId)
      .order('criado_em', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    return res.status(200).json({ documents: data, total: count });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: error.message });
  }
}
