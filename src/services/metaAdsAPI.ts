import * as sdk from 'node-appwrite';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';
const DB_ID = 'dashboard-kv';

export interface MetaSyncConfig {
  cliente_id: string;
  accessToken: string;
  adAccountId: string; // Formato esperado: 'act_123456789'
  dateStart: string; // Formato: 'YYYY-MM-DD'
  dateEnd: string;   // Formato: 'YYYY-MM-DD'
}

/**
 * Função principal que sincroniza campanhas, conjuntos, anúncios e métricas
 * do Meta Ads diretamente para o banco de dados do Appwrite.
 */
export async function syncCustomerMetaAds(databases: sdk.Databases, config: MetaSyncConfig) {
  const { cliente_id, accessToken, adAccountId, dateStart, dateEnd } = config;
  
  // Helpers para requisição na Graph API
  const fetchMeta = async (path: string, params: Record<string, any> = {}) => {
    const url = new URL(`${GRAPH_API_BASE}/${path}`);
    url.searchParams.append('access_token', accessToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
    
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.error) throw new Error(`Meta API Error: ${data.error.message}`);
    return data;
  };

  try {
    // 1. Buscar Campanhas
    const campaignsData = await fetchMeta(`${adAccountId}/campaigns`, {
      fields: ['id', 'name', 'status', 'objective'].join(','),
      limit: 100
    });

    for (const camp of campaignsData.data) {
      await databases.createDocument(DB_ID, 'campaigns', camp.id, {
        id: camp.id,
        cliente_id,
        nome: camp.name,
        tipo: camp.objective === 'OUTCOME_LEADS' ? 'leads' : 'whatsapp', // Mapeamento simplificado
        status: camp.status,
        fonte_dados: 'meta_api'
      }).catch(e => {
        if (e.code === 409) {
          // Se já existe, atualiza
          return databases.updateDocument(DB_ID, 'campaigns', camp.id, {
            nome: camp.name,
            status: camp.status,
            fonte_dados: 'meta_api'
          });
        }
      });
    }

    // 2. Buscar Conjuntos de Anúncios (Ad Sets)
    const adSetsData = await fetchMeta(`${adAccountId}/adsets`, {
      fields: ['id', 'campaign_id', 'name', 'status'].join(','),
      limit: 100
    });

    for (const adset of adSetsData.data) {
      await databases.createDocument(DB_ID, 'adsets', adset.id, {
        id: adset.id,
        campanha_id: adset.campaign_id,
        nome: adset.name
      }).catch(async e => {
        if (e.code === 409) await databases.updateDocument(DB_ID, 'adsets', adset.id, { nome: adset.name });
      });
    }

    // 3. Buscar Anúncios e Criativos
    const adsData = await fetchMeta(`${adAccountId}/ads`, {
      fields: ['id', 'adset_id', 'name', 'creative{thumbnail_url,body}', 'status'].join(','),
      limit: 100
    });

    for (const ad of adsData.data) {
      await databases.createDocument(DB_ID, 'ads', ad.id, {
        id: ad.id,
        conjunto_id: ad.adset_id,
        nome: ad.name,
        thumbnail_url: ad.creative?.thumbnail_url || ''
      }).catch(async e => {
        if (e.code === 409) await databases.updateDocument(DB_ID, 'ads', ad.id, { 
          nome: ad.name,
          thumbnail_url: ad.creative?.thumbnail_url || ''
        });
      });
    }

    // 4. Buscar Métricas (Insights) Nível Anúncio
    const insightsData = await fetchMeta(`${adAccountId}/insights`, {
      level: 'ad',
      fields: ['ad_id', 'spend', 'impressions', 'reach', 'clicks', 'actions'].join(','),
      time_range: { since: dateStart, until: dateEnd },
      time_increment: 1, // Dados divididos por dia
      limit: 500
    });

    let processados = 0;

    for (const row of insightsData.data) {
      // Extraindo ações específicas
      const actions = row.actions || [];
      const conversasArr = actions.find((a: any) => 
        a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || 
        a.action_type === 'post_engagement'
      );
      const leadsArr = actions.find((a: any) => a.action_type === 'lead');

      const conversas = conversasArr ? Number(conversasArr.value) : 0;
      const leadsApi = leadsArr ? Number(leadsArr.value) : 0;

      const docId = `${cliente_id}_${row.ad_id}_${row.date_start}`.replace(/[^a-zA-Z0-9_-]/g, '_');

      const metricsPayload = {
        cliente_id,
        criativo_id: row.ad_id,
        data: row.date_start,
        investimento: Number(row.spend) || 0,
        impressoes: Number(row.impressions) || 0,
        alcance: Number(row.reach) || 0,
        cliques: Number(row.clicks) || 0,
        conversas: conversas,
        leads_qualificados: leadsApi, // Meta não divide sozinho, assumimos total como qualificado temporariamente
        leads_desqualificados: 0,
        vendas: 0,
        fonte: 'meta_api'
      };

      try {
        await databases.createDocument(DB_ID, 'daily_metrics', docId, metricsPayload);
      } catch (e: any) {
        if (e.code === 409) {
          await databases.updateDocument(DB_ID, 'daily_metrics', docId, metricsPayload);
        }
      }
      processados++;
    }

    return { success: true, processed_insights: processados };

  } catch (error: any) {
    console.error('Erro na sincronização do Meta Ads:', error);
    throw error;
  }
}
