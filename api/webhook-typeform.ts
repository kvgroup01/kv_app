import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client, Databases, ID, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT!.replace('/v1', '') + '/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.VITE_APPWRITE_API_KEY!);

const db = new Databases(client);
const DB = 'dashboard-kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const lancamentoId = req.query.lancamentoId as string;
  if (!lancamentoId) return res.status(400).json({ error: 'lancamentoId obrigatório' });

  try {
    const body = req.body;

    if (body.event_type !== 'form_response') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const response = body.form_response;
    const answers = response.answers || [];
    const responseId = response.token;
    const submittedAt = response.submitted_at;

    // Evitar duplicatas
    const existing = await db.listDocuments(DB, 'survey_entries', [
      Query.equal('typeform_response_id', responseId),
      Query.limit(1),
    ]);
    if (existing.documents.length > 0) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Extrai valor pelo field.id
    const getAnswer = (fieldId: string): string | null => {
      const answer = answers.find((a: any) => a.field.id === fieldId);
      if (!answer) return null;
      if (answer.type === 'text') return answer.text || null;
      if (answer.type === 'email') return answer.email || null;
      if (answer.type === 'phone_number') return answer.phone_number || null;
      if (answer.type === 'choice') return answer.choice?.label || null;
      return null;
    };

    const data = submittedAt
      ? submittedAt.split('T')[0]
      : new Date().toISOString().split('T')[0];

    const doc = {
      lancamento_id: lancamentoId,
      data,
      typeform_response_id: responseId,
      nome: getAnswer('MIGN5WqYptqf'),
      telefone: getAnswer('BRSQqTmC6bgQ'),
      email: getAnswer('46CS6Rkay5WF'),
      por_que_vaga: getAnswer('aagsmlfXQYoC'),
      idade: getAnswer('J1supOK1C2hQ'),
      genero: getAnswer('IoEmduQpRtvq'),
      estado: getAnswer('Et3hy3LTXdQf'),
      escolaridade: getAnswer('NIBKmSJRvX1d'),
      profissao: getAnswer('DU8nvPhLhgNr'),
      horas_livres: getAnswer('2FBhKPlxd5vi'),
      renda: getAnswer('yOjeKrg6OqKw'),
      mora_com: getAnswer('UviencX9oM7p'),
      ja_estudou: getAnswer('Bo0ipY2nIq5u'),
      experiencia_concursos: getAnswer('2ZZ2N9kD7Pgc'),
      o_que_mudaria: getAnswer('iv4Th39e0xnI'),
      o_que_impede: getAnswer('pntOqR5N92zd'),
      como_se_sente: getAnswer('anoFjSYQufwA'),
      pergunta_professor: getAnswer('ZQrkhx8ytEZ3'),
    };

    await db.createDocument(DB, 'survey_entries', ID.unique(), doc);

    return res.status(200).json({ ok: true, id: responseId });
  } catch (error: any) {
    console.error('Webhook Typeform erro:', error);
    return res.status(500).json({ error: error.message });
  }
}
