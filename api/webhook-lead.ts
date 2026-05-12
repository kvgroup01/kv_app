import { Client, Databases, ID, Query } from "node-appwrite";

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
    const { lancamentoId } = req.query;

    if (!lancamentoId) {
      return res.status(400).json({ error: "lancamentoId is required" });
    }

    const body = req.body;

    let data_convertida = new Date().toISOString().split("T")[0];
    if (body?.Data_da_conversao) {
      data_convertida = body.Data_da_conversao.split(" ")[0];
    }

    // Buscar regras de qualificação do lançamento
    const lancamento = await db.getDocument(DB, 'lancamentos', lancamentoId as string);
    let leads_qualificados = 0;
    let leads_desqualificados = 0;

    let renda = body?.Renda || body?.renda || null;

    if (lancamento.regras_qualificacao) {
      try {
        const regras = JSON.parse(lancamento.regras_qualificacao);
        const criterio = regras.criterio || 'escolaridade';
        const escolaridades = regras.escolaridades || [];
        const rendas = regras.rendas || [];

        const escQualificada = escolaridades.length === 0 || 
          escolaridades.includes(body?.Escolaridade);
        const rendaQualificada = rendas.length === 0 || 
          rendas.includes(renda);

        let qualificado = false;
        if (criterio === 'escolaridade') qualificado = escQualificada;
        else if (criterio === 'renda') qualificado = rendaQualificada;
        else if (criterio === 'ambos_e') qualificado = escQualificada && rendaQualificada;
        else if (criterio === 'ambos_ou') qualificado = escQualificada || rendaQualificada;

        if (qualificado) leads_qualificados = 1;
        else leads_desqualificados = 1;
      } catch (e) {}
    }

    const documentData = {
      lancamento_id: lancamentoId,
      nome: body?.Nome || null,
      email: body?.E_mail || null,
      telefone: body?.DDD_Telefone || null,
      escolaridade: body?.Escolaridade || null,
      utm_source: body?.utm_source || body?.UTM_Source || null,
      utm_campaign: body?.utm_campaign || body?.UTM_Campaign || null,
      utm_medium: body?.utm_medium || body?.UTM_Medium || null,
      utm_content: body?.utm_content || body?.UTM_Content || null,
      utm_term: body?.UTM_Term || body?.utm_term || null,
      data: data_convertida,
      renda,
      leads_qualificados,
      leads_desqualificados,
    };

    // Verificar duplicata por email + data
    if (documentData.email && documentData.data) {
      const existing = await db.listDocuments(DB, 'lead_entries', [
        Query.equal('lancamento_id', lancamentoId as string),
        Query.equal('email', documentData.email),
        Query.equal('data', documentData.data),
        Query.limit(1),
      ]);

      if (existing.documents.length > 0) {
        return res.status(200).json({ success: true, duplicate: true });
      }
    }

    await db.createDocument(DB, "lead_entries", ID.unique(), documentData);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Webhook GreatPages Error:", error);
    return res.status(400).json({ error: error.message });
  }
}
