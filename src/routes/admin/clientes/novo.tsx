import * as React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MessageCircle, Users, Layers, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

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

  // Auto-geração do link slug
  React.useEffect(() => {
    if (!slugModificado) {
      const generated = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\s+/g, '-') // Espaços para traço
        .replace(/[^a-z0-9-]/g, '') // Remove especial
        .replace(/-+/g, '-') // Traços múltiplos
        .replace(/^-|-$/g, ''); // Traço início e fim
      setSlug(generated);
    }
  }, [nome, slugModificado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !slug) return;

    criarMut.mutate({
      nome,
      slug,
      tipo_campanha: tipoCampanha as any,
      pasta_id: pastaId === 'sem-pasta' ? '' : pastaId,
      logo_url: logoUrl || '',
      spreadsheet_id: '', // removed from form, kept as empty string to fit DB schema if needed
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
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
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
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-8 shadow-premium hover:border-border transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-blue) rounded-full" />
          
          <div className="mb-10">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Informações do Painel</h3>
            <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-wider">Estes dados serão mapeados para criar o dashboard público</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                   className="h-11 bg-background border-(--card-border) focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg text-[14px]"
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
                   className="h-11 bg-background border-(--card-border) focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg font-mono text-[14px]"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <Label className="text-[13px] text-(--text-secondary) mb-2">Preview do Dashboard</Label>
              <div className="flex-1 bg-background/50 border border-(--card-border) rounded-xl p-6 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <LinkIcon className="h-6 w-6 text-blue-500" />
                </div>
                {slug ? (
                  <>
                    <p className="text-[13px] font-medium text-(--text-primary)">Seu link está pronto para uso:</p>
                    <a href={`${CONFIG.APP_URL}/dashboard/${slug}`} target="_blank" rel="noreferrer" className="text-blue-500 font-mono mt-2 text-[14px] hover:underline break-all">
                      {CONFIG.APP_URL}/dashboard/{slug}
                    </a>
                  </>
                ) : (
                  <p className="text-[13px] text-(--text-tertiary)">Preencha o nome para gerar o link do painel.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-2">
              <Label className="text-[13px] text-(--text-secondary)">Tipo de Campanha</Label>
              <Select value={tipoCampanha} onValueChange={setTipoCampanha} disabled={criarMut.isPending}>
                <SelectTrigger className="h-11 bg-background border-(--card-border) rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2 text-[13px]">
                      <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="leads">
                    <div className="flex items-center gap-2 text-[13px]">
                      <Users className="h-4 w-4 text-blue-500" /> Leads List
                    </div>
                  </SelectItem>
                  <SelectItem value="ambos">
                    <div className="flex items-center gap-2 text-[13px]">
                      <Layers className="h-4 w-4 text-purple-500" /> Híbrido (Ambos)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] text-(--text-secondary)">Pasta Organizacional</Label>
              <Select value={pastaId} onValueChange={setPastaId} disabled={criarMut.isPending}>
                <SelectTrigger className="h-11 bg-background border-(--card-border) rounded-lg">
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

          <div className="mt-8 space-y-2">
            <Label htmlFor="logoUrl" className="text-[13px] text-(--text-secondary)">URL da Logo (Opcional)</Label>
            <div className="flex items-center gap-4">
              <Input 
                 id="logoUrl" 
                 type="url"
                 placeholder="https://exemplo.com/logo.png" 
                 value={logoUrl}
                 onChange={e => setLogoUrl(e.target.value)}
                 disabled={criarMut.isPending}
                 className="flex-1 h-11 bg-background border-(--card-border) rounded-lg text-[14px]"
              />
              <div className="w-11 h-11 bg-background border border-(--card-border) rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <ImageIcon className="h-5 w-5 text-(--text-tertiary)" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex justify-end gap-4 border-t border-(--card-border)">
          <Button type="button" variant="ghost" className="h-11 px-8 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5" onClick={() => navigate('/admin/clientes')} disabled={criarMut.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={criarMut.isPending || !nome || !slug} className="h-11 px-10 bg-white text-black hover:bg-zinc-200 text-[13px] font-semibold">
            {criarMut.isPending ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </Button>
        </div>
      </form>
    </div>
  );
}
