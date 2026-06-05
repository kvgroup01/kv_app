import * as React from 'react';
import { fmtBRL } from '../../lib/utils';
import { KVMark } from '../brand/KVMark';

// Componente de campo editável inline
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

  const updateItem = (idx: number, field: string, value: string) => {
    setItens(prev => prev.map((item, i) =>
      i === idx
        ? { ...item, [field]: field === 'descricao' ? value : parseFloat(value) || 0 }
        : item
    ));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', fontFamily: 'system-ui, -apple-system, sans-serif', colorScheme: 'light' }}>

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
                  <div style={{ fontSize: 11, color: '#6e6e73', marginTop: 2, display: 'flex', gap: 4 }}>
                    <EditableField
                      value={item.quantidade}
                      onChange={v => updateItem(idx, 'quantidade', v)}
                      type="number"
                      style={{ fontSize: 11, color: '#6e6e73', width: 32 }}
                    />
                    <span>x ·</span>
                    <EditableField
                      value={item.valor_unitario}
                      onChange={v => updateItem(idx, 'valor_unitario', v)}
                      type="number"
                      style={{ fontSize: 11, color: '#6e6e73', width: 70 }}
                    />
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
          <div style={{ background: '#f5f5f7', borderTop: '1px solid #f0f0f0', padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#fff', border: '1px solid #e5e5e7', borderRadius: 9999, padding: '3px 12px', fontSize: 9, fontWeight: 600, color: '#1d1d1f', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
              Pague com PIX
            </div>
            <div style={{ fontSize: 11, color: '#6e6e73' }}>
              Chave:{' '}
              <EditableField
                value={pixChave}
                onChange={setPixChave}
                placeholder="sua@chave.pix"
                style={{ fontSize: 11, color: '#1d1d1f', fontFamily: 'monospace' }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
