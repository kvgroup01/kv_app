import * as React from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Check, Copy, Lock, Plus, Trash2, X, Search, CircleCheck
} from 'lucide-react';
import { toast } from 'sonner';

import { useClientes } from '../../../hooks/useClientes';
import { 
  useCriarLancamento, 
  useMetaAccounts, 
  useCriarMetaAccount, 
  useValidarMetaToken, 
  useTestarFiltroCampanhas 
} from '../../../hooks/useLancamentos';

import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { DateRangePicker } from '../../../components/shared/DateRangePicker';
import { cn } from '../../../lib/utils';
import { type DateRange } from 'react-day-picker';

type Coluna = {
  nome: string;
  tipo: string;
  obrigatorio: boolean;
  fixo: boolean;
};

const defaultColunas: Coluna[] = [
  { nome: 'data', tipo: 'data', obrigatorio: true, fixo: true },
  { nome: 'nome', tipo: 'texto', obrigatorio: false, fixo: false },
  { nome: 'email', tipo: 'texto', obrigatorio: false, fixo: false },
  { nome: 'telefone', tipo: 'texto', obrigatorio: false, fixo: false },
  { nome: 'escolaridade', tipo: 'texto', obrigatorio: false, fixo: false },
  { nome: 'utm_source', tipo: 'texto', obrigatorio: false, fixo: false },
  { nome: 'utm_campaign', tipo: 'texto', obrigatorio: false, fixo: false },
  { nome: 'utm_medium', tipo: 'texto', obrigatorio: false, fixo: false },
  { nome: 'utm_term', tipo: 'texto', obrigatorio: false, fixo: false },
  { nome: 'utm_content', tipo: 'texto', obrigatorio: false, fixo: false },
];

const steps = [
  { id: 1, label: 'Identificação' },
  { id: 2, label: 'Colunas' },
  { id: 3, label: 'Webhook' },
  { id: 4, label: 'Meta Ads' },
  { id: 5, label: 'Publicar' },
];

export default function NovoDashboard() {
  const navigate = useNavigate();
  const { data: clientes } = useClientes();
  const { data: metaAccounts } = useMetaAccounts();
  const criarLancamentoMutation = useCriarLancamento();
  const criarMetaAccountMutation = useCriarMetaAccount();
  const validarTokenMutation = useValidarMetaToken();
  const testarFiltroMutation = useTestarFiltroCampanhas();

  const [passo, setPasso] = React.useState(1);
  const [form, setForm] = React.useState({
    cliente_id: '',
    cliente_slug: '',
    nome: '',
    slug: '',
    tipo: 'leads',
    periodo: undefined as DateRange | undefined,
    colunas: defaultColunas,
    meta_account_id: '',
    meta_access_token: '',
    meta_account_nome: '',
    palavra_chave_meta: '',
  });

  const [novaColuna, setNovaColuna] = React.useState({ nome: '', tipo: 'texto' });
  const [showAddColuna, setShowAddColuna] = React.useState(false);

  const [newAccountToken, setNewAccountToken] = React.useState('');
  const [newAccountId, setNewAccountId] = React.useState('');
  const [newAccountName, setNewAccountName] = React.useState('');
  const [campanhasEncontradas, setCampanhasEncontradas] = React.useState<any[] | null>(null);

  const generateSlug = (text: string) => {
    return text.toString().toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nome = e.target.value;
    setForm(prev => ({ ...prev, nome, slug: generateSlug(nome) }));
  };

  const handleAddColuna = () => {
    if (!novaColuna.nome) {
      toast.error('Informe o nome da coluna');
      return;
    }
    if (form.colunas.find(c => c.nome === novaColuna.nome)) {
      toast.error('Já existe uma coluna com este nome');
      return;
    }
    setForm(prev => ({
      ...prev,
      colunas: [...prev.colunas, { ...novaColuna, obrigatorio: false, fixo: false }]
    }));
    setNovaColuna({ nome: '', tipo: 'texto' });
    setShowAddColuna(false);
  };

  const removerColuna = (nome: string) => {
    setForm(prev => ({
      ...prev, 
      colunas: prev.colunas.filter(c => c.nome !== nome || c.fixo)
    }));
  };

  const validarToken = async () => {
    if (!newAccountToken || !newAccountId || !newAccountName) {
      toast.error("Preencha o nome, ID da conta e o token.");
      return;
    }
    
    try {
      const result = await validarTokenMutation.mutateAsync({ accountId: newAccountId, token: newAccountToken });
      
      if (!result.valido || !result.account_id) {
        toast.error("Token/Conta inválido ou sem acesso a publicidade.");
        return;
      }
      
      const nomeContaValido = result.nome_conta || result.account_id;
      
      const novaConta = await criarMetaAccountMutation.mutateAsync({
        nome: newAccountName,
        meta_account_id: result.account_id,
        meta_access_token: newAccountToken
      });

      setForm(prev => ({ 
        ...prev, 
        meta_account_id: result.account_id!, 
        meta_access_token: newAccountToken,
        meta_account_nome: newAccountName
      }));
      
      toast.success(`Conta ${nomeContaValido} salva e selecionada com sucesso!`);
      
      setNewAccountName('');
      setNewAccountId('');
      setNewAccountToken('');
    } catch (e: any) {
      console.error(e);
      toast.error("Falha na validação ou salvamento da conta");
    }
  };

  const testarFiltro = async () => {
    if (!form.meta_account_id || !form.palavra_chave_meta) {
      toast.error("Selecione uma conta e informe a palavra-chave");
      return;
    }
    
    toast.promise(testarFiltroMutation.mutateAsync({
      accountId: form.meta_account_id,
      token: form.meta_access_token,
      palavraChave: form.palavra_chave_meta
    }), {
      loading: 'Buscando campanhas...',
      success: (data) => {
        setCampanhasEncontradas(data);
        return `Encontradas ${data.length} campanhas!`;
      },
      error: 'Erro ao buscar campanhas'
    });
  };

  const handleSalvar = async (status: 'rascunho' | 'ativo') => {
    const payload = {
      cliente_id: form.cliente_id,
      nome: form.nome,
      slug: form.slug,
      tipo: form.tipo,
      status: status,
      palavra_chave_meta: form.palavra_chave_meta,
      meta_account_id: form.meta_account_id,
      meta_access_token: form.meta_access_token,
      colunas_webhook: JSON.stringify(form.colunas),
    };

    try {
      const lancamento = await criarLancamentoMutation.mutateAsync(payload);
      toast.success(status === 'ativo' ? 'Dashboard publicado com sucesso!' : 'Rascunho salvo!');
      navigate('/admin/dashboards');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || 'Desconhecido'));
    }
  };

  const generatePayloadExample = () => {
    const p: Record<string, any> = {};
    form.colunas.forEach(c => {
       if (c.tipo === 'data') p[c.nome] = "2026-04-23";
       else if (c.tipo === 'numero') p[c.nome] = 123;
       else if (c.tipo === 'boolean') p[c.nome] = true;
       else p[c.nome] = "Exemplo";
    });
    return JSON.stringify(p, null, 2);
  };

  const isPassoAtualValid = () => {
    switch (passo) {
      case 1: return form.cliente_id !== '' && form.nome !== '' && form.slug !== '';
      case 2: return form.colunas.length >= 3;
      case 3: return true;
      case 4: return form.meta_account_id !== '' && form.palavra_chave_meta !== '';
      case 5: return true;
      default: return false;
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboards')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Novo Dashboard</h1>
      </div>

      {/* Indicador de fluxo */}
      <div className="flex items-center justify-between relative mt-8 mb-12 px-6">
        <div className="absolute left-[5%] top-1/2 -translate-y-1/2 w-[90%] h-0.5 bg-muted -z-10" />
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-2 z-10 bg-background px-2">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              passo > step.id ? "bg-primary text-primary-foreground" :
              passo === step.id ? "bg-primary text-primary-foreground outline outline-4 outline-primary/20" :
              "bg-muted text-muted-foreground border-2 border-muted"
            )}>
              {passo > step.id ? <Check className="h-4 w-4 stroke-[3]" /> : step.id}
            </div>
            <span className={cn(
              "text-xs font-semibold whitespace-nowrap",
              passo >= step.id ? "text-foreground" : "text-muted-foreground"
            )}>{step.label}</span>
          </div>
        ))}
      </div>

      {/* Passo 1 */}
      {passo === 1 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
            <CardDescription>Configure as informações básicas do lançamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select 
                value={form.cliente_id} 
                onValueChange={(val) => {
                  const c = clientes?.find(x => x.$id === val);
                  setForm(prev => ({ ...prev, cliente_id: val, cliente_slug: c?.slug || '' }));
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map(c => <SelectItem key={c.$id} value={c.$id!}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Lançamento</label>
              <Input 
                placeholder="ex: Captação Abril 2026" 
                value={form.nome} 
                onChange={handleNomeChange}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug do Lançamento</label>
              <Input 
                value={form.slug} 
                onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground pt-1">
                O URL público será: <span className="text-primary/80">/dashboard/{form.cliente_slug || '[cliente]'}/{form.slug || '[lancamento]'}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Dashboard</label>
              <Select 
                value={form.tipo} 
                onValueChange={(val) => setForm(prev => ({ ...prev, tipo: val }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Apenas Leads</SelectItem>
                  <SelectItem value="ambos">Leads + WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Período previsto (Opcional)</label>
              <DateRangePicker 
                value={form.periodo} 
                onChange={val => setForm(prev => ({ ...prev, periodo: val }))} 
                className="w-full bg-background"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passo 2 */}
      {passo === 2 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Quais dados você vai coletar?</CardTitle>
            <CardDescription>Defina as colunas que serão guardadas de cada chumbo/lead.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {form.colunas.map(col => (
                <div key={col.nome} className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                  <div className="flex items-center gap-3">
                    {col.fixo ? <Lock className="h-4 w-4 text-muted-foreground" /> : <div className="w-4" />}
                    <span className="font-semibold text-sm">{col.nome}</span>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">{col.tipo}</Badge>
                    {col.obrigatorio && <Badge className="text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary hover:bg-primary/30">Obrigatório</Badge>}
                  </div>
                  {!col.fixo && (
                    <Button variant="ghost" size="icon" onClick={() => removerColuna(col.nome)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {showAddColuna ? (
              <div className="flex items-end gap-3 p-4 border rounded-lg bg-muted/20">
                <div className="flex-[2] space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Nome (camelCase)</label>
                  <Input 
                    value={novaColuna.nome} 
                    onChange={e => setNovaColuna(prev => ({ ...prev, nome: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} 
                    placeholder="ex: cidade" 
                    className="bg-background"
                  />
                </div>
                <div className="flex-[2] space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo de Dado</label>
                  <Select value={novaColuna.tipo} onValueChange={val => setNovaColuna(prev => ({ ...prev, tipo: val }))}>
                    <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Texto</SelectItem>
                      <SelectItem value="numero">Número</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="boolean">Verdade. Falso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" onClick={handleAddColuna}><Check className="h-4 w-4"/></Button>
                  <Button variant="outline" size="icon" onClick={() => setShowAddColuna(false)}><X className="h-4 w-4"/></Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAddColuna(true)}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar coluna customizada
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Passo 3 */}
      {passo === 3 && (
        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary flex items-center gap-2">
                <CircleCheck className="h-5 w-5" /> Seu webhook está pronto!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL do Webhook</label>
                <div className="flex items-center gap-2">
                   <Input 
                     readOnly 
                     value={`https://sistema.kvgroupbr.com.br/api/webhook/${form.slug || 'novo-lancamento'}`} 
                     className="bg-background font-mono text-sm"
                   />
                   <Button variant="secondary" onClick={() => copyToClipboard(`https://sistema.kvgroupbr.com.br/api/webhook/${form.slug || 'novo-lancamento'}`, 'URL copiada!')}>
                     <Copy className="h-4 w-4" />
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Payload de exemplo (JSON)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 relative">
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono text-muted-foreground overflow-x-auto">
                {generatePayloadExample()}
              </pre>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-6 right-6"
                onClick={() => copyToClipboard(generatePayloadExample(), 'JSON copiado!')}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Código JavaScript para Landing Page</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 relative">
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono text-muted-foreground overflow-x-auto">
{`fetch("https://sistema.kvgroupbr.com.br/api/webhook/${form.slug || 'id'}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    // Insira os dados do formulário aqui
  }),
});`}
              </pre>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-6 right-6"
                onClick={() => copyToClipboard(`fetch("https://sistema.kvgroupbr.com.br/api/webhook/${form.slug || 'id'}", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });`, 'Código copiado!')}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Passo 4 */}
      {passo === 4 && (
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Contas de Integração</CardTitle>
              <CardDescription>Conecte sua conta de anúncios para extrair investimentos e relatórios automaticamente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               
              <div className="space-y-3">
                <label className="text-sm font-semibold">Selecione uma conta existente</label>
                {metaAccounts && metaAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {metaAccounts.map(ma => (
                      <div 
                        key={ma.$id} 
                        className={cn(
                          "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                          form.meta_account_id === ma.meta_account_id ? "bg-primary/5 border-primary" : "bg-card hover:bg-muted/50"
                        )}
                        onClick={() => setForm(prev => ({ 
                           ...prev, 
                           meta_account_id: ma.meta_account_id,
                           meta_access_token: ma.meta_access_token,
                           meta_account_nome: ma.nome 
                        }))}
                      >
                         <div className={cn(
                           "flex items-center justify-center h-4 w-4 rounded-full border",
                           form.meta_account_id === ma.meta_account_id ? "border-primary border-4" : "border-muted-foreground"
                         )} />
                         <div>
                            <p className="font-semibold text-sm">{ma.nome}</p>
                            <p className="text-xs text-muted-foreground">{ma.meta_account_id}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma conta salva ainda.</p>
                )}
              </div>

               <div className="relative py-4">
                 <div className="absolute inset-0 flex items-center">
                   <span className="w-full border-t" />
                 </div>
                 <div className="relative flex justify-center text-xs uppercase">
                   <span className="bg-card px-2 text-muted-foreground font-semibold">ou cadastre nova</span>
                 </div>
               </div>

               <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Apelido da conta</label>
                    <Input placeholder="ex: Conta Matriz KV" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} className="bg-background"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Meta Ad Account ID</label>
                    <Input placeholder="act_1234567890" value={newAccountId} onChange={e => setNewAccountId(e.target.value)} className="bg-background"/>
                    <p className="text-xs text-muted-foreground">Encontre em business.facebook.com → Configurações → Contas de anúncios</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Access Token Graph API</label>
                    <Input type="password" placeholder="EAA..." value={newAccountToken} onChange={e => setNewAccountToken(e.target.value)} className="bg-background"/>
                  </div>
                  <Button onClick={validarToken} variant="secondary" className="w-full" disabled={validarTokenMutation.isPending}>
                    {validarTokenMutation.isPending ? "Validando..." : "Validar e salvar conta"}
                  </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Palavra-chave de filtro</CardTitle>
              <CardDescription>Todas as campanhas que aparecerem no dashboard precisam conter esta palavra-chave no nome.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center gap-2">
                 <div className="flex-1 space-y-1.5">
                   <Input 
                      placeholder="ex: [lanc_abril26]" 
                      value={form.palavra_chave_meta} 
                      onChange={e => setForm(prev => ({ ...prev, palavra_chave_meta: e.target.value }))}
                      className="bg-background"
                   />
                 </div>
                 <Button onClick={testarFiltro} disabled={testarFiltroMutation.isPending}>
                   {testarFiltroMutation.isPending ? "Testando..." : "Testar filtro"}
                 </Button>
               </div>

               {campanhasEncontradas !== null && (
                 <div className="mt-4 border rounded-lg overflow-hidden bg-background">
                   {campanhasEncontradas.length > 0 ? (
                     <div className="overflow-x-auto max-h-60">
                       <table className="w-full text-sm text-left">
                          <thead className="text-xs text-muted-foreground bg-muted">
                            <tr>
                              <th className="px-4 py-2 font-medium">Nome da Campanha</th>
                              <th className="px-4 py-2 font-medium">Status</th>
                              <th className="px-4 py-2 font-medium text-right">Gasto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                             {campanhasEncontradas.map((camp, i) => (
                               <tr key={i} className="hover:bg-muted/50">
                                 <td className="px-4 py-2 font-medium">{camp.nome}</td>
                                 <td className="px-4 py-2">
                                    <Badge variant="outline" className="text-[10px]">{camp.status}</Badge>
                                 </td>
                                 <td className="px-4 py-2 text-right">R$ {camp.gasto}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                     </div>
                   ) : (
                     <div className="p-6 text-center text-muted-foreground text-sm">
                       Nenhuma campanha encontrada com esta palavra-chave.
                     </div>
                   )}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Passo 5 */}
      {passo === 5 && (
        <Card className="border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <CardTitle className="text-2xl">Seu dashboard está pronto!</CardTitle>
            <CardDescription>Revise os detalhes antes de salvar ou publicar o seu novo lançamento.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 p-6 rounded-xl bg-card border">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Lançamento</p>
                  <p className="font-semibold text-sm">{form.nome}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Cliente</p>
                  <p className="font-semibold text-sm">{clientes?.find(c => c.$id === form.cliente_id)?.nome || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Tipo</p>
                  <p className="font-semibold text-sm capitalize">{form.tipo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Colunas do DB</p>
                  <p className="font-semibold text-sm">{form.colunas.length} campos</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Meta Ads</p>
                  <p className="font-semibold text-sm truncate">{form.meta_account_nome}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Filtro de Campanhas</p>
                  <p className="font-semibold text-sm">{form.palavra_chave_meta}</p>
                </div>
             </div>

             <div className="mt-8 space-y-3">
               <label className="text-sm font-semibold">Tudo pronto! Seu link de acesso será:</label>
               <div className="flex items-center gap-2 p-1 border rounded-md pr-2 bg-background">
                  <div className="flex-1 px-3 py-1 font-mono text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
                    https://sistema.kvgroupbr.com.br/dashboard/{form.cliente_slug || 'cliente'}/{form.slug}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => copyToClipboard(`https://sistema.kvgroupbr.com.br/dashboard/${form.cliente_slug || 'cliente'}/${form.slug}`, 'Link copiado!')}>
                    <Copy className="h-4 w-4 mr-2" /> Copiar Link
                  </Button>
               </div>
             </div>
          </CardContent>
          <CardFooter className="flex-col sm:flex-row gap-3 pt-6 border-t mt-4">
             <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-1/2" 
                onClick={() => handleSalvar('rascunho')}
                disabled={criarLancamentoMutation.isPending}
              >
               Salvar como Rascunho
             </Button>
             <Button 
                size="lg" 
                className="w-full sm:w-1/2" 
                onClick={() => handleSalvar('ativo')}
                disabled={criarLancamentoMutation.isPending}
              >
               {criarLancamentoMutation.isPending ? "Processando..." : "Publicar Agora"}
             </Button>
          </CardFooter>
        </Card>
      )}

      {/* Controles do Footer */}
      {passo < 5 && (
        <div className="flex justify-between items-center pt-8 border-t">
          <Button 
            variant="ghost" 
            onClick={() => setPasso(p => Math.max(1, p - 1))}
            disabled={passo === 1}
            className="text-muted-foreground"
          >
            Voltar
          </Button>
          
          <Button 
            onClick={() => setPasso(p => Math.min(5, p + 1))}
            disabled={!isPassoAtualValid()}
          >
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}
