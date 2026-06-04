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
  const [paymentStatus, setPaymentStatus] = React.useState<'idle' | 'loading' | 'success'>('idle');
  const [paymentTime, setPaymentTime] = React.useState<string>('');

  function getSaudacao() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Bom dia';
    if (h >= 12 && h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

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
      <div className="min-h-screen bg-[#f5f5f7] flex justify-center items-start pt-16 px-4">
        <Skeleton className="h-[500px] w-full max-w-xl rounded-2xl" />
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Orçamento não encontrado</h1>
          <p className="text-[15px] text-[#6e6e73] leading-relaxed">
            Este link pode estar quebrado, expirado ou o orçamento foi deletado do sistema.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full border border-[#e5e5e7] bg-white text-[#1d1d1f] text-[15px] font-medium hover:bg-[#f5f5f7] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const parsedItens = typeof orcamento.itens === 'string' ? JSON.parse(orcamento.itens) : orcamento.itens;
  const itensFormatados = Array.isArray(parsedItens) ? parsedItens : [];
  const isPago = orcamento.status === 'pago';

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center gap-6 px-6" style={{ colorScheme: 'light', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="bg-white rounded-2xl border border-[#e5e5e7] p-10 flex flex-col items-center gap-5 w-full max-w-sm text-center">
          <KVMark size={32} color="#FBB03B" />
          <div className="w-10 h-10 border-4 border-[#FBB03B] border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f]">Processando pagamento</p>
            <p className="text-[14px] text-[#6e6e73] mt-1">Aguarde um momento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center gap-6 px-6" style={{ colorScheme: 'light', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="bg-white rounded-2xl border border-[#e5e5e7] p-10 flex flex-col items-center gap-5 w-full max-w-sm text-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#1d1d1f] rounded-lg p-1.5 flex items-center justify-center">
              <KVMark size={16} color="#FBB03B" />
            </div>
            <span className="font-semibold text-[15px] text-[#1d1d1f] tracking-tight">
              KV<span className="text-[#FBB03B]">GROUP</span>
            </span>
          </div>

          {/* Ícone de check animado */}
          <div className="w-16 h-16 rounded-full bg-[#34c759]/10 flex items-center justify-center">
            <CircleCheck className="w-8 h-8 text-[#34c759]" />
          </div>

          {/* Saudação */}
          <div>
            <p className="text-[22px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
              {getSaudacao()}, obrigado! 🎉
            </p>
            <p className="text-[14px] text-[#6e6e73] mt-2 leading-relaxed">
              Seu comprovante foi enviado com sucesso.<br />Em breve entraremos em contato.
            </p>
          </div>

          {/* Resumo do pagamento */}
          <div className="w-full bg-[#f5f5f7] rounded-xl p-4 space-y-2 text-left">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6e6e73]">Cliente</span>
              <span className="font-medium text-[#1d1d1f]">{orcamento.cliente_nome}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6e6e73]">Valor</span>
              <span className="font-semibold text-[#1d1d1f]">{fmtBRL(orcamento.valor_total)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6e6e73]">Data e hora</span>
              <span className="font-medium text-[#1d1d1f]">{paymentTime}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6e6e73]">Status</span>
              <span className="font-semibold text-[#34c759]">Confirmado</span>
            </div>
          </div>

          <p className="text-[11px] text-[#8e8e93]">Gerado automaticamente por KVision</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]" style={{ colorScheme: 'light', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
  
      {/* NAV */}
      <nav className="bg-[#1d1d1f] h-12 flex items-center justify-center sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <KVMark size={18} color="#FBB03B" />
          <span className="text-white font-semibold text-[15px] tracking-tight">
            KV<span className="text-[#FBB03B]">GROUP</span>
          </span>
        </div>
      </nav>
  
      {/* Banners de status */}
      {isPago && (
        <div className="bg-[#1d1d1f] text-white py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <CircleCheck className="w-4 h-4 text-[#34c759] shrink-0" />
          Pagamento confirmado — Obrigado!
        </div>
      )}
      {orcamento.status === 'cancelado' && (
        <div className="bg-white text-[#6e6e73] py-2.5 px-4 flex items-center justify-center gap-2 text-sm border-b border-[#e5e5e7]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Este orçamento foi cancelado.
        </div>
      )}
  
      {/* CONTEÚDO */}
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-8 pb-16">
  
        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-[#e5e5e7] overflow-hidden">
  
          {/* Cabeçalho */}
          <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-[#f0f0f0]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight leading-tight">
                  Proposta Comercial
                </h1>
                <p className="text-[14px] text-[#6e6e73] mt-1">Acordo de prestação de serviços</p>
              </div>
              <div className="text-[13px] text-[#6e6e73] space-y-0.5 sm:text-right">
                <p>Emissão: <span className="text-[#1d1d1f] font-medium">{fmtDataString(orcamento.$createdAt)}</span></p>
                <p>Válido por: <span className="text-[#1d1d1f] font-medium">7 dias úteis</span></p>
              </div>
            </div>
          </div>
  
          {/* Faturado para */}
          <div className="px-6 sm:px-8 py-5 bg-[#f5f5f7] border-b border-[#f0f0f0]">
            <p className="text-[10px] font-semibold text-[#8e8e93] uppercase tracking-widest mb-1">Faturado para</p>
            <p className="text-[18px] sm:text-xl font-semibold text-[#1d1d1f] tracking-tight">{orcamento.cliente_nome}</p>
          </div>
  
          {/* Itens */}
          <div className="px-6 sm:px-8 py-6">
  
            {/* Cabeçalho da tabela — escondido no mobile, visível sm+ */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-x-6 pb-3 border-b border-[#f0f0f0] mb-3">
              {['Serviço', 'Qtd', 'Valor Un.', 'Subtotal'].map((h, i) => (
                <span key={h} className={`text-[10px] font-semibold text-[#8e8e93] uppercase tracking-widest ${i > 0 ? 'text-right' : ''}`}>
                  {h}
                </span>
              ))}
            </div>
  
            {/* Linhas dos itens */}
            <div className="space-y-0 divide-y divide-[#f5f5f7]">
              {itensFormatados.map((item: any, idx: number) => (
                <div key={idx} className="py-4">
                  {/* Mobile: layout em bloco */}
                  <div className="sm:hidden">
                    <p className="text-[15px] font-medium text-[#1d1d1f] mb-1">{item.descricao}</p>
                    <div className="flex justify-between text-[13px] text-[#6e6e73]">
                      <span>{item.quantidade}x · {fmtBRL(item.valor_unitario)}</span>
                      <span className="font-semibold text-[#1d1d1f]">{fmtBRL(item.quantidade * item.valor_unitario)}</span>
                    </div>
                  </div>
                  {/* Desktop: grid */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center">
                    <span className="text-[15px] font-medium text-[#1d1d1f]">{item.descricao}</span>
                    <span className="text-[14px] text-[#6e6e73] text-right">{item.quantidade}x</span>
                    <span className="text-[14px] text-[#6e6e73] text-right">{fmtBRL(item.valor_unitario)}</span>
                    <span className="text-[14px] font-semibold text-[#1d1d1f] text-right">{fmtBRL(item.quantidade * item.valor_unitario)}</span>
                  </div>
                </div>
              ))}
            </div>
  
            {/* Total */}
            <div className="flex justify-between items-center pt-5 mt-2 border-t-2 border-[#f0f0f0]">
              <span className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight">Total a pagar</span>
              <span className="text-[22px] sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight">{fmtBRL(orcamento.valor_total)}</span>
            </div>
          </div>
  
          {/* PIX + Upload */}
          {!isPago && orcamento.status !== 'cancelado' && (
            <>
              <div className="bg-[#f5f5f7] border-t border-[#f0f0f0] px-6 sm:px-8 py-8 flex flex-col items-center text-center">
                <span className="inline-block bg-white border border-[#e5e5e7] rounded-full px-4 py-1.5 text-[11px] font-semibold text-[#1d1d1f] uppercase tracking-widest mb-5">
                  Pague com PIX
                </span>
                <p className="text-[14px] text-[#6e6e73] max-w-xs mb-7 leading-relaxed">
                  Escaneie o código com o app do seu banco para pagamento imediato.
                </p>
                {qrCodeData ? (
                  <div className="bg-white p-3 rounded-xl border border-[#e5e5e7] mb-7 inline-block">
                    <img src={qrCodeData} alt="QR Code PIX" className="w-40 h-40 sm:w-44 sm:h-44 block" />
                  </div>
                ) : (
                  <Skeleton className="w-40 h-40 rounded-xl mb-7" />
                )}
  
                {/* PIX Copia e Cola */}
                <div className="w-full max-w-sm">
                  <p className="text-[10px] font-semibold text-[#8e8e93] uppercase tracking-widest mb-2 text-left">
                    PIX Copia e Cola
                  </p>
                  <div className="flex items-center bg-white border border-[#e5e5e7] rounded-xl px-4 py-3 gap-3">
                    <span className="font-mono text-[12px] text-[#8e8e93] flex-1 truncate min-w-0">
                      {orcamento.pix_chave} (Código gerado)
                    </span>
                    <button
                      onClick={copyPix}
                      className="shrink-0 flex items-center gap-1.5 text-[#FBB03B] font-semibold text-[13px] hover:opacity-70 transition-opacity"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
  
              <div className="px-6 sm:px-8 py-8 border-t border-[#f0f0f0]">
                <UploadComprovante
                  orcamentoId={orcamento.$id}
                  isLoading={confirmarMutation.isPending}
                  onConfirmar={(arquivo, observacao) => {
                  setPaymentStatus('loading');
                  setPaymentTime(new Date().toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  }));
                  confirmarMutation.mutate(
                    { orcamento_id: orcamento.$id, arquivoFile: arquivo, observacao },
                    {
                      onSuccess: () => setPaymentStatus('success'),
                      onError: () => { setPaymentStatus('idle'); toast.error('Erro ao confirmar pagamento.'); }
                    }
                  );
                  }}
                />
              </div>
            </>
          )}
  
        </div>
  
        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[12px] text-[#8e8e93]">
          <Receipt className="w-3 h-3" />
          Gerado automaticamente por KVision
        </div>
  
      </div>
    </div>
  );
}
