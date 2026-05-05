import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { fmtNum, fmtPct } from "../../lib/utils";
import type { CriativoComMetricas, TipoCampanha } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Image as ImageIcon, Play, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

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
  const [verTodos, setVerTodos] = React.useState(false);
  const [modalCriativo, setModalCriativo] = React.useState<CriativoComMetricas | null>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);

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

  const displayedCriativos = verTodos ? criativos : (criativos ?? []).slice(0, 10);

  return (
    <div className="space-y-4" ref={gridRef}>
      <h3 className="text-lg font-medium">Análise de Criativos</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {displayedCriativos.map((criativo) => {
          let badgeClass = "bg-muted text-muted-foreground";
          if (criativo.performance === "melhor")
            badgeClass = "bg-[#22c55e] text-white hover:bg-[#16a34a]";
          if (criativo.performance === "bom")
            badgeClass = "bg-[#eab308] text-white hover:bg-[#ca8a04]";

          return (
            <Card key={criativo.$id} className="overflow-hidden flex flex-col">
              {/* Thumbnail Area */}
              <div 
                onClick={() => setModalCriativo(criativo)}
                className="group relative h-[160px] w-full bg-muted/30 border-b flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {/* Hover overlay with icon */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity transform scale-95 group-hover:scale-100">
                    {criativo.link_anuncio ? (
                      <Play className="w-10 h-10 text-white drop-shadow-md" />
                    ) : (
                      <ZoomIn className="w-10 h-10 text-white drop-shadow-md" />
                    )}
                  </div>
                </div>

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
      {(criativos ?? []).length > 10 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (verTodos && gridRef.current) {
                gridRef.current.scrollIntoView({ behavior: 'smooth' });
              }
              setVerTodos(!verTodos);
            }}
          >
            {verTodos ? "Ver menos" : `Ver todos (${criativos.length})`}
          </Button>
        </div>
      )}
      {criativos.length === 0 && (
        <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
          Nenhum criativo associado ou com métricas no período.
        </div>
      )}

      {/* Modal View Criativo */}
      {modalCriativo && (
        <Dialog open={!!modalCriativo} onOpenChange={(open) => !open && setModalCriativo(null)}>
          <DialogContent className="max-w-3xl bg-black/90 border border-white/10 text-white overflow-hidden p-0 sm:rounded-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <DialogTitle className="truncate font-medium pr-8">
                {modalCriativo.nome}
              </DialogTitle>
            </div>
            <div className="flex items-center justify-center bg-black/50 min-h-[400px]">
              {modalCriativo.link_anuncio ? (
                <div className="flex flex-col items-center justify-center gap-6 py-12 px-6">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Play className="w-10 h-10 text-blue-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white/80 text-sm">Este criativo é um vídeo</p>
                    <p className="text-white/50 text-xs">Clique abaixo para visualizar no Facebook Ads</p>
                  </div>
                  <a
                    href={modalCriativo.link_anuncio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Assistir no Facebook
                  </a>
                </div>
              ) : (
                <img
                  src={modalCriativo.thumbnail_url || ""}
                  alt={modalCriativo.nome}
                  className="w-full max-h-[500px] object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
