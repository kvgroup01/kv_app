import * as React from 'react';
import { useParams } from 'react-router';
import { AlertCircle, CircleCheck, Copy, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

import { useOrcamentoPorToken, useConfirmarPagamento } from '../../hooks/useOrcamentos';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { UploadComprovante } from '../../components/admin/UploadComprovante';
import { fmtBRL, fmtDataString } from '../../lib/utils';
import { cn } from '../../lib/utils';

export default function OrcamentoPublico() {
  const { token } = useParams();
  const { data: orcamento, isLoading, error } = useOrcamentoPorToken(token);
  const confirmarMutation = useConfirmarPagamento();
  
  const [qrCodeData, setQrCodeData] = React.useState<string>('');

  React.useEffect(() => {
    const generateQR = async () => {
      if (orcamento && orcamento.pix_chave && orcamento.status !== 'pago') {
        try {
          const { gerarPayloadPix } = await import('../../lib/utils');
          const payload = gerarPayloadPix(
            orcamento.pix_chave, 
            orcamento.valor_total, 
            'Gestor de Tráfego', 
            'São Paulo'
          );
          
          const url = await QRCode.toDataURL(payload, { width: 250, margin: 1 });
          setQrCodeData(url);
        } catch (err) {
          console.error('Erro ao gerar QR Code PIX:', err);
        }
      }
    };

    generateQR();
  }, [orcamento]);

  const copyPix = () => {
    if (qrCodeData && orcamento?.pix_chave) {
      // Re-gerar o payload puro (sem ser base64 de imagem)
      const generatePayload = async () => {
        try {
          const { gerarPayloadPix } = await import('../../lib/utils');
          const payload = gerarPayloadPix(
            orcamento.pix_chave, 
            orcamento.valor_total, 
            'Gestor de Trafego', 
            'Sao Paulo'
          );
          navigator.clipboard.writeText(payload);
          toast.success('PIX Copia e Cola copiado!');
        } catch (err) {
          toast.error('Erro ao copiar payload PIX');
        }
      };
      generatePayload();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-start pt-12">
        <Skeleton className="h-[600px] w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (error || !orcamento) {
    const isPermissionError = error?.message?.includes('insufficient_permissions') || error?.message?.includes('unauthorized');
    
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {isPermissionError ? 'Acesso restrito' : 'Orçamento não encontrado'}
            </h1>
            <p className="text-slate-600">
              {isPermissionError 
                ? 'As permissões do Appwrite não estão configuradas para acesso público. Vá ao Console > Database > orcamentos > Settings e adicione permissão de LEITURA para a role "Any".'
                : 'Este link pode estar quebrado, expirado ou o orçamento foi deletado do sistema.'}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const parsedItens = typeof orcamento.itens === 'string' ? JSON.parse(orcamento.itens) : orcamento.itens;
  const itensFormatados = Array.isArray(parsedItens) ? parsedItens : [];
  const isPago = orcamento.status === 'pago';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center items-start pt-8 pb-16">
      <Card className="w-full max-w-2xl shadow-xl overflow-hidden border-t-8 border-t-slate-800">
        
        {/* Banner Status */}
        {isPago && (
          <div className="bg-emerald-500 text-white p-4 flex items-center justify-center gap-2">
            <CircleCheck className="w-5 h-5" />
            <span className="font-medium">Pagamento Confirmado. Muito obrigado!</span>
          </div>
        )}
        {(orcamento.status === 'cancelado') && (
          <div className="bg-slate-300 text-slate-700 p-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Este orçamento foi cancelado.</span>
          </div>
        )}

        <CardContent className="p-6 md:p-10 space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Proposta Comercial</h1>
              <p className="text-slate-600 font-medium mt-1">Acordo de prestação de serviços</p>
            </div>
            <div className="text-left md:text-right text-sm space-y-1 text-slate-600">
              <p>Data de emissão: <span className="font-medium text-slate-900">{fmtDataString(orcamento.$createdAt)}</span></p>
              <p>Válido até: <span className="font-medium text-slate-900">7 dias úteis</span></p>
            </div>
          </div>

          <div className="bg-slate-100 p-5 rounded-xl border border-slate-200">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mb-1">Faturado para</p>
            <p className="text-2xl font-bold text-slate-900">{orcamento.cliente_nome}</p>
          </div>

          <div>
            <div className="flex justify-between text-xs uppercase font-bold text-slate-500 border-b-2 border-slate-100 pb-3 mb-4">
               <span>Descrição do Serviço</span>
               <div className="flex gap-4 md:gap-16">
                 <span className="hidden md:inline-block">Qtd</span>
                 <span className="hidden md:inline-block">Valor un.</span>
                 <span>Subtotal</span>
               </div>
            </div>
            
            <div className="space-y-4">
              {itensFormatados.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                   <div className="w-2/3">
                     <p className="font-medium text-slate-900">{item.descricao}</p>
                   </div>
                   <div className="flex gap-4 md:gap-16 text-right">
                     <span className="hidden md:block text-slate-600">{item.quantidade}x</span>
                     <span className="hidden md:block text-slate-600">{fmtBRL(item.valor_unitario)}</span>
                     <span className="font-medium text-slate-900">{fmtBRL(item.quantidade * item.valor_unitario)}</span>
                   </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between items-center text-xl md:text-2xl font-bold text-slate-900">
               <span>Total a pagar</span>
               <span className="text-primary">{fmtBRL(orcamento.valor_total)}</span>
            </div>
          </div>

          {!isPago && orcamento.status !== 'cancelado' && (
            <div className="pt-6">
               <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 md:p-8 flex flex-col items-center text-center">
                  <h3 className="font-bold text-xl text-blue-950 mb-2">Pague com PIX</h3>
                  <p className="text-blue-900 font-medium text-sm mb-6 max-w-sm">Escaneie o código abaixo com o aplicativo do seu banco para processar a aprovação imediata.</p>
                  
                  {qrCodeData ? (
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 mb-6">
                      <img src={qrCodeData} alt="QR Code PIX" className="w-[200px] h-[200px]" />
                    </div>
                  ) : (
                    <Skeleton className="w-[200px] h-[200px] rounded-xl mb-6" />
                  )}

                  <div className="w-full space-y-2">
                    <p className="text-[10px] text-blue-900/60 uppercase font-bold text-left ml-1">PIX Copia e Cola</p>
                    <div className="flex items-center gap-2 bg-blue-100/50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg break-all max-w-full group hover:bg-blue-100 transition-colors">
                       <span className="font-mono text-sm max-w-[200px] md:max-w-xs truncate opacity-70" title="Clique para copiar o código PIX completo">
                         {orcamento.pix_chave} (Código gerado)
                       </span>
                       <Button 
                         size="sm" 
                         variant="ghost" 
                         className="ml-auto h-8 gap-2 hover:bg-blue-200 hover:text-blue-900 text-blue-700" 
                         onClick={copyPix}
                       >
                         <Copy className="h-4 w-4" />
                         <span className="text-xs font-bold">Copiar Código</span>
                       </Button>
                    </div>
                  </div>
               </div>

               <Separator className="my-8" />
               <UploadComprovante 
                 orcamentoId={orcamento.$id} 
                 isLoading={confirmarMutation.isPending}
                 onConfirmar={(arquivo, observacao) => {
                   confirmarMutation.mutate({ 
                     orcamento_id: orcamento.$id, 
                     arquivoFile: arquivo,
                     observacao 
                   });
                 }}
               />
            </div>
          )}

        </CardContent>
        <div className="bg-slate-50 p-6 text-center text-xs text-slate-500 font-medium border-t border-slate-100">
           <p className="flex justify-center items-center gap-1"><Receipt className="w-3 h-3" /> Gerado de forma automatizada por Dashboard KV</p>
        </div>
      </Card>
    </div>
  );
}
