import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";
import { fmtBRL, calcularTaxaFacebook } from "../../lib/utils";
import { cn } from "../../lib/utils";

// Função auxiliar simples para máscara e limpeza de BRL limitando o escopo
function formatBrlInput(value: string) {
  // Remove tudo exceto dígitos
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return "";

  // Transforma em float com duas casas (divide por 100)
  const floatValue = parseInt(onlyDigits, 10) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(floatValue);
}

// Unmask function that returns pure float number
function parseBrlToFloat(value: string) {
  const onlyDigits = value.replace(/\D/g, "");
  return parseInt(onlyDigits, 10) / 100 || 0;
}

interface VisaoFinanceiraLeadsProps {
  investimentoManual: number;
  onInvestimentoChange: (valor: number) => void;
  valorUsadoCampanhas: number;
  isLoading?: boolean;
}

export function VisaoFinanceiraLeads({
  investimentoManual,
  onInvestimentoChange,
  valorUsadoCampanhas,
  isLoading,
}: VisaoFinanceiraLeadsProps) {
  // Mantem um string formatada state-local pra UX do input
  const [inputValue, setInputValue] = React.useState(
    fmtBRL(investimentoManual),
  );

  React.useEffect(() => {
    // Sincroniza via external props quando o componente monta ou atualiza por fora
    setInputValue(fmtBRL(investimentoManual));
  }, [investimentoManual]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBrlInput(e.target.value);
    setInputValue(formatted);
    // Dispara a mutation numerica pro parent
    onInvestimentoChange(parseBrlToFloat(formatted));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[180px]" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculos da Regra de Negocio via utils calc
  const taxaData = calcularTaxaFacebook(investimentoManual);
  const valorRestante = investimentoManual - valorUsadoCampanhas;
  const restantePositivo = valorRestante >= 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Visão financeira</CardTitle>
        <CardDescription>
          Acompanhamento e controle do budget injetado x utilizado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Linha 1 - Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Investimento Total na Plataforma
          </label>
          <Input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className="text-lg font-semibold h-11"
            placeholder="R$ 0,00"
          />
        </div>

        {/* Linha 2 - Calculados Taxa */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground mb-1">
              Taxa Facebook Ads
            </div>
            <Badge variant="outline" className="font-semibold">
              {fmtBRL(taxaData.taxa)} (12,5%)
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Valor Real Investido
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
              {fmtBRL(taxaData.valorSemTaxa)}
            </div>
          </div>
          <div className="space-y-1 col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-border pt-3 lg:pt-0 lg:pl-4">
            <div className="text-sm text-muted-foreground">Total c/ Taxas</div>
            <div className="text-lg font-bold">
              {fmtBRL(taxaData.valorComTaxa)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Linha 3 - Usado vs Restante */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-2">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground uppercase tracking-widest">
              Valor Utilizado
            </div>
            <div className="text-2xl font-semibold">
              {fmtBRL(valorUsadoCampanhas)}
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <div className="text-sm text-muted-foreground uppercase tracking-widest">
              Saldo Restante
            </div>
            <div
              className={cn(
                "text-3xl font-bold tracking-tight",
                restantePositivo ? "text-[#22c55e]" : "text-[#ef4444]",
              )}
            >
              {fmtBRL(valorRestante)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
