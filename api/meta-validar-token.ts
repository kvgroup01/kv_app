import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { accountId, token } = req.body
  
  if (!accountId || !token) {
    return res.status(400).json({ error: 'accountId e token são obrigatórios' })
  }
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}?fields=name,account_status&access_token=${token}`
    )
    const data = await response.json() as any
    
    if (data.error) {
      return res.status(400).json({ 
        valido: false, 
        erro: data.error.message 
      })
    }
    
    return res.json({ 
      valido: true, 
      account_id: data.id,
      nome_conta: data.name 
    })
  } catch (error: any) {
    return res.status(500).json({ 
      valido: false, 
      erro: error.message 
    })
  }
}
