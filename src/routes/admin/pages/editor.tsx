import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { usePage, useUpdatePage } from '../../../hooks/usePages';
import { PageBlock, BlockDefinition, FieldSchema, SectionStyles, PageData } from '../../../lib/blocks/types';
import { blockRegistry, BLOCK_CATEGORIES, getBlocksByCategory, getBlockByType } from '../../../lib/blocks/registry';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import {
  Monitor, Smartphone, Eye, EyeOff, Undo2, Redo2,
  ChevronUp, ChevronDown, Copy, Trash2, X, Plus,
  ArrowLeft, Save, Globe, Settings, GripVertical, Layers
} from 'lucide-react';
import { toast } from 'sonner';

export default function PagesEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: page, isLoading } = usePage(id);
  const updatePage = useUpdatePage();

  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number>(-1);
  const [activeCategory, setActiveCategory] = useState<string>(BLOCK_CATEGORIES[0]);
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState<PageBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHidden, setShowHidden] = useState(true);

  // Initialize blocks
  useEffect(() => {
    if (page?.page_data?.blocks && history.length === 0) {
      setBlocks(page.page_data.blocks);
      setHistory([page.page_data.blocks]);
      setHistoryIndex(0);
    }
  }, [page]);

  const pushHistory = (newBlocks: PageBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
      setIsDirty(true);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
      setIsDirty(true);
    }
  };

  function addBlock(blockType: string, afterIndex: number) {
    const def = getBlockByType(blockType);
    if (!def) return;
    const newBlock: PageBlock = {
      id: uuidv4(),
      type: blockType,
      data: { ...def.defaultData },
      sectionStyles: { ...def.defaultSectionStyles },
      hidden: false,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    pushHistory(newBlocks);
    setBlocks(newBlocks);
    setIsDirty(true);
    setShowBlockModal(false);
  }

  function updateBlockData(blockId: string, key: string, value: any) {
    const newBlocks = blocks.map(b =>
      b.id === blockId ? { ...b, data: { ...b.data, [key]: value } } : b
    );
    setBlocks(newBlocks);
    setIsDirty(true);
  }

  // Debounced pushHistory for input changes
  const debounceRef = useRef<NodeJS.Timeout>();
  const pushHistoryDebounced = (newBlocks: PageBlock[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushHistory(newBlocks);
    }, 1000);
  };

  function updateBlockStyles(blockId: string, styles: Partial<SectionStyles>) {
    const newBlocks = blocks.map(b =>
      b.id === blockId ? { ...b, sectionStyles: { ...b.sectionStyles, ...styles } } : b
    );
    setBlocks(newBlocks);
    setIsDirty(true);
    pushHistoryDebounced(newBlocks);
  }

  const handleUpdateField = (blockId: string, key: string, value: any) => {
    updateBlockData(blockId, key, value);
    pushHistoryDebounced(blocks.map(b => b.id === blockId ? { ...b, data: { ...b.data, [key]: value } } : b));
  };

  const handleUpdateArrayItem = (blockId: string, arrayKey: string, index: number, fieldKey: string, value: any) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const currentArray = [...(block.data[arrayKey] || [])];
    if (!currentArray[index]) currentArray[index] = {};
    currentArray[index] = { ...currentArray[index], [fieldKey]: value };
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, data: { ...b.data, [arrayKey]: currentArray } } : b);
    setBlocks(newBlocks);
    setIsDirty(true);
    pushHistoryDebounced(newBlocks);
  };

  const handleAddArrayItem = (blockId: string, arrayKey: string, subFields: FieldSchema[]) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const newItem: any = {};
    subFields.forEach(f => newItem[f.key] = f.defaultValue || '');
    const currentArray = [...(block.data[arrayKey] || []), newItem];
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, data: { ...b.data, [arrayKey]: currentArray } } : b);
    setBlocks(newBlocks);
    setIsDirty(true);
    pushHistoryDebounced(newBlocks);
  };

  const handleRemoveArrayItem = (blockId: string, arrayKey: string, index: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const currentArray = [...(block.data[arrayKey] || [])];
    currentArray.splice(index, 1);
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, data: { ...b.data, [arrayKey]: currentArray } } : b);
    setBlocks(newBlocks);
    setIsDirty(true);
    pushHistoryDebounced(newBlocks);
  };

  async function handleSave() {
    if (!id) return;
    const renderedHtml = blocks.map(b => {
      const def = getBlockByType(b.type);
      return def ? def.render(b.data, b.sectionStyles) : '';
    }).join('\n');
    
    await updatePage.mutateAsync({
      id,
      page_data: { blocks },
      html: renderedHtml,
    });
    setIsDirty(false);
    toast.success('Alterações salvas!');
  }

  async function handlePublish() {
    if (!id) return;
    await handleSave();
    await updatePage.mutateAsync({
      id,
      status: 'published',
      publicado_em: new Date().toISOString(),
    });
    toast.success('Página publicada!');
  }

  const handlePreview = () => {
    const renderedHtml = blocks.map(b => {
      const def = getBlockByType(b.type);
      return def && !b.hidden ? def.render(b.data, b.sectionStyles) : '';
    }).join('\n');
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><script src="https://cdn.tailwindcss.com"></script></head><body style="margin:0;padding:0;">${renderedHtml}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando editor...</div>;
  }

  if (!page) {
    return <div className="p-8 text-center text-red-500">Página não encontrada</div>;
  }

  const renderField = (field: FieldSchema, value: any, onChange: (val: any) => void) => {
    switch (field.type) {
      case 'textarea':
        return <Textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={3} />;
      case 'color':
        return (
          <div className="flex gap-2 items-center">
            <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="w-10 h-10 p-1 border rounded" />
            <Input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="flex-1" />
          </div>
        );
      case 'boolean':
        return <Switch checked={!!value} onCheckedChange={onChange} />;
      case 'select':
        return (
          <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-transparent">
            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        );
      case 'url':
      case 'image':
      case 'text':
      default:
        return <Input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || (field.type === 'image' ? 'URL da imagem' : '')} />;
    }
  };

  const editingBlock = blocks.find(b => b.id === editingBlockId);
  const editingBlockDef = editingBlock ? getBlockByType(editingBlock.type) : null;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* TOPBAR */}
      <div className="flex items-center justify-between h-14 border-b bg-white px-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center border rounded-md p-1 bg-muted/30">
            <Button variant={viewport === 'desktop' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewport('desktop')}>
              <Monitor className="w-4 h-4 mr-2" /> Desktop
            </Button>
            <Button variant={viewport === 'mobile' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewport('mobile')}>
              <Smartphone className="w-4 h-4 mr-2" /> Mobile
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowHidden(!showHidden)}>
            {showHidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showHidden ? 'Ocultar invisíveis' : 'Mostrar todos'}
          </Button>
          <span className="text-xs text-muted-foreground ml-2 font-medium">
            {isDirty ? 'Alterações não salvas' : 'Alterações salvas'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled={historyIndex <= 0} onClick={undo}><Undo2 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" disabled={historyIndex >= history.length - 1} onClick={redo}><Redo2 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={handlePreview} className="font-semibold"><Eye className="w-4 h-4 mr-2" /> Pré-visualizar</Button>
          <Button variant="outline" size="sm" onClick={handleSave} className="font-semibold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">SALVAR</Button>
          <Button variant="default" size="sm" onClick={handlePublish} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">PUBLICAR</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR left */}
        <div className="w-[48px] border-r bg-white flex flex-col items-center py-4 shrink-0 z-20 shadow-sm">
          <Button variant="ghost" size="icon" title="Blocos" onClick={() => { setInsertAfterIndex(blocks.length - 1); setShowBlockModal(true); }}>
            <Layers className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>

        {/* CANVAS */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center py-8"
          style={{ backgroundImage: 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px', backgroundColor: '#f1f5f9' }}
        >
          {blocks.length === 0 ? (
            <div className="mt-20 text-center bg-white p-12 rounded-xl shadow-lg max-w-sm w-full mx-auto">
              <Layers className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-600 font-medium mb-6">Comece adicionando o primeiro bloco da sua Landing Page</p>
              <Button onClick={() => { setInsertAfterIndex(-1); setShowBlockModal(true); }} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
                <Plus className="w-5 h-5 mr-2" /> Adicionar Bloco
              </Button>
            </div>
          ) : (
            <div className={cn("bg-white min-h-[500px] transition-all duration-300 shadow-2xl", viewport === 'desktop' ? 'w-full max-w-[1200px] rounded-xl overflow-hidden' : 'w-[390px] mx-auto rounded-[2rem] overflow-hidden')}>
              <div 
                className="w-full text-center py-4 opacity-0 hover:opacity-100 cursor-pointer h-10 flex items-center justify-center -mb-5 relative z-10"
                onClick={() => { setInsertAfterIndex(-1); setShowBlockModal(true); }}
              >
                <span className="bg-[#00BCD4] hover:bg-[#00acc1] transition-colors text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg ring-4 ring-white flex items-center uppercase tracking-wider">
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Bloco
                </span>
              </div>

              {blocks.map((block, index) => {
                if (block.hidden && !showHidden) return null;
                const def = getBlockByType(block.type);
                if (!def) return null;
                const html = def.render(block.data, block.sectionStyles);

                return (
                  <React.Fragment key={block.id}>
                    <div 
                      className={cn("relative group", block.hidden && "opacity-40 grayscale")}
                      onMouseEnter={() => setSelectedBlockId(block.id)}
                      onMouseLeave={() => setSelectedBlockId(null)}
                      style={{ outline: selectedBlockId === block.id || editingBlockId === block.id ? '2px solid #00BCD4' : 'none', outlineOffset: '-2px' }}
                    >
                      {/* Floating toolbar */}
                      <div className={cn("absolute top-2 right-2 z-50 bg-white shadow-xl rounded-md px-1 py-1 flex gap-0.5 items-center opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-1 group-hover:translate-y-0", (selectedBlockId === block.id || editingBlockId === block.id) && "opacity-100 translate-y-0")}>
                        <Button variant="ghost" size="sm" className="h-7 px-3 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setEditingBlockId(block.id)}>EDITAR</Button>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-800" disabled={index === 0} onClick={() => {
                          const newBlocks = [...blocks];
                          [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
                          setBlocks(newBlocks); setIsDirty(true); pushHistoryDebounced(newBlocks);
                        }}><ChevronUp className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-800" disabled={index === blocks.length - 1} onClick={() => {
                          const newBlocks = [...blocks];
                          [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
                          setBlocks(newBlocks); setIsDirty(true); pushHistoryDebounced(newBlocks);
                        }}><ChevronDown className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" title="Ocultar" className="h-7 w-7 text-slate-500 hover:text-slate-800" onClick={() => {
                          const newBlocks = blocks.map(b => b.id === block.id ? { ...b, hidden: !b.hidden } : b);
                          setBlocks(newBlocks); setIsDirty(true); pushHistoryDebounced(newBlocks);
                        }}>{block.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                        <Button variant="ghost" size="icon" title="Duplicar" className="h-7 w-7 text-slate-500 hover:text-slate-800" onClick={() => {
                          const newBlocks = [...blocks];
                          newBlocks.splice(index + 1, 0, { ...block, id: uuidv4() });
                          setBlocks(newBlocks); setIsDirty(true); pushHistoryDebounced(newBlocks);
                        }}><Copy className="w-4 h-4" /></Button>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <Button variant="ghost" size="icon" title="Deletar" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                          if (confirm('Deletar bloco?')) {
                            const newBlocks = blocks.filter(b => b.id !== block.id);
                            setBlocks(newBlocks); setIsDirty(true); pushHistoryDebounced(newBlocks);
                            if (editingBlockId === block.id) setEditingBlockId(null);
                          }
                        }}><Trash2 className="w-4 h-4" /></Button>
                      </div>

                      {/* BLOCK RENDER */}
                      <div className="w-full relative" dangerouslySetInnerHTML={{ __html: html }} />
                      
                      {block.hidden && (
                        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur text-white font-bold tracking-widest text-[10px] px-3 py-1.5 rounded-full uppercase">Oculto</div>
                      )}
                    </div>
                    
                    {/* Add block button between blocks */}
                    <div 
                      className="w-full text-center opacity-0 hover:opacity-100 cursor-pointer h-10 flex items-center justify-center -my-2.5 relative z-10"
                      onClick={() => { setInsertAfterIndex(index); setShowBlockModal(true); }}
                    >
                      <span className="bg-[#00BCD4] hover:bg-[#00acc1] transition-colors text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg ring-4 ring-white flex items-center uppercase tracking-wider">
                        <Plus className="w-3 h-3 mr-1" /> Adicionar Bloco
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL (Configs) */}
        {editingBlockId && editingBlock && editingBlockDef && (
          <div className="w-[340px] border-l bg-slate-50 shrink-0 flex flex-col z-30 shadow-2xl overflow-hidden animate-in slide-in-from-right h-full">
            <div className="h-14 border-b flex items-center justify-between px-5 bg-white shrink-0 shadow-sm z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Configuração</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{editingBlockDef.name}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-100/50 hover:bg-slate-200" onClick={() => setEditingBlockId(null)}><X className="w-4 h-4 text-slate-600" /></Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
              {/* SECTION STYLES */}
              <div className="space-y-5 bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Estilos da Seção
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Imagem de Fundo (URL)</Label>
                  <Input value={editingBlock.sectionStyles.backgroundImage || ''} onChange={e => updateBlockStyles(editingBlock.id, { backgroundImage: e.target.value })} placeholder="https://..." className="bg-slate-50" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <input type="color" value={editingBlock.sectionStyles.backgroundColor || '#ffffff'} onChange={e => updateBlockStyles(editingBlock.id, { backgroundColor: e.target.value })} className="w-10 h-10 p-0.5 rounded cursor-pointer border bg-white" />
                    <Input value={editingBlock.sectionStyles.backgroundColor || ''} onChange={e => updateBlockStyles(editingBlock.id, { backgroundColor: e.target.value })} className="font-mono text-xs uppercase bg-slate-50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Cor de Sobreposição (Overlay)</Label>
                  <div className="flex gap-2">
                    <input type="color" value={editingBlock.sectionStyles.overlayColor || '#000000'} onChange={e => updateBlockStyles(editingBlock.id, { overlayColor: e.target.value })} className="w-10 h-10 p-0.5 rounded cursor-pointer border bg-white" />
                    <Input value={editingBlock.sectionStyles.overlayColor || ''} onChange={e => updateBlockStyles(editingBlock.id, { overlayColor: e.target.value })} className="font-mono text-xs uppercase bg-slate-50" />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Opacidade do Overlay</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{editingBlock.sectionStyles.overlayOpacity || 0}%</span>
                  </Label>
                  <input type="range" min="0" max="100" value={editingBlock.sectionStyles.overlayOpacity || 0} onChange={e => updateBlockStyles(editingBlock.id, { overlayOpacity: parseInt(e.target.value) })} className="w-full accent-blue-600" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Espaço Acima (px)</Label>
                    <Input type="number" value={editingBlock.sectionStyles.paddingTop ?? 80} onChange={e => updateBlockStyles(editingBlock.id, { paddingTop: parseInt(e.target.value) || 0 })} className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Espaço Abaixo (px)</Label>
                    <Input type="number" value={editingBlock.sectionStyles.paddingBottom ?? 80} onChange={e => updateBlockStyles(editingBlock.id, { paddingBottom: parseInt(e.target.value) || 0 })} className="bg-slate-50" />
                  </div>
                </div>
              </div>

              {/* BLOCK DATA FIELDS */}
              <div className="space-y-5 bg-white p-4 rounded-xl border shadow-sm pb-10">
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Conteúdo
                </h4>
                
                {editingBlockDef.fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">{field.label}</Label>
                    {field.type === 'array' ? (
                      <div className="space-y-3 bg-slate-50 rounded-lg p-3 border">
                        {((editingBlock.data[field.key] as any[]) || []).map((item, i) => (
                          <div key={i} className="space-y-3 p-4 bg-white border rounded-md shadow-sm relative group/item">
                            <div className="absolute top-3 right-3 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 bg-red-50 hover:bg-red-100 rounded-full" onClick={() => handleRemoveArrayItem(editingBlock.id, field.key, i)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Item {i + 1}</span>
                            <div className="space-y-3 pt-1">
                              {field.subFields?.map(subF => (
                                <div key={subF.key} className="space-y-1.5">
                                  <Label className="text-[10px] uppercase text-slate-500 font-bold">{subF.label}</Label>
                                  {renderField(subF, item[subF.key], (val) => handleUpdateArrayItem(editingBlock.id, field.key, i, subF.key, val))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full text-xs h-9 border-dashed border-2 text-slate-600 bg-white hover:bg-slate-50 font-semibold" onClick={() => handleAddArrayItem(editingBlock.id, field.key, field.subFields || [])}>
                          <Plus className="w-4 h-4 mr-1 text-slate-400" /> Adicionar novo item
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-0.5">
                         {renderField(field, editingBlock.data[field.key], (val) => handleUpdateField(editingBlock.id, field.key, val))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ADICIONAR BLOCO */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-[1100px] max-w-[95vw] h-[85vh] flex overflow-hidden shadow-2xl flex-col animate-in zoom-in-95 duration-200">
            <div className="h-16 border-b flex items-center justify-between px-8 bg-white shrink-0">
              <h2 className="font-bold text-xl text-slate-800 tracking-tight">Biblioteca de Blocos</h2>
              <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full" onClick={() => setShowBlockModal(false)}><X className="w-6 h-6 text-slate-500" /></Button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar do modal (Categories) */}
              <div className="w-[240px] border-r overflow-y-auto bg-slate-50/50 py-6 px-4 shrink-0 space-y-1">
                <Button 
                  variant={activeCategory === 'blank' ? 'secondary' : 'ghost'} 
                  className={cn("w-full justify-start px-4 text-sm font-semibold h-11 rounded-lg transition-colors", activeCategory === 'blank' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-slate-600')}
                  onClick={() => setActiveCategory('blank')}
                >
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center mr-3", activeCategory === 'blank' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500')}>
                     <Plus className="w-3.5 h-3.5" />
                  </div>
                  Bloco vazio
                </Button>
                <div className="my-4 border-t mx-2" />
                <div className="px-3 pb-2 text-[10px] uppercase tracking-widest font-bold text-slate-400">Categorias</div>
                {BLOCK_CATEGORIES.map(cat => (
                  <Button 
                    key={cat}
                    variant={activeCategory === cat ? 'secondary' : 'ghost'} 
                    className={cn("w-full justify-start px-4 text-sm font-semibold h-11 rounded-lg transition-colors group", activeCategory === cat ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat} 
                    <span className={cn("ml-auto text-xs px-2 py-0.5 rounded-full font-bold transition-colors", activeCategory === cat ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200')}>
                      {getBlocksByCategory(cat).length}
                    </span>
                  </Button>
                ))}
              </div>
              {/* Grid de blocos */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">
                {activeCategory === 'blank' ? (
                  <div className="text-center mt-32 max-w-sm mx-auto">
                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Layers className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Contêiner Vazio</h3>
                    <p className="text-slate-500 mb-8 leading-relaxed">Comece com uma tela em branco para criar seu próprio bloco personalizado com código fonte no futuro.</p>
                    <Button disabled variant="outline" className="h-12 px-8 font-bold border-slate-300 text-slate-400">Recurso em breve</Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                      {activeCategory} <span className="ml-3 text-sm font-medium text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">{getBlocksByCategory(activeCategory as any).length} modelos</span>
                    </h3>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-8">
                      {getBlocksByCategory(activeCategory as any).map((def, idx) => (
                        <div 
                          key={def.type} 
                          className="group border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 cursor-pointer transition-all duration-300 flex flex-col relative"
                          onClick={() => addBlock(def.type, insertAfterIndex)}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors z-10"></div>
                          <div 
                            className="bg-white aspect-[280/180] w-full flex items-center justify-center border-b border-slate-100 transition-colors p-6 relative overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: def.thumbnail }}
                          />
                          <div className="p-4 bg-white relative z-20 flex items-center justify-between">
                            <p className="font-bold text-sm text-slate-800">{def.name}</p>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {getBlocksByCategory(activeCategory as any).length === 0 && (
                        <div className="col-span-full py-20 text-center">
                           <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Monitor className="w-6 h-6 text-slate-400" />
                           </div>
                           <h4 className="text-slate-800 font-bold mb-2">Em breve</h4>
                           <p className="text-slate-500 max-w-sm mx-auto">Nossa equipe de design está preparando novos blocos incríveis para esta categoria.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}
