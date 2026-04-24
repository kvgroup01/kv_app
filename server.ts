import express from 'express';
import fetch from 'node-fetch';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import * as sdk from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Configuração SDK Appwrite (Server-side)
const client = new sdk.Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.VITE_APPWRITE_API_KEY!);

const databases = new sdk.Databases(client);
const DB_ID = 'dashboard-kv';

app.use(express.json({ limit: '10mb' }));

/**
 * ETAPA 2 — ENDPOINT WEBHOOK
 * Recebe dados de métricas diárias e salva no Appwrite.
 */
app.post('/api/webhook', async (req, res) => {
  try {
    const payload = req.body;
    
    // Validação básica
    if (!payload.cliente_id || !payload.metrics || !Array.isArray(payload.metrics)) {
      return res.status(400).json({ error: 'Payload inválido. Requer cliente_id e array de metrics.' });
    }

    const { cliente_id, metrics } = payload;
    const results = [];

    // Processamento de métricas (Idempotência baseada em ID do anúncio + Data)
    for (const metric of metrics) {
      const documentId = `${cliente_id}_${metric.criativo_id}_${metric.data}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      try {
        // Tenta criar ou atualizar (Upsert manual via try/catch ou verificação prévia)
        // No Appwrite, podemos usar o ID customizado para garantir idempotência.
        await databases.createDocument(
          DB_ID,
          'daily_metrics',
          documentId,
          {
            cliente_id,
            criativo_id: metric.criativo_id,
            data: metric.data,
            investimento: Number(metric.investimento) || 0,
            impressoes: Number(metric.impressoes) || 0,
            alcance: Number(metric.alcance) || 0,
            cliques: Number(metric.cliques) || 0,
            conversas: Number(metric.conversas) || 0,
            leads_qualificados: Number(metric.leads_qualificados) || 0,
            leads_desqualificados: Number(metric.leads_desqualificados) || 0,
            vendas: Number(metric.vendas) || 0,
            fonte: 'webhook'
          }
        );
        results.push({ id: metric.criativo_id, status: 'created' });
      } catch (e: any) {
        if (e.code === 409) {
          // Documento já existe, fazemos o update
          await databases.updateDocument(
            DB_ID,
            'daily_metrics',
            documentId,
            {
              investimento: Number(metric.investimento) || 0,
              impressoes: Number(metric.impressoes) || 0,
              alcance: Number(metric.alcance) || 0,
              cliques: Number(metric.cliques) || 0,
              conversas: Number(metric.conversas) || 0,
              leads_qualificados: Number(metric.leads_qualificados) || 0,
              leads_desqualificados: Number(metric.leads_desqualificados) || 0,
              vendas: Number(metric.vendas) || 0,
              fonte: 'webhook'
            }
          );
          results.push({ id: metric.criativo_id, status: 'updated' });
        } else {
          console.error(`Erro ao processar métrica ${metric.criativo_id}:`, e.message);
          results.push({ id: metric.criativo_id, status: 'error', message: e.message });
        }
      }
    }

    res.json({ success: true, processed: results.length, details: results });
  } catch (error: any) {
    console.error('Erro no Webhook:', error);
    res.status(500).json({ error: 'Erro interno no servidor', message: error.message });
  }
});

app.post('/api/meta/validar-token', async (req, res) => {
  try {
    const { accountId, token } = req.body;
    if (!accountId || !token) {
      return res.status(400).json({ error: 'accountId e token são obrigatórios' });
    }
    const response = await fetch(`https://graph.facebook.com/v19.0/${accountId}?fields=name,account_status&access_token=${token}`);
    const data = (await response.json()) as any;
    if (data.error) {
      return res.status(400).json({ error: data.error.message || 'Erro ao validar token', details: data.error });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
});

app.post('/api/meta/testar-filtro', async (req, res) => {
  try {
    const { accountId, token, palavraChave } = req.body;
    if (!accountId || !token || !palavraChave) {
      return res.status(400).json({ error: 'accountId, token e palavraChave são obrigatórios' });
    }
    const response = await fetch(`https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=name,status,insights{spend}&limit=100&access_token=${token}`);
    const data = (await response.json()) as any;
    if (data.error) {
      return res.status(400).json({ error: data.error.message || 'Erro ao buscar campanhas', details: data.error });
    }
    const campanhas = (data.data || []).filter((c: any) => 
       c.name.toLowerCase().includes(palavraChave.toLowerCase())
    ).map((c: any) => ({
      nome: c.name,
      status: c.status,
      gasto: c.insights && c.insights.data && c.insights.data.length > 0 ? c.insights.data[0].spend : '0.00'
    }));
    res.json({ data: campanhas });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
});

/**
 * Healthcheck
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Integração com Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
