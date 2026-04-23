import * as React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { toast } from 'sonner';
import { useCriarCliente, usePastas } from '../../../hooks/useClientes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { CONFIG } from '../../../lib/constants';

export default function NovoCliente() {
  const navigate = useNavigate();
  const criarMut = useCriarCliente();
  const { data: pastas } = usePastas();

  // Estados do form
  const [nome, setNome] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugModificado, setSlugModificado] = React.useState(false);
  
  const [tipoCampanha, setTipoCampanha] = React.useState('whatsapp');
  const [pastaId, setPastaId] = React.useState('sem-pasta');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [spreadsheetId, setSpreadsheetId] = React.useState('');

  // Auto-geração do link slug
  React.useEffect(() => {
    if (!slugModificado) {
      const generated = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, "") // Remove acentos
        .replace(/\\s+/g, '-') // Espaços para traço
        .replace(/[^a-z0-9-]/g, '') // Remove especial
        .replace(/-+/g, '-') // Traços múltiplos
        .replace(/^-|-$/g, ''); // Traço início e fim
      setSlug(generated);
    }
  }, [nome, slugModificado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !slug || !spreadsheetId) return;

    criarMut.mutate({
      nome,
      slug,
      tipo_campanha: tipoCampanha as any,
      pasta_id: pastaId === 'sem-pasta' ? '' : pastaId,
      logo_url: logoUrl || '',
      spreadsheet_id: spreadsheetId,
      ativo: true
    }, {
      onSuccess: () => {
        toast.success("Cliente criado com sucesso!");
        navigate('/admin/clientes');
      },
      onError: (err: any) => {
        toast.error("Erro ao criar cliente: " + (err.message || "Erro desconhecido"));
      }
    });
  };

  return (
    <div className="space-y-10 max-w-[1000px] mx-auto pb-20">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="h-10 w-10 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 rounded-lg border border-transparent hover:border-(--card-border)" onClick={() => navigate('/admin/clientes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-[22px] font-semibold text-(--text-primary)">Novo cliente</h2>
          <p className="text-[13px] text-(--text-secondary) mt-1">Cadastre um novo painel para acompanhamento automatizado.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-8 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-blue) rounded-full" />
          
          <div className="mb-10">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Informações do Painel</h3>
            <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-wider">Estes dados serão mapeados para criar o dashboard público</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-[13px] text-(--text-secondary)">Nome do Cliente <span className="text-red-500">*</span></Label>
              <Input 
                 id="nome" 
                 placeholder="Ex: Clínica Sorriso" 
                 required 
                 value={nome}
                 onChange={e => setNome(e.target.value)}
                 disabled={criarMut.isPending}
                 className="h-11 bg-black/40 border-(--card-border) focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg text-[14px]"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="slug" className="text-[13px] text-(--text-secondary)">Link Identificador (Slug) <span className="text-red-500">*</span></Label>
              <Input 
                 id="slug" 
                 placeholder="clinica-sorriso" 
                 required 
                 value={slug}
                 onChange={e => {
                   setSlug(e.target.value);
                   setSlugModificado(true);
                 }}
                 disabled={criarMut.isPending}
                 className="h-11 bg-black/40 border-(--card-border) focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg font-mono text-[14px]"
              />
              {slug && (
                 <p className="text-[12px] text-blue-500/80 bg-blue-500/5 px-4 py-3 rounded-lg border border-blue-500/10 flex items-center gap-2">
                   <span className="text-blue-500 font-bold uppercase text-[10px] tracking-wider">Preview:</span>
                   <span className="truncate">{CONFIG.APP_URL}/dashboard/{slug}</span>
                 </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[13px] text-(--text-secondary)">Tipo de Campanha</Label>
                <Select value={tipoCampanha} onValueChange={setTipoCampanha} disabled={criarMut.isPending}>
                  <SelectTrigger className="h-11 bg-black/40 border-(--card-border) rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                    <SelectItem value="whatsapp">Foco em WhatsApp</SelectItem>
                    <SelectItem value="leads">Foco em Leads List</SelectItem>
                    <SelectItem value="ambos">Híbrido (Ambos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] text-(--text-secondary)">Pasta Organizacional</Label>
                <Select value={pastaId} onValueChange={setPastaId} disabled={criarMut.isPending}>
                  <SelectTrigger className="h-11 bg-black/40 border-(--card-border) rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                    <SelectItem value="sem-pasta">Sem pasta (Avulso)</SelectItem>
                    {pastas?.map((p: any) => (
                      <SelectItem key={p.$id} value={p.$id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="text-[13px] text-(--text-secondary)">URL da Logo (Opcional)</Label>
              <Input 
                 id="logoUrl" 
                 type="url"
                 placeholder="https://exemplo.com/logo.png" 
                 value={logoUrl}
                 onChange={e => setLogoUrl(e.target.value)}
                 disabled={criarMut.isPending}
                 className="h-11 bg-black/40 border-(--card-border) rounded-lg text-[14px]"
              />
            </div>
          </div>
        </div>

        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-8 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-green) rounded-full" />
          
          <div className="mb-10">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Integração Automatizada</h3>
            <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-wider">Conecte a fonte de dados do Google Sheets</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="spreadSheet" className="text-[13px] text-(--text-secondary)">ID da Planilha Google <span className="text-red-500">*</span></Label>
              <Input 
                 id="spreadSheet" 
                 placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" 
                 required
                 value={spreadsheetId}
                 onChange={e => setSpreadsheetId(e.target.value)}
                 disabled={criarMut.isPending}
                 className="h-11 bg-black/40 border-(--card-border) font-mono text-[13px] rounded-lg"
              />
              <p className="text-[11px] text-(--text-tertiary) italic px-1 mt-2">
                 O ID é encontrado na URL da planilha do cliente entre /d/ e /edit.
              </p>
            </div>

            <div className="pt-10 flex justify-end gap-4 border-t border-(--card-border)">
              <Button type="button" variant="ghost" className="h-11 px-8 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5" onClick={() => navigate('/admin/clientes')} disabled={criarMut.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarMut.isPending || !nome || !slug || !spreadsheetId} className="h-11 px-10 bg-white text-black hover:bg-zinc-200 text-[13px] font-semibold">
                {criarMut.isPending ? 'Sincronizando...' : 'Finalizar Cadastro'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
