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
  investimentoContratado: number;
  valorUsadoCampanhas: number;
  isLoading?: boolean;
}

export function VisaoFinanceiraLeads({
  investimentoContratado,
  valorUsadoCampanhas,
  isLoading,
}: VisaoFinanceiraLeadsProps) {

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

  // Cálculos baseados na regra de negócio
  const investimento_total = investimentoContratado || 0;
  const taxa_percentual = 12.5;
  const taxa_valor = investimento_total * (taxa_percentual / 100);
  const real_investido = investimento_total - taxa_valor;
  const total_com_taxa = investimento_total + taxa_valor;
  const valor_usado = valorUsadoCampanhas || 0;
  const saldo_restante = investimento_total - valor_usado;
  const restantePositivo = saldo_restante >= 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Visão financeira</CardTitle>
        <CardDescription>
          Acompanhamento e controle do budget injetado x utilizado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Linha 1 */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Investimento Total Contratado
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {fmtBRL(investimento_total)}
          </div>
        </div>

        {/* Linha 2 - Calculados Taxa */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground mb-1">
              Taxa Facebook Ads (12,5%)
            </div>
            <Badge variant="outline" className="font-semibold">
              {fmtBRL(taxa_valor)}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Real Investido em Anúncios
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
              {fmtBRL(real_investido)}
            </div>
          </div>
          <div className="space-y-1 col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-border pt-3 lg:pt-0 lg:pl-4">
            <div className="text-sm text-muted-foreground">Total com Taxa Incluída</div>
            <div className="text-lg font-bold">
              {fmtBRL(total_com_taxa)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Linha 3 - Usado vs Restante */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-2">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground uppercase tracking-widest">
              Valor Usado
            </div>
            <div className="text-2xl font-semibold">
              {fmtBRL(valor_usado)}
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
              {fmtBRL(saldo_restante)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
