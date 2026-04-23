import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../ui/skeleton';
import { fmtBRL, fmtData, fmtNum, fmtPct } from '../../lib/utils';
import type { DadosDiario } from '../../lib/types';

interface LeadsQualificadosChartProps {
  dados: DadosDiario[];
  isLoading?: boolean;
}

export function LeadsQualificadosChart({ dados, isLoading }: LeadsQualificadosChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px] mb-1" />
          <Skeleton className="h-3 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length >= 2) {
      // Procurando os valores no payload
      const investimentoEntry = payload.find((p: any) => p.dataKey === 'investimento');
      const qualificadosEntry = payload.find((p: any) => p.dataKey === 'leads_qualificados');
      const desqualificadosEntry = payload.find((p: any) => p.dataKey === 'leads_desqualificados');

      const invVal = investimentoEntry?.value || 0;
      const qualVal = qualificadosEntry?.value || 0;
      const desqVal = desqualificadosEntry?.value || 0;
      const total = qualVal + desqVal;
      const pctQual = total > 0 ? (qualVal / total) * 100 : 0;

      return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] text-popover-foreground shadow-sm rounded-lg p-3 z-[9999]">
          <p className="font-semibold mb-2">{fmtData(label)}</p>
          <div className="flex flex-col gap-1 min-w-[180px]">
             <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-[#22c55e]" />
                  <span className="text-muted-foreground">Qualificados:</span>
                </div>
                <span className="font-medium ml-4">{fmtNum(qualVal)}</span>
             </div>
             <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
                  <span className="text-muted-foreground">Desqualificados:</span>
                </div>
                <span className="font-medium ml-4">{fmtNum(desqVal)}</span>
             </div>
             <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-[#0f172a]" />
                  <span className="text-muted-foreground">Investimento:</span>
                </div>
                <span className="font-medium ml-4">{fmtBRL(invVal)}</span>
             </div>
             <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Qualificação:</span>
                <span className="font-bold">{fmtPct(pctQual)}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Qualificados vs Desqualificados</CardTitle>
        <CardDescription>Qualidade diária dos leads e investimento associado</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-[350px]">
        {/* Custom HTML Legend */}
        <div className="flex justify-center items-center space-x-6 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-[#22c55e]" />
            <span className="text-sm font-medium text-muted-foreground">Qualificados</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
            <span className="text-sm font-medium text-muted-foreground">Desqualificados</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-slate-100" />
            <span className="text-sm font-medium text-muted-foreground">Investimento</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={dados} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
            
            <XAxis 
              dataKey="data" 
              tickFormatter={fmtData} 
              className="text-xs text-muted-foreground" 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            
            {/* Eixo Esquerdo para Leads */}
            <YAxis 
              yAxisId="left"
              className="text-xs text-muted-foreground" 
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(val) => Math.round(val).toString()}
            />
            
            {/* Eixo Direito para Investimento */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              className="text-xs text-muted-foreground" 
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(val) => `R$ ${Math.round(val)}`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />

            <Bar 
              yAxisId="left" 
              dataKey="leads_qualificados" 
              name="Qualificados" 
              fill="#22c55e" 
              radius={[4, 4, 0, 0]} 
              barSize={16}
            />
            <Bar 
              yAxisId="left" 
              dataKey="leads_desqualificados" 
              name="Desqualificados" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]} 
              barSize={16}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="investimento" 
              name="Investimento" 
              stroke="currentColor" 
              className="text-foreground"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
