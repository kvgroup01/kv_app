import * as React from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, GitBranch, Trash2, Pencil, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { useFunis, useDeletarFunil } from '../../../hooks/useFunis';
import { Skeleton } from '../../../components/ui/skeleton';

export default function FunisIndex() {
  const navigate = useNavigate();
  const { data: funis, isLoading } = useFunis();
  const deletarMutation = useDeletarFunil();
  const [funilDeletar, setFunilDeletar] = React.useState<string | null>(null);

  const confirmarExclusao = async () => {
    if (!funilDeletar) return;
    try {
      await deletarMutation.mutateAsync(funilDeletar);
      toast.success('Funil excluído com sucesso');
    } catch (err) {
      toast.error('Erro ao excluir o funil');
    } finally {
      setFunilDeletar(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-(--text-tertiary)" />
            <h2 className="text-[22px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.374px' }}>Funis</h2>
          </div>
          <p className="text-[13px] text-(--text-secondary) mt-1">Crie e gerencie os fluxos do seu funil</p>
        </div>
        
        <Button onClick={() => navigate('/admin/funis/novo')} className="btn-brand h-9 px-4 text-[13px] rounded-full">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Novo Funil
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : funis?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed bg-(--card-bg) border-(--card-border) rounded-[14px]">
          <div className="h-14 w-14 rounded-full bg-(--card-hover) border border-(--card-border) flex items-center justify-center mb-4">
            <GitBranch className="h-6 w-6 text-(--text-tertiary)" />
          </div>
          <h3 className="text-[15px] font-semibold text-(--text-primary) mb-1">Nenhum funil criado ainda</h3>
          <p className="text-[13px] text-(--text-tertiary) mb-6 max-w-sm">
            Comece a mapear a jornada visualizando o seu fluxo de conversão.
          </p>
          <Button onClick={() => navigate('/admin/funis/novo')} className="btn-brand h-9 px-4 text-[13px] rounded-full">
            Criar primeiro funil
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funis?.map((funil: any) => (
            <Card key={funil.id || funil.$id} className="h-full flex flex-col group overflow-hidden bg-(--card-bg) border border-(--card-border) rounded-[14px] hover:border-[#FBB03B]/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-[15px] font-semibold text-(--text-primary) leading-tight line-clamp-1" title={funil.nome} style={{ letterSpacing: '-0.2px' }}>
                    {funil.nome}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                      <DropdownMenuItem onClick={() => navigate(`/admin/funis/${funil.id || funil.$id}/canvas`)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar Canvas
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => setFunilDeletar(funil.id || funil.$id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {funil.descricao && (
                  <CardDescription className="line-clamp-2 text-[13px] text-(--text-tertiary) mt-1">
                    {funil.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 text-[12px] text-(--text-tertiary)">
                <p>Criado em: {new Date(funil.criado_em).toLocaleDateString()}</p>
              </CardContent>
              <div 
                className="p-4 border-t border-(--card-border) bg-(--card-hover) cursor-pointer hover:bg-[#FBB03B]/5 hover:text-[#FBB03B] transition-colors flex items-center justify-center text-[13px] font-medium text-(--text-secondary)"
                onClick={() => navigate(`/admin/funis/${funil.id || funil.$id}/canvas`)}
              >
                Abrir Canvas
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!funilDeletar} onOpenChange={(open) => !open && setFunilDeletar(null)}>
        <AlertDialogContent className="bg-(--card-bg) border-(--card-border)">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O funil será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-(--card-border) text-(--text-secondary)">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
