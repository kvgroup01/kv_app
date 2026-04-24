import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { accountId, token, palavraChave } = req.body
  
  if (!accountId || !token || !palavraChave) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  }
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=name,status,insights{spend}&limit=100&access_token=${token}`
    )
    const data = await response.json() as any
    
    if (data.error) {
      return res.status(400).json({ erro: data.error.message })
    }
    
    const campanhas = (data.data || [])
      .filter((c: any) => c.name.toLowerCase().includes(palavraChave.toLowerCase()))
      .map((c: any) => ({
        nome: c.name,
        status: c.status,
        gasto: c.insights?.data?.[0]?.spend || '0.00'
      }))
    
    return res.json({ data: campanhas })
  } catch (error: any) {
    return res.status(500).json({ erro: error.message })
  }
}
