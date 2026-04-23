import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import * as sdk from 'node-appwrite';
import * as dotenv from 'dotenv';
import { syncCustomerMetaAds } from './src/services/metaAdsAPI.ts'; // Adicionado importe do serviço

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
 * ETAPA 3 — ENDPOINT META ADS SYNC
 * Rota para disparar a sincronização direta com a Meta Graph API
 */
app.post('/api/meta-ads/sync', async (req, res) => {
  try {
    const { cliente_id, access_token, ad_account_id, date_start, date_end } = req.body;

    if (!cliente_id || !access_token || !ad_account_id || !date_start || !date_end) {
      return res.status(400).json({ 
        error: 'Parâmetros ausentes.', 
        required: ['cliente_id', 'access_token', 'ad_account_id', 'date_start', 'date_end'] 
      });
    }

    const result = await syncCustomerMetaAds(databases, {
      cliente_id,
      accessToken: access_token,
      adAccountId: ad_account_id,
      dateStart: date_start,
      dateEnd: date_end
    });

    res.json({ success: true, message: 'Sincronização concluída com sucesso.', dados: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao sincronizar Meta Ads', detail: error.message });
  }
});

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
