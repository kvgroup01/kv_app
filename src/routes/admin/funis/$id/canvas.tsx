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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import {
  ArrowLeft, MoreHorizontal, Save, Megaphone, Mail,
  FileText, Package, LayoutTemplate, Users, CheckCircle,
  Calendar, DollarSign, MessageCircle, ClipboardList,
  BarChart2, Pencil, Trash2, Copy
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
];

// ─── NÓ CUSTOMIZADO ──────────────────────────────────────

function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const config = NODE_TYPES_CONFIG.find(t => t.type === data.nodeType)
    || NODE_TYPES_CONFIG[0];
  const { Icon } = config;

  return (
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
  );
}

const nodeTypes: NodeTypes = { custom: CustomNode };

// ─── CANVAS INNER (precisa estar dentro do ReactFlowProvider) ─

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

  React.useEffect(() => {
    if (funil) {
      setFunilNome(funil.nome || '');
      try {
        const parsedNodes = funil.nos ? JSON.parse(funil.nos) : [];
        const parsedEdges = funil.arestas ? JSON.parse(funil.arestas) : [];
        const normalizedNodes = parsedNodes.map((n: any) => ({
          ...n,
          type: 'custom',
          data: {
            ...n.data,
            nodeType: n.data?.nodeType || n.type || 'anuncio',
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
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: 'custom',
      position,
      data: { label: config.label, nodeType },
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
