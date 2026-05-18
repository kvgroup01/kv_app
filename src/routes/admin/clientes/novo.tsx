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
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-10 w-10 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 rounded-lg border border-transparent hover:border-(--card-border)" onClick={() => navigate('/admin/clientes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-[24px] font-bold text-(--text-primary)">Novo cliente</h2>
          <p className="text-[14px] text-(--text-secondary) mt-1">Cadastre um novo painel para acompanhamento automatizado.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-(--card-bg) border border-(--card-border) rounded-xl p-8 shadow-sm">
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-[14px] font-medium text-(--text-primary)">Nome do Cliente <span className="text-red-500">*</span></Label>
              <Input 
                 id="nome" 
                 placeholder="Ex: Clínica Sorriso" 
                 required 
                 value={nome}
                 onChange={e => setNome(e.target.value)}
                 disabled={criarMut.isPending}
                 className="h-11 w-full bg-background border-(--card-border) focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg text-[14px]"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="slug" className="text-[14px] font-medium text-(--text-primary)">Link Identificador (Slug) <span className="text-red-500">*</span></Label>
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
                 className="h-11 w-full bg-background border-(--card-border) focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg font-mono text-[14px]"
              />
              {slug && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded text-[13px] text-blue-500 truncate cursor-not-allowed">
                  <LinkIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{CONFIG.APP_URL.replace(/^https?:\/\//, '')}/dashboard/{slug}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[14px] font-medium text-(--text-primary)">Tipo de Campanha</Label>
                <Select value={tipoCampanha} onValueChange={setTipoCampanha} disabled={criarMut.isPending}>
                  <SelectTrigger className="h-11 bg-background border-(--card-border) rounded-lg w-full">
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
                <Label className="text-[14px] font-medium text-(--text-primary)">Pasta Organizacional</Label>
                <Select value={pastaId} onValueChange={setPastaId} disabled={criarMut.isPending}>
                  <SelectTrigger className="h-11 bg-background border-(--card-border) rounded-lg w-full">
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
              <Label htmlFor="logoUrl" className="text-[14px] font-medium text-(--text-primary)">URL da Logo (Opcional)</Label>
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

          <div className="pt-8 mt-8 flex justify-end gap-3 border-t border-(--card-border)">
            <Button type="button" variant="ghost" className="h-11 px-6 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5" onClick={() => navigate('/admin/clientes')} disabled={criarMut.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criarMut.isPending || !nome || !slug} className="h-11 px-8 bg-(--text-primary) text-(--body-bg) hover:bg-(--text-secondary) font-medium rounded-lg">
              {criarMut.isPending ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
