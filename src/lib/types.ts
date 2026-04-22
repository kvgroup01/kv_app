export type TipoCampanha = 'whatsapp' | 'leads' | 'ambos';
export type StatusOrcamento = 'pendente' | 'pago' | 'cancelado';
export type RoleAdmin = 'owner' | 'admin';
export type Performance = 'melhor' | 'bom' | 'medio';

export interface Cliente {
  $id: string;
  nome: string;
  slug: string;
  tipo_campanha: TipoCampanha;
  logo_url?: string;
  spreadsheet_id: string;
  pasta_id?: string;
  ativo: boolean;
  $createdAt: string;
}

export interface Pasta {
  $id: string;
  nome: string;
  cor: string;
}

export interface Convite {
  $id: string;
  email: string;
  token: string;
  status: 'pendente' | 'aceito' | 'expirado';
  expira_em: string;
}

export interface ItemOrcamento {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

export interface Orcamento {
  $id: string;
  cliente_id?: string;
  cliente_nome: string;
  token: string;
  itens: ItemOrcamento[];
  valor_total: number;
  status: StatusOrcamento;
  pix_chave: string;
  pix_qrcode: string;
  link_expira_em: string;
  $createdAt: string;
}

export interface Pagamento {
  $id: string;
  orcamento_id: string;
  comprovante_url: string;
  confirmado_em: string;
  observacao?: string;
}

export interface Campanha {
  id: string;
  nome: string;
  tipo: string;
  status: string;
}

export interface Conjunto {
  id: string;
  campanha_id: string;
  nome: string;
  publico_descricao: string;
  escolaridade?: string;
}

export interface Criativo {
  id: string;
  conjunto_id: string;
  nome: string;
  thumbnail_url: string;
  link_anuncio: string;
}

export interface MetricaDiaria {
  data: string;
  criativo_id: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  conversas: number;
  leads_qualificados: number;
  leads_desqualificados: number;
  vendas: number;
}

export interface LeadGrupo {
  data: string;
  leads_ensino_superior: number;
  leads_ensino_medio: number;
}

export interface MetricasAgregadas {
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  conversas: number;
  leads_qualificados: number;
  leads_desqualificados: number;
  leads_total: number;
  vendas: number;
  ctr: number;
  cpm: number;
  custo_conversa: number;
  cpl: number;
  taxa_conversao: number;
  pct_qualificados: number;
  pct_desqualificados: number;
  grupos_formados: number;
}

export interface CriativoComMetricas extends Criativo {
  investimento: number;
  cliques: number;
  conversas: number;
  leads_qualificados: number;
  leads_desqualificados: number;
  leads_total: number;
  ctr: number;
  pct_qualificados: number;
  performance: Performance;
}

export interface ConjuntoComMetricas extends Conjunto {
  investimento: number;
  conversas: number;
  leads_qualificados: number;
  leads_desqualificados: number;
  leads_total: number;
  custo_conversa: number;
  cpl: number;
  cliques: number;
  alcance: number;
  performance: Performance;
  criativos?: CriativoComMetricas[];
}

export interface CampanhaComMetricas extends Campanha {
  investimento: number;
  conversas: number;
  leads_qualificados: number;
  leads_desqualificados: number;
  leads_total: number;
  cliques: number;
  alcance: number;
  custo_conversa: number;
  cpl: number;
  conjuntos?: ConjuntoComMetricas[];
}

export interface DadosDiario {
  data: string;
  investimento: number;
  conversas: number;
  leads_qualificados: number;
  leads_desqualificados: number;
}
