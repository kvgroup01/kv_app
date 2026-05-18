import * as React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useCriarCliente, usePastas } from '../../../hooks/useClientes';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { CONFIG } from '../../../lib/constants';

export default function NovoCliente() {
  const navigate = useNavigate();
  const criarMut = useCriarCliente();
  const { data: pastas } = usePastas();

  const [nome, setNome] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugModificado, setSlugModificado] = React.useState(false);
  const [tipoCampanha, setTipoCampanha] = React.useState('whatsapp');
  const [pastaId, setPastaId] = React.useState('sem-pasta');
  const [logoUrl, setLogoUrl] = React.useState('');

  React.useEffect(() => {
    if (!slugModificado) {
      const generated = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
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
      ativo: true,
    }, {
      onSuccess: () => {
        toast.success('Cliente criado com sucesso!');
        navigate('/admin/clientes');
      },
      onError: (err: any) => {
        toast.error('Erro ao criar cliente: ' + (err.message || 'Erro desconhecido'));
      }
    });
  };

  return (
    <div className="space-y-8 max-w-[560px] mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => navigate('/admin/clientes')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-[22px] font-semibold text-(--text-primary)">Novo cliente</h2>
          <p className="text-[13px] text-(--text-secondary) mt-0.5">Cadastre um novo painel de acompanhamento.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-(--card-border) bg-(--card-bg) divide-y divide-(--card-border)">
          
          {/* Nome */}
          <div className="p-6 space-y-2">
            <Label className="text-[13px] font-medium text-(--text-secondary)">
              Nome do Cliente <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ex: Clínica Sorriso"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              disabled={criarMut.isPending}
              className="h-10 bg-(--card-bg) border-(--card-border) text-(--text-primary) placeholder:text-(--text-tertiary) focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>

          {/* Slug */}
          <div className="p-6 space-y-2">
            <Label className="text-[13px] font-medium text-(--text-secondary)">
              Link Identificador (Slug) <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugModificado(true); }}
              disabled={criarMut.isPending}
              className="h-10 font-mono text-[13px] bg-(--card-bg) border-(--card-border) text-(--text-primary) focus-visible:ring-1 focus-visible:ring-blue-500"
              placeholder="clinica-sorriso"
            />
            {slug && (
              <p className="text-[12px] text-blue-500 mt-1">
                {CONFIG.APP_URL}/dashboard/<strong>{slug}</strong>
              </p>
            )}
          </div>

          {/* Tipo e Pasta */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-(--text-secondary)">Tipo de Campanha</Label>
              <Select value={tipoCampanha} onValueChange={setTipoCampanha} disabled={criarMut.isPending}>
                <SelectTrigger className="h-10 bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="ambos">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-(--text-secondary)">Pasta</Label>
              <Select value={pastaId} onValueChange={setPastaId} disabled={criarMut.isPending}>
                <SelectTrigger className="h-10 bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-pasta">Sem pasta</SelectItem>
                  {pastas?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logo */}
          <div className="p-6 space-y-2">
            <Label className="text-[13px] font-medium text-(--text-secondary)">URL da Logo (Opcional)</Label>
            <Input
              type="url"
              placeholder="https://exemplo.com/logo.png"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              disabled={criarMut.isPending}
              className="h-10 bg-(--card-bg) border-(--card-border) text-(--text-primary) placeholder:text-(--text-tertiary)"
            />
          </div>

          {/* Ações */}
          <div className="p-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/clientes')}
              disabled={criarMut.isPending}
              className="h-10 px-6 text-(--text-secondary) hover:text-(--text-primary)"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={criarMut.isPending || !nome || !slug}
              className="h-10 px-8 bg-(--text-primary) text-(--card-bg) hover:opacity-90 font-medium text-[13px]"
            >
              {criarMut.isPending ? 'Criando...' : 'Finalizar Cadastro'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
