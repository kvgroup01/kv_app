import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Download, Trash2, Filter, X, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
  $id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  escolaridade?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  data?: string;
  lancamento_id?: string;
}

interface LeadsTableProps {
  lancamentoId: string;
  isLoading?: boolean;
}

export function LeadsTable({ lancamentoId, isLoading }: LeadsTableProps) {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState(false);

  // Filtros
  const [search, setSearch] = React.useState('');
  const [filterEscolaridade, setFilterEscolaridade] = React.useState('todos');
  const [filterSource, setFilterSource] = React.useState('todos');
  const [filterCampanha, setFilterCampanha] = React.useState('todos');
  const [filterData, setFilterData] = React.useState({ from: '', to: '' });

  // Carregar leads
  const carregarLeads = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads-list?lancamentoId=${lancamentoId}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e) {
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  }, [lancamentoId]);

  React.useEffect(() => { carregarLeads(); }, [carregarLeads]);

  // Filtrar leads
  const leadsFiltrados = React.useMemo(() => {
    return leads.filter(lead => {
      if (search) {
        const s = search.toLowerCase();
        const match = [lead.nome, lead.email, lead.telefone]
          .some(v => v?.toLowerCase().includes(s));
        if (!match) return false;
      }
      if (filterEscolaridade !== 'todos' && lead.escolaridade !== filterEscolaridade) return false;
      if (filterSource !== 'todos' && lead.utm_source !== filterSource) return false;
      if (filterCampanha !== 'todos' && lead.utm_campaign !== filterCampanha) return false;
      if (filterData.from && lead.data && lead.data < filterData.from) return false;
      if (filterData.to && lead.data && lead.data > filterData.to) return false;
      return true;
    });
  }, [leads, search, filterEscolaridade, filterSource, filterCampanha, filterData]);

  // Opções únicas para filtros
  const escolaridades = React.useMemo(() =>
    [...new Set(leads.map(l => l.escolaridade).filter(Boolean))], [leads]);
  const sources = React.useMemo(() =>
    [...new Set(leads.map(l => l.utm_source).filter(Boolean))], [leads]);
  const campanhas = React.useMemo(() =>
    [...new Set(leads.map(l => l.utm_campaign).filter(Boolean))], [leads]);

  // Seleção
  const toggleAll = () => {
    if (selected.size === leadsFiltrados.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leadsFiltrados.map(l => l.$id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  // Exportar CSV
  const exportarCSV = () => {
    const alvos = leadsFiltrados.filter(l => selected.size === 0 || selected.has(l.$id));
    if (alvos.length === 0) { toast.error('Nenhum lead para exportar'); return; }

    const cols = ['data', 'nome', 'email', 'telefone', 'escolaridade',
      'utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'];
    const header = cols.join(',');
    const rows = alvos.map(l =>
      cols.map(c => `"${String((l as any)[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${lancamentoId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${alvos.length} leads exportados`);
  };

  // Deletar
  const deletarSelecionados = async () => {
    const ids = selected.size > 0
      ? [...selected]
      : leadsFiltrados.map(l => l.$id);

    if (ids.length === 0) { toast.error('Nenhum lead selecionado'); return; }
    if (!confirm(`Deletar ${ids.length} lead(s)?`)) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/leads-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.deleted) {
        toast.success(`${data.deleted} lead(s) deletado(s)`);
        setSelected(new Set());
        await carregarLeads();
      }
    } catch (e) {
      toast.error('Erro ao deletar leads');
    } finally {
      setDeleting(false);
    }
  };

  const limparFiltros = () => {
    setSearch('');
    setFilterEscolaridade('todos');
    setFilterSource('todos');
    setFilterCampanha('todos');
    setFilterData({ from: '', to: '' });
  };

  const temFiltros = search || filterEscolaridade !== 'todos' ||
    filterSource !== 'todos' || filterCampanha !== 'todos' ||
    filterData.from || filterData.to;

  if (isLoading || loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com contagem e ações */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold">Lista de Leads</h3>
          <p className="text-sm text-muted-foreground">
            {leadsFiltrados.length} de {leads.length} leads
            {selected.size > 0 && ` · ${selected.size} selecionados`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={deletarSelecionados}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {selected.size > 0 ? `Deletar (${selected.size})` : 'Deletar filtrados'}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Busca */}
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, email, telefone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Escolaridade */}
            <Select value={filterEscolaridade} onValueChange={setFilterEscolaridade}>
              <SelectTrigger><SelectValue placeholder="Escolaridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas escolaridades</SelectItem>
                {escolaridades.map(e => (
                  <SelectItem key={e as string} value={e as string}>{e as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* UTM Source */}
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas origens</SelectItem>
                {sources.map(s => (
                  <SelectItem key={s as string} value={s as string}>{s as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Campanha */}
            <Select value={filterCampanha} onValueChange={setFilterCampanha}>
              <SelectTrigger><SelectValue placeholder="Campanha" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas campanhas</SelectItem>
                {campanhas.map(c => (
                  <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Limpar filtros */}
            {temFiltros && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}
                className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Filtro de data */}
          <div className="flex gap-3 mt-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">De:</label>
              <Input
                type="date"
                value={filterData.from}
                onChange={e => setFilterData({ ...filterData, from: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Até:</label>
              <Input
                type="date"
                value={filterData.to}
                onChange={e => setFilterData({ ...filterData, to: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-md">
        <div className="w-full overflow-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10 shadow-sm border-b">
              <tr>
                <th className="p-3 text-left font-medium w-[40px]">
                  <Checkbox 
                    checked={selected.size === leadsFiltrados.length && leadsFiltrados.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left font-medium">Nome</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Telefone</th>
                <th className="p-3 text-left font-medium">Data</th>
                <th className="p-3 text-left font-medium">Source / Campaign</th>
              </tr>
            </thead>
            <tbody>
              {leadsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum lead encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                leadsFiltrados.map((lead) => (
                  <tr key={lead.$id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3">
                      <Checkbox 
                        checked={selected.has(lead.$id)}
                        onCheckedChange={() => toggleOne(lead.$id)}
                      />
                    </td>
                    <td className="p-3 font-medium truncate max-w-[150px]">
                      {lead.nome || '-'}
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">
                      {lead.email || '-'}
                    </td>
                    <td className="p-3 truncate">{lead.telefone || '-'}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {lead.data ? new Date(lead.data).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="truncate max-w-[200px]" title={lead.utm_source}>
                          {lead.utm_source || '-'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={lead.utm_campaign}>
                          {lead.utm_campaign || '-'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
