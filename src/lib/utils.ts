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
  let investimento = 0, impressoes = 0, alcance = 0, cliques = 0, conversas = 0;
  let leads_qualificados = 0, leads_desqualificados = 0, vendas = 0;

  for (const m of metricas) {
    investimento += m.investimento;
    impressoes += m.impressoes;
    alcance += m.alcance;
    cliques += m.cliques;
    conversas += m.conversas;
    leads_qualificados += m.leads_qualificados;
    leads_desqualificados += m.leads_desqualificados;
    vendas += m.vendas;
  }

  const leads_total = leads_qualificados + leads_desqualificados;

  return {
    investimento,
    impressoes,
    alcance,
    cliques,
    conversas,
    leads_qualificados,
    leads_desqualificados,
    leads_total,
    vendas,
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
  const map = new Map<string, typeof metricas[0]>();

  for (const m of metricas) {
    if (!map.has(m.data)) {
      map.set(m.data, { ...m });
    } else {
      const item = map.get(m.data)!;
      item.investimento += m.investimento;
      item.impressoes += m.impressoes;
      item.alcance += m.alcance;
      item.cliques += m.cliques;
      item.conversas += m.conversas;
      item.leads_qualificados += m.leads_qualificados;
      item.leads_desqualificados += m.leads_desqualificados;
      item.vendas += m.vendas;
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
  let result = 0xFFFF;
  for (let i = 0; i < buffer.length; i++) {
    result ^= buffer.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((result & 0x8000) !== 0) {
        result = (result << 1) ^ 0x1021;
      } else {
        result <<= 1;
      }
    }
  }
  return (result & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function gerarPayloadPix(chave: string, valor: number, nome: string, cidade: string): string {
  const format = (id: string, value: string) => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  const payload = [
    format('00', '01'),
    format('26', 
      format('00', 'br.gov.bcb.pix') +
      format('01', chave)
    ),
    format('52', '0000'),
    format('53', '986'),
  ];

  if (valor > 0) {
    payload.push(format('54', valor.toFixed(2)));
  }

  payload.push(
    format('58', 'BR'),
    format('59', nome.substring(0, 25) || 'Nome Omitido'),
    format('60', cidade.substring(0, 15) || 'Cidade Omitida'),
    format('62', format('05', '***')),
  );

  const payloadString = payload.join('') + '6304';
  const crc = crc16(payloadString);

  return payloadString + crc;
}
