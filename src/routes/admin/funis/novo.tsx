import * as React from 'react';
import { useNavigate } from 'react-router';
import { Plus, Zap, Phone, Rocket, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '../../../components/ui/dialog';
import { useCriarFunil } from '../../../hooks/useFunis';

const TEMPLATES = [
  {
    id: 'blank',
    nome: 'Funil em branco',
    descricao: 'Comece do zero e monte seu próprio funil.',
    icon: Plus,
    nos: JSON.stringify([]),
    arestas: JSON.stringify([]),
  },
  {
    id: 'low-ticket-mvp',
    nome: 'Low Ticket MVP',
    descricao: 'Estrutura mínima viável para colocar seu primeiro funil no ar.',
    icon: Zap,
    nos: JSON.stringify([
      { id: '1', type: 'anuncio', position: { x: 50, y: 200 }, data: { label: 'Anúncio' } },
      { id: '2', type: 'pagina', position: { x: 250, y: 200 }, data: { label: 'Página de Captura' } },
      { id: '3', type: 'lead', position: { x: 450, y: 200 }, data: { label: 'Lead' } },
      { id: '4', type: 'email', position: { x: 650, y: 200 }, data: { label: 'E-mail' } },
    ]),
    arestas: JSON.stringify([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
    ]),
  },
  {
    id: 'book-a-call',
    nome: 'Book a Call',
    descricao: 'Estrutura para funil de agendamento de reunião.',
    icon: Phone,
    nos: JSON.stringify([
      { id: '1', type: 'anuncio', position: { x: 50, y: 200 }, data: { label: 'Anúncio' } },
      { id: '2', type: 'pagina', position: { x: 250, y: 200 }, data: { label: 'Página' } },
      { id: '3', type: 'formulario', position: { x: 450, y: 200 }, data: { label: 'Formulário' } },
      { id: '4', type: 'reuniao', position: { x: 650, y: 200 }, data: { label: 'Reunião' } },
    ]),
    arestas: JSON.stringify([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
    ]),
  },
  {
    id: 'lancamento',
    nome: 'Lançamento',
    descricao: 'Funil completo para lançamento com qualificação de leads.',
    icon: Rocket,
    nos: JSON.stringify([
      { id: '1', type: 'anuncio', position: { x: 50, y: 200 }, data: { label: 'Anúncio' } },
      { id: '2', type: 'pagina', position: { x: 250, y: 200 }, data: { label: 'Página de Captura' } },
      { id: '3', type: 'lead', position: { x: 450, y: 200 }, data: { label: 'Lead' } },
      { id: '4', type: 'pesquisa', position: { x: 650, y: 200 }, data: { label: 'Pesquisa' } },
      { id: '5', type: 'qualificado', position: { x: 850, y: 200 }, data: { label: 'Qualificado' } },
    ]),
    arestas: JSON.stringify([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ]),
  },
];

export default function FunisNovo() {
  const navigate = useNavigate();
  const criarMutation = useCriarFunil();
  const [templateAberto, setTemplateAberto] = React.useState<typeof TEMPLATES[0] | null>(null);
  const [nomeFunil, setNomeFunil] = React.useState('');

  const handleCriarFunil = async () => {
    if (!templateAberto) return;
    if (!nomeFunil.trim()) {
      toast.error('Informe um nome para o funil');
      return;
    }

    try {
      const funil = await criarMutation.mutateAsync({
        nome: nomeFunil,
        descricao: templateAberto.descricao,
        nos: templateAberto.nos,
        arestas: templateAberto.arestas,
      });
      toast.success('Funil criado com sucesso!');
      navigate(`/admin/funis/${funil.id || funil.$id}/canvas`);
    } catch (e: any) {
      toast.error('Erro ao criar o funil');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/funis')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Novo Funil</h1>
      </div>

      <p className="text-muted-foreground">Selecione um template para começar ou crie em branco.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <Card 
              key={tpl.id} 
              className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/10 group"
              onClick={() => {
                setTemplateAberto(tpl);
                setNomeFunil(tpl.nome);
              }}
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-(--text-primary)" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{tpl.nome}</h3>
                  <p className="text-sm text-muted-foreground">{tpl.descricao}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!templateAberto} onOpenChange={(open) => !open && setTemplateAberto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar funil: {templateAberto?.nome}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1 block">Nome do Funil</label>
            <Input 
              autoFocus
              value={nomeFunil} 
              onChange={(e) => setNomeFunil(e.target.value)} 
              placeholder="Ex: Lançamento Semente"
              onKeyDown={(e) => e.key === 'Enter' && handleCriarFunil()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateAberto(null)}>Cancelar</Button>
            <Button onClick={handleCriarFunil} disabled={criarMutation.isPending}>
              {criarMutation.isPending ? 'Criando...' : 'Criar Funil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
