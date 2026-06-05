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
import { IphoneFrame } from '../../../components/ui/iphone-frame';
import { OrcamentoPreview } from '../../../components/admin/OrcamentoPreview';

export default function OrcamentoNovo() {
  const navigate = useNavigate();
  const { data: clientes = [], isLoading: isLoadingClientes } = useClientes();
  const criarMut = useCriarOrcamento();
  
  const [successToken, setSuccessToken] = React.useState<string | null>(null);
  
  // Estado compartilhado
  const [modoCliente, setModoCliente] = React.useState<'existente' | 'avulso'>('existente');
  const [clienteSelecionado, setClienteSelecionado] = React.useState('');
  const [nomeAvulso, setNomeAvulso] = React.useState('');
  const [itens, setItens] = React.useState([{ descricao: '', quantidade: 1, valor_unitario: 0 }]);
  const [pixChave, setPixChave] = React.useState('');

  const clienteNome = React.useMemo(() => {
    if (modoCliente === 'avulso') return nomeAvulso;
    return clientes.find(c => c.$id === clienteSelecionado)?.nome || '';
  }, [modoCliente, nomeAvulso, clienteSelecionado, clientes]);

  const handleSubmit = () => {
    if (!clienteNome) { toast.error('Informe o nome do cliente.'); return; }
    if (!pixChave) { toast.error('Informe a chave PIX.'); return; }
    const itensValidos = itens.filter(i => i.descricao.trim() !== '' && i.valor_unitario > 0);
    if (itensValidos.length === 0) { toast.error('Adicione pelo menos um item.'); return; }

    criarMut.mutate({
      cliente_id: modoCliente === 'existente' ? clienteSelecionado : undefined,
      cliente_nome: clienteNome,
      itens: itensValidos,
      pix_chave: pixChave,
    }, {
      onSuccess: (responseData) => {
        setSuccessToken(responseData?.token || 'demo-token-1234');
        toast.success('Orçamento gerado com sucesso!');
      },
      onError: (err: any) => {
        toast.error(`Erro: ${err.message || 'Erro desconhecido'}`);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orcamentos')} className="h-8 w-8 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--card-hover) rounded-[8px]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-[22px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.374px' }}>Novo orçamento</h2>
          <p className="text-[13px] text-(--text-secondary) mt-0.5">Preencha os serviços e gere seu link de checkout.</p>
        </div>
      </div>

      {/* Layout split */}
      <div className="flex flex-col xl:flex-row gap-10 items-start">
        
        {/* Formulário — responsivo, cresce normalmente */}
        <div className="flex-1 min-w-0">
          <OrcamentoForm
            clientes={clientes}
            isLoading={criarMut.isPending || isLoadingClientes}
            modoCliente={modoCliente}
            setModoCliente={setModoCliente}
            clienteSelecionado={clienteSelecionado}
            setClienteSelecionado={setClienteSelecionado}
            nomeAvulso={nomeAvulso}
            setNomeAvulso={setNomeAvulso}
            itens={itens}
            setItens={setItens}
            pixChave={pixChave}
            setPixChave={setPixChave}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Preview — largura fixa, sticky */}
        <div className="hidden xl:flex flex-col items-center gap-3 sticky top-8 shrink-0">
          <div className="text-[11px] font-semibold text-(--text-tertiary) uppercase tracking-wider">
            Preview do cliente
          </div>
          <IphoneFrame scale={0.85}>
            <OrcamentoPreview
              clienteNome={clienteNome}
              itens={itens}
              setItens={setItens}
              pixChave={pixChave}
              setPixChave={setPixChave}
            />
          </IphoneFrame>
          <p className="text-[11px] text-(--text-tertiary) text-center">
            Clique nos textos para editar
          </p>
        </div>

      </div>

      <Dialog open={!!successToken} onOpenChange={(open) => {
         if (!open) navigate('/admin/orcamentos');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-[17px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.2px' }}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">✓</span>
              Orçamento gerado!
            </DialogTitle>
            <DialogDescription className="text-[13px] text-(--text-secondary)">
              O link já está ativo e pronto para envio. Compartilhe com o cliente para receber via PIX.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-2 my-4">
            <div className="flex items-center gap-2 bg-(--card-hover) border border-(--card-border) p-2 rounded-[10px]">
              <Input readOnly value={linkPublico} className="bg-transparent border-none focus-visible:ring-0 shadow-none text-[13px] text-(--text-primary) truncate h-8" />
              <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0 h-8 text-[12px] border-(--card-border) text-(--text-secondary) hover:text-(--text-primary) rounded-[7px]">
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
              </Button>
            </div>
            {CONFIG.APP_URL !== window.location.origin && (
              <p className="text-[10px] text-muted-foreground px-1">
                Link de produção. Para testar aqui no AI Studio, use o botão "Ver Orçamento" abaixo.
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-start gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => window.open(linkInterno, '_blank')} className="w-full sm:w-auto border-(--card-border) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--card-hover) rounded-[8px] text-[13px]">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver Orçamento
            </Button>
            <Button onClick={() => setSuccessToken(null)} className="btn-brand w-full sm:w-auto text-[13px] rounded-full">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Criar outro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
