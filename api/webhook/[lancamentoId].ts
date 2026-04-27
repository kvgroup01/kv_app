import { Client, Databases, ID } from "node-appwrite";

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
    };

    await db.createDocument(DB, "lead_entries", ID.unique(), documentData);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Webhook GreatPages Error:", error);
    return res.status(400).json({ error: error.message });
  }
}
