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
    let lancamentoId = req.body?.lancamentoId;
    if (typeof req.body === "string") {
      try {
        lancamentoId = JSON.parse(req.body).lancamentoId;
      } catch (e) {}
    }

    if (!lancamentoId) {
      return res.status(400).json({ error: "lancamentoId is required" });
    }

    const lancamento = await db.getDocument(DB, "lancamentos", lancamentoId);

    if (!lancamento.meta_account_id) {
      return res
        .status(400)
        .json({ error: "Lançamento não possui conta Meta configurada." });
    }

    const existingJobs = await db.listDocuments(DB, "sync_jobs", [
      Query.equal("lancamento_id", lancamentoId),
      Query.equal("status", "running"),
      Query.limit(1),
    ]);

    if (existingJobs.documents.length > 0) {
      const job = existingJobs.documents[0];
      const syncToken = Buffer.from(`${job.$id}:${process.env.VITE_APPWRITE_API_KEY}`).toString('base64').slice(0, 32);
      return res.status(200).json({
        jobId: job.$id,
        status: "running",
        syncToken,
      });
    }

    // Limpar jobs com erro mais antigos que 24 horas
    const jobsComErro = await db.listDocuments(DB, 'sync_jobs', [
      Query.equal('lancamento_id', lancamentoId),
      Query.equal('status', 'error'),
      Query.limit(10),
    ]);

    for (const job of jobsComErro.documents) {
      const criado_em = new Date(job.criado_em).getTime();
      const vinteQuatroHoras = 24 * 60 * 60 * 1000;
      if (Date.now() - criado_em > vinteQuatroHoras) {
        await db.deleteDocument(DB, 'sync_jobs', job.$id);
      }
    }

    const existingPending = await db.listDocuments(DB, "sync_jobs", [
      Query.equal("lancamento_id", lancamentoId),
      Query.equal("status", "pending"),
      Query.limit(1),
    ]);

    if (existingPending.documents.length > 0) {
      const job = existingPending.documents[0];
      const criado_em = new Date(job.criado_em).getTime();
      const agora = Date.now();
      const cincoMinutos = 5 * 60 * 1000;

      // Se o job pending tem mais de 5 minutos, está preso — deletar e criar novo
      if (agora - criado_em > cincoMinutos) {
        await db.deleteDocument(DB, 'sync_jobs', job.$id);
      } else {
        const syncToken = Buffer.from(
          `${job.$id}:${process.env.VITE_APPWRITE_API_KEY}`
        ).toString('base64').slice(0, 32);

        return res.status(200).json({
          jobId: job.$id,
          status: 'pending',
          syncToken,
        });
      }
    }

    const job = await db.createDocument(DB, "sync_jobs", ID.unique(), {
      lancamento_id: lancamentoId,
      status: "pending",
      etapa_atual: 0,
      total_etapas: 2,
      progresso: 0,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    const syncToken = Buffer.from(
      `${job.$id}:${process.env.VITE_APPWRITE_API_KEY}`
    ).toString('base64').slice(0, 32);

    return res.status(200).json({ jobId: job.$id, status: "pending", syncToken });
  } catch (error: any) {
    console.error("Meta Sync Start Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
