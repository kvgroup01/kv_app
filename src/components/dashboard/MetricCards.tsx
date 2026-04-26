import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  DollarSign,
  MessageCircle,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { fmtBRL, fmtNum, fmtPct } from "../../lib/utils";
import type { MetricasAgregadas, TipoCampanha } from "../../lib/types";
import { cn } from "../../lib/utils";

interface MetricCardsProps {
  metricas: MetricasAgregadas;
  tipo: TipoCampanha;
  isLoading: boolean;
}

export function MetricCards({ metricas, tipo, isLoading }: MetricCardsProps) {
  // Define os cards baseados no tipo
  const cards = React.useMemo(() => {
    const list = [];

    // Sempre tem investimento
    list.push({
      title: "Investimento",
      value: fmtBRL(metricas.investimento),
      icon: DollarSign,
    });

    if (tipo === "whatsapp" || tipo === "ambos") {
      list.push({
        title: "Conversas",
        value: fmtNum(metricas.conversas),
        icon: MessageCircle,
      });
    }

    if (tipo === "leads" || tipo === "ambos") {
      list.push({
        title: "Leads",
        value: fmtNum(metricas?.leads_total ?? 0),
        icon: Users,
      });
    }

    if (tipo === "whatsapp" || tipo === "ambos") {
      list.push({
        title: "Custo/Conv.",
        value: fmtBRL(metricas.custo_conversa),
        icon: Activity,
      });
    }

    if (tipo === "leads" || tipo === "ambos") {
      list.push({
        title: "CPL",
        value: fmtBRL(metricas.cpl),
        icon: TrendingUp,
      });
    }

    // Sempre tem CTR
    list.push({
      title: "CTR",
      value: fmtPct(metricas.ctr),
      icon: BarChart3,
    });

    // CPM apenas quando não for "ambos" (para economizar espaço e fechar em 6 cards no ambos)
    if (tipo !== "ambos") {
      list.push({
        title: "CPM",
        value: fmtBRL(metricas.cpm),
        icon: BarChart3,
      });
    }

    return list;
  }, [metricas, tipo]);

  const skeletonCount = tipo === "ambos" ? 6 : 5;
  const gridColumns =
    cards.length === 6 ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-5";

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 md:gap-4", gridColumns)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i} className="p-2 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <Skeleton className="h-4 w-16 sm:w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 md:gap-4", gridColumns)}>
      {(cards ?? []).map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="p-2 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-6 sm:pb-2 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
