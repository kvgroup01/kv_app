import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtBRL, fmtData, fmtNum } from '../../lib/utils';
import type { DadosDiario, TipoCampanha } from '../../lib/types';
import { Skeleton } from '../ui/skeleton';

interface InvestimentoChartProps {
  dados: DadosDiario[];
  tipo: TipoCampanha;
  isLoading?: boolean;
}

export function InvestimentoChart({ dados, tipo, isLoading }: InvestimentoChartProps) {
  const chartData = React.useMemo(() => {
    return dados.map(d => ({
      ...d,
      secundary_metric: tipo === 'whatsapp' ? d.conversas : (d.leads_qualificados + d.leads_desqualificados)
    }));
  }, [dados, tipo]);

  const metricName = tipo === 'whatsapp' ? 'Conversas' : 'Leads';
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-1/4 mb-1" />
          <Skeleton className="h-3 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground border shadow-sm rounded-lg p-3">
          <p className="font-semibold mb-2">{fmtData(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm py-0.5 min-w-[150px]">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-medium ml-4">
                {entry.dataKey === 'investimento' ? fmtBRL(entry.value) : fmtNum(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <CardTitle>Investimento vs {metricName}</CardTitle>
            <CardDescription>Acompanhamento diário do investimento e retorno</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[350px]">
        {/* Custom Legend - HTML */}
        <div className="flex justify-center items-center space-x-6 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-slate-100" />
            <span className="text-sm font-medium text-muted-foreground">Investimento (R$)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#25D366]" />
            <span className="text-sm font-medium text-muted-foreground">{metricName}</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
            
            <XAxis 
              dataKey="data" 
              tickFormatter={fmtData} 
              className="text-xs text-muted-foreground" 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            
            <YAxis 
              yAxisId="left"
              className="text-xs text-muted-foreground" 
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(val) => `R$ ${Math.round(val)}`}
            />

            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs text-muted-foreground" 
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(val) => Math.round(val).toString()}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />

            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="investimento" 
              name="Investimento" 
              stroke="currentColor" 
              className="text-foreground"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />

            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="secundary_metric" 
              name={metricName} 
              stroke="#25D366" 
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
