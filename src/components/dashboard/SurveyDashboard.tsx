import * as React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { SurveyEntry } from '../../lib/types';

interface SurveyDashboardProps {
  entries: SurveyEntry[];
  isLoading?: boolean;
}

// Cores para os gráficos
const COLORS = ['#3b82f6','#22c55e','#eab308','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'];

// Helper: agrupa array de strings e retorna [{name, value}] ordenado por value desc
function contarOcorrencias(arr: (string | undefined | null)[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  arr.forEach(v => {
    if (!v) return;
    map[v] = (map[v] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Tooltip customizado escuro
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name || p.dataKey}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function SurveyDashboard({ entries, isLoading }: SurveyDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="h-64 p-6 animate-pulse bg-muted/30" /></Card>
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="text-center p-16 border rounded-lg border-dashed text-muted-foreground">
        Nenhuma resposta de pesquisa no período selecionado.
      </div>
    );
  }

  // Agrupa dados para cada gráfico
  const totalRespostas = entries.length;
  const dadosGenero = contarOcorrencias(entries.map(e => e.genero));
  const dadosIdade = contarOcorrencias(entries.map(e => e.idade));
  const dadosEscolaridade = contarOcorrencias(entries.map(e => e.escolaridade));
  const dadosProfissao = contarOcorrencias(entries.map(e => e.profissao)).slice(0, 10);
  const dadosEstado = contarOcorrencias(entries.map(e => e.estado)).slice(0, 10);
  const dadosRenda = contarOcorrencias(entries.map(e => e.renda));
  const dadosMoraCom = contarOcorrencias(entries.map(e => e.mora_com));
  const dadosJaEstudou = contarOcorrencias(entries.map(e => e.ja_estudou));
  const dadosExperiencia = contarOcorrencias(entries.map(e => e.experiencia_concursos));
  const dadosOQueImpede = contarOcorrencias(entries.map(e => e.o_que_impede)).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header com total */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalRespostas.toLocaleString('pt-BR')}</div>
            <div className="text-xs text-muted-foreground mt-1">Total de Respostas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {dadosGenero.find(g => g.name === 'FEMININO')?.value || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Feminino</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {dadosGenero.find(g => g.name === 'MASCULINO')?.value || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Masculino</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {dadosJaEstudou.find(j => j.name === 'SIM')?.value || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Já estudou conosco</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos linha 1: Gênero (pizza) + Idade (barras) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Gênero</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosGenero} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" nameKey="name" label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(1)}%`}>
                  {dadosGenero.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Faixa Etária</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosIdade} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                <XAxis dataKey="name" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} width={35} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" name="Respostas" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos linha 2: Escolaridade (barras) + Renda (barras) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Escolaridade</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosEscolaridade} layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/50" />
                <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" className="text-xs"
                  tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" name="Respostas" fill="#22c55e" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Renda Atual</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosRenda} layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/50" />
                <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" className="text-xs"
                  tickLine={false} axisLine={false} width={160} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" name="Respostas" fill="#eab308" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos linha 3: Top Profissões + Top Estados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 10 Profissões</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dadosProfissao.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[200px]">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.value / dadosProfissao[0].value) * 100}%` }} />
                    </div>
                    <span className="font-medium w-8 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top 10 Estados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dadosEstado.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(item.value / dadosEstado[0].value) * 100}%` }} />
                    </div>
                    <span className="font-medium w-8 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos linha 4: Mora com (pizza) + Experiência concursos (barras) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Mora com quem?</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosMoraCom} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" nameKey="name">
                  {dadosMoraCom.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Experiência em Concursos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dadosExperiencia.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-muted-foreground text-xs leading-tight flex-1">{item.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full"
                        style={{ width: `${(item.value / dadosExperiencia[0].value) * 100}%` }} />
                    </div>
                    <span className="font-medium w-8 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* O que impede os estudos - tabela */}
      <Card>
        <CardHeader><CardTitle className="text-sm">O que impede ou atrapalha os estudos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {dadosOQueImpede.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                <span className="text-muted-foreground truncate">{item.name}</span>
                <Badge variant="secondary" className="ml-2 shrink-0">{item.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
