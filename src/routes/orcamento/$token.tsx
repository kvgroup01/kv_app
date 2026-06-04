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
import { KVMark } from '../../components/brand/KVMark';

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
      <div className="min-h-screen" style={{ colorScheme: 'light', background: '#f8fafc', color: '#0f172a' }}>
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 flex justify-center items-start pt-12">
          <Skeleton className="h-[600px] w-full max-w-2xl rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !orcamento) {
    const isPermissionError = error?.message?.includes('insufficient_permissions') || error?.message?.includes('unauthorized');
    
    return (
      <div className="min-h-screen" style={{ colorScheme: 'light', background: '#f8fafc', color: '#0f172a' }}>
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
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
      </div>
    );
  }

  const parsedItens = typeof orcamento.itens === 'string' ? JSON.parse(orcamento.itens) : orcamento.itens;
  const itensFormatados = Array.isArray(parsedItens) ? parsedItens : [];
  const isPago = orcamento.status === 'pago';

  return (
  <div style={{ colorScheme: 'light', background: '#f5f5f5', minHeight: '100vh' }}>
    <div className="min-h-screen bg-[#f5f5f5] p-4 md:p-8 flex justify-center items-start pt-8 pb-16">
      <div className="w-full max-w-2xl space-y-0">

        {/* Header com logo KV */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-black rounded-lg p-2 flex items-center justify-center">
              <KVMark size={22} color="#FBB03B" />
            </div>
            <span className="font-bold text-lg text-black tracking-tight">
              KV<span className="text-[#FBB03B]">ision</span>
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Proposta Comercial</span>
        </div>

        {/* Card principal */}
        <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>

          {/* Faixa superior amarela */}
          <div className="h-1.5 bg-[#FBB03B] w-full" />

          {/* Banners de status */}
          {isPago && (
            <div className="bg-emerald-500 text-white px-8 py-3 flex items-center justify-center gap-2 text-sm font-medium">
              <CircleCheck className="w-4 h-4" /> Pagamento Confirmado — Obrigado!
            </div>
          )}
          {orcamento.status === 'cancelado' && (
            <div className="bg-slate-200 text-slate-600 px-8 py-3 flex items-center justify-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4" /> Este orçamento foi cancelado.
            </div>
          )}

          <div className="p-8 md:p-10 space-y-8">

            {/* Cabeçalho da proposta */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Proposta Comercial</h1>
                <p className="text-sm text-slate-500 mt-1">Acordo de prestação de serviços</p>
              </div>
              <div className="text-sm text-slate-500 space-y-1 sm:text-right">
                <p>Emissão: <span className="font-semibold text-slate-800">{fmtDataString(orcamento.$createdAt)}</span></p>
                <p>Válido por: <span className="font-semibold text-slate-800">7 dias úteis</span></p>
              </div>
            </div>

            {/* Faturado para */}
            <div className="bg-[#FBB03B]/8 border border-[#FBB03B]/20 rounded-xl p-5">
              <p className="text-[10px] text-[#FBB03B] uppercase tracking-widest font-bold mb-1">Faturado para</p>
              <p className="text-xl font-bold text-slate-900">{orcamento.cliente_nome}</p>
            </div>

            {/* Tabela de itens */}
            <div>
              <div className="grid grid-cols-12 text-[10px] uppercase tracking-widest font-bold text-slate-400 pb-3 border-b border-slate-100">
                <span className="col-span-6">Serviço</span>
                <span className="col-span-2 text-center">Qtd</span>
                <span className="col-span-2 text-right">Valor Un.</span>
                <span className="col-span-2 text-right">Subtotal</span>
              </div>
              <div className="space-y-3 mt-4">
                {itensFormatados.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-sm items-center">
                    <span className="col-span-6 font-medium text-slate-800">{item.descricao}</span>
                    <span className="col-span-2 text-center text-slate-500">{item.quantidade}x</span>
                    <span className="col-span-2 text-right text-slate-500">{fmtBRL(item.valor_unitario)}</span>
                    <span className="col-span-2 text-right font-semibold text-slate-800">{fmtBRL(item.quantidade * item.valor_unitario)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t-2 border-slate-100 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Total a pagar</span>
                <span className="text-2xl font-bold text-[#FBB03B]">{fmtBRL(orcamento.valor_total)}</span>
              </div>
            </div>

            {/* Seção PIX + Upload */}
            {!isPago && orcamento.status !== 'cancelado' && (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center text-center">
                  <div className="inline-flex items-center gap-2 bg-[#FBB03B]/10 text-[#c17f00] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                    Pague com PIX
                  </div>
                  <p className="text-sm text-slate-500 mb-6 max-w-sm">Escaneie o código com o app do seu banco para pagamento imediato.</p>
                  {qrCodeData ? (
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-6">
                      <img src={qrCodeData} alt="QR Code PIX" className="w-[180px] h-[180px]" />
                    </div>
                  ) : (
                    <Skeleton className="w-[180px] h-[180px] rounded-xl mb-6" />
                  )}
                  <div className="w-full space-y-1.5">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold text-left">PIX Copia e Cola</p>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-3 rounded-xl">
                      <span className="font-mono text-xs text-slate-500 truncate flex-1">{orcamento.pix_chave} (Código gerado)</span>
                      <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-[#FBB03B] hover:text-[#c17f00] hover:bg-[#FBB03B]/10 shrink-0 font-bold text-xs" onClick={copyPix}>
                        <Copy className="h-3.5 w-3.5" /> Copiar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <UploadComprovante
                    orcamentoId={orcamento.$id}
                    isLoading={confirmarMutation.isPending}
                    onConfirmar={(arquivo, observacao) => {
                      confirmarMutation.mutate({ orcamento_id: orcamento.$id, arquivoFile: arquivo, observacao });
                    }}
                  />
                </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-8 py-4 flex items-center justify-center gap-2 bg-slate-50/50">
            <Receipt className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-xs text-slate-400 font-medium">Gerado automaticamente por KVision</span>
          </div>

        </div>
      </div>
    </div>
  </div>
);
}
