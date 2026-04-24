import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { MetricaDiaria, MetricasAgregadas, Performance } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function fmtNum(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function fmtPct(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '0,0%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function fmtData(dateStr: string): string {
  if (!dateStr || dateStr.split('-').length !== 3) return dateStr;
  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

export const fmtDataString = fmtData;

export function calcularMetricas(metricas: MetricaDiaria[]): MetricasAgregadas {
  const metricasVazias: MetricasAgregadas = {
    investimento: 0, impressoes: 0, alcance: 0,
    cliques: 0, conversas: 0, leads_qualificados: 0,
    leads_desqualificados: 0, leads_total: 0,
    leads_superior: 0, leads_medio: 0, vendas: 0,
    ctr: 0, cpm: 0, custo_conversa: 0, cpl: 0,
    taxa_conversao: 0, pct_qualificados: 0,
    pct_desqualificados: 0, grupos_formados: 0,
  }

  if (!metricas || metricas.length === 0) return metricasVazias

  let investimento = 0, impressoes = 0, alcance = 0, 
      cliques = 0, conversas = 0, leads_qualificados = 0, 
      leads_desqualificados = 0, vendas = 0

  for (const m of metricas) {
    investimento += m?.investimento ?? 0
    impressoes += m?.impressoes ?? 0
    alcance += m?.alcance ?? 0
    cliques += m?.cliques ?? 0
    conversas += m?.conversas ?? 0
    leads_qualificados += m?.leads_qualificados ?? 0
    leads_desqualificados += m?.leads_desqualificados ?? 0
    vendas += m?.vendas ?? 0
  }

  const leads_total = leads_qualificados + leads_desqualificados

  return {
    investimento, impressoes, alcance, cliques,
    conversas, leads_qualificados, leads_desqualificados,
    leads_total, leads_superior: 0, leads_medio: 0, vendas,
    ctr: impressoes > 0 ? (cliques / impressoes) * 100 : 0,
    cpm: impressoes > 0 ? (investimento / impressoes) * 1000 : 0,
    custo_conversa: conversas > 0 ? investimento / conversas : 0,
    cpl: leads_total > 0 ? investimento / leads_total : 0,
    taxa_conversao: conversas > 0 ? (vendas / conversas) * 100 : 0,
    pct_qualificados: leads_total > 0 ? (leads_qualificados / leads_total) * 100 : 0,
    pct_desqualificados: leads_total > 0 ? (leads_desqualificados / leads_total) * 100 : 0,
    grupos_formados: calcularGrupos(leads_total),
  };
}

export function agruparPorDia(metricas: MetricaDiaria[]) {
  if (!metricas || metricas.length === 0) return [];
  const map = new Map<string, typeof metricas[0]>();

  for (const m of metricas) {
    if (!m) continue;
    if (!map.has(m.data)) {
      map.set(m.data, { ...m });
    } else {
      const item = map.get(m.data)!;
      item.investimento += m?.investimento ?? 0;
      item.impressoes += m?.impressoes ?? 0;
      item.alcance += m?.alcance ?? 0;
      item.cliques += m?.cliques ?? 0;
      item.conversas += m?.conversas ?? 0;
      item.leads_qualificados += m?.leads_qualificados ?? 0;
      item.leads_desqualificados += m?.leads_desqualificados ?? 0;
      item.vendas += m?.vendas ?? 0;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.data.localeCompare(b.data));
}

export function calcularTaxaFacebook(valor: number) {
  const taxa = valor * 0.125;
  return {
    taxa,
    valorSemTaxa: valor - taxa,
    valorComTaxa: valor + taxa,
  };
}

export function calcularGrupos(totalLeads: number): number {
  return Math.floor(totalLeads / 250);
}

export function calcularPerformance(items: any[], index: number): Performance {
  if (items.length === 0) return 'medio';
  const percentile = index / items.length;
  if (percentile <= 0.25) return 'melhor';
  if (percentile <= 0.60) return 'bom';
  return 'medio';
}

function crc16(buffer: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
    .toUpperCase();
}

export function gerarPayloadPix(chave: string, valor: number, nome: string, cidade: string): string {
  // Limpar a chave (remover espaços, hífens, pontuação)
  let chaveLimpa = chave.replace(/[\s\.\-\(\)]/g, '');
  
  // Se for celular (11 dígitos começando com DDD) e não tiver o +55, adicionar
  if (chaveLimpa.length === 11 && /^\d+$/.test(chaveLimpa)) {
    chaveLimpa = `+55${chaveLimpa}`;
  }

  const format = (id: string, value: string) => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  const payload = [
    format('00', '01'),
    format('26', 
      format('00', 'br.gov.bcb.pix') +
      format('01', chaveLimpa)
    ),
    format('52', '0000'),
    format('53', '986'),
  ];

  if (valor > 0) {
    // Garantir exatamente 2 casas decimais com ponto
    payload.push(format('54', valor.toFixed(2)));
  }

  payload.push(
    format('58', 'BR'),
    format('59', normalizarTexto(nome).substring(0, 25) || 'GESTOR KV'),
    format('60', normalizarTexto(cidade).substring(0, 15) || 'SAO PAULO'),
    format('62', format('05', '***')),
  );

  const payloadString = payload.join('') + '6304';
  const crc = crc16(payloadString);

  return payloadString + crc;
}
