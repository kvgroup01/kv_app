import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { fmtNum, fmtPct } from "../../lib/utils";
import type { CriativoComMetricas, TipoCampanha } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Image as ImageIcon, Play } from "lucide-react";

interface CreativosGridProps {
  criativos: CriativoComMetricas[];
  tipo: TipoCampanha;
  isLoading?: boolean;
}

export function CreativosGrid({
  criativos,
  tipo,
  isLoading,
}: CreativosGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-[200px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-[140px] w-full rounded-t-xl rounded-b-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Identifica visualmente entre vídeo e imagem (Mockup behavior)
  const isVideo = (name: string) =>
    name.toLowerCase().includes("video") || name.toLowerCase().includes("vid");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Análise de Criativos</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {(criativos ?? []).map((criativo) => {
          let badgeClass = "bg-muted text-muted-foreground";
          if (criativo.performance === "melhor")
            badgeClass = "bg-[#22c55e] text-white hover:bg-[#16a34a]";
          if (criativo.performance === "bom")
            badgeClass = "bg-[#eab308] text-white hover:bg-[#ca8a04]";

          return (
            <Card key={criativo.$id} className="overflow-hidden flex flex-col">
              {/* Thumbnail Area */}
              <div className="relative h-[160px] w-full bg-muted/30 border-b flex items-center justify-center">
                {criativo.thumbnail_url ? (
                  <img
                    src={criativo.thumbnail_url}
                    alt={criativo.nome}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-full",
                      isVideo(criativo.nome)
                        ? "bg-indigo-500/10 text-indigo-500"
                        : "bg-blue-500/10 text-blue-500",
                    )}
                  >
                    {isVideo(criativo.nome) ? (
                      <Play className="w-8 h-8 mb-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 mb-2" />
                    )}
                    <span className="text-xs font-semibold tracking-widest uppercase">
                      {isVideo(criativo.nome) ? "Vídeo" : "Imagem"}
                    </span>
                  </div>
                )}

                <div className="absolute top-2 right-2">
                  <Badge className={cn("capitalize shadow-sm", badgeClass)}>
                    {criativo.performance}
                  </Badge>
                </div>
              </div>

              {/* Data Area */}
              <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <h4
                    className="text-sm font-medium truncate"
                    title={criativo.nome}
                  >
                    {criativo.nome}
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Cliques</span>
                    <span className="font-semibold">
                      {fmtNum(criativo.cliques)}
                    </span>
                  </div>

                  {tipo === "whatsapp" ? (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Conversas</span>
                      <span className="font-semibold text-[#25D366]">
                        {fmtNum(criativo.conversas)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Leads</span>
                        <span className="font-semibold">
                          {fmtNum(criativo?.leads_total ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">% Qualif.</span>
                        <span className="font-semibold">
                          {fmtPct(criativo.pct_qualificados)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {criativos.length === 0 && (
        <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
          Nenhum criativo associado ou com métricas no período.
        </div>
      )}
    </div>
  );
}
