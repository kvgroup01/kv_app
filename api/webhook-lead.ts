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

    // ── API de Conversões Meta (CAPI) ──────────────────
    // Executar em background, não bloquear resposta
    (async () => {
      try {
        // Verificar se lançamento tem CAPI configurado
        const pixelId = lancamento.capi_pixel_id;
        const accessToken = lancamento.capi_access_token || lancamento.meta_access_token;
        const enviarCapi = lancamento.capi_ativo === true;
        const eventName = lancamento.meta_event_type || 'Lead';

        if (!pixelId || !accessToken || !enviarCapi) return;

        // Verificar se deve enviar apenas qualificados
        const apenasQualificados = lancamento.capi_apenas_qualificados === true;
        if (apenasQualificados && leads_qualificados === 0) return;

        // Funções de hash SHA-256
        const crypto = await import('crypto');
        const sha256 = (str: string) =>
          crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');

        const normalizeName = (str: string) =>
          (str || '').trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z\s]/g, '');

        // Processar dados
        const emailRaw = documentData.email || '';
        const telefoneRaw = documentData.telefone || '';
        const nomeRaw = documentData.nome || '';

        const nameParts = normalizeName(nomeRaw).split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        let phone = telefoneRaw.replace(/\D/g, '');
        if (phone.length === 10 || phone.length === 11) phone = '55' + phone;

        // UTMs para custom_data
        const utmSource = documentData.utm_source || '';
        const utmMedium = documentData.utm_medium || '';
        const utmCampaign = documentData.utm_campaign || '';
        const utmContent = documentData.utm_content || '';
        const utmTerm = documentData.utm_term || '';

        // Event ID único
        const eventId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const eventTime = Math.floor(Date.now() / 1000);

        // URL da página (do webhook se disponível)
        const pageUrl = body?.URL || body?.url || '';

        // fbc/fbp
        const fbclidMatch = pageUrl.match(/fbclid=([^&]+)/);
        const fbclid = fbclidMatch ? fbclidMatch[1] : '';
        const fbc = body?.fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : '');
        const fbp = body?.fbp || '';

        const payload = {
          data: [{
            event_name: eventName,
            event_time: eventTime,
            event_id: eventId,
            event_source_url: pageUrl,
            action_source: 'website',
            user_data: {
              em: emailRaw ? [sha256(emailRaw)] : [],
              ph: phone ? [sha256(phone)] : [],
              fn: firstName ? [sha256(firstName)] : [],
              ln: lastName ? [sha256(lastName)] : [],
              external_id: emailRaw ? [sha256(emailRaw)] : [],
              ...(fbc ? { fbc } : {}),
              ...(fbp ? { fbp } : {}),
            },
            custom_data: {
              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign,
              utm_content: utmContent,
              utm_term: utmTerm,
            },
          }],
        };

        const capiUrl = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
        const capiRes = await fetch(capiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!capiRes.ok) {
          const err = await capiRes.text();
          console.error('CAPI Meta error:', err);
        } else {
          console.log('CAPI Meta enviado com sucesso para pixel:', pixelId);
        }
      } catch (capiError) {
        console.error('CAPI Meta exception:', capiError);
      }
    })();
    // ── fim CAPI ────────────────────────────────────────

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Webhook GreatPages Error:", error);
    return res.status(400).json({ error: error.message });
  }
}
