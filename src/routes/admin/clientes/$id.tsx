import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { useCliente, useAtualizarCliente, usePastas } from '../../../hooks/useClientes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';

export default function EditarCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: cliente, isLoading: loadingCliente } = useCliente(id);
  const { data: pastas } = usePastas();
  const atualizarMut = useAtualizarCliente();

  // Estados do form (Initializados em brancos, populados no effect)
  const [nome, setNome] = React.useState('');
  const [slug, setSlug] = React.useState('');
  
  const [tipoCampanha, setTipoCampanha] = React.useState('');
  const [pastaId, setPastaId] = React.useState('sem-pasta');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [spreadsheetId, setSpreadsheetId] = React.useState('');
  const [ativo, setAtivo] = React.useState('true');

  React.useEffect(() => {
    if (cliente) {
      setNome(cliente.nome);
      setSlug(cliente.slug);
      setTipoCampanha(cliente.tipo_campanha);
      setPastaId(cliente.pasta_id || 'sem-pasta');
      setLogoUrl(cliente.logo_url || '');
      setSpreadsheetId(cliente.spreadsheet_id);
      setAtivo(cliente.ativo ? 'true' : 'false');
    }
  }, [cliente]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !nome || !slug || !spreadsheetId) return;

    atualizarMut.mutate({
      id,
      data: {
        nome,
        slug,
        tipo_campanha: tipoCampanha as any,
        pasta_id: pastaId === 'sem-pasta' ? null : pastaId,
        logo_url: logoUrl || '',
        spreadsheet_id: spreadsheetId,
        ativo: ativo === 'true'
      }
    }, {
      onSuccess: () => navigate('/admin/clientes')
    });
  };

  if (loadingCliente) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-[200px]" />
        <Card>
           <CardContent className="p-6 space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <div className="grid grid-cols-2 gap-4">
                 <Skeleton className="h-16" />
                 <Skeleton className="h-16" />
              </div>
           </CardContent>
        </Card>
      </div>
    );
  }

  const domain = import.meta.env.VITE_APP_URL || window.location.origin;

  return (
    <div className="space-y-10 max-w-[1000px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 rounded-lg border border-transparent hover:border-(--card-border)" onClick={() => navigate('/admin/clientes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-[22px] font-semibold text-(--text-primary)">Editar cliente</h2>
            <p className="text-[13px] text-(--text-secondary) mt-1">Atualize as configurações e integrações do cliente.</p>
          </div>
        </div>
        {cliente && (
           <Button variant="outline" className="h-10 px-6 border-(--card-border) hover:bg-[#1a1a1a] text-(--text-primary) text-[13px] font-medium" onClick={() => window.open(`\${domain}/dashboard/\${cliente.slug}`, '_blank')}>
             <ExternalLink className="mr-2 h-4 w-4" /> Link do Dashboard
           </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-8 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-blue) rounded-full" />
          
          <div className="mb-10">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Informações Gerais</h3>
            <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-wider">Configurações principais e visual da conta</p>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               <div className="space-y-2">
                 <Label className="text-[13px] text-(--text-secondary)">Status da Conta</Label>
                 <Select value={ativo} onValueChange={setAtivo} disabled={atualizarMut.isPending}>
                   <SelectTrigger className="h-11 bg-black/40 border-(--card-border) focus:ring-1 focus:ring-blue-500 rounded-lg">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                     <SelectItem value="true">Ativa (Visível)</SelectItem>
                     <SelectItem value="false">Inativa (Pausada)</SelectItem>
                   </SelectContent>
                 </Select>
                 <p className="text-[11px] text-(--text-tertiary) mt-2 italic px-1">
                   Inativar esconde dos rankings gerais e do painel inicial.
                 </p>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="nome" className="text-[13px] text-(--text-secondary)">Nome do Cliente <span className="text-red-500">*</span></Label>
                 <Input 
                   id="nome" 
                   required 
                   value={nome}
                   onChange={e => setNome(e.target.value)}
                   disabled={atualizarMut.isPending}
                   className="h-11 bg-black/40 border-(--card-border) focus-visible:ring-1 focus-visible:ring-blue-500"
                   placeholder="Ex: Agência KV Group"
                 />
               </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="slug" className="text-[13px] text-(--text-secondary)">Identificador / Link Público (Slug) <span className="text-red-500">*</span></Label>
              <div className="relative group/slug">
                <Input 
                   id="slug" 
                   required 
                   value={slug}
                   onChange={e => setSlug(e.target.value)}
                   disabled={atualizarMut.isPending}
                   className="h-11 bg-black/40 border-(--card-border) focus-visible:ring-1 focus-visible:ring-blue-500 font-mono text-[14px]"
                   placeholder="agencia-kv"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <Target className="h-4 w-4 text-(--text-tertiary) opacity-0 group-hover/slug:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="text-[12px] text-blue-500/80 bg-blue-500/5 px-4 py-3 rounded-lg border border-blue-500/10 flex items-center gap-2">
                <span className="text-blue-500 font-bold uppercase text-[10px] tracking-wider">Url Ativa:</span>
                <span className="truncate hover:underline cursor-pointer">{domain}/dashboard/{slug}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[13px] text-(--text-secondary)">Tipo de Campanha</Label>
                <Select value={tipoCampanha} onValueChange={setTipoCampanha} disabled={atualizarMut.isPending}>
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
                <Select value={pastaId} onValueChange={setPastaId} disabled={atualizarMut.isPending}>
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
                 value={logoUrl}
                 onChange={e => setLogoUrl(e.target.value)}
                 disabled={atualizarMut.isPending}
                 className="h-11 bg-black/40 border-(--card-border)"
                 placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </div>
        </div>

        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-8 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-green) rounded-full" />
          
          <div className="mb-10">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Integração de Dados</h3>
            <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-wider">Conexão com as planilhas do Google</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="spreadSheet" className="text-[13px] text-(--text-secondary)">ID da Planilha Google <span className="text-red-500">*</span></Label>
              <Input 
                 id="spreadSheet" 
                 required
                 value={spreadsheetId}
                 onChange={e => setSpreadsheetId(e.target.value)}
                 disabled={atualizarMut.isPending}
                 className="h-11 bg-black/40 border-(--card-border) font-mono text-[13px]"
                 placeholder="1ABCdefGHIjklMNOpqrSTUvwxYZ..."
              />
              <p className="text-[11px] text-(--text-tertiary) italic px-1 mt-2">
                O ID é a parte entre "/d/" e "/edit" na URL da planilha.
              </p>
            </div>

            <div className="pt-10 flex justify-end gap-4 border-t border-(--card-border)">
              <Button type="button" variant="ghost" className="h-11 px-8 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5" onClick={() => navigate('/admin/clientes')} disabled={atualizarMut.isPending}>
                Descartar
              </Button>
              <Button type="submit" disabled={atualizarMut.isPending || !nome || !slug || !spreadsheetId} className="h-11 px-10 bg-white text-black hover:bg-zinc-200 text-[13px] font-semibold">
                {atualizarMut.isPending ? 'Sincronizando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
