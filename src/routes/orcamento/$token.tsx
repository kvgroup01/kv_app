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
    <div style={{ colorScheme: 'light', background: '#f5f5f7', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
  
      {/* NAV — estilo global-nav Apple, mas com identidade KV */}
      <nav style={{ background: '#1d1d1f', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <KVMark size={20} color="#FBB03B" />
          <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 15, letterSpacing: '-0.2px' }}>
            KV<span style={{ color: '#FBB03B' }}>GROUP</span>
          </span>
        </div>
      </nav>
  
      {/* Banners de status — fora do card */}
      {isPago && (
        <div style={{ background: '#1d1d1f', color: '#fff', padding: '10px 24px', textAlign: 'center', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CircleCheck style={{ width: 16, height: 16, color: '#34c759' }} />
          Pagamento confirmado — Obrigado!
        </div>
      )}
      {orcamento.status === 'cancelado' && (
        <div style={{ background: '#f5f5f7', color: '#6e6e73', padding: '10px 24px', textAlign: 'center', fontSize: 14, borderBottom: '1px solid #e5e5e7' }}>
          Este orçamento foi cancelado.
        </div>
      )}
  
      {/* CONTEÚDO */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>
  
        {/* Card principal */}
        <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #e5e5e7', overflow: 'hidden' }}>
  
          {/* Cabeçalho do documento */}
          <div style={{ padding: '40px 40px 32px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.374px', margin: 0 }}>
                  Proposta Comercial
                </h1>
                <p style={{ fontSize: 14, color: '#6e6e73', marginTop: 4, marginBottom: 0 }}>
                  Acordo de prestação de serviços
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: '#6e6e73', lineHeight: 1.8 }}>
                <div>Emissão: <span style={{ color: '#1d1d1f', fontWeight: 500 }}>{fmtDataString(orcamento.$createdAt)}</span></div>
                <div>Válido por: <span style={{ color: '#1d1d1f', fontWeight: 500 }}>7 dias úteis</span></div>
              </div>
            </div>
          </div>
  
          {/* Faturado para */}
          <div style={{ padding: '24px 40px', background: '#f5f5f7', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>
              Faturado para
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.3px' }}>
              {orcamento.cliente_nome}
            </div>
          </div>
  
          {/* Itens */}
          <div style={{ padding: '32px 40px' }}>
            {/* Cabeçalho da tabela */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0 24px', paddingBottom: 12, borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
              {['Serviço', 'Qtd', 'Valor Un.', 'Subtotal'].map((h, i) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>
                  {h}
                </span>
              ))}
            </div>
  
            {/* Linhas */}
            {itensFormatados.map((item: any, idx: number) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0 24px', padding: '12px 0', borderBottom: '1px solid #f5f5f7' }}>
                <span style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500 }}>{item.descricao}</span>
                <span style={{ fontSize: 15, color: '#6e6e73', textAlign: 'right' }}>{item.quantidade}x</span>
                <span style={{ fontSize: 15, color: '#6e6e73', textAlign: 'right' }}>{fmtBRL(item.valor_unitario)}</span>
                <span style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 600, textAlign: 'right' }}>{fmtBRL(item.quantidade * item.valor_unitario)}</span>
              </div>
            ))}
  
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginTop: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.374px' }}>Total a pagar</span>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.374px' }}>{fmtBRL(orcamento.valor_total)}</span>
            </div>
          </div>
  
          {/* Seção PIX */}
          {!isPago && orcamento.status !== 'cancelado' && (
            <>
              <div style={{ background: '#f5f5f7', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', padding: '40px 40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {/* Badge */}
                <div style={{ display: 'inline-block', background: '#fff', border: '1px solid #e5e5e7', borderRadius: 9999, padding: '5px 16px', fontSize: 11, fontWeight: 600, color: '#1d1d1f', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 20 }}>
                  Pague com PIX
                </div>
                <p style={{ fontSize: 15, color: '#6e6e73', maxWidth: 320, margin: '0 auto 28px', lineHeight: 1.5 }}>
                  Escaneie o código com o aplicativo do seu banco para pagamento imediato.
                </p>
                {qrCodeData ? (
                  <div style={{ background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e5e5e7', marginBottom: 24, display: 'inline-block' }}>
                    <img src={qrCodeData} alt="QR Code PIX" style={{ width: 160, height: 160, display: 'block' }} />
                  </div>
                ) : (
                  <Skeleton className="w-[160px] h-[160px] rounded-xl mb-6" />
                )}
  
                {/* PIX Copia e Cola */}
                <div style={{ width: '100%', maxWidth: 400 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#8e8e93', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8, textAlign: 'left' }}>
                    PIX Copia e Cola
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e5e5e7', borderRadius: 10, padding: '10px 16px', gap: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8e8e93', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {orcamento.pix_chave} (Código gerado)
                    </span>
                    <button
                      onClick={copyPix}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FBB03B', fontWeight: 600, fontSize: 13, padding: '4px 0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Copy style={{ width: 14, height: 14 }} />
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
  
              {/* Upload Comprovante */}
              <div style={{ padding: '32px 40px' }}>
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
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Receipt style={{ width: 12, height: 12 }} />
          Gerado automaticamente por KVision
        </div>
  
      </div>
    </div>
  );
}
