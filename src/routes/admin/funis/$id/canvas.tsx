import * as React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ReactFlow, Background, Controls, addEdge,
  useNodesState, useEdgesState, type Connection,
  type NodeTypes, BackgroundVariant, Handle, Position,
  useReactFlow, ReactFlowProvider, NodeToolbar,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Megaphone, Mail, FileText, Package,
  LayoutTemplate, Users, CheckCircle, Calendar, DollarSign,
  MessageCircle, BarChart2, Pencil, Trash2, Copy,
  AlignLeft, AlignCenter, ChevronDown, Type, Save,
  RotateCcw, ZoomIn, ZoomOut, Maximize2, MousePointer2,
} from 'lucide-react';
import { useFunil, useAtualizarFunil } from '../../../../hooks/useFunis';

// ─── TIPOS DE NÓ ─────────────────────────────────────────
const NODE_TYPES_CONFIG = [
  { type: 'anuncio',     label: 'Anúncio',     Icon: Megaphone,      color: '#3b82f6' },
  { type: 'pagina',      label: 'Página',       Icon: LayoutTemplate, color: '#8b5cf6' },
  { type: 'email',       label: 'E-mail',       Icon: Mail,           color: '#6366f1' },
  { type: 'produto',     label: 'Produto',      Icon: Package,        color: '#f59e0b' },
  { type: 'formulario',  label: 'Formulário',   Icon: FileText,       color: '#f97316' },
  { type: 'lead',        label: 'Lead',         Icon: Users,          color: '#10b981' },
  { type: 'pesquisa',    label: 'Pesquisa',     Icon: BarChart2,      color: '#ec4899' },
  { type: 'qualificado', label: 'Qualificado',  Icon: CheckCircle,    color: '#22c55e' },
  { type: 'reuniao',     label: 'Reunião',      Icon: Calendar,       color: '#f97316' },
  { type: 'venda',       label: 'Venda',        Icon: DollarSign,     color: '#eab308' },
  { type: 'whatsapp',    label: 'WhatsApp',     Icon: MessageCircle,  color: '#25d366' },
  { type: 'texto',       label: 'Texto',        Icon: Type,           color: '#94a3b8' },
];

// ─── MODAL ADICIONAR NÓ ──────────────────────────────────
function ModalAddNode({ onAdd, onClose }: {
  onAdd: (type: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const filtered = NODE_TYPES_CONFIG.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#2d2d2d', borderRadius: 12, width: 420,
        border: '1px solid #3d3d3d',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #3d3d3d' }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nó..."
            style={{
              width: '100%', padding: '10px 14px',
              background: '#383838', border: '1px solid #4d4d4d',
              borderRadius: 8, color: '#e5e7eb', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
          {filtered.map(({ type, label, Icon, color }) => (
            <button
              key={type}
              onClick={() => { onAdd(type); onClose(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 12, padding: '10px 12px', borderRadius: 8,
                border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#383838')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: `${color}20`, border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={color} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 14, color: '#e5e7eb', fontWeight: 500 }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODAL PERFORMANCE ───────────────────────────────────
function ModalPerformance({ label, onClose }: { label: string; onClose: () => void }) {
  const [aba, setAba] = React.useState<'performance' | 'info'>('performance');

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#2d2d2d', borderRadius: 12, width: 540,
        maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        border: '1px solid #3d3d3d',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '18px 20px 0',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb' }}>{label}</span>
          <button onClick={onClose} style={{
            background: '#383838', border: 'none', borderRadius: 6,
            width: 28, height: 28, cursor: 'pointer', color: '#9ca3af',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0' }}>
          {['performance', 'info'].map(tab => (
            <button key={tab} onClick={() => setAba(tab as any)} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: 12,
              background: aba === tab ? '#383838' : 'transparent',
              color: aba === tab ? '#e5e7eb' : '#6b7280',
              textTransform: 'capitalize',
            }}>
              {tab === 'performance' ? 'Performance' : 'Informações'}
            </button>
          ))}
        </div>
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {aba === 'performance' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb' }}>Performance</span>
                <select style={{
                  border: '1px solid #3d3d3d', borderRadius: 7,
                  padding: '6px 10px', fontSize: 12, color: '#9ca3af',
                  background: '#383838', cursor: 'pointer',
                }}>
                  <option>Período...</option>
                  <option>Últimos 7 dias</option>
                  <option>Últimos 30 dias</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Visitas', value: '0', icon: '👁' },
                  { label: 'Leads', value: '0', icon: '👤' },
                  { label: 'Conversão', value: '0%', icon: '🎯' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: '#383838', borderRadius: 10, padding: 14,
                    border: '1px solid #3d3d3d',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb' }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{
                background: '#383838', borderRadius: 10, border: '1px solid #3d3d3d',
                height: 120, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#4b5563', fontSize: 13,
              }}>
                Nenhum dado encontrado
              </div>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280',
                display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Nome
              </label>
              <input placeholder="Nome deste nó..." style={{
                width: '100%', padding: '9px 12px', border: '1px solid #3d3d3d',
                borderRadius: 7, fontSize: 13, color: '#e5e7eb',
                background: '#383838', outline: 'none', boxSizing: 'border-box',
              }} />
            </div>
          )}
        </div>
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #3d3d3d',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: '7px 18px', borderRadius: 7, border: '1px solid #3d3d3d',
            background: 'transparent', color: '#9ca3af', fontWeight: 600,
            fontSize: 12, cursor: 'pointer',
          }}>Sair</button>
          {aba === 'info' && (
            <button onClick={onClose} style={{
              padding: '7px 18px', borderRadius: 7, border: 'none',
              background: '#ff6d5a', color: '#fff', fontWeight: 600,
              fontSize: 12, cursor: 'pointer',
            }}>Salvar</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NÓ CUSTOMIZADO ──────────────────────────────────────
function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const config = NODE_TYPES_CONFIG.find(t => t.type === data.nodeType) || NODE_TYPES_CONFIG[0];
  const { Icon, color } = config;

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Bottom} offset={8}>
        <div style={{
          display: 'flex', gap: 2, background: '#2d2d2d',
          border: '1px solid #3d3d3d', borderRadius: 8,
          padding: '4px 6px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {[
            { icon: BarChart2, label: 'Performance', action: 'performance' },
            { icon: Copy,      label: 'Copiar',      action: 'copy' },
            { icon: Trash2,    label: 'Deletar',     action: 'delete', danger: true },
          ].map(({ icon: BtnIcon, label, action, danger }) => (
            <button key={action} title={label}
              onClick={e => { e.stopPropagation(); data.onAction?.(action); }}
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: danger ? '#ef4444' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  danger ? 'rgba(239,68,68,0.15)' : '#383838';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <BtnIcon size={13} strokeWidth={2} />
            </button>
          ))}
        </div>
      </NodeToolbar>

      <div style={{
        background: '#2d2d2d',
        border: `1px solid ${selected ? color : '#3d3d3d'}`,
        borderRadius: 10, width: 200, overflow: 'hidden',
        boxShadow: selected
          ? `0 0 0 2px ${color}33, 0 8px 24px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'all 0.15s',
      }}>
        <Handle type="target" position={Position.Left} style={{
          background: '#555', width: 8, height: 8,
          border: '2px solid #2d2d2d', left: -5,
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          borderBottom: selected ? `1px solid ${color}33` : '1px solid #383838',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: `${color}20`, border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={color} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
              {config.label}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
              {data.label || config.label}
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[85, 65, 45].map((w, i) => (
            <div key={i} style={{
              height: 5, width: `${w}%`,
              background: '#383838', borderRadius: 3,
            }} />
          ))}
        </div>

        <Handle type="source" position={Position.Right} style={{
          background: '#555', width: 8, height: 8,
          border: '2px solid #2d2d2d', right: -5,
        }} />
      </div>
    </>
  );
}

// ─── NÓ DE TEXTO ─────────────────────────────────────────
function TextNode({ data, selected }: { data: any; selected: boolean }) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(data.text || 'Texto aqui');
  const [align, setAlign] = React.useState<'left' | 'center'>(data.align || 'center');
  const [bgColor, setBgColor] = React.useState(data.bgColor || '#2d2d2d');
  const [showColors, setShowColors] = React.useState(false);
  const COLORS = ['#2d2d2d', '#1e3a5f', '#1e3a2f', '#3b1f2b', '#2d2a1e', '#1f1f3b'];

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Bottom} offset={8}>
        <div style={{
          display: 'flex', gap: 2, alignItems: 'center',
          background: '#2d2d2d', border: '1px solid #3d3d3d',
          borderRadius: 8, padding: '4px 6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {[
            { icon: AlignLeft,   action: () => setAlign('left'),   active: align === 'left' },
            { icon: AlignCenter, action: () => setAlign('center'), active: align === 'center' },
          ].map(({ icon: BtnIcon, action, active }, i) => (
            <button key={i} onClick={action} style={{
              width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: active ? '#ff6d5a' : 'transparent',
              color: active ? '#fff' : '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BtnIcon size={13} />
            </button>
          ))}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowColors(v => !v)} style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid #4d4d4d', cursor: 'pointer',
              background: bgColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronDown size={10} color="#9ca3af" />
            </button>
            {showColors && (
              <div style={{
                position: 'absolute', bottom: 36, left: '50%',
                transform: 'translateX(-50%)',
                background: '#2d2d2d', border: '1px solid #3d3d3d',
                borderRadius: 8, padding: 6,
                display: 'flex', flexDirection: 'column', gap: 4,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 100,
              }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => { setBgColor(c); setShowColors(false); }} style={{
                    width: 18, height: 18, borderRadius: '50%', background: c,
                    border: bgColor === c ? '2px solid #ff6d5a' : '1px solid #4d4d4d',
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
            )}
          </div>
          <button onClick={() => data.onAction?.('copy')} style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'transparent', color: '#9ca3af', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Copy size={13} />
          </button>
          <button onClick={() => data.onAction?.('delete')} style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'transparent', color: '#ef4444', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={13} />
          </button>
        </div>
      </NodeToolbar>

      <Handle type="target" position={Position.Left} style={{
        background: '#555', width: 8, height: 8,
        border: '2px solid #2d2d2d', left: -5,
      }} />
      <div onDoubleClick={() => setEditing(true)} style={{
        background: bgColor,
        border: `1px solid ${selected ? '#ff6d5a' : '#3d3d3d'}`,
        borderRadius: 10, minWidth: 160, minHeight: 60, padding: 16,
        cursor: editing ? 'text' : 'grab',
        boxShadow: selected ? '0 0 0 2px rgba(255,109,90,0.2)' : '0 2px 8px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        transition: 'all 0.15s',
      }}>
        {editing ? (
          <textarea autoFocus value={text} onChange={e => setText(e.target.value)}
            onBlur={() => setEditing(false)}
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, fontWeight: 600, color: '#e5e7eb',
              resize: 'none', width: '100%', textAlign: align, fontFamily: 'sans-serif',
            }} rows={3}
          />
        ) : (
          <span style={{
            fontSize: 14, fontWeight: 600, color: '#e5e7eb',
            textAlign: align, width: '100%', userSelect: 'none',
          }}>{text}</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{
        background: '#555', width: 8, height: 8,
        border: '2px solid #2d2d2d', right: -5,
      }} />
    </>
  );
}

const nodeTypes: NodeTypes = { custom: CustomNode, texto: TextNode };

// ─── CANVAS INNER ─────────────────────────────────────────
function CanvasInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: funil, isLoading } = useFunil(id!);
  const atualizarMutation = useAtualizarFunil();
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [funilNome, setFunilNome] = React.useState('');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [modalPerformance, setModalPerformance] = React.useState<{
    nodeId: string; label: string;
  } | null>(null);

  const handleNodeAction = React.useCallback((action: string, nodeId: string) => {
    if (action === 'delete') {
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
      setHasChanges(true);
    }
    if (action === 'copy') {
      setNodes(nds => {
        const original = nds.find(n => n.id === nodeId);
        if (!original) return nds;
        const newId = `${original.data.nodeType}-${Date.now()}`;
        return [...nds, {
          ...original, id: newId, selected: false,
          position: { x: original.position.x + 30, y: original.position.y + 30 },
          data: { ...original.data, onAction: (a: string) => handleNodeAction(a, newId) },
        }];
      });
      setHasChanges(true);
    }
    if (action === 'performance') {
      setNodes(nds => {
        const node = nds.find(n => n.id === nodeId);
        if (node) setModalPerformance({ nodeId, label: node.data.label as string });
        return nds;
      });
    }
  }, [setNodes, setEdges]);

  const buildData = React.useCallback((nodeType: string, nodeId: string, extra = {}) => ({
    label: NODE_TYPES_CONFIG.find(t => t.type === nodeType)?.label || nodeType,
    nodeType,
    onAction: (action: string) => handleNodeAction(action, nodeId),
    ...extra,
  }), [handleNodeAction]);

  React.useEffect(() => {
    if (funil) {
      setFunilNome(funil.nome || '');
      try {
        const ns = funil.nos ? JSON.parse(funil.nos) : [];
        const es = funil.arestas ? JSON.parse(funil.arestas) : [];
        setNodes(ns.map((n: any) => ({
          ...n,
          type: n.data?.nodeType === 'texto' ? 'texto' : 'custom',
          data: buildData(n.data?.nodeType || 'anuncio', n.id,
            n.data?.nodeType === 'texto'
              ? { text: n.data?.text, align: n.data?.align, bgColor: n.data?.bgColor }
              : {}
          ),
        })));
        setEdges(es);
      } catch { setNodes([]); setEdges([]); }
    }
  }, [funil, buildData]);

  const onConnect = React.useCallback((c: Connection) => {
    setEdges(eds => addEdge({
      ...c, type: 'smoothstep', animated: false,
      style: { stroke: '#555', strokeWidth: 1.5 },
    }, eds));
    setHasChanges(true);
  }, [setEdges]);

  const onNodesChangeWrapped = React.useCallback((changes: any) => {
    onNodesChange(changes);
    if (changes.some((c: any) => c.type !== 'select' && c.type !== 'dimensions'))
      setHasChanges(true);
  }, [onNodesChange]);

  const handleAddNode = React.useCallback((nodeType: string) => {
    const newId = `${nodeType}-${Date.now()}`;
    setNodes(nds => [...nds, {
      id: newId,
      type: nodeType === 'texto' ? 'texto' : 'custom',
      position: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 },
      data: buildData(nodeType, newId,
        nodeType === 'texto'
          ? { text: 'Texto aqui', align: 'center', bgColor: '#2d2d2d' }
          : {}
      ),
    }]);
    setHasChanges(true);
  }, [buildData, setNodes]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await atualizarMutation.mutateAsync({
        id, data: { nome: funilNome, nos: JSON.stringify(nodes), arestas: JSON.stringify(edges) },
      });
      setHasChanges(false);
      toast.success('Funil salvo!');
    } catch { toast.error('Erro ao salvar'); }
  };

  if (isLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#2d2d2d', color: '#6b7280', fontSize: 14,
    }}>Carregando...</div>
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', width: '100%', minHeight: 0,
      background: '#2d2d2d', overflow: 'hidden',
    }}>
      {/* ── HEADER estilo N8N ── */}
      <div style={{
        height: 44, background: '#1f1f1f',
        borderBottom: '1px solid #3d3d3d',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0, zIndex: 10,
      }}>
        {/* Esquerda: voltar + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/admin/funis')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7280', display: 'flex', alignItems: 'center',
            padding: 4, borderRadius: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e5e7eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
            {funilNome || 'Funil'}
          </span>
          {hasChanges && (
            <span style={{
              fontSize: 10, color: '#f59e0b',
              background: 'rgba(245,158,11,0.1)',
              padding: '2px 7px', borderRadius: 999,
            }}>não salvo</span>
          )}
        </div>

        {/* Centro: abas Editor / Histórico */}
        <div style={{ display: 'flex', gap: 2 }}>
          {['Editor', 'Histórico'].map((tab, i) => (
            <button key={tab} style={{
              padding: '5px 14px', borderRadius: 7, border: 'none',
              background: i === 0 ? '#383838' : 'transparent',
              color: i === 0 ? '#e5e7eb' : '#6b7280',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>{tab}</button>
          ))}
        </div>

        {/* Direita: salvar */}
        <button onClick={handleSave} disabled={atualizarMutation.isPending} style={{
          background: '#ff6d5a', color: '#fff', border: 'none',
          borderRadius: 7, padding: '6px 14px', fontWeight: 600,
          fontSize: 12, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 6,
          opacity: atualizarMutation.isPending ? 0.6 : 1,
        }}>
          <Save size={13} />
          {atualizarMutation.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* ── CANVAS ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            type: 'smoothstep', animated: false,
            style: { stroke: '#555', strokeWidth: 1.5 },
          }}
          style={{ background: '#2d2d2d' }}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#3d3d3d" />
        </ReactFlow>

        {/* Botão + para adicionar nó (canto superior direito do canvas) */}
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: 8,
            background: '#383838', border: '1px solid #4d4d4d',
            color: '#e5e7eb', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#4d4d4d')}
          onMouseLeave={e => (e.currentTarget.style.background = '#383838')}
          title="Adicionar nó"
        >
          <Plus size={18} />
        </button>

        {/* Controles rodapé estilo N8N */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 4, zIndex: 10,
          background: '#1f1f1f', border: '1px solid #3d3d3d',
          borderRadius: 10, padding: '6px 10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {[
            { icon: Maximize2,    action: () => fitView({ padding: 0.2 }), label: 'Ajustar' },
            { icon: ZoomOut,      action: () => zoomOut(),                  label: 'Zoom -' },
            { icon: ZoomIn,       action: () => zoomIn(),                   label: 'Zoom +' },
            { icon: RotateCcw,    action: () => { setNodes([]); setEdges([]); setHasChanges(true); }, label: 'Limpar' },
            { icon: MousePointer2, action: () => {},                        label: 'Selecionar' },
          ].map(({ icon: BtnIcon, action, label }) => (
            <button key={label} onClick={action} title={label} style={{
              width: 30, height: 30, borderRadius: 7, border: 'none',
              background: 'transparent', color: '#9ca3af', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#2d2d2d';
                (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
              }}
            >
              <BtnIcon size={14} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>

      {showAddModal && (
        <ModalAddNode
          onAdd={handleAddNode}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {modalPerformance && (
        <ModalPerformance
          label={modalPerformance.label}
          onClose={() => setModalPerformance(null)}
        />
      )}
    </div>
  );
}

export default function FunilCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
