import * as React from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { fmtBRL, fmtData, fmtNum } from '../../lib/utils';
import type { DadosDiario, MetricasAgregadas } from '../../lib/types';

interface FunnelLeadsProps {
  dados: DadosDiario[];
  metricas: MetricasAgregadas;
}

export function FunnelLeads({ dados, metricas }: FunnelLeadsProps) {

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] text-popover-foreground shadow-sm rounded-lg p-3 z-[9999]">
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

  const CustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-4 text-xs pt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }} 
            />
            <span className="font-medium text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <CardTitle>Evolução de Leads</CardTitle>
            <CardDescription>Qualificados x Desqualificados x Investimento</CardDescription>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold">{fmtNum(metricas.leads_total)}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total do período</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dados}
            margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
          >
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
            <Legend content={<CustomLegend />} />

            <Bar 
              yAxisId="left" 
              dataKey="leads_qualificados" 
              name="Qualificados" 
              fill="#22c55e" 
              stackId="a" 
              radius={[0, 0, 4, 4]} 
              barSize={20}
            />
            <Bar 
              yAxisId="left" 
              dataKey="leads_desqualificados" 
              name="Desqualificados" 
              fill="#ef4444" 
              stackId="a" 
              radius={[4, 4, 0, 0]} 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="investimento" 
              name="Investimento" 
              stroke="#eab308" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
