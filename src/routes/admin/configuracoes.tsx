import * as React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePastas, useCriarPasta, useDeletarPasta } from '../../hooks/useClientes';
import { account } from '../../lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { UserPlus, FolderPlus, Lock, CheckCircle2, XCircle, User, Settings, Globe, Shield, Camera, Pencil, Trash2, LayoutDashboard, BarChart3, Users2, FileText, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useOrcamentos } from '../../hooks/useOrcamentos';
import { useClientes } from '../../hooks/useClientes';
import { fmtBRL } from '../../lib/utils';
import { toast } from 'sonner';

const PASTA_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 
  'bg-rose-500', 'bg-orange-500', 'bg-amber-500'
];

export default function Configuracoes() {
  const { user: usuario, updateProfile, changePassword, updatePhoto, isUpdatingProfile, isChangingPassword, isUpdatingPhoto } = useAuth();
  const { data: pastas } = usePastas();
  const { data: orcamentos } = useOrcamentos();
  const { data: clientes } = useClientes();
  const criarPastaMut = useCriarPasta();
  const deletarPastaMut = useDeletarPasta();

  const totalVendas = orcamentos?.filter(o => o.status === 'pago').reduce((acc, o) => acc + o.valor_total, 0) || 0;
  const orcamentosPendentes = orcamentos?.filter(o => o.status === 'pendente').length || 0;
  const totalClientes = clientes?.length || 0;

  // Perfis
  const [nomeUsuario, setNomeUsuario] = React.useState(usuario?.name || '');
  
  // Estados dos forms
  const [conviteEmail, setConviteEmail] = React.useState('');
  const [pastaNome, setPastaNome] = React.useState('');
  const [pastaCor, setPastaCor] = React.useState(PASTA_COLORS[0]);
  const [senhaAtual, setSenhaAtual] = React.useState('');
  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmaSenha, setConfirmaSenha] = React.useState('');

  // Integrações
  const [googleApiKey, setGoogleApiKey] = React.useState((usuario?.prefs as any)?.googleApiKey || '');

  const handleSaveIntegrations = async () => {
    try {
      await account.updatePrefs({ ...(usuario?.prefs || {}), googleApiKey });
      toast.success('Configurações de integração salvas!');
    } catch (e) {
      toast.error('Erro ao salvar integrações.');
    }
  };

  const photoUrl = (usuario?.prefs as any)?.photoUrl;

  const handleUpdateProfile = async () => {
    if (!nomeUsuario) return;
    try {
      await updateProfile(nomeUsuario);
      toast.success('Perfil atualizado com sucesso!');
    } catch (e) {
      toast.error('Erro ao atualizar perfil.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await updatePhoto(file);
      toast.success('Foto de perfil atualizada!');
    } catch (err) {
      toast.error('Erro ao subir foto.');
    }
  };

  const handleConvidar = () => {
    if (!conviteEmail) return;
    toast.success(`Convite enviado para ${conviteEmail}`);
    setConviteEmail('');
  };

  const handleCriarPasta = () => {
    if (!pastaNome) return;
    criarPastaMut.mutate({ nome: pastaNome, cor: pastaCor }, {
      onSuccess: () => {
        setPastaNome('');
        toast.success("Pasta criada com sucesso");
      }
    });
  };

  const handleAlterarSenha = async () => {
    if (novaSenha !== confirmaSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    try {
      await changePassword({ nova: novaSenha, atual: senhaAtual });
      toast.success('Senha atualizada com sucesso');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmaSenha('');
    } catch (e) {
      toast.error('Ocorreu um erro ao alterar a senha. Verifique a senha atual.');
    }
  };

  return (
    <div className="space-y-10 max-w-[1200px] mx-auto pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-(--text-primary) tracking-tight">Centro de Comando</h2>
        <p className="text-(--text-secondary) text-sm">Gerencie sua identidade, conexões e equipe KV Group.</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-8">
        <TabsList className="bg-[#141414] border border-(--card-border) p-1 h-12 rounded-xl overflow-x-auto max-w-full no-scrollbar">
          <TabsTrigger value="geral" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 text-xs font-semibold uppercase tracking-wider min-w-fit">
            <BarChart3 className="h-4 w-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="perfil" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 text-xs font-semibold uppercase tracking-wider min-w-fit">
            <User className="h-4 w-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 text-xs font-semibold uppercase tracking-wider">
            <Globe className="h-4 w-4" /> Integrações
          </TabsTrigger>
          <TabsTrigger value="equipe" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 text-xs font-semibold uppercase tracking-wider">
            <UserPlus className="h-4 w-4" /> Equipe
          </TabsTrigger>
          <TabsTrigger value="organizacao" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 text-xs font-semibold uppercase tracking-wider">
            <FolderPlus className="h-4 w-4" /> Organização
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 text-xs font-semibold uppercase tracking-wider">
            <Shield className="h-4 w-4" /> Segurança
          </TabsTrigger>
        </TabsList>

        {/* --- GERAL --- */}
        <TabsContent value="geral" className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-(--card-bg) border-(--card-border) shadow-premium overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Sucesso</Badge>
                  </div>
                  <h3 className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-widest mb-1">Receita Confirmada</h3>
                  <p className="text-2xl font-bold text-(--text-primary)">{fmtBRL(totalVendas)}</p>
                </CardContent>
              </Card>

              <Card className="bg-(--card-bg) border-(--card-border) shadow-premium overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Users2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-400 border-none">Ativos</Badge>
                  </div>
                  <h3 className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-widest mb-1">Total de Clientes</h3>
                  <p className="text-2xl font-bold text-(--text-primary)">{totalClientes}</p>
                </CardContent>
              </Card>

              <Card className="bg-(--card-bg) border-(--card-border) shadow-premium overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <FileText className="h-5 w-5 text-amber-500" />
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-500 border-none">Aguardando</Badge>
                  </div>
                  <h3 className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-widest mb-1">Orçamentos Pendentes</h3>
                  <p className="text-2xl font-bold text-(--text-primary)">{orcamentosPendentes}</p>
                </CardContent>
              </Card>

              <Card className="bg-(--card-bg) border-(--card-border) shadow-premium overflow-hidden border-2 border-zinc-100 dark:border-white/5">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full">
                  <h3 className="text-[11px] font-bold text-(--text-tertiary) uppercase mb-3">Status do Sistema</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold">100% OPERACIONAL</span>
                  </div>
                </CardContent>
              </Card>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="bg-(--card-bg) border-(--card-border) shadow-premium">
               <CardHeader>
                 <CardTitle className="text-lg">Atalhos Rápidos</CardTitle>
                 <CardDescription>Acesso imediato às principais funcionalidades.</CardDescription>
               </CardHeader>
               <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 border-(--card-border) hover:bg-white/5 active:scale-95 transition-all">
                    <LayoutDashboard className="h-5 w-5 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">Dashboard Geral</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2 border-(--card-border) hover:bg-white/5 active:scale-95 transition-all">
                    <Users2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">Lista de Clientes</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2 border-(--card-border) hover:bg-white/5 active:scale-95 transition-all">
                    <FileText className="h-5 w-5 text-violet-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">Novo Orçamento</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2 border-(--card-border) hover:bg-white/5 active:scale-95 transition-all">
                    <Shield className="h-5 w-5 text-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">Segurança</span>
                  </Button>
               </CardContent>
             </Card>

             <Card className="bg-(--card-bg) border-(--card-border) shadow-premium flex flex-col justify-center items-center text-center p-10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Globe className="h-8 w-8 text-white/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">KV Group v1.5.0</h3>
                <p className="text-sm text-(--text-secondary) max-w-[280px]">Você está utilizando a versão mais recente do sistema de gestão.</p>
                <Badge variant="outline" className="mt-6 border-white/20 text-(--text-tertiary)">Licença Ativa</Badge>
             </Card>
           </div>
        </TabsContent>

        {/* --- PERFIL --- */}
        <TabsContent value="perfil" className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 bg-(--card-bg) border-(--card-border) shadow-premium overflow-hidden border-t-4 border-t-blue-500">
              <CardHeader className="text-center pb-2">
                <div className="relative mx-auto w-24 h-24 mb-4">
                  <Avatar className="w-24 h-24 border-2 border-white/10 shadow-xl rounded-2xl">
                    <AvatarImage src={photoUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold uppercase rounded-2xl">
                      {usuario?.name?.substring(0, 2) || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 bg-white text-black p-2 rounded-xl shadow-lg cursor-pointer hover:bg-zinc-200 transition-colors border border-zinc-300">
                    <Camera className="h-4 w-4" />
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUpdatingPhoto} />
                  </label>
                </div>
                <CardTitle className="text-xl font-bold">{usuario?.name}</CardTitle>
                <CardDescription>{usuario?.email}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4 pt-4 border-t border-(--card-border)">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-(--text-tertiary) font-medium uppercase tracking-widest">Nível de Acesso</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-none rounded-full px-3">Administrador</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-(--text-tertiary) font-medium uppercase tracking-widest">Desde</span>
                    <span className="text-(--text-primary)">{new Date(usuario?.$createdAt || '').toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 bg-(--card-bg) border-(--card-border) shadow-premium">
              <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                <CardDescription>Mantenha seus dados atualizados para contato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Nome Completo</Label>
                    <Input 
                      value={nomeUsuario} 
                      onChange={e => setNomeUsuario(e.target.value)} 
                      className="bg-black/20 border-(--card-border) h-11 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">E-mail</Label>
                    <Input 
                      value={usuario?.email} 
                      disabled
                      className="bg-black/10 border-(--card-border) h-11 opacity-60"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={isUpdatingProfile}
                    className="bg-white text-black hover:bg-zinc-200 h-11 px-8 font-bold"
                  >
                    {isUpdatingProfile ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- INTEGRACOES --- */}
        <TabsContent value="integracoes" className="space-y-6 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <Card className="bg-(--card-bg) border-(--card-border) border-t-4 border-t-emerald-500 lg:col-span-2">
               <CardContent className="pt-8 space-y-6">
                 <div className="flex items-center gap-4 mb-2">
                   <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                     <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.92,19.27 6.23,16.59 6.23,13.31C6.23,10.03 8.92,7.35 12.19,7.35C14.1,7.35 15.74,8.26 17,9.45L19.05,7.41C17.29,5.7 14.84,4.61 12.19,4.61C7.38,4.61 3.5,8.51 3.5,13.31C3.5,18.11 7.38,22.01 12.19,22.01C17.41,22.01 21.5,18.33 21.5,13.31C21.5,12.55 21.43,11.83 21.35,11.1V11.1Z" />
                     </svg>
                   </div>
                   <div>
                     <h3 className="font-bold">Google Cloud Platform</h3>
                     <p className="text-xs text-(--text-tertiary)">Conexão com Google Sheets e APIs</p>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Chave de API do Google</Label>
                   <div className="flex gap-2">
                     <Input 
                       type="password"
                       value={googleApiKey} 
                       onChange={e => setGoogleApiKey(e.target.value)} 
                       className="bg-black/20 border-(--card-border) h-11 focus-visible:ring-emerald-500"
                       placeholder="AIzaSy..."
                     />
                     <Button onClick={handleSaveIntegrations} className="bg-emerald-600 text-white hover:bg-emerald-700 h-11 px-6">Salvar</Button>
                   </div>
                   <p className="text-[11px] text-(--text-tertiary) italic">Esta chave é necessária para ler os dados das planilhas de clientes.</p>
                 </div>

                 <div className="pt-4 border-t border-(--card-border) flex items-center justify-between">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3">Status: Ativo</Badge>
                    <p className="text-[10px] text-(--text-tertiary) uppercase tracking-widest">Última checagem: Hoje</p>
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-(--card-bg) border-(--card-border) opacity-50 cursor-not-allowed">
               <CardContent className="pt-8">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                     <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                     </svg>
                   </div>
                   <div>
                     <h3 className="font-bold">Meta Ads API</h3>
                     <p className="text-xs text-(--text-tertiary)">Integração nativa com Gerenciador</p>
                   </div>
                 </div>
                 <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 uppercase font-bold tracking-widest mb-6">Em desenvolvimento</Badge>
                 <Button disabled variant="outline" className="w-full border-(--card-border) text-xs font-bold uppercase tracking-widest">Aguardando Lançamento</Button>
               </CardContent>
             </Card>
           </div>
        </TabsContent>

        {/* --- EQUIPE --- */}
        <TabsContent value="equipe" className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-(--card-bg) border-(--card-border) shadow-premium">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Membros Ativos</CardTitle>
                  <CardDescription>Gerencie quem tem acesso administrativo.</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-black hover:bg-zinc-200">
                      <UserPlus className="mr-2 h-4 w-4" /> Convidar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                    <DialogHeader>
                      <DialogTitle>Convidar membro</DialogTitle>
                      <DialogDescription className="text-(--text-secondary)">Envie um convite por e-mail.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                      <Label className="text-sm font-medium mb-2 block">E-mail do colaborador</Label>
                      <Input value={conviteEmail} onChange={e => setConviteEmail(e.target.value)} placeholder="exemplo@gmail.com" className="bg-black/20 border-(--card-border) h-11" />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleConvidar} className="bg-white text-black">Enviar convite</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-(--card-border)">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-white/10">
                      <AvatarImage src={photoUrl} />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">{usuario?.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[13px] font-bold">{usuario?.name}</p>
                      <p className="text-[11px] text-(--text-tertiary)">{usuario?.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-blue-400 border-blue-400/30">Owner</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- ORGANIZAÇÃO --- */}
        <TabsContent value="organizacao" className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-(--card-bg) border-(--card-border) shadow-premium">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pastas de Clientes</CardTitle>
                <CardDescription>Crie categorias para organizar seus painéis.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black hover:bg-zinc-200">
                    <FolderPlus className="mr-2 h-4 w-4" /> Nova Pasta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                  <DialogHeader>
                    <DialogTitle>Criar Pasta</DialogTitle>
                    <DialogDescription>Dê um nome e cor para identificação.</DialogDescription>
                  </DialogHeader>
                  <div className="py-6 space-y-4">
                    <div className="space-y-2">
                       <Label className="text-sm font-medium">Nome</Label>
                       <Input value={pastaNome} onChange={e => setPastaNome(e.target.value)} placeholder="Ex: E-commerce" className="h-11 bg-black/20 border-(--card-border)" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-sm font-medium">Cor</Label>
                       <div className="flex gap-2">
                         {PASTA_COLORS.map(c => (
                           <button 
                             key={c} 
                             onClick={() => setPastaCor(c)}
                             className={`w-8 h-8 rounded-full border-2 transition-all ${c} ${pastaCor === c ? 'border-white scale-110' : 'border-transparent'}`} 
                           />
                         ))}
                       </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCriarPasta} className="bg-white text-black">Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastas?.map((p: any) => (
                  <div key={p.$id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-(--card-border)">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${p.cor}`} />
                      <span className="font-bold text-sm tracking-tight">{p.nome}</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/40 hover:text-red-500 hover:bg-red-500/10">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                        <AlertDialogHeader>
                           <AlertDialogTitle>Excluir Pasta?</AlertDialogTitle>
                           <AlertDialogDescription className="text-(--text-secondary)">Clientes nesta pasta serão movidos para "Sem pasta".</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-transparent border-(--card-border)">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletarPastaMut.mutate(p.$id)} className="bg-red-500 text-white">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SEGURANCA --- */}
        <TabsContent value="seguranca" className="space-y-6 animate-in fade-in duration-500">
           <Card className="bg-(--card-bg) border-(--card-border) shadow-premium">
              <CardHeader>
                <CardTitle className="text-lg">Alterar Senha</CardTitle>
                <CardDescription>Mantenha sua conta protegida com uma senha complexa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Senha Atual</Label>
                  <Input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className="bg-black/20 border-(--card-border) h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Nova Senha</Label>
                  <Input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className="bg-black/20 border-(--card-border) h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Confirmar Nova Senha</Label>
                  <Input type="password" value={confirmaSenha} onChange={e => setConfirmaSenha(e.target.value)} className="bg-black/20 border-(--card-border) h-11" />
                </div>
                <div className="flex justify-start">
                   <Button 
                     onClick={handleAlterarSenha} 
                     disabled={isChangingPassword || !senhaAtual || !novaSenha}
                     className="bg-white text-black hover:bg-zinc-200 h-11 px-8 font-bold"
                   >
                     {isChangingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                   </Button>
                </div>
              </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
