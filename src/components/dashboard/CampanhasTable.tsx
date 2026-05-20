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
import { ChevronRight, ChevronDown, ExternalLink, Settings2 } from "lucide-react";
import { fmtBRL, fmtNum } from "../../lib/utils";
import type {
  CampanhaComMetricas,
  ConjuntoComMetricas,
  CriativoComMetricas,
  TipoCampanha,
} from "../../lib/types";
import { cn } from "../../lib/utils";
import { type DateRange } from "react-day-picker";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";

interface CampanhasTableProps {
  campanhasComMetricas: CampanhaComMetricas[];
  tipo: TipoCampanha;
  isLoading?: boolean;
  dateRange?: DateRange;
}

const COLUNAS_DISPONIVEIS = [
  { id: 'investimento', label: 'Valor usado', defaultVisible: true },
  { id: 'resultados', label: 'Resultados', defaultVisible: true },
  { id: 'alcance', label: 'Alcance', defaultVisible: true },
  { id: 'frequencia', label: 'Frequência', defaultVisible: false },
  { id: 'cpl', label: 'Custo por resultado', defaultVisible: true },
  { id: 'impressoes', label: 'Impressões', defaultVisible: false },
  { id: 'cpm', label: 'CPM', defaultVisible: true },
  { id: 'cliques_link', label: 'Cliques no link', defaultVisible: true },
  { id: 'cpc', label: 'CPC (link)', defaultVisible: false },
  { id: 'ctr', label: 'CTR (link)', defaultVisible: true },
  { id: 'cliques_todos', label: 'Cliques (todos)', defaultVisible: false },
  { id: 'ctr_todos', label: 'CTR (todos)', defaultVisible: false },
  { id: 'cpc_todos', label: 'CPC (todos)', defaultVisible: false },
  { id: 'conversas', label: 'Conversas iniciadas', defaultVisible: false },
  { id: 'custo_conversa', label: 'Custo por conversa', defaultVisible: false },
  { id: 'leads', label: 'Leads', defaultVisible: true },
  { id: 'qualificados', label: 'Qualificados', defaultVisible: true },
];

export function CampanhasTable({
  campanhasComMetricas,
  tipo,
  isLoading,
  dateRange,
}: CampanhasTableProps) {
  const [expandedCampanhas, setExpandedCampanhas] = React.useState<
    Record<string, boolean>
  >({});
  const [expandedConjuntos, setExpandedConjuntos] = React.useState<
    Record<string, boolean>
  >({});
  const [showColunasMenu, setShowColunasMenu] = React.useState(false);
  
  const [colunasVisiveis, setColunasVisiveis] = React.useState<string[]>(
    COLUNAS_DISPONIVEIS.filter(c => c.defaultVisible).map(c => c.id)
  );

  const campanhasFiltradas = React.useMemo(() => {
    if (!dateRange?.from) return campanhasComMetricas;
    return campanhasComMetricas.filter(c => {
      // Verificar se a campanha tem métricas no período
      return c.investimento > 0 || c.cliques > 0;
    });
  }, [campanhasComMetricas, dateRange]);

  const toggleCampanha = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCampanhas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleConjunto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedConjuntos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isWhats = tipo === "whatsapp" || tipo === "ambos";

  const toggleColuna = (id: string) => {
    setColunasVisiveis(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const renderCells = (
    data: CampanhaComMetricas | ConjuntoComMetricas | CriativoComMetricas | any,
    level: number,
  ) => {
    const investimento = data.investimento || 0;
    const alcance = data.alcance || 0;
    const impressoes = data.impressoes || 0;
    const frequencia = alcance > 0 ? (impressoes / alcance) : 0;
    const cliques_link = data.cliques || 0;
    const cliques_todos = data.cliques_todos || 0;
    const leads = data.leads_total ?? 0;
    const conversas = data.conversas || 0;
    const resultados = isWhats ? conversas : leads;
    const cpl = resultados > 0 ? investimento / resultados : 0;
    const cpm = impressoes > 0 ? (investimento / impressoes) * 1000 : 0;
    const cpc = cliques_link > 0 ? investimento / cliques_link : 0;
    const ctr = impressoes > 0 ? (cliques_link / impressoes) * 100 : 0;
    const ctr_todos = impressoes > 0 ? (cliques_todos / impressoes) * 100 : 0;
    const cpc_todos = cliques_todos > 0 ? investimento / cliques_todos : 0;
    const custo_conversa = conversas > 0 ? investimento / conversas : 0;
    const qualificados = data.leads_qualificados || 0;

    return (
      <>
        {colunasVisiveis.includes('investimento') && <TableCell>{fmtBRL(investimento)}</TableCell>}
        {colunasVisiveis.includes('resultados') && <TableCell className="hidden sm:table-cell">{fmtNum(resultados)}</TableCell>}
        {colunasVisiveis.includes('alcance') && <TableCell className="hidden sm:table-cell">{fmtNum(alcance)}</TableCell>}
        {colunasVisiveis.includes('frequencia') && <TableCell className="hidden sm:table-cell">{frequencia.toFixed(2)}</TableCell>}
        {colunasVisiveis.includes('cpl') && <TableCell className="hidden sm:table-cell">{fmtBRL(cpl)}</TableCell>}
        {colunasVisiveis.includes('impressoes') && <TableCell className="hidden sm:table-cell">{fmtNum(impressoes)}</TableCell>}
        {colunasVisiveis.includes('cpm') && <TableCell className="hidden sm:table-cell">{fmtBRL(cpm)}</TableCell>}
        {colunasVisiveis.includes('cliques_link') && <TableCell className="hidden sm:table-cell">{fmtNum(cliques_link)}</TableCell>}
        {colunasVisiveis.includes('cpc') && <TableCell className="hidden sm:table-cell">{fmtBRL(cpc)}</TableCell>}
        {colunasVisiveis.includes('ctr') && <TableCell className="hidden sm:table-cell">{ctr.toFixed(2)}%</TableCell>}
        {colunasVisiveis.includes('cliques_todos') && <TableCell className="hidden sm:table-cell">{fmtNum(cliques_todos)}</TableCell>}
        {colunasVisiveis.includes('ctr_todos') && <TableCell className="hidden sm:table-cell">{ctr_todos.toFixed(2)}%</TableCell>}
        {colunasVisiveis.includes('cpc_todos') && <TableCell className="hidden sm:table-cell">{fmtBRL(cpc_todos)}</TableCell>}
        {colunasVisiveis.includes('conversas') && <TableCell className="hidden sm:table-cell">{fmtNum(conversas)}</TableCell>}
        {colunasVisiveis.includes('custo_conversa') && <TableCell className="hidden sm:table-cell">{fmtBRL(custo_conversa)}</TableCell>}
        {colunasVisiveis.includes('leads') && <TableCell className="hidden sm:table-cell">{fmtNum(leads)}</TableCell>}
        {colunasVisiveis.includes('qualificados') && <TableCell className="hidden sm:table-cell">{fmtNum(qualificados)}</TableCell>}

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

  const totalInvestimento = campanhasFiltradas.reduce((sum, c) => sum + (c.investimento || 0), 0);
  const totalLeads = campanhasFiltradas.reduce((sum, c) => sum + ((c as any).leads_total || 0), 0);
  const totalConversas = campanhasFiltradas.reduce((sum, c) => sum + (c.conversas || 0), 0);
  const totalResultados = isWhats ? totalConversas : totalLeads;
  const totalAlcance = campanhasFiltradas.reduce((sum, c) => sum + (c.alcance || 0), 0);
  const totalImpress = campanhasFiltradas.reduce((sum, c) => sum + ((c as any).impressoes || 0), 0);
  const totalFrequencia = totalAlcance > 0 ? (totalImpress / totalAlcance) : 0;
  const cplMedio = totalResultados > 0 ? totalInvestimento / totalResultados : 0;
  const cpmMedio = totalImpress > 0 ? (totalInvestimento / totalImpress) * 1000 : 0;
  const totalCliques = campanhasFiltradas.reduce((sum, c) => sum + (c.cliques || 0), 0);
  const cpcMedio = totalCliques > 0 ? totalInvestimento / totalCliques : 0;
  const ctrMedio = totalImpress > 0 ? (totalCliques / totalImpress) * 100 : 0;
  const totalCliquesTodos = campanhasFiltradas.reduce((sum, c) => sum + ((c as any).cliques_todos || 0), 0);
  const cpcTodosMedio = totalCliquesTodos > 0 ? totalInvestimento / totalCliquesTodos : 0;
  const ctrTodosMedio = totalImpress > 0 ? (totalCliquesTodos / totalImpress) * 100 : 0;
  const custoConversaMedio = totalConversas > 0 ? totalInvestimento / totalConversas : 0;
  const totalQualificados = campanhasFiltradas.reduce((sum, c) => sum + (c.leads_qualificados || 0), 0);

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
      <CardHeader className="pb-4 flex flex-row items-start justify-between">
        <div>
          <CardTitle>Desempenho Geral</CardTitle>
          <CardDescription>
            Visão hierárquica (Campanha ▶ Conjunto ▶ Anúncio)
          </CardDescription>
        </div>
        
        <Popover open={showColunasMenu} onOpenChange={setShowColunasMenu}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 text-[13px]"
            >
              <Settings2 className="h-4 w-4" />
              Colunas
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <div className="flex flex-col space-y-3">
              <h4 className="font-medium text-sm px-1">Colunas visíveis</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto px-1 pb-1">
                {COLUNAS_DISPONIVEIS.map(col => (
                  <div key={col.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`col-${col.id}`}
                      checked={colunasVisiveis.includes(col.id)}
                      onCheckedChange={() => toggleColuna(col.id)}
                    />
                    <label 
                      htmlFor={`col-${col.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {col.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] sm:w-[300px] sm:min-w-[300px]">Nome</TableHead>
                {COLUNAS_DISPONIVEIS.map(col => 
                  colunasVisiveis.includes(col.id) ? (
                    <TableHead key={col.id} className={col.id !== 'investimento' ? "hidden sm:table-cell" : ""}>
                      {col.label}
                    </TableHead>
                  ) : null
                )}
                <TableHead className="w-[50px] hidden sm:table-cell"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campanhasFiltradas.map((campanha) => (
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
              {campanhasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={colunasVisiveis.length + 2}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum dado encontrado para o período.
                  </TableCell>
                </TableRow>
              )}
              {campanhasFiltradas.length > 0 && (
                <TableRow className="border-t-2 border-(--card-border) bg-(--card-hover) font-semibold">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  {colunasVisiveis.includes('investimento') && <TableCell>{fmtBRL(totalInvestimento)}</TableCell>}
                  {colunasVisiveis.includes('resultados') && <TableCell className="hidden sm:table-cell">{fmtNum(totalResultados)}</TableCell>}
                  {colunasVisiveis.includes('alcance') && <TableCell className="hidden sm:table-cell">{fmtNum(totalAlcance)}</TableCell>}
                  {colunasVisiveis.includes('frequencia') && <TableCell className="hidden sm:table-cell">{totalFrequencia.toFixed(2)}</TableCell>}
                  {colunasVisiveis.includes('cpl') && <TableCell className="hidden sm:table-cell">{fmtBRL(cplMedio)}</TableCell>}
                  {colunasVisiveis.includes('impressoes') && <TableCell className="hidden sm:table-cell">{fmtNum(totalImpress)}</TableCell>}
                  {colunasVisiveis.includes('cpm') && <TableCell className="hidden sm:table-cell">{fmtBRL(cpmMedio)}</TableCell>}
                  {colunasVisiveis.includes('cliques_link') && <TableCell className="hidden sm:table-cell">{fmtNum(totalCliques)}</TableCell>}
                  {colunasVisiveis.includes('cpc') && <TableCell className="hidden sm:table-cell">{fmtBRL(cpcMedio)}</TableCell>}
                  {colunasVisiveis.includes('ctr') && <TableCell className="hidden sm:table-cell">{ctrMedio.toFixed(2)}%</TableCell>}
                  {colunasVisiveis.includes('cliques_todos') && <TableCell className="hidden sm:table-cell">{fmtNum(totalCliquesTodos)}</TableCell>}
                  {colunasVisiveis.includes('ctr_todos') && <TableCell className="hidden sm:table-cell">{ctrTodosMedio.toFixed(2)}%</TableCell>}
                  {colunasVisiveis.includes('cpc_todos') && <TableCell className="hidden sm:table-cell">{fmtBRL(cpcTodosMedio)}</TableCell>}
                  {colunasVisiveis.includes('conversas') && <TableCell className="hidden sm:table-cell">{fmtNum(totalConversas)}</TableCell>}
                  {colunasVisiveis.includes('custo_conversa') && <TableCell className="hidden sm:table-cell">{fmtBRL(custoConversaMedio)}</TableCell>}
                  {colunasVisiveis.includes('leads') && <TableCell className="hidden sm:table-cell">{fmtNum(totalLeads)}</TableCell>}
                  {colunasVisiveis.includes('qualificados') && <TableCell className="hidden sm:table-cell">{fmtNum(totalQualificados)}</TableCell>}
                  <TableCell className="hidden sm:table-cell"></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
