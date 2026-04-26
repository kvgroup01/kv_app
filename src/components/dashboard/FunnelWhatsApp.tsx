import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";
import type { MetricasAgregadas } from "../../lib/types";
import { fmtNum, fmtPct } from "../../lib/utils";

interface FunnelWhatsAppProps {
  metricas: MetricasAgregadas;
  onVendasChange: (vendas: number) => void;
}

const COLORS = ["#3b82f6", "#0ea5e9", "#06b6d4", "#10b981", "#22c55e"];

export function FunnelWhatsApp({
  metricas,
  onVendasChange,
}: FunnelWhatsAppProps) {
  const [vendasLocal, setVendasLocal] = React.useState<number>(
    metricas.vendas || 0,
  );

  // Sincroniza estado local se as props mudarem por fora
  React.useEffect(() => {
    setVendasLocal(metricas.vendas || 0);
  }, [metricas.vendas]);

  const handleVendasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setVendasLocal(val);
    onVendasChange(val);
  };

  const constructFunnelData = () => {
    const steps = [
      {
        name: "Impressões",
        value: metricas.impressoes,
        base: metricas.impressoes,
      },
      { name: "Alcance", value: metricas.alcance, base: metricas.impressoes },
      { name: "Cliques", value: metricas.cliques, base: metricas.alcance },
      { name: "Conversas", value: metricas.conversas, base: metricas.cliques },
      { name: "Vendas", value: vendasLocal, base: metricas.conversas },
    ];

    return steps.map((step, index) => {
      let conversao = 0;
      if (index === 0) {
        conversao = 100;
      } else {
        const prevValue = steps[index - 1].value;
        conversao = prevValue > 0 ? (step.value / prevValue) * 100 : 0;
      }

      return {
        ...step,
        conversao,
        fillColor: COLORS[index % COLORS.length],
      };
    });
  };

  const data = constructFunnelData();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] text-popover-foreground shadow-sm rounded-lg p-3 z-[9999]">
          <p className="font-semibold mb-1">{pData.name}</p>
          <p className="text-sm">
            <span className="text-muted-foreground mr-2">Volume:</span>
            {fmtNum(pData.value)}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground mr-2">
              Conversão da etapa anterior:
            </span>
            {fmtPct(pData.conversao)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Funil de WhatsApp</CardTitle>
          <CardDescription>Conversão de etapa por etapa</CardDescription>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className="text-xs text-muted-foreground font-medium uppercase">
            Vendas Registradas
          </span>
          <Input
            type="number"
            value={vendasLocal || ""}
            onChange={handleVendasChange}
            placeholder="0"
            className="w-24 h-8 text-right font-medium"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none">
          <BarChart
            className="outline-none focus:outline-none"
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              className="stroke-muted"
            />
            <XAxis
              type="number"
              className="text-xs text-muted-foreground"
              tickFormatter={(val) => fmtNum(val)}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              className="text-sm font-medium"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              barSize={32}
              animationDuration={1000}
            >
              {(data ?? []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fillColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
