import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { fmtNum, fmtPct } from '../../lib/utils';

interface ClassificacaoTraficoProps {
  leadsEnsino: {
    superior: number;
    medio: number;
  };
  isLoading?: boolean;
}

const COLORS = {
  superior: '#3b82f6', // blue-500
  medio: '#22c55e'     // green-500
};

export function ClassificacaoTrafico({ leadsEnsino, isLoading }: ClassificacaoTraficoProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-full max-w-[200px] mx-auto" />
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-10" /></div>
              <Skeleton className="h-3 w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-10" /></div>
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const superior = leadsEnsino?.superior ?? 0;
  const medio = leadsEnsino?.medio ?? 0;
  const total = superior + medio;
  const pctSuperior = total > 0 ? (superior / total) * 100 : 0;
  const pctMedio = total > 0 ? (medio / total) * 100 : 0;

  const chartData = [
    { name: 'Ensino Superior', value: superior, color: COLORS.superior },
    { name: 'Ensino Médio', value: medio, color: COLORS.medio }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] text-popover-foreground shadow-sm rounded-lg p-3 text-sm z-[9999]">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-semibold">{data.name}</span>
          </div>
          <p className="mt-1 ml-5 text-muted-foreground">
            Leads: <span className="font-medium text-foreground">{fmtNum(data.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Classificação do Tráfego</CardTitle>
        <CardDescription>Escolaridade declarada pelos leads</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Seção 1: Gráfico de Pizza */}
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold">{fmtNum(total)}</span>
            <span className="text-xs text-muted-foreground uppercase">Total</span>
          </div>
        </div>

        {/* Seção 2: Barras de Progresso */}
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.superior }} />
                <span className="font-medium">Ensino Superior</span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground mr-2">{fmtNum(superior)}</span>
                ({fmtPct(pctSuperior)})
              </div>
            </div>
            {/* Truque permitido via classes do Tailwind usando Child Selector sem CSS custom */}
            <Progress value={pctSuperior} className="h-2 [&>div]:bg-blue-500" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.medio }} />
                <span className="font-medium">Ensino Médio</span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground mr-2">{fmtNum(medio)}</span>
                ({fmtPct(pctMedio)})
              </div>
            </div>
            <Progress value={pctMedio} className="h-2 [&>div]:bg-green-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
