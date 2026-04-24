export type TipoCampanha = 'whatsapp' | 'leads' | 'ambos';
export type StatusOrcamento = 'pendente' | 'pago' | 'cancelado';
export type RoleAdmin = 'owner' | 'admin';
export type Performance = 'melhor' | 'bom' | 'medio';

export interface Cliente {
  $id: string;
  nome: string;
  slug: string;
  tipo_campanha: TipoCampanha;
  fonte_dados?: 'appwrite' | 'sheets' | 'meta_api';
  meta_ad_account_id?: string;
  meta_access_token?: string;
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
  $updatedAt?: string;
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
  comprovante_url?: string;
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
  cliente_id?: string; // Optional for sheets
  nome: string;
  tipo: TipoCampanha;
  status: string;
  fonte_dados?: 'appwrite' | 'sheets' | 'meta_api'; // Optional for sheets
}

export interface Conjunto {
  id: string;
  campanha_id: string;
  nome: string;
  escolaridade?: 'superior' | 'medio' | string;
  publico_descricao?: string;
}

export interface Criativo {
  id: string;
  conjunto_id: string;
  nome: string;
  thumbnail_url?: string;
  link_anuncio?: string;
  tipo_midia?: string;
  status?: string;
}

export interface MetricaDiaria {
  $id?: string;
  cliente_id?: string; // Optional for sheets
  criativo_id: string;
  data: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  conversas: number;
  leads_qualificados: number;
  leads_desqualificados: number;
  vendas: number;
  fonte?: 'webhook' | 'sheets' | 'meta_api'; // Optional for sheets
}

export interface ManualInput {
  cliente_id: string;
  data: string;
  investimento_total_contratado: number;
  leads_no_grupo_superior: number;
  leads_no_grupo_medio: number;
}

export interface Lancamento {
  $id?: string;
  cliente_id: string;
  nome: string;
  slug: string;
  tipo: 'leads' | 'ambos';
  status: 'rascunho' | 'ativo' | 'encerrado';
  palavra_chave_meta?: string;
  meta_account_id?: string;
  meta_access_token?: string;
  colunas_webhook?: string; // JSON array (stringificado na base)
  webhook_url?: string;
  configuracao_secoes?: string;
  criado_em?: string;
  publicado_em?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface MetaAccount {
  $id?: string;
  nome: string;
  meta_account_id: string;
  meta_access_token: string;
  criado_em?: string;
  $createdAt?: string;
  $updatedAt?: string;
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
  leads_superior: number; // Adicionado
  leads_medio: number;    // Adicionado
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
  alcance: number;
  impressoes: number;
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
