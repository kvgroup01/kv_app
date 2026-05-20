import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { accountId, token, palavraChave } = req.body;

  if (!accountId || !token) {
    return res.status(400).json({ erro: 'accountId e token são obrigatórios' });
  }

  try {
    const actId = accountId.startsWith('act_') 
      ? accountId 
      : `act_${accountId}`;

    let url = `https://graph.facebook.com/v19.0/${actId}/campaigns?` +
      `fields=id,name,status,objective&` +
      `limit=200&` +
      `access_token=${token}`;

    if (palavraChave) {
      const palavraLimpa = palavraChave.replace(/[\[\]]/g, '');
      const filtering = JSON.stringify([{
        field: 'campaign.name',
        operator: 'CONTAIN',
        value: palavraLimpa
      }]);
      url += `&filtering=${encodeURIComponent(filtering)}`;
    }

    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.error) {
      return res.status(400).json({ erro: data.error.message });
    }

    return res.status(200).json({ data: data.data || [] });

  } catch (error: any) {
    console.error('meta-testar-filtro erro:', error);
    return res.status(500).json({ erro: error.message });
  }
}
