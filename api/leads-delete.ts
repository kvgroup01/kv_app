import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Lista de IDs obrigatória' });
    }

    const { error } = await supabase
      .from('lead_entries')
      .delete()
      .in('id', ids);
    if (error) throw error;

    return res.status(200).json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error('Error deleting leads:', error);
    return res.status(500).json({ error: error.message });
  }
}
