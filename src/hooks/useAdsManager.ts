import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const VPS = "https://sync.kvgroupbr.com.br";

// ─── Types ────────────────────────────────────────────────────

export interface AdsAccount {
  id: string;
  meta_account_id: string;
  nome: string;
  moeda: string;
  expires_at: string;
  lancamentos: Array<{
    id: string;
    nome: string;
    slug: string;
    status: string;
  }>;
  metricas: {
    investimento: number;
    impressoes: number;
    cliques: number;
    resultados: number;
    campanhas: number;
    ads: number;
  };
}

export interface AdsCampaign {
  id: string;
  nome: string;
  status: string;
  objective: string;
  lancamento_nome: string;
  lancamento_slug: string;
  lancamento_status: string;
  total_adsets: number;
  total_ads: number;
  metricas: {
    investimento: number;
    impressoes: number;
    alcance: number;
    cliques: number;
    resultados: number;
    ctr: number;
    cpm: number;
  };
}

export interface AdsAdset {
  id: string;
  nome: string;
  total_ads: number;
  metricas: {
    investimento: number;
    impressoes: number;
    alcance: number;
    cliques: number;
    resultados: number;
  };
}

export interface AdsAd {
  id: string;
  nome: string;
  thumbnail_url: string;
  link_anuncio: string;
  meta_ad_id: string;
  isVideo: boolean;
  instagramShortcode: string | null;
  metricas: {
    investimento: number;
    impressoes: number;
    alcance: number;
    cliques: number;
    resultados: number;
    ctr: number;
    cpm: number;
  };
}

export interface BoostedPost {
  id: string;
  instagram_media_id: string;
  media_type: string;
  caption: string;
  permalink: string;
  thumbnail_url: string;
  media_url: string;
  timestamp: string;
  username: string;
  organico: {
    reach: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saved: number;
  };
  impulsionado: {
    ad_id: string;
    ad_nome: string;
    meta_ad_id: string;
    metricas: {
      investimento: number;
      alcance: number;
      impressoes: number;
      cliques: number;
    } | null;
  } | null;
}

export interface ClienteComInstagram {
  id: string;
  nome: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function toDateStr(d?: Date): string {
  return d ? d.toISOString().split("T")[0] : "";
}

// ─── Hooks ───────────────────────────────────────────────────

export function useAdsManagerOverview() {
  return useQuery({
    queryKey: ["ads-manager-overview"],
    queryFn: async (): Promise<{
      accounts: AdsAccount[];
      period: { from: string; to: string };
    }> => {
      const res = await fetch(`${VPS}/ads-manager/overview`);
      if (!res.ok) throw new Error("Erro ao buscar contas Meta Ads");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAdsManagerCampaigns(
  accountId: string | null,
  from?: Date,
  to?: Date,
) {
  return useQuery({
    queryKey: [
      "ads-manager-campaigns",
      accountId,
      toDateStr(from),
      toDateStr(to),
    ],
    queryFn: async (): Promise<{
      campaigns: AdsCampaign[];
      period: { from: string; to: string };
    }> => {
      const params = new URLSearchParams({ accountId: accountId! });
      if (from) params.append("from", toDateStr(from));
      if (to) params.append("to", toDateStr(to));
      const res = await fetch(`${VPS}/ads-manager/campaigns?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar campanhas");
      return res.json();
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAdsManagerAdsets(
  campaignId: string | null,
  from?: Date,
  to?: Date,
) {
  return useQuery({
    queryKey: [
      "ads-manager-adsets",
      campaignId,
      toDateStr(from),
      toDateStr(to),
    ],
    queryFn: async (): Promise<{ adsets: AdsAdset[] }> => {
      const params = new URLSearchParams({ campaignId: campaignId! });
      if (from) params.append("from", toDateStr(from));
      if (to) params.append("to", toDateStr(to));
      const res = await fetch(`${VPS}/ads-manager/adsets?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar conjuntos");
      return res.json();
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAdsManagerAds(
  adsetId: string | null,
  from?: Date,
  to?: Date,
) {
  return useQuery({
    queryKey: ["ads-manager-ads", adsetId, toDateStr(from), toDateStr(to)],
    queryFn: async (): Promise<{ ads: AdsAd[] }> => {
      const params = new URLSearchParams({ adsetId: adsetId! });
      if (from) params.append("from", toDateStr(from));
      if (to) params.append("to", toDateStr(to));
      const res = await fetch(`${VPS}/ads-manager/ads?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar anúncios");
      return res.json();
    },
    enabled: !!adsetId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAdsManagerBoostedPosts(
  clienteId: string | null,
  from?: Date,
  to?: Date,
) {
  return useQuery({
    queryKey: [
      "ads-manager-boosted",
      clienteId,
      toDateStr(from),
      toDateStr(to),
    ],
    queryFn: async (): Promise<{
      posts: BoostedPost[];
      total: number;
      impulsionados: number;
      period: { from: string; to: string };
    }> => {
      const params = new URLSearchParams({ clienteId: clienteId! });
      if (from) params.append("from", toDateStr(from));
      if (to) params.append("to", toDateStr(to));
      const res = await fetch(`${VPS}/ads-manager/boosted-posts?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar posts impulsionados");
      return res.json();
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useClientesComInstagram() {
  return useQuery({
    queryKey: ["clientes-com-instagram"],
    queryFn: async (): Promise<ClienteComInstagram[]> => {
      const { data, error } = await supabase
        .from("instagram_profiles")
        .select("cliente_id, clientes(id, nome)")
        .not("cliente_id", "is", null);

      if (error) throw error;

      const map = new Map<string, string>();
      (data || []).forEach((row: any) => {
        if (row.cliente_id && !map.has(row.cliente_id)) {
          map.set(row.cliente_id, row.clientes?.nome || row.cliente_id);
        }
      });

      return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
