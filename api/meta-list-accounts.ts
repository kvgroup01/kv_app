import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string;

  if (!token) {
    return res.status(400).json({ error: 'token obrigatório' });
  }

  try {
    // Buscar Business Managers do usuário
    const bmsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/businesses?` +
      `fields=id,name&` +
      `access_token=${token}&` +
      `limit=50`
    );
    const bmsData = await bmsRes.json();

    if (bmsData.error) {
      throw new Error(bmsData.error.message);
    }

    const businesses = bmsData.data || [];

    // Para cada BM, buscar contas de anúncio
    const bmsWithAccounts = await Promise.all(
      businesses.map(async (bm: { id: string; name: string }) => {
        try {
          const accountsRes = await fetch(
            `https://graph.facebook.com/v19.0/${bm.id}/owned_ad_accounts?` +
            `fields=id,name,account_id,currency,account_status&` +
            `access_token=${token}&` +
            `limit=50`
          );
          const accountsData = await accountsRes.json();
          return {
            id: bm.id,
            name: bm.name,
            adAccounts: accountsData.data || [],
          };
        } catch {
          return {
            id: bm.id,
            name: bm.name,
            adAccounts: [],
          };
        }
      })
    );


    return res.status(200).json({ bms: bmsWithAccounts });

  } catch (error: any) {
    console.error('meta-list-accounts erro:', error);
    return res.status(500).json({ error: error.message });
  }
}
