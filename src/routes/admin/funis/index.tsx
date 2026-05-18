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
            <GitBranch className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Funis</h1>
          </div>
          <p className="text-muted-foreground mt-1">Crie e gerencie os fluxos do seu funil</p>
        </div>
        
        <Button onClick={() => navigate('/admin/funis/novo')}>
          <Plus className="h-4 w-4 mr-2" />
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
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <GitBranch className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum funil criado ainda</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Comece a mapear a jornada visualizando o seu fluxo de conversão.
          </p>
          <Button onClick={() => navigate('/admin/funis/novo')}>
            Criar primeiro funil
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funis?.map((funil: any) => (
            <Card key={funil.id || funil.$id} className="h-full flex flex-col group overflow-hidden border transition-colors hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight line-clamp-1" title={funil.nome}>
                    {funil.nome}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                  <CardDescription className="line-clamp-2 text-sm mt-1">
                    {funil.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 text-xs text-muted-foreground">
                <p>Criado em: {new Date(funil.criado_em).toLocaleDateString()}</p>
              </CardContent>
              <div 
                className="p-4 border-t bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors flex items-center justify-center text-sm font-medium"
                onClick={() => navigate(`/admin/funis/${funil.id || funil.$id}/canvas`)}
              >
                Abrir Canvas
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!funilDeletar} onOpenChange={(open) => !open && setFunilDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O funil será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
