import { Client, Databases, Query, ID } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT!)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.VITE_APPWRITE_API_KEY!);

const db = new Databases(client);
const DB = "dashboard-kv";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let jobId = req.body?.jobId;
    if (typeof req.body === "string") {
      try {
        jobId = JSON.parse(req.body).jobId;
      } catch (e) {}
    }

    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    const job = await db.getDocument(DB, "sync_jobs", jobId);

    if (job.status === "done" || job.status === "error") {
      return res
        .status(200)
        .json({ done: job.status === "done", progresso: job.progresso, jobId });
    }

    await db.updateDocument(DB, "sync_jobs", jobId, {
      status: "running",
      atualizado_em: new Date().toISOString(),
    });

    const lancamento = await db.getDocument(
      DB,
      "lancamentos",
      job.lancamento_id,
    );
    const {
      meta_account_id,
      meta_access_token,
      palavra_chave_meta,
      cliente_id,
      data_inicio_sync,
    } = lancamento;

    if (!meta_account_id || !meta_access_token) {
      throw new Error("Lançamento não possui conta Meta configurada.");
    }

    const accountId = meta_account_id.startsWith("act_")
      ? meta_account_id
      : `act_${meta_account_id}`;
    const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

    const fetchMeta = async (
      path: string,
      params: Record<string, any> = {},
    ) => {
      const url = new URL(`${GRAPH_API_BASE}/${path}`);
      url.searchParams.append("access_token", meta_access_token);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : value,
        );
      }
      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.error) throw new Error(`Meta API Error: ${data.error.message}`);
      return data;
    };

    const etapa = job.etapa_atual;
    const total_etapas = job.total_etapas || 2;

    const fbAdToAppwriteAd = new Map<string, string>();

    const upsertCampaign = async (c: any) => {
      const existing = await db.listDocuments(DB, "campaigns", [
        Query.equal("cliente_id", cliente_id),
        Query.equal("nome", c.name),
        Query.limit(1),
      ]);
      const data = {
        cliente_id,
        nome: c.name,
        tipo: c.objective === "OUTCOME_LEADS" ? "leads" : "whatsapp",
        status: c.status,
        fonte_dados: "meta",
      };
      if (existing.documents.length > 0) {
        await db.updateDocument(
          DB,
          "campaigns",
          existing.documents[0].$id,
          data,
        );
        return existing.documents[0].$id;
      } else {
        const result = await db.createDocument(
          DB,
          "campaigns",
          ID.unique(),
          data,
        );
        return result.$id;
      }
    };

    const upsertAdset = async (campanha_id: string, a: any) => {
      const existing = await db.listDocuments(DB, "adsets", [
        Query.equal("campanha_id", campanha_id),
        Query.equal("nome", a.name),
        Query.limit(1),
      ]);
      const data = {
        campanha_id,
        nome: a.name,
        publico_descricao: JSON.stringify(a.targeting || {}),
        escolaridade: null,
      };
      if (existing.documents.length > 0) {
        await db.updateDocument(DB, "adsets", existing.documents[0].$id, data);
        return existing.documents[0].$id;
      } else {
        const result = await db.createDocument(DB, "adsets", ID.unique(), data);
        return result.$id;
      }
    };

    const upsertAd = async (conjunto_id: string, a: any) => {
      const existing = await db.listDocuments(DB, "ads", [
        Query.equal("meta_ad_id", a.id),
        Query.limit(1),
      ]);
      const data = {
        conjunto_id,
        nome: a.name,
        meta_ad_id: a.id,
        thumbnail_url: a.creative?.thumbnail_url || "",
        link_anuncio: null,
      };
      if (existing.documents.length > 0) {
        await db.updateDocument(DB, "ads", existing.documents[0].$id, data);
        return existing.documents[0].$id;
      } else {
        const result = await db.createDocument(DB, "ads", ID.unique(), data);
        return result.$id;
      }
    };

    if (etapa === 0) {
      console.log(
        "Worker - Etapa 0: Sincronizando estrutura (Campanhas, Conjuntos, Anúncios)...",
      );

      const adsParams: any = {
        fields: [
          "id",
          "name",
          "creative{thumbnail_url}",
          "adset{id,name,targeting}",
          "campaign{id,name,status,objective}",
        ].join(","),
        limit: 500,
      };

      if (palavra_chave_meta) {
        adsParams.filtering = JSON.stringify([
          {
            field: "campaign.name",
            operator: "CONTAIN",
            value: palavra_chave_meta,
          },
        ]);
      }

      let url = `${GRAPH_API_BASE}/${accountId}/ads?access_token=${meta_access_token}`;
      for (const [key, value] of Object.entries(adsParams)) {
        url += `&${key}=${encodeURIComponent(typeof value === "object" ? JSON.stringify(value) : String(value))}`;
      }

      const campCache = new Map<string, string>();
      const adsetCache = new Map<string, string>();

      while (url) {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.error) throw new Error(`Meta API Error: ${data.error.message}`);

        for (const ad of data.data || []) {
          const campaign = ad.campaign;
          const adset = ad.adset;

          if (!campaign || !adset) continue;

          let appwriteCampId = campCache.get(campaign.id);
          if (!appwriteCampId) {
            appwriteCampId = await upsertCampaign(campaign);
            campCache.set(campaign.id, appwriteCampId);
          }

          let appwriteAdsetId = adsetCache.get(adset.id);
          if (!appwriteAdsetId) {
            appwriteAdsetId = await upsertAdset(appwriteCampId, adset);
            adsetCache.set(adset.id, appwriteAdsetId);
          }

          await upsertAd(appwriteAdsetId, ad);
        }

        url = data.paging?.next || null;
      }
    } else {
      console.log(
        "Worker - Etapa",
        etapa,
        ": Estrutura já sincronizada ou ignorada (otimização).",
      );
    }

    if (etapa === 1) {
      let dateSinceStr = data_inicio_sync;
      if (!dateSinceStr) {
        const date90Dias = new Date();
        date90Dias.setDate(date90Dias.getDate() - 90);
        dateSinceStr = date90Dias.toISOString().split("T")[0];
      }
      const dateUntilStr = new Date().toISOString().split("T")[0];

      console.log(
        `Worker - Etapa ${etapa}: Buscando insights de ${dateSinceStr} até ${dateUntilStr}...`,
      );

      const insightsParams: any = {
        level: "ad",
        fields: [
          "spend",
          "impressions",
          "reach",
          "clicks",
          "actions",
          "campaign_name",
          "adset_name",
          "ad_name",
          "ad_id",
          "date_start",
        ].join(","),
        time_increment: 1,
        time_range: JSON.stringify({
          since: dateSinceStr,
          until: dateUntilStr,
        }),
        limit: 500,
      };

      if (palavra_chave_meta) {
        insightsParams.filtering = JSON.stringify([
          {
            field: "campaign.name",
            operator: "CONTAIN",
            value: palavra_chave_meta,
          },
        ]);
      }

      // Pre-load all fbAd.id -> appwriteAd.$id mappings in memory
      const fbAdToAppwriteAd = new Map<string, string>();
      const allAppwriteAds = await db.listDocuments(DB, "ads", [Query.limit(5000)]);
      for (const ad of allAppwriteAds.documents) {
        if (ad.meta_ad_id) {
          fbAdToAppwriteAd.set(ad.meta_ad_id, ad.$id);
        }
      }

      let url = `${GRAPH_API_BASE}/${accountId}/insights?access_token=${meta_access_token}`;
      for (const [key, value] of Object.entries(insightsParams)) {
        url += `&${key}=${encodeURIComponent(typeof value === "object" ? JSON.stringify(value) : String(value))}`;
      }

      while (url) {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.error) throw new Error(`Meta API Error: ${data.error.message}`);

        for (const i of data.data || []) {
          let criativo_id = fbAdToAppwriteAd.get(i.ad_id);

          if (!criativo_id) {
            const existingAd = await db.listDocuments(DB, "ads", [
              Query.equal("meta_ad_id", i.ad_id),
              Query.limit(1),
            ]);
            if (existingAd.documents.length > 0) {
              criativo_id = existingAd.documents[0].$id;
              fbAdToAppwriteAd.set(i.ad_id, criativo_id);
            }
          }

          if (!criativo_id) continue;

          const dataStr = i.date_start;

          const existing = await db.listDocuments(DB, "daily_metrics", [
            Query.equal("criativo_id", criativo_id),
            Query.equal("data", dataStr),
            Query.limit(1),
          ]);

          const actions = i.actions || [];
          const conversasArr = actions.find(
            (a: any) =>
              a.action_type ===
              "onsite_conversion.messaging_conversation_started_7d",
          );
          const conversas = conversasArr ? Number(conversasArr.value) : 0;

          const metricData = {
            criativo_id,
            data: dataStr,
            investimento: Number(i.spend) || 0,
            impressoes: Number(i.impressions) || 0,
            alcance: Number(i.reach) || 0,
            cliques: Number(i.clicks) || 0,
            conversas,
            leads_qualificados: 0,
            leads_desqualificados: 0,
            vendas: 0,
            cliente_id,
          };

          if (existing.documents.length > 0) {
            await db.updateDocument(
              DB,
              "daily_metrics",
              existing.documents[0].$id,
              metricData,
            );
          } else {
            await db.createDocument(DB, "daily_metrics", ID.unique(), metricData);
          }
        }

        url = data.paging?.next || null;
      }
    }

    const nextEtapa = etapa + 1;
    const isDone = nextEtapa >= total_etapas;
    const nextStatus = isDone ? "done" : "pending";
    const progresso = Math.round((nextEtapa / total_etapas) * 100);

    await db.updateDocument(DB, "sync_jobs", jobId, {
      etapa_atual: nextEtapa,
      progresso,
      status: nextStatus,
      atualizado_em: new Date().toISOString(),
    });

    return res.status(200).json({ done: isDone, progresso, jobId });
  } catch (error: any) {
    console.error("Meta Sync Worker Error:", error);
    try {
      if (
        req.body?.jobId ||
        (typeof req.body === "string" && JSON.parse(req.body).jobId)
      ) {
        let id = req.body?.jobId;
        if (!id) id = JSON.parse(req.body).jobId;
        await db.updateDocument(DB, "sync_jobs", id, {
          status: "error",
          erro: error.message,
          atualizado_em: new Date().toISOString(),
        });
      }
    } catch (e) {}

    let id = req.body?.jobId || (typeof req.body === "string" ? JSON.parse(req.body).jobId : undefined);
    return res.status(200).json({ done: false, error: error.message, jobId: id });
  }
}
