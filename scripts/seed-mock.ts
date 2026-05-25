import * as sdk from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

let endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
if (endpoint && !endpoint.endsWith('/v1')) {
  endpoint = endpoint.endsWith('/') ? `${endpoint}v1` : `${endpoint}/v1`;
}

const client = new sdk.Client()
  .setEndpoint(endpoint)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.VITE_APPWRITE_API_KEY!);

const databases = new sdk.Databases(client);
const DB_ID = 'dashboard-kv';

async function seed() {
  console.log('🌱 Iniciando Seed de Mock...');

  // 1. Criar Cliente
  const clienteId = 'agencia-exemplo-mock-id';
  try {
    await databases.createDocument(DB_ID, 'clientes', clienteId, {
      nome: 'Agência Exemplo',
      slug: 'agencia-exemplo',
      tipo_campanha: 'whatsapp',
      ativo: true,
      fonte_dados: 'appwrite'
    });
    console.log('✅ Cliente "Agência Exemplo" criado.');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('⏭️ Cliente já existe. Prosseguindo...');
    } else {
      console.error('❌ Erro cliente:', error.message);
      return;
    }
  }

  // 2. Criar Campanha
  const campanhaId = 'campanha-mock-id';
  try {
    await databases.createDocument(DB_ID, 'campaigns', campanhaId, {
      id: campanhaId,
      cliente_id: clienteId,
      nome: 'WhatsApp — Prospecção Março',
      tipo: 'whatsapp',
      status: 'active',
      fonte_dados: 'appwrite'
    });
    console.log('✅ Campanha criada.');
  } catch (error: any) {
    if (error.code === 409) console.log('⏭️ Campanha já existe.');
    else console.error('❌ Erro campanha:', error.message);
  }

  // 3. Criar Conjuntos
  const adsets = [
    { id: 'adset-1', nome: 'Público 25-34 · Interesse imóveis' },
    { id: 'adset-2', nome: 'Lookalike 2% · Clientes' },
    { id: 'adset-3', nome: 'Remarketing · Visitantes 30d' }
  ];

  for (const adset of adsets) {
    try {
      await databases.createDocument(DB_ID, 'adsets', adset.id, {
        id: adset.id,
        campanha_id: campanhaId,
        nome: adset.nome
      });
      console.log(`✅ Conjunto "${adset.nome}" criado.`);
    } catch (error: any) {
      if (error.code === 409) console.log(`⏭️ Conjunto "${adset.nome}" já existe.`);
    }
  }

  // 4. Criar Anúncios
  const thumbnails = [
    'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80'
  ];

  const ads = [
    // Para adset-1
    { id: 'ad-1-1', conjunto_id: 'adset-1', nome: 'Vídeo Depoimento Mário', thumb: thumbnails[0] },
    { id: 'ad-1-2', conjunto_id: 'adset-1', nome: 'Carrossel Benefícios', thumb: thumbnails[1] },
    { id: 'ad-1-3', conjunto_id: 'adset-1', nome: 'Imagem Oferta 20%', thumb: thumbnails[2] },
    // Para adset-2
    { id: 'ad-2-1', conjunto_id: 'adset-2', nome: 'Vídeo Tours Apto', thumb: thumbnails[0] },
    { id: 'ad-2-2', conjunto_id: 'adset-2', nome: 'Carrossel Casal', thumb: thumbnails[1] },
    { id: 'ad-2-3', conjunto_id: 'adset-2', nome: 'Imagem Plantas', thumb: thumbnails[2] },
    // Para adset-3
    { id: 'ad-3-1', conjunto_id: 'adset-3', nome: 'Vídeo Últimas Unidades', thumb: thumbnails[0] },
    { id: 'ad-3-2', conjunto_id: 'adset-3', nome: 'Carrossel Bairro', thumb: thumbnails[1] },
    { id: 'ad-3-3', conjunto_id: 'adset-3', nome: 'Imagem Condições Especiais', thumb: thumbnails[2] }
  ];

  for (const ad of ads) {
    try {
      await databases.createDocument(DB_ID, 'ads', ad.id, {
        id: ad.id,
        conjunto_id: ad.conjunto_id,
        nome: ad.nome,
        thumbnail_url: ad.thumb,
        link_anuncio: `https://facebook.com/ads/${ad.id}`,
        tipo_midia: ad.nome.startsWith('Vídeo') ? 'video' : 'image',
        status: 'active'
      });
      console.log(`✅ Anúncio "${ad.nome}" criado.`);
    } catch (error: any) {
      if (error.code === 409) console.log(`⏭️ Anúncio "${ad.nome}" já existe.`);
    }
  }

  // 5. Criar Métricas Diárias (Março 2026 - 31 dias)
  console.log('⏳ Gerando métricas diárias para cada anúncio...');
  
  const diasMes = 31;
  const metricsPromises = [];

  for (let dia = 1; dia <= diasMes; dia++) {
    const dataStr = `2026-03-${dia.toString().padStart(2, '0')}`;
    
    for (const ad of ads) {
      const metricId = `mock-metric-${ad.id}-${dataStr}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
      
      // Gera valores realistas para cada dia
      const investimento = parseFloat((Math.random() * 50 + 20).toFixed(2)); // R$ 20 - R$ 70
      const impressoes = Math.floor(Math.random() * 2000 + 500); // 500 - 2500
      const cliqueProb = Math.random() * 0.03 + 0.01; // 1% - 4% CTR
      const cliques = Math.floor(impressoes * cliqueProb);
      const conversasProb = Math.random() * 0.15 + 0.05; // 5% - 20% Conv.Rate
      const conversas = Math.floor(cliques * conversasProb);
      const leadsQualiProb = Math.random() * 0.5 + 0.2; // 20% - 70% Qualificação
      const leadsQualificados = Math.floor(conversas * leadsQualiProb);
      const leadsDesqualificados = conversas - leadsQualificados;
      const vendasProb = Math.random() * 0.1; // 0 - 10% Conversão de Qualificado pra venda
      const vendas = Math.floor(leadsQualificados * vendasProb);
      
      const payload = {
        cliente_id: clienteId,
        criativo_id: ad.id,
        data: dataStr,
        investimento: investimento,
        impressoes: impressoes,
        alcance: Math.floor(impressoes * 0.8),
        cliques: cliques,
        conversas: conversas,
        leads_qualificados: leadsQualificados,
        leads_desqualificados: leadsDesqualificados,
        vendas: vendas,
        fonte: 'mock'
      };

      const p = databases.createDocument(DB_ID, 'daily_metrics', metricId, payload)
        .catch(e => {
          if (e.code !== 409) console.error(`❌ Erro métrica ${metricId}:`, e.message);
        });
      
      metricsPromises.push(p);
    }
  }

  await Promise.all(metricsPromises);
  console.log(`✅ ${metricsPromises.length} registros de métricas processados!`);
  
  console.log('🎉 Seed concluído com sucesso!');
}

seed();
