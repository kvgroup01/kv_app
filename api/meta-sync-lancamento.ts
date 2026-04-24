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
    const body = req.body;
    let lancamentoId =
      body && typeof body === "string"
        ? JSON.parse(body).lancamentoId
        : body?.lancamentoId;

    if (!lancamentoId && req.body) {
      lancamentoId = req.body.lancamentoId;
    }

    if (typeof req.body === "string" && !lancamentoId) {
      try {
        lancamentoId = JSON.parse(req.body).lancamentoId;
      } catch (e) {}
    }

    if (!lancamentoId) {
      return res.status(400).json({ error: "lancamentoId is required" });
    }

    // 1. Busca o lançamento
    const lancamento = await db.getDocument(DB, "lancamentos", lancamentoId);

    const {
      meta_account_id,
      meta_access_token,
      palavra_chave_meta,
      cliente_id,
    } = lancamento;

    if (!meta_account_id || !meta_access_token) {
      return res
        .status(400)
        .json({ error: "Lançamento não possui conta Meta configurada." });
    }

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

    // 2. Lista campanhas do Meta e filtra
    const campaignsData = await fetchMeta(`act_${meta_account_id}/campaigns`, {
      fields: ["id", "name", "status", "objective"].join(","),
      limit: 500,
    });

    const activeCampaigns = campaignsData.data.filter((c: any) => {
      if (!palavra_chave_meta) return true;
      return c.name.toLowerCase().includes(palavra_chave_meta.toLowerCase());
    });

    let adsetsCount = 0;
    let adsCount = 0;
    let insightsCount = 0;

    const dateSince = new Date();
    dateSince.setDate(dateSince.getDate() - 90);
    const dateSinceStr = dateSince.toISOString().split("T")[0];
    const dateUntilStr = new Date().toISOString().split("T")[0];

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
        Query.equal("conjunto_id", conjunto_id),
        Query.equal("nome", a.name),
        Query.limit(1),
      ]);
      const data = {
        conjunto_id,
        nome: a.name,
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

    const countInsights = new Set<string>();

    for (const fbCampaign of activeCampaigns) {
      const appwriteCampId = await upsertCampaign(fbCampaign);

      const adsetsData = await fetchMeta(`${fbCampaign.id}/adsets`, {
        fields: ["id", "name", "status", "targeting"].join(","),
        limit: 500,
      });

      for (const fbAdset of adsetsData.data) {
        const appwriteAdsetId = await upsertAdset(appwriteCampId, fbAdset);
        adsetsCount++;

        const adsData = await fetchMeta(`${fbAdset.id}/ads`, {
          fields: ["id", "name", "creative{thumbnail_url}"].join(","),
          limit: 500,
        });

        for (const fbAd of adsData.data) {
          const appwriteAdId = await upsertAd(appwriteAdsetId, fbAd);
          fbAdToAppwriteAd.set(fbAd.id, appwriteAdId);
          adsCount++;
        }
      }

      const insightsData = await fetchMeta(`${fbCampaign.id}/insights`, {
        level: "ad",
        fields: [
          "ad_id",
          "spend",
          "impressions",
          "reach",
          "clicks",
          "actions",
        ].join(","),
        time_increment: 1,
        time_range: JSON.stringify({
          since: dateSinceStr,
          until: dateUntilStr,
        }),
        limit: 500,
      });

      for (const i of insightsData.data) {
        const criativo_id = fbAdToAppwriteAd.get(i.ad_id);
        if (!criativo_id) continue;

        const dataStr = i.date_start;
        countInsights.add(dataStr);

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

        const data = {
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
            data,
          );
        } else {
          await db.createDocument(DB, "daily_metrics", ID.unique(), data);
        }
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        campanhas: activeCampaigns.length,
        adsets: adsetsCount,
        ads: adsCount,
        dias_sincronizados: countInsights.size,
      },
    });
  } catch (error: any) {
    console.error("Meta Sync Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
