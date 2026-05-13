import * as React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
  Panel,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useFunil, useAtualizarFunil } from '../../../../hooks/useFunis';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../../../../components/ui/dropdown-menu';

// ─── TIPOS DE NÓS ────────────────────────────────────────

const NODE_TYPES_CONFIG = [
  { type: 'anuncio',     label: 'Anúncio',          color: '#3b82f6', emoji: '📢' },
  { type: 'pagina',      label: 'Página',            color: '#8b5cf6', emoji: '🌐' },
  { type: 'formulario',  label: 'Formulário',        color: '#f59e0b', emoji: '📋' },
  { type: 'lead',        label: 'Lead',              color: '#10b981', emoji: '👤' },
  { type: 'email',       label: 'E-mail',            color: '#6366f1', emoji: '✉️'  },
  { type: 'pesquisa',    label: 'Pesquisa',          color: '#ec4899', emoji: '📊' },
  { type: 'qualificado', label: 'Qualificado',       color: '#22c55e', emoji: '✅' },
  { type: 'reuniao',     label: 'Reunião',           color: '#f97316', emoji: '📅' },
  { type: 'venda',       label: 'Venda',             color: '#eab308', emoji: '💰' },
  { type: 'whatsapp',    label: 'WhatsApp',          color: '#25d366', emoji: '💬' },
];

// ─── COMPONENTE DE NÓ CUSTOMIZADO ─────────────────────────

function CustomNodeWithHandles({ data, selected }: { data: any; selected: boolean }) {
  const config = NODE_TYPES_CONFIG.find(t => t.type === data.nodeType)
    || { color: '#6b7280', emoji: '📦', label: data.label };

  return (
    <div
      style={{
        border: `2px solid ${selected ? '#fff' : config.color}`,
        borderRadius: '12px',
        padding: '12px 16px',
        backgroundColor: '#1a1a1a',
        minWidth: '160px',
        boxShadow: selected
          ? `0 0 0 2px ${config.color}, 0 4px 20px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: config.color, width: 10, height: 10, border: '2px solid #1a1a1a' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>{config.emoji}</span>
        <div>
          <div style={{
            fontSize: '11px',
            color: config.color,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '2px',
          }}>
            {config.label}
          </div>
          <div style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: 500 }}>
            {data.label}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: config.color, width: 10, height: 10, border: '2px solid #1a1a1a' }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNodeWithHandles,
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────

export default function FunilCanvas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: funil, isLoading } = useFunil(id!);
  const atualizarMutation = useAtualizarFunil();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Carregar nós e arestas do banco quando funil carrega
  React.useEffect(() => {
    if (funil) {
      try {
        const parsedNodes = funil.nos ? JSON.parse(funil.nos) : [];
        const parsedEdges = funil.arestas ? JSON.parse(funil.arestas) : [];
        // Garantir que todos os nós usam o type 'custom'
        const normalizedNodes = parsedNodes.map((n: any) => ({
          ...n,
          type: 'custom',
          data: { ...n.data, nodeType: n.data?.nodeType || n.type || 'lead' },
        }));
        setNodes(normalizedNodes);
        setEdges(parsedEdges);
      } catch (e) {
        setNodes([]);
        setEdges([]);
      }
    }
  }, [funil]);

  const onConnect = React.useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge({
        ...connection,
        style: { stroke: '#6b7280', strokeWidth: 2 },
        animated: true,
      }, eds));
      setHasChanges(true);
    },
    [setEdges]
  );

  const handleNodesChange = React.useCallback((changes: any) => {
    onNodesChange(changes);
    setHasChanges(true);
  }, [onNodesChange]);

  const handleEdgesChange = React.useCallback((changes: any) => {
    onEdgesChange(changes);
    setHasChanges(true);
  }, [onEdgesChange]);

  const handleAddNode = (nodeType: string) => {
    const config = NODE_TYPES_CONFIG.find(t => t.type === nodeType)!;
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: 'custom',
      position: {
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 200,
      },
      data: {
        label: config.label,
        nodeType,
      },
    };
    setNodes(nds => [...nds, newNode]);
    setHasChanges(true);
  };

  const handleDeleteSelected = () => {
    setNodes(nds => nds.filter(n => !n.selected));
    setEdges(eds => eds.filter(e => !e.selected));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await atualizarMutation.mutateAsync({
        id,
        data: {
          nos: JSON.stringify(nodes),
          arestas: JSON.stringify(edges),
        },
      });
      setHasChanges(false);
      toast.success('Funil salvo com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar funil');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f] text-white">
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0f0f0f' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          style: { stroke: '#6b7280', strokeWidth: 2 },
          animated: true,
        }}
        style={{ background: '#0f0f0f' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2a2a2a"
        />
        <Controls
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
          nodeColor="#3b82f6"
          maskColor="rgba(0,0,0,0.6)"
        />

        {/* Toolbar superior */}
        <Panel position="top-left">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '10px',
            padding: '8px 16px',
          }}>
            <button
              onClick={() => navigate('/admin/funis')}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
              }}
            >
              ← Voltar
            </button>
            <div style={{ width: '1px', height: '20px', background: '#333' }} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>
              {funil?.nome || 'Funil'}
            </span>
            {hasChanges && (
              <span style={{
                fontSize: '11px',
                color: '#f59e0b',
                background: '#451a03',
                padding: '2px 8px',
                borderRadius: '999px',
              }}>
                Não salvo
              </span>
            )}
          </div>
        </Panel>

        {/* Botões direita */}
        <Panel position="top-right">
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Adicionar nó */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}>
                  + Adicionar nó
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[#1a1a1a] border-[#333] text-white"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Tipo de nó
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#333]" />
                {NODE_TYPES_CONFIG.map(t => (
                  <DropdownMenuItem
                    key={t.type}
                    onClick={() => handleAddNode(t.type)}
                    className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
                  >
                    <span className="mr-2">{t.emoji}</span>
                    {t.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Deletar selecionados */}
            <button
              onClick={handleDeleteSelected}
              title="Deletar selecionados"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#ef4444',
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              🗑
            </button>

            {/* Salvar */}
            <button
              onClick={handleSave}
              disabled={atualizarMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: hasChanges ? '#2563eb' : '#1a1a1a',
                border: `1px solid ${hasChanges ? '#3b82f6' : '#333'}`,
                borderRadius: '8px',
                color: '#fff',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {atualizarMutation.isPending ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
