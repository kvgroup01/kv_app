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

    // Também buscar contas de anúncio diretas do usuário
    // (contas que não estão em nenhuma BM)
    const directAccountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?` +
      `fields=id,name,account_id,currency,account_status&` +
      `access_token=${token}&` +
      `limit=50`
    );
    const directAccountsData = await directAccountsRes.json();
    const directAccounts = directAccountsData.data || [];

    // Filtrar contas diretas que já não aparecem em alguma BM
    const accountsInBMs = new Set(
      bmsWithAccounts.flatMap(bm => bm.adAccounts.map((a: any) => a.id))
    );
    const uniqueDirectAccounts = directAccounts.filter(
      (acc: any) => !accountsInBMs.has(acc.id)
    );

    // Se tiver contas diretas, adiciona como grupo "Contas Pessoais"
    if (uniqueDirectAccounts.length > 0) {
      bmsWithAccounts.push({
        id: 'personal',
        name: 'Contas Pessoais',
        adAccounts: uniqueDirectAccounts,
      });
    }

    return res.status(200).json({ bms: bmsWithAccounts });

  } catch (error: any) {
    console.error('meta-list-accounts erro:', error);
    return res.status(500).json({ error: error.message });
  }
}
