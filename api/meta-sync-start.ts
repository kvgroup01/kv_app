import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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

    const { data: lancamento, error: lancErr } = await supabase.from('lancamentos').select('*').eq('id', lancamentoId).single();
    if (lancErr || !lancamento) {
      return res.status(404).json({ error: "Lançamento não encontrado" });
    }

    if (!lancamento.meta_account_id) {
      return res
        .status(400)
        .json({ error: "Lançamento não possui conta Meta configurada." });
    }

    const { data: existingJobs } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('lancamento_id', lancamentoId)
      .eq('status', 'running')
      .limit(1);

    if (existingJobs && existingJobs.length > 0) {
      const job = existingJobs[0];
      const syncToken = Buffer.from(`${job.id}:${process.env.SUPABASE_SERVICE_KEY}`).toString('base64').slice(0, 32);
      return res.status(200).json({
        jobId: job.id,
        status: "running",
        syncToken,
      });
    }

    // Limpar jobs com erro mais antigos que 24 horas
    const { data: jobsComErro } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('lancamento_id', lancamentoId)
      .eq('status', 'error')
      .limit(10);

    if (jobsComErro) {
      for (const job of jobsComErro) {
        const criado_em = new Date(job.criado_em).getTime();
        const vinteQuatroHoras = 24 * 60 * 60 * 1000;
        if (Date.now() - criado_em > vinteQuatroHoras) {
          await supabase.from('sync_jobs').delete().eq('id', job.id);
        }
      }
    }

    const { data: existingPending } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('lancamento_id', lancamentoId)
      .eq('status', 'pending')
      .limit(1);

    if (existingPending && existingPending.length > 0) {
      const job = existingPending[0];
      const criado_em = new Date(job.criado_em).getTime();
      const agora = Date.now();
      const cincoMinutos = 5 * 60 * 1000;

      // Se o job pending tem mais de 5 minutos, está preso — deletar e criar novo
      if (agora - criado_em > cincoMinutos) {
        await supabase.from('sync_jobs').delete().eq('id', job.id);
      } else {
        const syncToken = Buffer.from(
          `${job.id}:${process.env.SUPABASE_SERVICE_KEY}`
        ).toString('base64').slice(0, 32);

        return res.status(200).json({
          jobId: job.id,
          status: 'pending',
          syncToken,
        });
      }
    }

    const { data: job, error: jobErr } = await supabase
      .from('sync_jobs')
      .insert({
        lancamento_id: lancamentoId,
        status: 'pending',
        etapa_atual: 0,
        total_etapas: 2,
        progresso: 0,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .select()
      .single();
    if (jobErr) throw jobErr;

    const syncToken = Buffer.from(
      `${job.id}:${process.env.SUPABASE_SERVICE_KEY}`
    ).toString('base64').slice(0, 32);

    // Chama o sync service em background (não aguarda resposta)
    fetch(`${process.env.SYNC_SERVICE_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, syncToken }),
    }).catch(err => console.error('Erro ao chamar sync service:', err));

    return res.status(200).json({ jobId: job.id, status: "pending", syncToken });
  } catch (error: any) {
    console.error("Meta Sync Start Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
