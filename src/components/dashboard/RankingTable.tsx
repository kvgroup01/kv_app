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
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { fmtBRL, fmtNum, fmtPct } from "../../lib/utils";
import type {
  ConjuntoComMetricas,
  CriativoComMetricas,
  TipoCampanha,
} from "../../lib/types";
import { cn } from "../../lib/utils";

// Como o ranking serve tanto pra Públicos(Conjuntos) quanto para Criativos...
interface RankingTableProps {
  titulo: string;
  items: (ConjuntoComMetricas | CriativoComMetricas)[];
  tipo: "publicos" | "criativos";
  campanhaTipo: TipoCampanha;
  isLoading?: boolean;
}

export function RankingTable({
  titulo,
  items,
  tipo,
  campanhaTipo,
  isLoading,
}: RankingTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-muted/20 p-2 rounded-md"
              >
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[50px] rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verifica as Labels e Chaves dependendo se é Publicos ou Criativos
  const colNomeItem = tipo === "publicos" ? "Público" : "Criativo";
  const metricName = campanhaTipo === "whatsapp" ? "Conversas" : "Leads";

  // A última coluna muda a depender do que estamos analisando
  const colDesempenho =
    tipo === "publicos"
      ? campanhaTipo === "whatsapp"
        ? "Custo/Conv"
        : "CPL"
      : "CTR";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">#</TableHead>
              <TableHead className="max-w-[200px]">{colNomeItem}</TableHead>
              <TableHead className="text-right">{metricName}</TableHead>
              <TableHead className="text-right">{colDesempenho}</TableHead>
              <TableHead className="text-right">Perf.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items ?? []).slice(0, 5).map((item, index) => {
              // Mostra só o TOP 5 para não quebrar layout
              let badgeClass = "bg-muted text-muted-foreground";
              if (item.performance === "melhor")
                badgeClass =
                  "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400";
              if (item.performance === "bom")
                badgeClass =
                  "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";

              const valDesempenho =
                tipo === "publicos"
                  ? fmtBRL(
                      (item as ConjuntoComMetricas).custo_conversa ||
                        (item as ConjuntoComMetricas).cpl ||
                        0,
                    )
                  : fmtPct((item as CriativoComMetricas).ctr || 0);

              const contagem =
                campanhaTipo === "whatsapp"
                  ? (item?.conversas ?? 0)
                  : (item?.leads_total ?? 0);

              return (
                <TableRow key={item.$id} className="group">
                  <TableCell className="font-mono text-muted-foreground text-[10px] sm:text-xs">
                    #{index + 1}
                  </TableCell>
                  <TableCell
                    className="font-medium truncate max-w-[80px] sm:max-w-[200px] text-[10px] sm:text-sm"
                    title={item.nome}
                  >
                    {tipo === "publicos"
                      ? (item as ConjuntoComMetricas).publico_descricao ||
                        item.nome
                      : item.nome}
                  </TableCell>
                  <TableCell className="text-right text-[10px] sm:text-sm">
                    {fmtNum(contagem)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-[10px] sm:text-sm">
                    {valDesempenho}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={cn("border-none capitalize text-[9px] sm:text-xs px-1 sm:px-2", badgeClass)}
                    >
                      {item.performance}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center h-24 text-muted-foreground"
                >
                  Nenhum dado para analisar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
