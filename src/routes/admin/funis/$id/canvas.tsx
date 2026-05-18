import * as React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ReactFlow, Background, Controls, addEdge,
  useNodesState, useEdgesState, type Connection,
  type NodeTypes, BackgroundVariant, Handle, Position,
  useReactFlow, ReactFlowProvider, NodeToolbar, MiniMap,
  EdgeLabelRenderer, BaseEdge, getSmoothStepPath, type EdgeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Megaphone, Mail, FileText, Package,
  LayoutTemplate, Users, CheckCircle, Calendar, DollarSign,
  MessageCircle, BarChart2, Pencil, Trash2, Copy,
  AlignLeft, AlignCenter, ChevronDown, Type, Save,
  RotateCcw, ZoomIn, ZoomOut, Maximize2, MousePointer2, Wand2,
} from 'lucide-react';
import dagre from '@dagrejs/dagre';
import { useFunil, useAtualizarFunil } from '../../../../hooks/useFunis';
import { useTheme } from '../../../../hooks/useTheme';

// Remover marca d'água do React Flow
const hideReactFlowAttribution = `
  .react-flow__attribution { display: none !important; }
  :root.light .react-flow__renderer { background: #f8f9fa; }
  :root.light .react-flow__controls button {
    background: #ffffff;
    border-color: #e2e8f0;
    color: #374151;
  }
  :root.light .react-flow__controls button:hover {
    background: #f1f5f9;
  }
  :root.light .react-flow__minimap {
    background: #f1f5f9;
  }
`;

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
      className="fixed inset-0 z-[1000] bg-black/60 sm:bg-transparent"
    >
      <div
        className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:top-16 sm:right-4 z-50 rounded-t-2xl sm:rounded-xl bg-(--card-bg) border border-(--card-border) max-h-[60vh] overflow-y-auto w-full sm:w-72 shadow-2xl flex flex-col"
      >
        <div className="shrink-0" style={{ padding: '16px 16px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
          <input
            autoFocus={false}
            autoComplete="off"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nó..."
            style={{
              width: '100%', padding: '10px 14px',
              background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))',
              borderRadius: 8, color: 'hsl(var(--foreground))', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ padding: 8 }}>
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
              onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: `${color}20`, border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={color} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 14, color: 'hsl(var(--foreground))', fontWeight: 500 }}>
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
        background: 'hsl(var(--card))', borderRadius: 12, width: 540,
        maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '18px 20px 0',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{label}</span>
          <button onClick={onClose} style={{
            background: 'hsl(var(--muted))', border: 'none', borderRadius: 6,
            width: 28, height: 28, cursor: 'pointer', color: 'hsl(var(--muted-foreground))',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0' }}>
          {['performance', 'info'].map(tab => (
            <button key={tab} onClick={() => setAba(tab as any)} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: 12,
              background: aba === tab ? 'hsl(var(--muted))' : 'transparent',
              color: aba === tab ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
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
                <span style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Performance</span>
                <select style={{
                  border: '1px solid hsl(var(--border))', borderRadius: 7,
                  padding: '6px 10px', fontSize: 12, color: 'hsl(var(--muted-foreground))',
                  background: 'hsl(var(--muted))', cursor: 'pointer',
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
                    background: 'hsl(var(--muted))', borderRadius: 10, padding: 14,
                    border: '1px solid hsl(var(--border))',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{
                background: 'hsl(var(--muted))', borderRadius: 10, border: '1px solid hsl(var(--border))',
                height: 120, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#4b5563', fontSize: 13,
              }}>
                Nenhum dado encontrado
              </div>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))',
                display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Nome
              </label>
              <input placeholder="Nome deste nó..." style={{
                width: '100%', padding: '9px 12px', border: '1px solid hsl(var(--border))',
                borderRadius: 7, fontSize: 13, color: 'hsl(var(--foreground))',
                background: 'hsl(var(--background))', outline: 'none', boxSizing: 'border-box',
              }} />
            </div>
          )}
        </div>
        <div style={{
          padding: '12px 20px', borderTop: '1px solid hsl(var(--border))',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: '7px 18px', borderRadius: 7, border: '1px solid hsl(var(--border))',
            background: 'transparent', color: 'hsl(var(--muted-foreground))', fontWeight: 600,
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
  const config = NODE_TYPES_CONFIG.find(t => t.type === data.nodeType)
    || NODE_TYPES_CONFIG[0];
  const { Icon, color } = config;

  const bg = data.isLight ? '#ffffff' : '#2d2d2d';
  const bgSub = data.isLight ? '#f1f5f9' : '#383838';
  const borderColor = selected
    ? color
    : (data.isLight ? '#e2e8f0' : '#3d3d3d');
  const titleColor = data.isLight ? '#0f172a' : '#e5e7eb';
  const skeletonColor = data.isLight ? '#e2e8f0' : '#383838';
  const handleBg = data.isLight ? '#94a3b8' : '#555';
  const handleBorder = data.isLight ? '#f8f9fa' : '#2d2d2d';

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Bottom} offset={10}>
        <div style={{
          display: 'flex', gap: 2, background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))', borderRadius: 8,
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
                color: danger ? '#ef4444' : 'hsl(var(--muted-foreground))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  danger ? 'rgba(239,68,68,0.15)' : 'hsl(var(--muted))';
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

      <Handle type="target" position={Position.Left} style={{
        background: handleBg, width: 8, height: 8,
        border: `2px solid ${handleBorder}`, left: -5,
      }} />

      <div style={{
        background: bg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 16,
        width: 155,
        paddingBottom: 14,
        boxShadow: selected
          ? `0 0 0 3px ${color}33, 0 8px 24px rgba(0,0,0,0.5)`
          : '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'all 0.15s',
        overflow: 'hidden',
      }}>
        {/* Título */}
        <div style={{
          padding: '12px 12px 10px',
          fontSize: 13, fontWeight: 700, color: titleColor,
        }}>
          {config.label}
        </div>

        {/* Área de ícone */}
        <div style={{
          margin: '0 10px',
          background: bgSub,
          borderRadius: 10,
          height: 76,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${data.isLight ? '#e2e8f0' : '#444'}`,
        }}>
          <Icon size={30} color={`${color}bb`} strokeWidth={1.3} />
        </div>

        {/* Linhas skeleton */}
        <div style={{
          padding: '10px 10px 0',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {[80, 60, 40].map((w, i) => (
            <div key={i} style={{
              height: 6, width: `${w}%`,
              background: skeletonColor, borderRadius: 4,
            }} />
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{
        background: handleBg, width: 8, height: 8,
        border: `2px solid ${handleBorder}`, right: -5,
      }} />
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

function CustomEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
}: EdgeProps) {
  const [hovered, setHovered] = React.useState(false);
  const hoverTimeout = React.useRef<any>(null);
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges(eds => eds.filter(edge => edge.id !== id));
  };

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    // Delay para dar tempo de mover o mouse até o botão
    hoverTimeout.current = setTimeout(() => setHovered(false), 200);
  };

  return (
    <>
      {/* Área invisível larga para detectar hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      />
      {/* Linha visível */}
      <path
        d={edgePath}
        fill="none"
        style={{
          stroke: hovered ? '#ff6d5a' : '#555',
          strokeWidth: hovered ? 2 : 1.5,
          strokeDasharray: hovered ? 'none' : '5 3',
          transition: 'stroke 0.15s, stroke-width 0.15s',
          pointerEvents: 'none',
        }}
      />
      {/* Botão deletar */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 10,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
          className="nodrag nopan"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={onDelete}
            title="Deletar conexão"
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#1f1f1f',
              border: '1.5px solid #ff6d5a',
              color: '#ff6d5a', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <Trash2 size={11} strokeWidth={2.5} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes: NodeTypes = { custom: CustomNode, texto: TextNode };
const edgeTypes = { custom: CustomEdge };

// ─── CANVAS INNER ─────────────────────────────────────────
function CanvasInner() {
  const { theme } = useTheme();
  const isLight = theme === 'light' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const COLORS = {
    bg: isLight ? '#f8f9fa' : '#2d2d2d',
    bgDot: isLight ? '#cbd5e1' : '#3d3d3d',
    surface: isLight ? '#ffffff' : '#2d2d2d',
    surfaceSub: isLight ? '#f1f5f9' : '#383838',
    border: isLight ? '#e2e8f0' : '#3d3d3d',
    borderActive: isLight ? '#4f46e5' : '#ff6d5a',
    text: isLight ? '#0f172a' : '#e5e7eb',
    textMuted: isLight ? '#64748b' : '#9ca3af',
    header: isLight ? '#ffffff' : '#1f1f1f',
    headerBorder: isLight ? '#e2e8f0' : '#3d3d3d',
    skeleton: isLight ? '#e2e8f0' : '#383838',
    handle: isLight ? '#94a3b8' : '#555',
    handleBorder: isLight ? '#f8f9fa' : '#2d2d2d',
  };

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: funil, isLoading } = useFunil(id || '');
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
              ? { text: n.data?.text, align: n.data?.align, bgColor: n.data?.bgColor, isLight }
              : { isLight }
          ),
        })));
        setEdges(es);
      } catch { setNodes([]); setEdges([]); }
    }
  }, [funil, buildData, setNodes, setEdges, isLight]);

  const onConnect = React.useCallback((c: Connection) => {
    setEdges(eds => addEdge({ ...c, type: 'custom' }, eds));
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
          ? { text: 'Texto aqui', align: 'center', bgColor: '#2d2d2d', isLight }
          : { isLight }
      ),
    }]);
    setHasChanges(true);
  }, [buildData, setNodes, isLight]);

  const handleTidyUp = React.useCallback(() => {
    if (nodes.length === 0) return;

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: 'LR',   // Left to Right
      nodesep: 60,     // espaço vertical entre nós
      ranksep: 120,    // espaço horizontal entre colunas
      marginx: 40,
      marginy: 40,
    });

    // Dimensões padrão dos nós
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 180;

    nodes.forEach((node) => {
      g.setNode(node.id, {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
      };
    });

    setNodes(layoutedNodes);
    setHasChanges(true);

    // Centralizar a view após reorganizar
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [nodes, edges, setNodes, fitView]);

  const handleSave = async () => {
    if (!funil) return;
    try {
      await atualizarMutation.mutateAsync({
        id: funil.id || funil.$id, data: { nome: funilNome, nos: JSON.stringify(nodes), arestas: JSON.stringify(edges) },
      });
      setHasChanges(false);
      toast.success('Funil salvo!');
    } catch { toast.error('Erro ao salvar'); }
  };

  if (!id) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: COLORS.bg, color: COLORS.textMuted, fontSize: 14,
      }}>ID do funil não encontrado</div>
    );
  }

  if (isLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: COLORS.bg, color: COLORS.textMuted, fontSize: 14,
    }}>Carregando...</div>
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', width: '100%', minHeight: 0,
      background: COLORS.bg, overflow: 'hidden',
    }}>
      <style>{hideReactFlowAttribution}</style>
      {/* ── HEADER estilo N8N ── */}
      <div className="overflow-x-auto scrollbar-none" style={{
        height: 44, background: COLORS.header,
        borderBottom: `1px solid ${COLORS.headerBorder}`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
        padding: '0 16px', flexShrink: 0, zIndex: 10,
      }}>
        {/* Esquerda: voltar + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => navigate('/admin/funis')} style={{
            background: COLORS.surfaceSub, border: 'none', cursor: 'pointer',
            color: COLORS.textMuted, display: 'flex', alignItems: 'center',
            padding: 4, borderRadius: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = COLORS.text)}
            onMouseLeave={e => (e.currentTarget.style.color = COLORS.textMuted)}
          >
            <ArrowLeft size={16} />
          </button>
          <span className="truncate max-w-[120px] sm:max-w-none" style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
            {funilNome || 'Funil'}
          </span>
          {hasChanges && (
            <span style={{
              fontSize: 10, color: '#f59e0b',
              background: 'rgba(245,158,11,0.1)',
              padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap'
            }}>não salvo</span>
          )}
        </div>

        {/* Centro: abas Editor / Histórico */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {['Editor', 'Histórico'].map((tab, i) => (
            <button key={tab} style={{
              padding: '5px 14px', borderRadius: 7, border: 'none',
              background: i === 0 ? COLORS.surfaceSub : 'transparent',
              color: i === 0 ? COLORS.text : COLORS.textMuted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>{tab}</button>
          ))}
        </div>

        {/* Direita: salvar */}
        <div style={{ flexShrink: 0 }}>
          <button onClick={handleSave} disabled={atualizarMutation.isPending} style={{
            background: '#ff6d5a', color: '#fff', border: 'none',
            borderRadius: 7, padding: '6px 14px', fontWeight: 600,
            fontSize: 12, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 6,
            opacity: atualizarMutation.isPending ? 0.6 : 1,
          }}>
            <Save size={13} />
            <span className="hidden sm:inline">{atualizarMutation.isPending ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          fitView 
          fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1 }}
          defaultEdgeOptions={{
            type: 'custom',
          }}
          style={{ background: COLORS.bg }}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color={COLORS.bgDot} />
          <MiniMap
            style={{
              background: COLORS.surfaceSub,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
            }}
            nodeColor={COLORS.border}
            maskColor={isLight ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}
          />
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
            { icon: Wand2,        action: handleTidyUp,                     label: 'Tidy Up' },
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
