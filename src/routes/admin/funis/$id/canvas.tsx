import * as React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  NodeToolbar,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import {
  ArrowLeft, MoreHorizontal, Save, Megaphone, Mail,
  FileText, Package, LayoutTemplate, Users, CheckCircle,
  Calendar, DollarSign, MessageCircle, ClipboardList,
  BarChart2, Pencil, Trash2, Copy,
  AlignLeft, AlignCenter, ChevronDown, Type
} from 'lucide-react';
import { useFunil, useAtualizarFunil } from '../../../../hooks/useFunis';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';

// ─── CONFIG DOS TIPOS DE NÓ ──────────────────────────────

const NODE_TYPES_CONFIG = [
  { type: 'anuncio',     label: 'Anúncio',      Icon: Megaphone },
  { type: 'pagina',      label: 'Página',        Icon: LayoutTemplate },
  { type: 'email',       label: 'E-mail',        Icon: Mail },
  { type: 'produto',     label: 'Produtos',      Icon: Package },
  { type: 'formulario',  label: 'Formas',        Icon: FileText },
  { type: 'lead',        label: 'Lead',          Icon: Users },
  { type: 'pesquisa',    label: 'Pesquisa',      Icon: BarChart2 },
  { type: 'qualificado', label: 'Qualificado',   Icon: CheckCircle },
  { type: 'reuniao',     label: 'Reunião',       Icon: Calendar },
  { type: 'venda',       label: 'Venda',         Icon: DollarSign },
  { type: 'whatsapp',    label: 'WhatsApp',      Icon: MessageCircle },
  { type: 'texto',       label: 'Texto',         Icon: Type },
];

// ─── NÓ CUSTOMIZADO ──────────────────────────────────────

function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const config = NODE_TYPES_CONFIG.find(t => t.type === data.nodeType)
    || NODE_TYPES_CONFIG[0];
  const { Icon } = config;

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Bottom} offset={8}>
        <div style={{
          display: 'flex',
          gap: '4px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '6px 8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {[
            { icon: BarChart2, label: 'Performance', action: 'performance' },
            { icon: Copy,      label: 'Copiar',      action: 'copy' },
            { icon: Pencil,    label: 'Editar',      action: 'edit' },
            { icon: Trash2,    label: 'Deletar',     action: 'delete', danger: true },
          ].map(({ icon: BtnIcon, label, action, danger }) => (
            <button
              key={action}
              title={label}
              onClick={(e) => {
                e.stopPropagation();
                if (data.onAction) data.onAction(action);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 7,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: danger ? '#ef4444' : '#64748b',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = danger ? '#fff0f0' : '#f1f5f9';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <BtnIcon size={15} strokeWidth={2} />
            </button>
          ))}
        </div>
      </NodeToolbar>

      <div style={{
        background: '#ffffff',
        border: selected ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
        borderRadius: '16px',
        width: '160px',
        padding: '0 0 12px 0',
      boxShadow: selected
        ? '0 0 0 3px rgba(79,70,229,0.15), 0 4px 16px rgba(0,0,0,0.1)'
        : '0 2px 8px rgba(0,0,0,0.06)',
      fontFamily: 'sans-serif',
      position: 'relative',
      cursor: 'grab',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#4f46e5',
          width: 12, height: 12,
          border: '2px solid #fff',
          boxShadow: '0 0 0 2px #4f46e5',
          left: -7,
        }}
      />

      {/* Título */}
      <div style={{
        padding: '12px 14px 8px',
        fontSize: '14px',
        fontWeight: 700,
        color: '#0f172a',
      }}>
        {config.label}
      </div>

      {/* Área de preview */}
      <div style={{
        margin: '0 10px',
        background: '#f1f5f9',
        borderRadius: '10px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={28} color="#94a3b8" strokeWidth={1.5} />
      </div>

      {/* Badge de status */}
      {data.status && (
        <div style={{
          margin: '8px 10px 0',
          background: '#fff0f0',
          border: '1px solid #fecaca',
          borderRadius: '999px',
          padding: '3px 10px',
          fontSize: '11px',
          color: '#ef4444',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          {data.status}
        </div>
      )}

      {/* Linhas skeleton */}
      <div style={{ padding: '8px 10px 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[70, 55, 40].map((w, i) => (
          <div key={i} style={{
            height: 7,
            width: `${w}%`,
            background: '#e2e8f0',
            borderRadius: 4,
          }} />
        ))}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#4f46e5',
          width: 12, height: 12,
          border: '2px solid #fff',
          boxShadow: '0 0 0 2px #4f46e5',
          right: -7,
        }}
      />
    </div>
    </>
  );
}

function TextNode({ data, selected }: { data: any; selected: boolean }) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(data.text || 'Texto aqui');
  const [align, setAlign] = React.useState<'left' | 'center'>(data.align || 'center');
  const [bgColor, setBgColor] = React.useState(data.bgColor || '#ffffff');
  const [showColors, setShowColors] = React.useState(false);

  const COLORS = ['#ffffff', '#fee2e2', '#dbeafe', '#dcfce7', '#fef9c3', '#f3e8ff'];

  React.useEffect(() => {
    if (data.onUpdate) data.onUpdate({ text, align, bgColor });
  }, [text, align, bgColor]);

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Bottom} offset={8}>
        <div style={{
          display: 'flex', gap: 4, alignItems: 'center',
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 10, padding: '6px 8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {/* Alinhar esquerda */}
          <button
            title="Alinhar esquerda"
            onClick={() => setAlign('left')}
            style={{
              width: 32, height: 32, borderRadius: 7, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              background: align === 'left' ? '#4f46e5' : 'transparent',
              color: align === 'left' ? '#fff' : '#64748b',
            }}
          >
            <AlignLeft size={15} />
          </button>
          {/* Alinhar centro */}
          <button
            title="Centralizar"
            onClick={() => setAlign('center')}
            style={{
              width: 32, height: 32, borderRadius: 7, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              background: align === 'center' ? '#4f46e5' : 'transparent',
              color: align === 'center' ? '#fff' : '#64748b',
            }}
          >
            <AlignCenter size={15} />
          </button>
          {/* Cor de fundo */}
          <div style={{ position: 'relative' }}>
            <button
              title="Cor de fundo"
              onClick={() => setShowColors(v => !v)}
              style={{
                width: 32, height: 32, borderRadius: 7,
                border: '1.5px solid #e2e8f0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bgColor, gap: 2, fontSize: 10,
              }}
            >
              <ChevronDown size={12} color="#64748b" />
            </button>
            {showColors && (
              <div style={{
                position: 'absolute', bottom: 40, left: '50%',
                transform: 'translateX(-50%)',
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: '6px',
                display: 'flex', flexDirection: 'column', gap: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 100,
              }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setBgColor(c); setShowColors(false); }}
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: c, border: bgColor === c
                        ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Copiar */}
          <button
            title="Copiar"
            onClick={() => data.onAction && data.onAction('copy')}
            style={{
              width: 32, height: 32, borderRadius: 7, border: 'none',
              cursor: 'pointer', background: 'transparent', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Copy size={15} />
          </button>
          {/* Deletar */}
          <button
            title="Deletar"
            onClick={() => data.onAction && data.onAction('delete')}
            style={{
              width: 32, height: 32, borderRadius: 7, border: 'none',
              cursor: 'pointer', background: 'transparent', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </NodeToolbar>

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#4f46e5', width: 12, height: 12,
          border: '2px solid #fff', boxShadow: '0 0 0 2px #4f46e5', left: -7,
        }}
      />

      <div
        onDoubleClick={() => setEditing(true)}
        style={{
          background: bgColor,
          border: selected ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
          borderRadius: 16,
          minWidth: 160,
          minHeight: 80,
          padding: '20px 16px',
          boxShadow: selected
            ? '0 0 0 3px rgba(79,70,229,0.15)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          cursor: editing ? 'text' : 'grab',
          transition: 'box-shadow 0.15s, border-color 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
        }}
      >
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={() => setEditing(false)}
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, fontWeight: 600, color: '#0f172a',
              resize: 'none', width: '100%', textAlign: align,
              fontFamily: 'sans-serif',
            }}
            rows={3}
          />
        ) : (
          <span style={{
            fontSize: 15, fontWeight: 600, color: '#0f172a',
            textAlign: align, width: '100%',
            userSelect: 'none',
          }}>
            {text}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#4f46e5', width: 12, height: 12,
          border: '2px solid #fff', boxShadow: '0 0 0 2px #4f46e5', right: -7,
        }}
      />
    </>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  texto: TextNode,
};

// ─── CANVAS INNER (precisa estar dentro do ReactFlowProvider) ─

function ModalPerformance({
  nodeType, label, onClose
}: {
  nodeType: string;
  label: string;
  onClose: () => void;
}) {
  const [aba, setAba] = React.useState<'performance' | 'info'>('performance');
  const [nomePagina, setNomePagina] = React.useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: 560,
        maxHeight: '85vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {label}
          </span>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 24px 0' }}>
          {[
            { key: 'performance', label: 'Performance', icon: '📈' },
            { key: 'info', label: 'Informações', icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setAba(tab.key as any)}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                border: 'none', cursor: 'pointer', fontWeight: 600,
                fontSize: 13,
                background: aba === tab.key ? '#fff' : '#f8fafc',
                color: aba === tab.key ? '#0f172a' : '#64748b',
                boxShadow: aba === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {aba === 'performance' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Performance da página
                </h3>
                <select style={{
                  border: '1.5px solid #e2e8f0', borderRadius: 8,
                  padding: '8px 12px', fontSize: 13, color: '#64748b',
                  background: '#fff', cursor: 'pointer',
                }}>
                  <option value="">Selecione período...</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                </select>
              </div>

              {/* Cards de métricas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Visitas', value: '0', icon: '👁' },
                  { label: 'Leads', value: '0', icon: '👤' },
                  { label: 'Taxa de conversão', value: '0%', icon: '🎯', sub: '0 / 0' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: '#f8fafc', borderRadius: 12,
                    padding: '16px', border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
                      {m.value}
                    </div>
                    {m.sub && (
                      <div style={{ fontSize: 11, color: '#cbd5e1' }}>{m.sub}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Área de gráfico vazia */}
              <div style={{
                background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0',
                height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', fontSize: 13,
              }}>
                Nenhum dado encontrado
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                  Configurações
                </h3>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Nome
                </label>
                <input
                  value={nomePagina}
                  onChange={e => setNomePagina(e.target.value)}
                  placeholder="Nome deste nó..."
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid #e2e8f0', borderRadius: 8,
                    fontSize: 14, color: '#0f172a', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b', fontWeight: 600,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            Sair
          </button>
          {aba === 'info' && (
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#4f46e5', color: '#fff', fontWeight: 600,
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Salvar edição
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CanvasInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: funil, isLoading } = useFunil(id!);
  const atualizarMutation = useAtualizarFunil();
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);
  const [funilNome, setFunilNome] = React.useState('');

  const [modalPerformance, setModalPerformance] = React.useState<{
    nodeId: string;
    nodeType: string;
    label: string;
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
        const copy = {
          ...original,
          id: `${original.data.nodeType}-${Date.now()}`,
          position: { x: original.position.x + 30, y: original.position.y + 30 },
          selected: false,
          data: { ...original.data },
        };
        return [...nds, copy];
      });
      setHasChanges(true);
    }
    if (action === 'performance') {
      setNodes(nds => {
        const node = nds.find(n => n.id === nodeId);
        if (node) {
          setModalPerformance({
            nodeId,
            nodeType: node.data.nodeType as string,
            label: node.data.label as string,
          });
        }
        return nds;
      });
    }
  }, [setNodes, setEdges]);

  React.useEffect(() => {
    if (funil) {
      setFunilNome(funil.nome || '');
      try {
        const parsedNodes = funil.nos ? JSON.parse(funil.nos) : [];
        const parsedEdges = funil.arestas ? JSON.parse(funil.arestas) : [];
        const normalizedNodes = parsedNodes.map((n: any) => ({
          ...n,
          type: n.data?.nodeType === 'texto' ? 'texto' : 'custom',
          data: {
            ...n.data,
            nodeType: n.data?.nodeType || n.type || 'anuncio',
            onAction: (action: string) => handleNodeAction(action, n.id),
          },
        }));
        setNodes(normalizedNodes);
        setEdges(parsedEdges);
      } catch {
        setNodes([]);
        setEdges([]);
      }
    }
  }, [funil]);

  const onConnect = React.useCallback((connection: Connection) => {
    setEdges(eds => addEdge({
      ...connection,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '6 3' },
    }, eds));
    setHasChanges(true);
  }, [setEdges]);

  const onNodesChangeWrapped = React.useCallback((changes: any) => {
    onNodesChange(changes);
    const meaningful = changes.some((c: any) => c.type !== 'select' && c.type !== 'dimensions');
    if (meaningful) setHasChanges(true);
  }, [onNodesChange]);

  // Drag and drop da sidebar
  const onDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/nodeType');
    if (!nodeType) return;
    const config = NODE_TYPES_CONFIG.find(t => t.type === nodeType)!;
    const position = screenToFlowPosition({ x: e.clientX - 240, y: e.clientY - 60 });
    const newId = `${nodeType}-${Date.now()}`;
    const newNode = {
      id: newId,
      type: nodeType === 'texto' ? 'texto' : 'custom',
      position,
      data: {
        label: config.label,
        nodeType,
        onAction: (action: string) => handleNodeAction(action, newId),
        ...(nodeType === 'texto' ? { text: 'Texto aqui', align: 'center', bgColor: '#ffffff' } : {})
      },
    };
    setNodes(nds => [...nds, newNode]);
    setHasChanges(true);
  }, [screenToFlowPosition, setNodes]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await atualizarMutation.mutateAsync({
        id,
        data: {
          nome: funilNome,
          nos: JSON.stringify(nodes),
          arestas: JSON.stringify(edges),
        },
      });
      setHasChanges(false);
      toast.success('Funil salvo!');
    } catch {
      toast.error('Erro ao salvar funil');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f8f9fa', color: '#64748b', fontSize: 14 }}>
        Carregando funil...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
      width: '100%', background: '#f8f9fa', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{
        height: 56,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Esquerda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/admin/funis')}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          {editingName ? (
            <input
              autoFocus
              value={funilNome}
              onChange={e => setFunilNome(e.target.value)}
              onBlur={() => { setEditingName(false); setHasChanges(true); }}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              style={{
                fontSize: 16, fontWeight: 600, color: '#0f172a',
                border: 'none', borderBottom: '2px solid #4f46e5',
                outline: 'none', background: 'transparent', padding: '2px 4px',
              }}
            />
          ) : (
            <span
              style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
              onClick={() => setEditingName(true)}
            >
              {funilNome || 'Funil'}
            </span>
          )}
        </div>

        {/* Direita */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasChanges && (
            <span style={{
              fontSize: 11, color: '#f59e0b', background: '#fef3c7',
              padding: '2px 10px', borderRadius: 999, fontWeight: 500,
            }}>
              Não salvo
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={{
                background: '#f1f5f9', border: 'none', borderRadius: 8,
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b',
              }}>
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setEditingName(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Renomear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={handleSave}
            disabled={atualizarMutation.isPending}
            style={{
              background: '#4f46e5', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 18px', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
              opacity: atualizarMutation.isPending ? 0.7 : 1,
            }}
          >
            {atualizarMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <div style={{
          width: 100,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 8px',
          gap: 4,
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 600, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 8, paddingLeft: 4,
          }}>
            Arrastar
          </p>
          {NODE_TYPES_CONFIG.map(({ type, label, Icon }) => (
            <div
              key={type}
              draggable
              onDragStart={e => e.dataTransfer.setData('application/nodeType', type)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
                padding: '10px 8px', borderRadius: 10,
                cursor: 'grab', userSelect: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: '#f1f5f9', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color="#64748b" strokeWidth={1.5} />
              </div>
              <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500, textAlign: 'center' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* CANVAS */}
        <div style={{ flex: 1 }} onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeWrapped}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '6 3' },
            }}
            style={{ background: '#f8f9fa' }}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.5}
              color="#cbd5e1"
            />
            <Controls
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            />
          </ReactFlow>
        </div>
      </div>
      
      {modalPerformance && (
        <ModalPerformance
          nodeType={modalPerformance.nodeType}
          label={modalPerformance.label}
          onClose={() => setModalPerformance(null)}
        />
      )}
    </div>
  );
}

// ─── EXPORT PRINCIPAL (com ReactFlowProvider) ─────────────

export default function FunilCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
