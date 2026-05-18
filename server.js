const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

function getDb() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/sync', async (req, res) => {
  const { jobId, syncToken } = req.body;
  if (!jobId) return res.status(400).json({ error: 'jobId obrigatório' });

  const expectedToken = Buffer.from(
    `${jobId}:${process.env.SUPABASE_SERVICE_KEY}`
  ).toString('base64').slice(0, 32);

  if (!syncToken || syncToken !== expectedToken) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  res.json({ ok: true, jobId, message: 'Sync iniciado' });

  try {
    const db = getDb();

    const { data: job, error: jobErr } = await db
      .from('sync_jobs').select('*').eq('id', jobId).single();
    if (jobErr || !job) throw new Error('Job não encontrado');

    if (job.status === 'done' || job.status === 'error') return;

    await db.from('sync_jobs').update({
      status: 'running',
      atualizado_em: new Date().toISOString(),
    }).eq('id', jobId);

    const { data: lancamento, error: lancErr } = await db
      .from('lancamentos').select('*').eq('id', job.lancamento_id).single();
    if (lancErr || !lancamento) throw new Error('Lançamento não encontrado');

    const { meta_account_id, meta_access_token, palavra_chave_meta, 
            cliente_id, data_inicio_sync, meta_event_type } = lancamento;

    if (!meta_account_id || !meta_access_token) {
      throw new Error('Lançamento não possui conta Meta configurada.');
    }

    const accountId = meta_account_id.startsWith('act_') 
      ? meta_account_id : `act_${meta_account_id}`;

    const fetchMeta = async (path, params = {}) => {
      const url = new URL(`${GRAPH_API_BASE}/${path}`);
      url.searchParams.append('access_token', meta_access_token);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, typeof value === 'object' 
          ? JSON.stringify(value) : value);
      }
      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.error) throw new Error(`Meta API Error: ${data.error.message}`);
      return data;
    };

    // ═══ ETAPA 0: Estrutura ═══
    console.log(`[${jobId}] Etapa 0: Buscando estrutura...`);

    const upsertCampaign = async (c) => {
      const { data: existing } = await db.from('campaigns')
        .select('id').eq('cliente_id', cliente_id).eq('nome', c.name).limit(1);
      const row = { 
        cliente_id, nome: c.name, 
        status: c.status,
        objective: c.objective,
        lancamento_id: lancamento.id,
      };
      if (existing && existing.length > 0) {
        await db.from('campaigns').update(row).eq('id', existing[0].id);
        return existing[0].id;
      }
      const { data: result } = await db.from('campaigns').insert(row).select().single();
      return result.id;
    };

    const upsertAdset = async (campaign_id, a) => {
      const { data: existing } = await db.from('adsets')
        .select('id').eq('campaign_id', campaign_id).eq('nome', a.name).limit(1);
      const row = { campaign_id, nome: a.name, lancamento_id: lancamento.id };
      if (existing && existing.length > 0) {
        await db.from('adsets').update(row).eq('id', existing[0].id);
        return existing[0].id;
      }
      const { data: result } = await db.from('adsets').insert(row).select().single();
      return result.id;
    };

    const upsertAd = async (adset_id, a) => {
      const { data: existing } = await db.from('ads')
        .select('id').eq('meta_ad_id', a.id).limit(1);
      const videoId = a.creative?.video_id || 
        a.creative?.object_story_spec?.video_data?.video_id || null;
      const row = {
        adset_id,
        nome: a.name,
        meta_ad_id: a.id,
        thumbnail_url: a.creative?.image_url || a.creative?.thumbnail_url || '',
        link_anuncio: videoId 
          ? `https://www.facebook.com/ads/archive/render_ad/?id=${a.id}&access_token=${meta_access_token}` 
          : null,
        lancamento_id: lancamento.id,
      };
      if (existing && existing.length > 0) {
        await db.from('ads').update(row).eq('id', existing[0].id);
        return existing[0].id;
      }
      const { data: result } = await db.from('ads').insert(row).select().single();
      return result.id;
    };

    const adsParams = {
      fields: ['id','name','creative{thumbnail_url,image_url,video_id}',
               'adset{id,name}','campaign{id,name,status,objective}'].join(','),
      limit: 200,
    };
    if (palavra_chave_meta) {
      const palavraLimpa = palavra_chave_meta.replace(/[\[\]]/g, '');
      adsParams.filtering = JSON.stringify([{ 
        field: 'campaign.name', operator: 'CONTAIN', value: palavraLimpa 
      }]);
    }

    let adsUrl = `${GRAPH_API_BASE}/${accountId}/ads?access_token=${meta_access_token}`;
    for (const [key, value] of Object.entries(adsParams)) {
      adsUrl += `&${key}=${encodeURIComponent(
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      )}`;
    }

    const campCache = new Map();
    const adsetCache = new Map();

    while (adsUrl) {
      const res = await fetch(adsUrl);
      const data = await res.json();
      if (data.error) throw new Error(`Meta API Error: ${data.error.message}`);

      for (const ad of data.data || []) {
        if (!ad.campaign || !ad.adset) continue;
        let campId = campCache.get(ad.campaign.id);
        if (!campId) { 
          campId = await upsertCampaign(ad.campaign); 
          campCache.set(ad.campaign.id, campId); 
        }
        let adsetId = adsetCache.get(ad.adset.id);
        if (!adsetId) { 
          adsetId = await upsertAdset(campId, ad.adset); 
          adsetCache.set(ad.adset.id, adsetId); 
        }
        await upsertAd(adsetId, ad);
      }
      adsUrl = data.paging?.next || null;
    }

    await db.from('sync_jobs').update({ 
      etapa_atual: 1, progresso: 50, status: 'running', 
      atualizado_em: new Date().toISOString() 
    }).eq('id', jobId);
    console.log(`[${jobId}] Etapa 0 concluída. Iniciando etapa 1...`);

    // ═══ ETAPA 1: Insights ═══
    let dateSinceStr = data_inicio_sync;
    if (!dateSinceStr) {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      dateSinceStr = d.toISOString().split('T')[0];
    }
    const dateUntilStr = new Date().toISOString().split('T')[0];

    const { data: allAds } = await db.from('ads').select('id, meta_ad_id').limit(2000);
    const fbAdToSupabaseAd = new Map();
    for (const ad of allAds || []) {
      if (ad.meta_ad_id) fbAdToSupabaseAd.set(ad.meta_ad_id, ad.id);
    }

    const insightsParams = {
      level: 'ad',
      fields: ['spend','impressions','reach','clicks','actions',
               'ad_id','date_start'].join(','),
      time_increment: 1,
      time_range: JSON.stringify({ since: dateSinceStr, until: dateUntilStr }),
      limit: 200,
    };
    if (palavra_chave_meta) {
      const palavraLimpa = palavra_chave_meta.replace(/[\[\]]/g, '');
      insightsParams.filtering = JSON.stringify([{ 
        field: 'campaign.name', operator: 'CONTAIN', value: palavraLimpa 
      }]);
    }

    let insightsUrl = `${GRAPH_API_BASE}/${accountId}/insights?access_token=${meta_access_token}`;
    for (const [key, value] of Object.entries(insightsParams)) {
      insightsUrl += `&${key}=${encodeURIComponent(
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      )}`;
    }

    while (insightsUrl) {
      const res = await fetch(insightsUrl);
      const data = await res.json();
      if (data.error) throw new Error(`Meta API Error: ${data.error.message}`);

      const batch = data.data || [];
      await Promise.all(batch.map(async (i) => {
        let criativo_id = fbAdToSupabaseAd.get(i.ad_id);
        if (!criativo_id) {
          const { data: existingAd } = await db.from('ads')
            .select('id').eq('meta_ad_id', i.ad_id).limit(1);
          if (existingAd && existingAd.length > 0) {
            criativo_id = existingAd[0].id;
            fbAdToSupabaseAd.set(i.ad_id, criativo_id);
          }
        }
        if (!criativo_id) return;

        const { data: existing } = await db.from('daily_metrics')
          .select('id')
          .eq('criativo_id', criativo_id)
          .eq('data', i.date_start)
          .eq('lancamento_id', lancamento.id)
          .limit(1);

        const actions = i.actions || [];
        const conversas = Number(actions.find(
          a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
        )?.value || 0);

        let totalLeadsMeta = 0;
        if (meta_event_type) {
          totalLeadsMeta = Number(actions.find(
            a => a.action_type === meta_event_type
          )?.value || 0);
        }
        if (!totalLeadsMeta) {
          const leads_pixel = Number(actions.find(
            a => a.action_type === 'offsite_conversion.fb_pixel_complete_registration'
          )?.value || 0);
          const leads_nativo = Number(actions.find(
            a => a.action_type === 'lead'
          )?.value || 0);
          const leads_grouped = Number(actions.find(
            a => a.action_type === 'onsite_conversion.lead_grouped'
          )?.value || 0);
          const leads_omni = Number(actions.find(
            a => a.action_type === 'omni_complete_registration'
          )?.value || 0);
          totalLeadsMeta = leads_pixel || leads_nativo || leads_grouped || leads_omni || 0;
        }

        const metricRow = {
          criativo_id,
          data: i.date_start,
          investimento: Number(i.spend) || 0,
          impressoes: Number(i.impressions) || 0,
          alcance: Number(i.reach) || 0,
          cliques: Number(i.clicks) || 0,
          conversas,
          leads_qualificados: 0,
          leads_desqualificados: 0,
          vendas: 0,
          cliente_id,
          lancamento_id: lancamento.id,
        };

        if (existing && existing.length > 0) {
          await db.from('daily_metrics').update(metricRow).eq('id', existing[0].id);
        } else {
          await db.from('daily_metrics').insert(metricRow);
        }
      }));

      insightsUrl = data.paging?.next || null;
    }

    await db.from('sync_jobs').update({
      etapa_atual: 2, progresso: 100, status: 'done', 
      atualizado_em: new Date().toISOString(),
    }).eq('id', jobId);
    console.log(`[${jobId}] Sync concluído com sucesso!`);

  } catch (error) {
    console.error(`[${jobId}] Erro:`, error.message);
    try {
      await getDb().from('sync_jobs').update({
        status: 'error', erro: error.message, 
        atualizado_em: new Date().toISOString(),
      }).eq('id', jobId);
    } catch (e) {}
  }
});

app.get('/status/:jobId', async (req, res) => {
  try {
    const db = getDb();
    const { data: job, error } = await db
      .from('sync_jobs').select('*').eq('id', req.params.jobId).single();
    if (error || !job) return res.status(404).json({ error: 'Job não encontrado' });
    res.json({ 
      done: job.status === 'done', 
      progresso: job.progresso, 
      status: job.status, 
      erro: job.erro 
    });
  } catch (e) {
    res.status(404).json({ error: 'Job não encontrado' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Sync service rodando na porta ${PORT}`));
