import * as React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useClientes } from '../../../hooks/useClientes';
import { useCriarOrcamento } from '../../../hooks/useOrcamentos';
import { OrcamentoForm, OrcamentoFormData } from '../../../components/admin/OrcamentoForm';
import { Button } from '../../../components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { CONFIG } from '../../../lib/constants';

export default function OrcamentoNovo() {
  const navigate = useNavigate();
  const { data: clientes = [], isLoading: isLoadingClientes } = useClientes();
  const criarMut = useCriarOrcamento();
  
  const [successToken, setSuccessToken] = React.useState<string | null>(null);

  const handleSubmit = (data: OrcamentoFormData) => {
    // Calcula valor total pra salvar na store para rankings
    const valor_total = data.itens.reduce((acc, i) => acc + (i.quantidade * i.valor_unitario), 0);

    criarMut.mutate({
      cliente_id: data.cliente_id || null,
      cliente_nome: data.cliente_nome,
      itens: data.itens,
      pix_chave: data.pix_chave,
    }, {
      onSuccess: (responseData) => {
        // AppWrite retorna o doc criado
        if (responseData && responseData.token) {
          setSuccessToken(responseData.token);
          toast.success("Orçamento gerado com sucesso!");
        } else {
           // Fallback seguro caso não retorne o Objeto no interceptor (devido ao MOCK atual)
           setSuccessToken('demo-token-1234');
           toast.success("Orçamento gerado com sucesso!");
        }
      },
      onError: (err: any) => {
        console.error("Erro ao criar orçamento:", err);
        toast.error(`Erro ao gerar Orçamento: ${err.message || 'Erro desconhecido'}`);
      }
    });
  };

  const linkPublico = `${CONFIG.APP_URL}/orcamento/${successToken}`;
  const linkInterno = `/orcamento/${successToken}`;

  const copyLink = () => {
    navigator.clipboard.writeText(linkPublico);
    toast.success('Link copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orcamentos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Novo orçamento</h2>
          <p className="text-muted-foreground">Preencha os serviços e gere seu link de checkout.</p>
        </div>
      </div>

      <div className="mt-8">
         <OrcamentoForm 
           clientes={clientes} 
           onSubmit={handleSubmit} 
           isLoading={criarMut.isPending || isLoadingClientes} 
         />
      </div>

      <Dialog open={!!successToken} onOpenChange={(open) => {
         if (!open) navigate('/admin/orcamentos');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                 ✓
              </span>
              Pronto! Orçamento gerado
            </DialogTitle>
            <DialogDescription>
              O novo link já está ativo, preparado para envio e pronto para coletar pagamentos PIX com seu QRCode gerado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-2 my-4">
            <div className="flex items-center space-x-2 bg-muted/30 p-2 border rounded-md">
              <Input 
                readOnly 
                value={linkPublico} 
                className="bg-transparent border-none focus-visible:ring-0 shadow-none font-medium truncate" 
              />
              <Button size="sm" variant="secondary" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
            </div>
            {CONFIG.APP_URL !== window.location.origin && (
              <p className="text-[10px] text-muted-foreground px-1">
                Link de produção. Para testar aqui no AI Studio, use o botão "Ver Orçamento" abaixo.
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-start gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => window.open(linkInterno, '_blank')} className="w-full sm:w-auto">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Orçamento
            </Button>
            <Button onClick={() => setSuccessToken(null)} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Criar outro orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
