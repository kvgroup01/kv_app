import * as React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePastas, useCriarPasta, useDeletarPasta } from '../../hooks/useClientes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { UserPlus, FolderPlus, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const PASTA_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 
  'bg-rose-500', 'bg-orange-500', 'bg-amber-500'
];

export default function Configuracoes() {
  const { usuario } = useAuth();
  const { data: pastas } = usePastas();
  const criarPastaMut = useCriarPasta();
  const deletarPastaMut = useDeletarPasta();

  // Estados dos forms
  const [conviteEmail, setConviteEmail] = React.useState('');
  const [pastaNome, setPastaNome] = React.useState('');
  const [pastaCor, setPastaCor] = React.useState(PASTA_COLORS[0]);
  const [senhaAtual, setSenhaAtual] = React.useState('');
  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmaSenha, setConfirmaSenha] = React.useState('');

  const handleConvidar = () => {
    if (!conviteEmail) return;
    toast.success(`Convite enviado para \${conviteEmail}`);
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

  const handleAlterarSenha = () => {
    if (novaSenha !== confirmaSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    toast.success('Senha atualizada com sucesso');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmaSenha('');
  };

  return (
    <div className="space-y-12 max-w-[1200px] mx-auto pb-20">
      <div>
        <h2 className="text-[22px] font-semibold text-(--text-primary)">Configurações</h2>
        <p className="text-[13px] text-(--text-secondary) mt-1">Gerencie a equipe, organize sua conta e ajuste a segurança.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seção 1: Equipe */}
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-8 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-blue) rounded-full" />
          <div className="mb-8">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Equipe</h3>
            <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-wider">Membros com acesso administrativo</p>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 rounded-lg border border-(--card-border)">
                  <AvatarFallback className="bg-[#1a1a1a] text-(--text-primary) uppercase font-semibold text-xs">
                    {usuario?.nome?.substring(0, 2) || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[14px] font-medium text-(--text-primary)">{usuario?.nome || 'Administrador'}</p>
                  <p className="text-[12px] text-(--text-tertiary)">{usuario?.email}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-blue-500/10 text-blue-500 border border-blue-500/20">Admin</span>
            </div>

            <div className="pt-8 border-t border-(--card-border)">
              <h4 className="text-[11px] uppercase tracking-wider text-(--text-secondary) mb-4">Convites pendentes</h4>
              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg mb-6 border border-(--card-border)">
                <div>
                  <p className="text-[13px] font-medium text-(--text-primary)">membro@agencia.com</p>
                  <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-tight">Expira em 2 dias</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-amber-500/10 text-amber-500">Pendente</span>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-(--text-tertiary) hover:text-red-400 hover:bg-red-500/10" onClick={() => toast.success('Convite revogado')}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-10 border-(--card-border) hover:bg-[#1a1a1a] text-(--text-primary) text-[13px]">
                    <UserPlus className="mr-2 h-4 w-4" /> Convidar membro
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary) shadow-premium">
                  <DialogHeader>
                    <DialogTitle>Convidar membro</DialogTitle>
                    <DialogDescription className="text-(--text-secondary)">Envia um link de acesso ao painel para o e-mail informado.</DialogDescription>
                  </DialogHeader>
                  <div className="py-6 space-y-2">
                    <Label htmlFor="email" className="text-[13px] text-(--text-secondary)">E-mail do colaborador</Label>
                    <Input id="email" type="email" placeholder="nome@agencia.com" className="bg-black/40 border-(--card-border) text-(--text-primary) h-11 focus-visible:ring-1 focus-visible:ring-blue-500" value={conviteEmail} onChange={e => setConviteEmail(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleConvidar} className="h-10 px-8 bg-white text-black hover:bg-zinc-200 text-[13px] font-medium">Enviar convite</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Seção 2: Pastas */}
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-8 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-amber) rounded-full" />
          <div className="mb-8">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Pastas de Organização</h3>
            <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-wider">Estruture sua base de clientes</p>
          </div>

          <div className="space-y-3 mb-8">
            {pastas?.map((pasta: any) => (
              <div key={pasta.$id} className="group/item flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-(--card-border) hover:border-(--text-tertiary) transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-sm \${pasta.cor || 'bg-slate-500'}`} />
                  <span className="text-[14px] font-medium text-(--text-primary)">{pasta.nome}</span>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover/item:opacity-100 text-(--text-tertiary) hover:text-red-400 hover:bg-red-500/10 h-8 px-3 text-[11px] font-medium uppercase tracking-tight">Remover</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary) shadow-premium">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Zerar pasta?</AlertDialogTitle>
                      <AlertDialogDescription className="text-(--text-secondary)">Os clientes dentro desta pasta NÃO serão excluídos, apenas movidos para "Sem pasta".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                      <AlertDialogCancel className="bg-transparent border-(--card-border) hover:bg-[#1a1a1a]">Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600 border-none" onClick={() => deletarPastaMut.mutate(pasta.$id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            
            {(!pastas || pastas.length === 0) && (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-(--card-border) rounded-lg bg-black/20">
                <p className="text-[13px] text-(--text-tertiary) italic">Você não possui nenhuma pasta.</p>
              </div>
            )}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full h-10 border border-(--card-border) bg-[#1a1a1a] hover:bg-[#222] text-(--text-primary) text-[13px] font-medium">
                <FolderPlus className="mr-2 h-4 w-4" /> Criar nova pasta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary) shadow-premium">
              <DialogHeader>
                <DialogTitle>Nova Pasta</DialogTitle>
                <DialogDescription className="text-(--text-secondary)">Defina um nome e cor para sua nova categoria.</DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nomePasta" className="text-[13px] text-(--text-secondary)">Nome da pasta</Label>
                  <Input id="nomePasta" placeholder="Ex: Clientes VIP" value={pastaNome} onChange={e => setPastaNome(e.target.value)} className="bg-black/40 border-(--card-border) h-11 focus-visible:ring-1 focus-visible:ring-amber-500" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[13px] text-(--text-secondary)">Cor de marcação</Label>
                  <div className="flex gap-3">
                    {PASTA_COLORS.map(cor => (
                      <button 
                        key={cor} 
                        onClick={() => setPastaCor(cor)}
                        className={`w-7 h-7 rounded-full transition-all \${cor} \${pastaCor === cor ? 'ring-2 ring-offset-2 ring-offset-black ring-white scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCriarPasta} disabled={criarPastaMut.isPending || !pastaNome} className="h-10 px-8 bg-white text-black hover:bg-zinc-200 text-[13px] font-medium">
                  {criarPastaMut.isPending ? 'Criando...' : 'Criar pasta'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Seção 3: Conta */}
        <div className="md:col-span-2 group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-8 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-purple) rounded-full" />
          <div className="mb-8">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Conta e Segurança</h3>
            <p className="text-[11px] text-(--text-tertiary) mt-1 uppercase tracking-wider">Edite suas informações e tokens de acesso</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-(--text-tertiary)">Nome da conta</Label>
                  <div className="h-11 flex items-center bg-[#1a1a1a] px-4 rounded-lg border border-(--card-border) text-[14px] font-medium text-(--text-primary)">
                    {usuario?.nome || 'Admin'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-(--text-tertiary)">E-mail autenticado</Label>
                  <div className="h-11 flex items-center bg-[#1a1a1a] px-4 rounded-lg border border-(--card-border) text-[14px] font-medium text-(--text-primary) truncate">
                    {usuario?.email || 'admin@admin.com'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-11 px-8 border-(--card-border) hover:bg-[#1a1a1a] text-(--text-primary) text-[13px]">
                    <Lock className="mr-2 h-4 w-4" /> Alterar Senha
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary) shadow-premium">
                  <DialogHeader>
                    <DialogTitle>Alterar senha</DialogTitle>
                    <DialogDescription className="text-(--text-secondary)">Mantenha sua conta segura com uma senha forte.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-6">
                    <div className="space-y-2">
                      <Label className="text-[13px] text-(--text-secondary)">Senha atual</Label>
                      <Input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className="bg-black/40 border-(--card-border) h-11 focus-visible:ring-1 focus-visible:ring-purple-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] text-(--text-secondary)">Nova senha</Label>
                      <Input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className="bg-black/40 border-(--card-border) h-11 focus-visible:ring-1 focus-visible:ring-purple-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] text-(--text-secondary)">Confirmar nova senha</Label>
                      <Input type="password" value={confirmaSenha} onChange={e => setConfirmaSenha(e.target.value)} className="bg-black/40 border-(--card-border) h-11 focus-visible:ring-1 focus-visible:ring-purple-500" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAlterarSenha} disabled={!senhaAtual || !novaSenha || novaSenha !== confirmaSenha} className="h-10 px-8 bg-white text-black hover:bg-zinc-200 text-[13px] font-medium">Salvar nova senha</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
