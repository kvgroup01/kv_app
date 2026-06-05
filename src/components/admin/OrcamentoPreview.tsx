import * as React from 'react';
import QRCode from 'qrcode';
import { fmtBRL, gerarPayloadPix } from '../../lib/utils';
import { KVMark } from '../brand/KVMark';
import { UploadCloud } from 'lucide-react';

function EditableField({
  value, onChange, type = 'text', placeholder = '', style = {},
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => e.key === 'Enter' && setEditing(false)}
        style={{
          border: '1px solid #FBB03B',
          borderRadius: 6,
          padding: '2px 6px',
          outline: 'none',
          background: '#fffbf0',
          fontFamily: 'inherit',
          ...style,
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Clique para editar"
      style={{
        cursor: 'text',
        borderRadius: 4,
        padding: '2px 4px',
        transition: 'background 0.15s',
        ...style,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,176,59,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {value || <span style={{ color: '#c7c7cc' }}>{placeholder}</span>}
    </span>
  );
}

interface OrcamentoPreviewProps {
  clienteNome: string;
  itens: { descricao: string; quantidade: number; valor_unitario: number }[];
  setItens: React.Dispatch<React.SetStateAction<{ descricao: string; quantidade: number; valor_unitario: number }[]>>;
  pixChave: string;
  setPixChave: (v: string) => void;
}

export function OrcamentoPreview({ clienteNome, itens, setItens, pixChave, setPixChave }: OrcamentoPreviewProps) {
  const total = itens.reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0);
  const [qrCodeImg, setQrCodeImg] = React.useState('');

  React.useEffect(() => {
    if (pixChave && total > 0) {
      const payload = gerarPayloadPix(pixChave, total, 'Gestor KVision', 'SAO PAULO');
      QRCode.toDataURL(payload, { width: 180, margin: 1 }, (err, url) => {
        if (!err) setQrCodeImg(url);
      });
    } else {
      setQrCodeImg('');
    }
  }, [pixChave, total]);

  const updateItem = (idx: number, field: string, value: string) => {
    setItens(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'descricao' ? value : parseFloat(value) || 0 } : item
    ));
  };

  return (
    <div style={{ minHeight: '100%', background: '#f5f5f7', fontFamily: 'system-ui, -apple-system, sans-serif', colorScheme: 'light' }}>

      {/* NAV */}
      <nav style={{ background: '#1d1d1f', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 37 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KVMark size={18} color="#FBB03B" />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
            KV<span style={{ color: '#FBB03B' }}>GROUP</span>
          </span>
        </div>
      </nav>

      <div style={{ padding: '20px 14px 40px' }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e5e7', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.374px', marginBottom: 4 }}>
              Proposta Comercial
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73' }}>Acordo de prestação de serviços</div>
            <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 6 }}>
              Emissão: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' '}· Válido por 7 dias úteis
            </div>
          </div>

          {/* Faturado para */}
          <div style={{ padding: '14px 20px', background: '#f5f5f7', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
              Faturado para
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>
              {clienteNome || <span style={{ color: '#c7c7cc' }}>Nome do cliente...</span>}
            </div>
          </div>

          {/* Itens */}
          <div style={{ padding: '14px 20px' }}>
            {itens.map((item, idx) => (
              <div key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <EditableField
                    value={item.descricao}
                    onChange={v => updateItem(idx, 'descricao', v)}
                    placeholder="Descrição do serviço"
                    style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f', display: 'block', width: '100%' }}
                  />
                  <div style={{ fontSize: 11, color: '#6e6e73', marginTop: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <EditableField value={item.quantidade} onChange={v => updateItem(idx, 'quantidade', v)} type="number" style={{ fontSize: 11, width: 32 }} />
                    <span>x ·</span>
                    <EditableField value={item.valor_unitario} onChange={v => updateItem(idx, 'valor_unitario', v)} type="number" style={{ fontSize: 11, width: 70 }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', whiteSpace: 'nowrap' }}>
                  {fmtBRL(item.quantidade * item.valor_unitario)}
                </div>
              </div>
            ))}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4, borderTop: '2px solid #f0f0f0' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>Total a pagar</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f' }}>{fmtBRL(total)}</span>
            </div>
          </div>

          {/* PIX */}
          <div style={{ background: '#f5f5f7', borderTop: '1px solid #f0f0f0', padding: '20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#fff', border: '1px solid #e5e5e7', borderRadius: 9999, padding: '3px 12px', fontSize: 9, fontWeight: 600, color: '#1d1d1f', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
              Pague com PIX
            </div>
            <p style={{ fontSize: 11, color: '#6e6e73', marginBottom: 14 }}>
              Escaneie o código com o app do seu banco para pagamento imediato.
            </p>

            {/* QR Code */}
            {qrCodeImg ? (
              <div style={{ background: '#fff', padding: 8, borderRadius: 12, border: '1px solid #e5e5e7', marginBottom: 14 }}>
                <img src={qrCodeImg} alt="QR Code PIX" style={{ width: 140, height: 140, display: 'block' }} />
              </div>
            ) : (
              <div style={{ width: 140, height: 140, background: '#f0f0f0', borderRadius: 12, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: '#8e8e93' }}>QR Code</span>
              </div>
            )}

            {/* PIX chave */}
            <div style={{ width: '100%', background: '#fff', border: '1px solid #e5e5e7', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8e8e93', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <EditableField value={pixChave} onChange={setPixChave} placeholder="sua@chave.pix" style={{ fontSize: 10, fontFamily: 'monospace', color: '#1d1d1f' }} />
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#FBB03B', whiteSpace: 'nowrap' }}>Copiar</span>
            </div>
          </div>

          {/* Upload comprovante */}
          <div style={{ padding: '20px 20px', borderTop: '1px solid #f0f0f0' }}>
            {/* Dropzone */}
            <div style={{ border: '2px dashed #e5e5e7', borderRadius: 12, padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: '#fafafa', marginBottom: 14 }}>
              <UploadCloud style={{ width: 28, height: 28, color: '#8e8e93' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>Arraste seu comprovante aqui</span>
              <span style={{ fontSize: 11, color: '#6e6e73' }}>Ou clique para selecionar nos seus arquivos</span>
              <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#8e8e93', fontWeight: 600 }}>
                <span>PNG</span><span>·</span><span>JPG</span><span>·</span><span>PDF</span>
              </div>
              <span style={{ fontSize: 10, color: '#a0a0a5' }}>Tamanho máximo: 5MB</span>
            </div>

            {/* Observação */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', marginBottom: 6 }}>Observação (Opcional)</div>
              <div style={{ border: '1px solid #e5e5e7', borderRadius: 10, padding: '10px 12px', minHeight: 60, background: '#fff', fontSize: 12, color: '#c7c7cc' }}>
                Deixe uma mensagem para o gestor se necessário...
              </div>
            </div>

            {/* Botão confirmar */}
            <div style={{ width: '100%', height: 44, background: '#FBB03B', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#000' }}>
              Confirmar pagamento
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', textAlign: 'center', background: '#fafafa' }}>
            <span style={{ fontSize: 10, color: '#8e8e93' }}>Gerado automaticamente por KVision</span>
          </div>

        </div>
      </div>
    </div>
  );
}
