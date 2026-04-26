import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { fmtBRL, fmtNum } from "../../lib/utils";
import type {
  CampanhaComMetricas,
  ConjuntoComMetricas,
  CriativoComMetricas,
  TipoCampanha,
} from "../../lib/types";
import { cn } from "../../lib/utils";

interface CampanhasTableProps {
  campanhasComMetricas: CampanhaComMetricas[];
  tipo: TipoCampanha;
  isLoading?: boolean;
}

export function CampanhasTable({
  campanhasComMetricas,
  tipo,
  isLoading,
}: CampanhasTableProps) {
  const [expandedCampanhas, setExpandedCampanhas] = React.useState<
    Record<string, boolean>
  >({});
  const [expandedConjuntos, setExpandedConjuntos] = React.useState<
    Record<string, boolean>
  >({});

  const toggleCampanha = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCampanhas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleConjunto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedConjuntos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isWhats = tipo === "whatsapp" || tipo === "ambos"; // Default to WhatsApp columns if "ambos"
  const showLeads = tipo === "leads" || tipo === "ambos"; // Fallback checking. We'll strict to the rule:

  // Regra do prompt: "Colunas para 'whatsapp': Nome | Investimento | Conversas | Custo/Conv | Cliques | Alcance | Link"
  // "Colunas para 'leads': Nome | Investimento | Leads | Qualificados | CPL | Cliques | Alcance | Link"

  const renderCells = (
    data: CampanhaComMetricas | ConjuntoComMetricas | CriativoComMetricas,
    level: number,
  ) => {
    if (tipo === "whatsapp") {
      return (
        <>
          <TableCell>{fmtBRL(data.investimento)}</TableCell>
          <TableCell className="hidden sm:table-cell">{fmtNum(data.conversas)}</TableCell>
          <TableCell className="hidden sm:table-cell">{fmtBRL((data as any).custo_conversa || 0)}</TableCell>
          <TableCell className="hidden sm:table-cell">{fmtNum((data as any).cliques || 0)}</TableCell>
          <TableCell className="hidden sm:table-cell">{fmtNum((data as any).alcance || 0)}</TableCell>
          <TableCell className="hidden sm:table-cell">
            {level === 3 && (data as CriativoComMetricas).link_anuncio ? (
              <a
                href={(data as CriativoComMetricas).link_anuncio}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-500 hover:text-cyan-400"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </TableCell>
        </>
      );
    }

    // leads ou ambos usa estrutura de leads (no seu design, Ambos renderiza um ou outro em Tab)
    return (
      <>
        <TableCell>{fmtBRL(data.investimento)}</TableCell>
        <TableCell className="hidden sm:table-cell">{fmtNum((data as any)?.leads_total ?? 0)}</TableCell>
        <TableCell className="hidden sm:table-cell">{fmtNum((data as any).leads_qualificados || 0)}</TableCell>
        <TableCell className="hidden sm:table-cell">{fmtBRL((data as any).cpl || 0)}</TableCell>
        <TableCell className="hidden sm:table-cell">{fmtNum((data as any).cliques || 0)}</TableCell>
        <TableCell className="hidden sm:table-cell">{fmtNum((data as any).alcance || 0)}</TableCell>
        <TableCell className="hidden sm:table-cell">
          {level === 3 && (data as CriativoComMetricas).link_anuncio ? (
            <a
              href={(data as CriativoComMetricas).link_anuncio}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-500 hover:text-cyan-400"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </TableCell>
      </>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Desempenho Geral</CardTitle>
        <CardDescription>
          Visão hierárquica (Campanha ▶ Conjunto ▶ Anúncio)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] sm:w-[300px] sm:min-w-[300px]">Nome</TableHead>
                <TableHead>Investimento</TableHead>
                {tipo === "whatsapp" ? (
                  <>
                    <TableHead className="hidden sm:table-cell">Conversas</TableHead>
                    <TableHead className="hidden sm:table-cell">Custo/Conv</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="hidden sm:table-cell">Leads</TableHead>
                    <TableHead className="hidden sm:table-cell">Qualificados</TableHead>
                    <TableHead className="hidden sm:table-cell">CPL</TableHead>
                  </>
                )}
                <TableHead className="hidden sm:table-cell">Cliques</TableHead>
                <TableHead className="hidden sm:table-cell">Alcance</TableHead>
                <TableHead className="w-[50px] hidden sm:table-cell"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(campanhasComMetricas ?? []).map((campanha) => (
                <React.Fragment key={campanha.$id}>
                  {/* LEVEL 1: Campanha */}
                  <TableRow
                    className="font-medium bg-background hover:bg-muted/50 cursor-pointer text-xs sm:text-sm"
                    onClick={(e) => toggleCampanha(campanha.$id, e)}
                  >
                    <TableCell className="flex items-center space-x-1 sm:space-x-2">
                      {expandedCampanhas[campanha.$id] ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="truncate max-w-[120px] sm:max-w-none">{campanha.nome}</span>
                    </TableCell>
                    {renderCells(campanha, 1)}
                  </TableRow>

                  {/* LEVEL 2: Conjuntos */}
                  {expandedCampanhas[campanha.$id] &&
                    (campanha.conjuntos ?? []).map((conjunto) => (
                      <React.Fragment key={conjunto.$id}>
                        <TableRow
                          className="bg-muted/30 text-[11px] sm:text-sm hover:bg-muted/50 cursor-pointer"
                          onClick={(e) => toggleConjunto(conjunto.$id, e)}
                        >
                          <TableCell className="pl-3 sm:pl-6 flex items-center space-x-1 sm:space-x-2">
                            {expandedConjuntos[conjunto.$id] ? (
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-[100px] sm:max-w-none">{conjunto.nome}</span>
                          </TableCell>
                          {renderCells(conjunto, 2)}
                        </TableRow>

                        {/* LEVEL 3: Criativos */}
                        {expandedConjuntos[conjunto.$id] &&
                          (conjunto.criativos ?? []).map((criativo) => (
                            <TableRow
                              key={criativo.$id}
                              className="text-muted-foreground text-[10px] sm:text-sm hover:bg-muted/50"
                            >
                              <TableCell className="pl-8 sm:pl-12">
                                <span className="truncate block max-w-[100px] sm:max-w-[220px]">
                                  {criativo.nome}
                                </span>
                              </TableCell>
                              {renderCells(criativo, 3)}
                            </TableRow>
                          ))}
                      </React.Fragment>
                    ))}
                </React.Fragment>
              ))}
              {campanhasComMetricas.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={tipo === "whatsapp" ? 7 : 8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum dado encontrado para o período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
