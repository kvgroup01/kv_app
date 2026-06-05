import * as React from 'react';
import { fmtBRL } from '../../lib/utils';
import { KVMark } from '../brand/KVMark';

interface OrcamentoPreviewProps {
  clienteNome: string;
  itens: { descricao: string; quantidade: number; valor_unitario: number }[];
  pixChave: string;
}

export function OrcamentoPreview({ clienteNome, itens, pixChave }: OrcamentoPreviewProps) {
  const total = itens.reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0);
  const itensValidos = itens.filter(i => i.descricao.trim() !== '');

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: '#f5f5f7',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        colorScheme: 'light',
        fontSize: 16,
      }}
    >
      {/* NAV */}
      <nav style={{ background: '#1d1d1f', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KVMark size={18} color="#FBB03B" />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: '-0.2px' }}>
            KV<span style={{ color: '#FBB03B' }}>GROUP</span>
          </span>
        </div>
      </nav>

      {/* Conteúdo */}
      <div style={{ padding: '24px 16px 40px' }}>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e5e7', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.374px', marginBottom: 4 }}>
              Proposta Comercial
            </div>
            <div style={{ fontSize: 13, color: '#6e6e73' }}>Acordo de prestação de serviços</div>
            <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 8 }}>
              Emissão: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' '}· Válido por 7 dias úteis
            </div>
          </div>

          {/* Faturado para */}
          <div style={{ padding: '16px 24px', background: '#f5f5f7', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
              Faturado para
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: clienteNome ? '#1d1d1f' : '#c7c7cc', letterSpacing: '-0.2px' }}>
              {clienteNome || 'Nome do cliente...'}
            </div>
          </div>

          {/* Itens */}
          <div style={{ padding: '16px 24px' }}>
            {itensValidos.length === 0 ? (
              <div style={{ fontSize: 13, color: '#c7c7cc', padding: '12px 0' }}>
                Adicione itens ao orçamento...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {itensValidos.map((item, idx) => (
                  <div
                    key={idx}
                    style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f7', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f' }}>{item.descricao}</div>
                      <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>
                        {item.quantidade}x · {fmtBRL(item.valor_unitario)}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                      {fmtBRL(item.quantidade * item.valor_unitario)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 4, borderTop: '2px solid #f0f0f0' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>Total a pagar</span>
              <span style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.3px' }}>
                {fmtBRL(total)}
              </span>
            </div>
          </div>

          {/* PIX */}
          <div style={{ background: '#f5f5f7', borderTop: '1px solid #f0f0f0', padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#fff', border: '1px solid #e5e5e7', borderRadius: 9999, padding: '4px 14px', fontSize: 10, fontWeight: 600, color: '#1d1d1f', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
              Pague com PIX
            </div>
            {pixChave ? (
              <div style={{ fontSize: 12, color: '#6e6e73' }}>
                Chave: <span style={{ fontFamily: 'monospace', color: '#1d1d1f' }}>{pixChave}</span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#c7c7cc' }}>
                QR Code aparecerá aqui
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
