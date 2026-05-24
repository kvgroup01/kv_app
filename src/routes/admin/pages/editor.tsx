import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { usePage, useUpdatePage, type Page } from '../../../hooks/usePages'
import { blockRegistry, BLOCK_CATEGORIES, getBlocksByCategory, getBlockByType } from '../../../lib/blocks/registry'
import { type PageBlock, type PageData, type BlockDefinition, type FieldSchema, type SectionStyles } from '../../../lib/blocks/types'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Switch } from '../../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Slider } from '../../../components/ui/slider'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Badge } from '../../../components/ui/badge'
import { Separator } from '../../../components/ui/separator'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { 
  ArrowLeft, Monitor, Smartphone, Eye, EyeOff, 
  Trash2, ChevronUp, ChevronDown, Undo2, Redo2,
  Plus, Search, GripVertical, Pencil, Globe, X, Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../../lib/utils'
import { v4 as uuidv4 } from 'uuid'

export default function PagesEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: page, isLoading } = usePage(id)
  const updatePage = useUpdatePage()

  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [insertAfterIndex, setInsertAfterIndex] = useState<number>(-1)
  const [activeCategory, setActiveCategory] = useState<string>(BLOCK_CATEGORIES[0] || 'Headers')
  const [isDirty, setIsDirty] = useState(false)
  const [history, setHistory] = useState<PageBlock[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [pageName, setPageName] = useState('')

  const historyIndexRef = useRef(historyIndex)

  useEffect(() => {
    historyIndexRef.current = historyIndex
  }, [historyIndex])

  // Inicializa o estado com os dados da página
  useEffect(() => {
    if (page && pageName === '') {
      setPageName(page.nome)
    }
    if (page?.page_data?.blocks && history.length === 0) {
      setBlocks(page.page_data.blocks)
      setHistory([page.page_data.blocks])
      setHistoryIndex(0)
    }
  }, [page])

  const debounceRef = useRef<NodeJS.Timeout>(undefined)
  const pushHistoryDebounced = useCallback((newBlocks: PageBlock[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setHistory((prev) => {
        const currentIdx = historyIndexRef.current
        const newHistory = prev.slice(0, currentIdx + 1)
        newHistory.push(newBlocks)
        setHistoryIndex(newHistory.length - 1)
        return newHistory
      })
    }, 800)
  }, [])

  const pushHistory = (newBlocks: PageBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newBlocks)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setBlocks(history[historyIndex - 1])
      setIsDirty(true)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setBlocks(history[historyIndex + 1])
      setIsDirty(true)
    }
  }

  function addBlock(blockType: string, afterIndex: number) {
    const def = getBlockByType(blockType)
    if (!def) return
    const newBlock: PageBlock = {
      id: uuidv4(),
      type: blockType,
      data: { ...def.defaultData },
      sectionStyles: { ...def.defaultSectionStyles },
      hidden: false,
    }
    const newBlocks = [...blocks]
    newBlocks.splice(afterIndex + 1, 0, newBlock)
    pushHistory(newBlocks)
    setBlocks(newBlocks)
    setIsDirty(true)
    setShowBlockModal(false)
  }

  function updateBlockData(blockId: string, key: string, value: any) {
    const newBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, data: { ...b.data, [key]: value } } : b
    )
    setBlocks(newBlocks)
    setIsDirty(true)
    pushHistoryDebounced(newBlocks)
  }

  function updateBlockStyles(blockId: string, styles: Partial<SectionStyles>) {
    const newBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, sectionStyles: { ...b.sectionStyles, ...styles } } : b
    )
    setBlocks(newBlocks)
    setIsDirty(true)
    pushHistoryDebounced(newBlocks)
  }

  function deleteBlock(blockId: string) {
    if (confirm('Deletar bloco permanentemente?')) {
      const newBlocks = blocks.filter((b) => b.id !== blockId)
      setBlocks(newBlocks)
      setIsDirty(true)
      pushHistoryDebounced(newBlocks)
      if (editingBlockId === blockId) setEditingBlockId(null)
    }
  }

  function toggleHidden(blockId: string) {
    const newBlocks = blocks.map((b) => (b.id === blockId ? { ...b, hidden: !b.hidden } : b))
    setBlocks(newBlocks)
    setIsDirty(true)
    pushHistoryDebounced(newBlocks)
  }

  function moveUp(index: number) {
    if (index === 0) return
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]]
    setBlocks(newBlocks)
    setIsDirty(true)
    pushHistoryDebounced(newBlocks)
  }

  function moveDown(index: number) {
    if (index === blocks.length - 1) return
    const newBlocks = [...blocks];
    [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]]
    setBlocks(newBlocks)
    setIsDirty(true)
    pushHistoryDebounced(newBlocks)
  }

  const handleUpdateArrayItem = (blockId: string, arrayKey: string, index: number, fieldKey: string, value: any) => {
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return
    const currentArray = [...(block.data[arrayKey] || [])]
    if (!currentArray[index]) currentArray[index] = {}
    currentArray[index] = { ...currentArray[index], [fieldKey]: value }
    updateBlockData(blockId, arrayKey, currentArray)
  }

  const handleAddArrayItem = (blockId: string, arrayKey: string, subFields: FieldSchema[]) => {
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return
    const newItem: any = {}
    subFields.forEach((f) => (newItem[f.key] = f.defaultValue || ''))
    const currentArray = [...(block.data[arrayKey] || []), newItem]
    updateBlockData(blockId, arrayKey, currentArray)
  }

  const handleRemoveArrayItem = (blockId: string, arrayKey: string, index: number) => {
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return
    const currentArray = [...(block.data[arrayKey] || [])]
    currentArray.splice(index, 1)
    updateBlockData(blockId, arrayKey, currentArray)
  }

  const handleNameSave = async () => {
    setIsEditingName(false)
    if (pageName.trim() !== '' && pageName.trim() !== page?.nome) {
      if (!id) return
      await updatePage.mutateAsync({ id, nome: pageName.trim() })
      toast.success('Nome da página atualizado')
    } else {
      setPageName(page?.nome || '')
    }
  }

  async function handleSave() {
    if (!id) return
    const renderedHtml = blocks
      .filter((b) => !b.hidden)
      .map((b) => {
        const def = getBlockByType(b.type)
        return def ? def.render(b.data, b.sectionStyles) : ''
      })
      .join('\n')

    await updatePage.mutateAsync({
      id,
      page_data: { blocks },
      html: renderedHtml,
    })
    setIsDirty(false)
    toast.success('Alterações salvas!')
  }

  async function handlePublish() {
    if (!id) return
    const renderedHtml = blocks
      .filter((b) => !b.hidden)
      .map((b) => {
        const def = getBlockByType(b.type)
        return def ? def.render(b.data, b.sectionStyles) : ''
      })
      .join('\n')

    await updatePage.mutateAsync({
      id,
      page_data: { blocks },
      html: renderedHtml,
      status: 'published',
      publicado_em: new Date().toISOString(),
    })
    setIsDirty(false)
    toast.success('Página publicada com sucesso!')
  }

  const handlePreview = () => {
    const renderedHtml = blocks
      .filter((b) => !b.hidden)
      .map((b) => {
        const def = getBlockByType(b.type)
        return def ? def.render(b.data, b.sectionStyles) : ''
      })
      .join('\n')
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><script src="https://cdn.tailwindcss.com"></script></head><body style="margin:0;padding:0;">${renderedHtml}</body></html>`
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  if (isLoading) return <div className="p-8 text-center text-slate-500">Buscando editor...</div>
  if (!page) return <div className="p-8 text-center text-red-500">Página não encontrada</div>

  const renderField = (field: FieldSchema, value: any, onChange: (val: any) => void, blockId: string) => {
    switch (field.type) {
      case 'textarea':
        return <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={4} />
      case 'boolean':
        return <Switch checked={!!value} onCheckedChange={onChange} />
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'color':
        return (
          <div className="flex gap-2">
            <input type="color" className="w-10 h-10 p-1 border rounded cursor-pointer shrink-0" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
            <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs uppercase" />
          </div>
        )
      case 'array':
        return (
          <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            {((value as any[]) || []).map((item, i) => (
              <div key={i} className="space-y-4 bg-white p-4 border rounded-md shadow-sm relative pt-10 group/item">
                <button title="Remover item" onClick={() => handleRemoveArrayItem(blockId, field.key, i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute top-3 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  ITEM {i + 1}
                </div>
                {field.subFields?.map((subF) => (
                  <div key={subF.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">{subF.label}</label>
                    {renderField(subF, item[subF.key], (val) => handleUpdateArrayItem(blockId, field.key, i, subF.key, val), blockId)}
                  </div>
                ))}
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs h-9 border-dashed border-2 text-slate-600 bg-white hover:bg-slate-50" onClick={() => handleAddArrayItem(blockId, field.key, field.subFields || [])}>
              <Plus className="w-4 h-4 mr-1 text-slate-400" /> Adicionar item
            </Button>
          </div>
        )
      case 'text':
      case 'url':
      case 'image':
      default:
        return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={field.type === 'image' ? 'URL da Imagem' : ''} />
    }
  }

  const editingBlock = blocks.find((b) => b.id === editingBlockId)
  const editingBlockDef = editingBlock ? getBlockByType(editingBlock.type) : null

  // Filtra blocos no modal se tiver pesquisa
  const filteredCategories = activeCategory === 'vazio' 
    ? [] 
    : getBlocksByCategory(activeCategory as any).filter(def => 
        def.name.toLowerCase().includes(searchQuery.toLowerCase())
      )

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background font-sans">
      {/* 1. TOPBAR - Atualizado visual*/}
      <div className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
        {/* ESQUERDA */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-300 font-semibold hover:text-white hover:bg-slate-800 h-9 px-3 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Páginas
          </Button>
          <div className="w-px h-5 bg-slate-700 mx-2" />
          {isEditingName ? (
            <Input 
              autoFocus
              value={pageName} 
              onChange={(e) => setPageName(e.target.value)} 
              className="h-8 w-64 bg-slate-800 border-slate-700 text-white text-sm font-semibold focus-visible:ring-slate-500" 
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            />
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 px-3 py-1.5 rounded-md transition-colors text-sm font-semibold text-white"
              onClick={() => setIsEditingName(true)}
            >
              {pageName}
              <Pencil className="w-3 h-3 text-slate-300" />
            </div>
          )}
        </div>

        {/* CENTRO */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 hidden md:flex">
          <button 
            onClick={() => setViewport('desktop')}
            className={cn("p-1.5 px-4 transition-all text-xs flex items-center", viewport === 'desktop' ? 'bg-[#FBB03B] text-black font-bold rounded-md' : 'text-slate-400 hover:text-white')}
          >
            <Monitor className="w-4 h-4 mr-2" /> Desktop
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={cn("p-1.5 px-4 transition-all text-xs flex items-center", viewport === 'mobile' ? 'bg-[#FBB03B] text-black font-bold rounded-md' : 'text-slate-400 hover:text-white')}
          >
            <Smartphone className="w-4 h-4 mr-2" /> Mobile
          </button>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-2">
           <Badge variant="outline" className={cn("px-2 py-1 text-xs font-semibold cursor-default", page?.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md' : 'bg-slate-800 text-slate-400 border border-slate-700 rounded-md')}>
            {page?.status === 'published' ? 'Publicado' : 'Rascunho'}
          </Badge>
          <Button variant="ghost" size="icon" title="Pré-visualizar em nova aba" className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 w-8" onClick={handlePreview}>
            <Eye className="w-5 h-5" />
          </Button>
          <div className="w-px h-5 bg-slate-700 mx-1" />
          <Button variant="outline" className={cn("h-8 px-4 bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 text-sm font-semibold rounded-md transition-all", isDirty && "border-slate-500")} onClick={handleSave}>
            {isDirty ? <span className="flex items-center gap-1.5"><span className="text-[#FBB03B] text-[10px]">●</span> Salvar</span> : 'Salvo'}
          </Button>
          <Button className="h-8 px-4 bg-[#FBB03B] hover:bg-[#f0a824] text-black font-bold rounded-md text-sm transition-colors" onClick={handlePublish}>
            <Globe className="w-4 h-4 mr-2" /> Publicar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* 3. CANVAS - Principal ao centro */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-slate-100 custom-scrollbar pr-[340px]">
          
          {/* UNDO / REDO Pill - Canto inferior esquerdo flotante */}
          <div className="fixed bottom-8 left-8 z-50 bg-slate-950 border border-slate-700 rounded-lg shadow-lg px-0.5 text-white flex items-center h-10 gap-0.5">
             <button title="Desfazer" disabled={historyIndex <= 0} onClick={undo} className="p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded-md text-slate-300 hover:text-white transition-colors"><Undo2 className="w-4 h-4" /></button>
             <div className="w-px h-5 bg-slate-700 mx-0.5" />
             <button title="Refazer" disabled={historyIndex >= history.length - 1} onClick={redo} className="p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded-md text-slate-300 hover:text-white transition-colors"><Redo2 className="w-4 h-4" /></button>
          </div>

          <div className="w-full flex justify-center sticky top-0 py-0 z-20 pointer-events-none bg-slate-100/80 backdrop-blur-sm">
             <p className="text-center text-xs text-slate-400 py-3 font-medium pointer-events-auto">
               {viewport === 'desktop' ? 'Desktop — 1024px' : 'Mobile — 390px'}
             </p>
          </div>
          
          <div className="py-4 pb-40 px-4 flex flex-col items-center min-h-[calc(100vh-100px)]">
             {blocks.length === 0 ? (
               // ESTADO VAZIO
               <div className="flex flex-col items-center justify-center pt-20 w-full max-w-2xl mx-auto text-center px-4">
                 <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-8 opacity-30">
                     <rect x="2" y="2" width="236" height="156" rx="14" stroke="#64748B" strokeWidth="4" strokeDasharray="8 8"/>
                     <line x1="40" y1="40" x2="200" y2="40" stroke="#64748B" strokeWidth="4" strokeLinecap="round"/>
                     <line x1="40" y1="60" x2="160" y2="60" stroke="#64748B" strokeWidth="4" strokeLinecap="round"/>
                     <line x1="40" y1="80" x2="180" y2="80" stroke="#64748B" strokeWidth="4" strokeLinecap="round"/>
                     <rect x="40" y="100" width="80" height="24" rx="6" fill="#64748B"/>
                 </svg>
                 <h3 className="text-xl font-semibold text-slate-700 mb-3">Sua página está em branco</h3>
                 <p className="text-sm text-slate-400 mb-10 max-w-sm">Crie seu layout adicionando blocos pré-construídos para compor sua Landing Page perfeita.</p>
                 <Button 
                    className="bg-[#FBB03B] hover:bg-[#f0a824] text-black px-8 py-3 h-auto text-base rounded-xl font-bold transition-colors"
                    onClick={() => { setInsertAfterIndex(-1); setShowBlockModal(true) }}
                 >
                    <Plus className="w-5 h-5 mr-3" strokeWidth={3} /> Adicionar primeiro bloco
                 </Button>
               </div>
             ) : (
               <div className={cn("bg-white min-h-[500px] w-full transition-all duration-300 relative shadow-lg flex flex-col", viewport === 'desktop' ? 'max-w-5xl' : 'max-w-[390px] mx-auto mt-4 overflow-hidden border border-slate-200')}>
                  {blocks.map((block, index) => {
                     const def = getBlockByType(block.type)
                     if (!def) return null
                     const html = def.render(block.data, block.sectionStyles)

                     return (
                        <div key={block.id} className="w-full relative flex flex-col">
                           {/* Add block above */}
                           <div className="w-full h-8 opacity-0 hover:opacity-100 flex items-center justify-center -my-4 relative z-30 cursor-pointer pointer-events-auto transition-opacity duration-200" onClick={() => { setInsertAfterIndex(index - 1); setShowBlockModal(true) }}>
                              <div className="bg-[#FBB03B] text-black text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full shadow-lg hover:bg-[#f0a824] transition-colors flex items-center gap-1.5 focus:outline-none ring-4 ring-white">
                                <Plus className="w-3 h-3" strokeWidth={3} /> Inserir Acima
                              </div>
                           </div>

                           <div 
                              className={cn("relative group transition-all", block.hidden && "opacity-40 grayscale")}
                              style={{
                                outlineOffset: '-2px',
                                outline: selectedBlockId === block.id || editingBlockId === block.id ? '3px solid #FBB03B' : 'none'
                              }}
                              onMouseEnter={() => setSelectedBlockId(block.id)}
                              onMouseLeave={() => setSelectedBlockId(null)}
                              onClick={() => setEditingBlockId(block.id)}
                           >
                              {/* FLOTING TOOLBAR - Acima do bloco */}
                              <div className={cn("absolute -top-12 right-2 bg-slate-900 border border-slate-700 text-white rounded-lg hidden items-center gap-1 p-1 px-1.5 shadow-xl z-40 transition-all", (selectedBlockId === block.id || editingBlockId === block.id) && "group-hover:flex")}>
                                  <button title="Subir" onClick={(e) => { e.stopPropagation(); moveUp(index) }} disabled={index === 0} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 rounded-md text-slate-300 hover:text-white transition-colors"><ChevronUp className="w-4 h-4"/></button>
                                  <button title="Descer" onClick={(e) => { e.stopPropagation(); moveDown(index) }} disabled={index === blocks.length - 1} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 rounded-md text-slate-300 hover:text-white transition-colors"><ChevronDown className="w-4 h-4"/></button>
                                  <div className="w-px h-5 bg-slate-700 mx-1" />
                                  <button title="Ocultar" onClick={(e) => { e.stopPropagation(); toggleHidden(block.id) }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors">{block.hidden ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                                  <button title="Duplicar" onClick={(e) => { 
                                     e.stopPropagation()
                                     const newBlocks = [...blocks]
                                     newBlocks.splice(index + 1, 0, { ...block, id: uuidv4() })
                                     setBlocks(newBlocks); setIsDirty(true); pushHistoryDebounced(newBlocks)
                                  }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"><Copy className="w-4 h-4"/></button>
                                  <div className="w-px h-5 bg-slate-700 mx-1" />
                                  <button title="Excluir" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }} className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 rounded-md text-slate-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </div>

                              <div dangerouslySetInnerHTML={{ __html: html }} className="min-h-[40px]" />
                              
                              {block.hidden && <div className="absolute top-4 left-4 bg-slate-900 border border-slate-700 text-white tracking-widest text-[10px] uppercase font-bold px-3 py-1.5 rounded shadow-lg">Oculto</div>}
                           </div>

                           {/* Add block below (special case for last block) */}
                           {index === blocks.length - 1 && (
                              <div className="w-full h-8 opacity-0 hover:opacity-100 flex items-center justify-center -my-4 relative z-30 cursor-pointer pointer-events-auto transition-opacity duration-200 mt-2" onClick={() => { setInsertAfterIndex(index); setShowBlockModal(true) }}>
                                 <div className="bg-[#FBB03B] text-black text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full shadow-lg hover:bg-[#f0a824] transition-colors flex items-center gap-1.5 ring-4 ring-white">
                                   <Plus className="w-3 h-3" strokeWidth={3} /> Inserir Abaixo
                                 </div>
                              </div>
                           )}
                        </div>
                     )
                  })}
               </div>
             )}
          </div>
        </div>

        {/* 2. SIDEBAR DIREITA - Painel de Config ou Layers */}
        <div className="w-[340px] bg-white border-l border-slate-200 shadow-xl shrink-0 z-20 flex flex-col h-full absolute right-0 top-0 overflow-hidden">
           {editingBlockId && editingBlock && editingBlockDef ? (
              // FORMULÁRIO DE EDIÇÃO
              <div className="flex flex-col h-full w-full">
                 <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white shrink-0">
                    <div>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Editar:</p>
                       <h3 className="font-semibold text-slate-800 text-sm leading-tight">{editingBlockDef.name}</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md" onClick={() => setEditingBlockId(null)}><X className="w-4 h-4"/></Button>
                 </div>
                 
                 <Tabs defaultValue="conteudo" className="flex-1 flex flex-col w-full overflow-hidden">
                    <TabsList className="w-full justify-start h-10 bg-transparent border-b border-slate-100 rounded-none px-4 space-x-4 shrink-0">
                       <TabsTrigger value="conteudo" className="data-[state=active]:border-b-2 data-[state=active]:border-[#FBB03B] data-[state=active]:text-[#FBB03B] data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-0 h-full text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors">Conteúdo</TabsTrigger>
                       <TabsTrigger value="secao" className="data-[state=active]:border-b-2 data-[state=active]:border-[#FBB03B] data-[state=active]:text-[#FBB03B] data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-0 h-full text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors">Seção</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                       <TabsContent value="conteudo" className="p-5 m-0 space-y-6">
                           {editingBlockDef.fields.map(field => (
                              <div key={field.key} className="space-y-2.5">
                                 <label className="text-xs font-medium text-slate-600">{field.label}</label>
                                 {renderField(field, editingBlock.data[field.key], (val) => updateBlockData(editingBlock.id, field.key, val), editingBlock.id)}
                              </div>
                           ))}
                       </TabsContent>
                       
                       <TabsContent value="secao" className="p-5 m-0 space-y-6">
                          <div className="space-y-2.5">
                             <label className="text-xs font-medium text-slate-600">Imagem de Fundo (URL)</label>
                             <Input value={editingBlock.sectionStyles.backgroundImage || ''} onChange={(e) => updateBlockStyles(editingBlock.id, { backgroundImage: e.target.value })} placeholder="Ex: https://..." className="bg-white" />
                          </div>
                          
                          <div className="space-y-2.5">
                             <label className="text-xs font-medium text-slate-600">Cor de Fundo</label>
                             <div className="flex gap-2">
                                <input type="color" className="w-10 h-10 p-1 border rounded cursor-pointer shrink-0 bg-white" value={editingBlock.sectionStyles.backgroundColor || '#ffffff'} onChange={e => updateBlockStyles(editingBlock.id, { backgroundColor: e.target.value })} />
                                <Input className="font-mono text-xs uppercase bg-white" value={editingBlock.sectionStyles.backgroundColor || ''} onChange={e => updateBlockStyles(editingBlock.id, { backgroundColor: e.target.value })} />
                             </div>
                          </div>

                          <div className="space-y-2.5">
                             <label className="text-xs font-medium text-slate-600">Cor de Sobreposição (Overlay)</label>
                             <div className="flex gap-2">
                                <input type="color" className="w-10 h-10 p-1 border rounded cursor-pointer shrink-0 bg-white" value={editingBlock.sectionStyles.overlayColor || '#000000'} onChange={e => updateBlockStyles(editingBlock.id, { overlayColor: e.target.value })} />
                                <Input className="font-mono text-xs uppercase bg-white" value={editingBlock.sectionStyles.overlayColor || ''} onChange={e => updateBlockStyles(editingBlock.id, { overlayColor: e.target.value })} />
                             </div>
                          </div>

                          <div className="space-y-3 pt-3">
                             <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-slate-600">Opacidade do Overlay</label>
                                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono font-bold text-slate-700">{editingBlock.sectionStyles.overlayOpacity || 0}%</span>
                             </div>
                             <Slider min={0} max={100} step={1} value={[editingBlock.sectionStyles.overlayOpacity || 0]} onValueChange={vals => updateBlockStyles(editingBlock.id, { overlayOpacity: vals[0] })} className="py-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-3">
                             <div className="space-y-2.5">
                                <label className="text-xs font-medium text-slate-600">Espaço Topo (px)</label>
                                <Input type="number" className="bg-white" value={editingBlock.sectionStyles.paddingTop ?? 80} onChange={e => updateBlockStyles(editingBlock.id, { paddingTop: parseInt(e.target.value) || 0 })} />
                             </div>
                             <div className="space-y-2.5">
                                <label className="text-xs font-medium text-slate-600">Espaço Base (px)</label>
                                <Input type="number" className="bg-white" value={editingBlock.sectionStyles.paddingBottom ?? 80} onChange={e => updateBlockStyles(editingBlock.id, { paddingBottom: parseInt(e.target.value) || 0 })} />
                             </div>
                          </div>
                       </TabsContent>
                    </div>
                 </Tabs>
              </div>
           ) : (
              // PAINE L DE CAMADAS (LAYERS)
              <div className="flex flex-col h-full w-full bg-white">
                 <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 shrink-0">
                    <h3 className="font-semibold text-slate-800 text-sm">Camadas</h3>
                    <Button size="sm" className="h-8 bg-[#FBB03B] hover:bg-[#f0a824] text-black text-xs px-3 font-bold rounded-md transition-colors" onClick={() => { setInsertAfterIndex(blocks.length - 1); setShowBlockModal(true) }}>
                       <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={3} /> Bloco
                    </Button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar bg-white">
                    {blocks.map((block, i) => {
                       const def = getBlockByType(block.type)
                       return (
                         <div 
                           key={block.id} 
                           className={cn("flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group", selectedBlockId === block.id || editingBlockId === block.id ? "border-[#FBB03B] bg-amber-50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 relative")}
                           onClick={() => setEditingBlockId(block.id)}
                           onMouseEnter={() => setSelectedBlockId(block.id)}
                           onMouseLeave={() => setSelectedBlockId(null)}
                         >
                           <div className="flex items-center gap-3 overflow-hidden">
                             <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 cursor-grab shrink-0" />
                             <div className="flex flex-col">
                                <span className={cn("text-sm font-medium truncate", block.hidden ? "text-slate-400" : "text-slate-700")}>{def?.name || 'Bloco'}</span>
                                {block.hidden && <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Oculto</span>}
                             </div>
                           </div>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); toggleHidden(block.id) }} className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600">
                                {block.hidden ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }} className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-red-500">
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         </div>
                       )
                    })}
                    {blocks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-slate-300 mb-2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
                         <p className="text-sm font-medium text-slate-400">Nenhum bloco ainda</p>
                      </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* 5. MODAL DE BLOCOS - Sheet vindo da direita */}
      <Sheet open={showBlockModal} onOpenChange={setShowBlockModal}>
        <SheetContent side="right" className="w-[700px] sm:max-w-[700px] p-0 flex flex-col border-l-0 bg-slate-50 gap-0 shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-100 bg-white shrink-0">
             <SheetHeader className="text-left space-y-0 pb-4">
                <SheetTitle className="text-xl font-semibold text-slate-900">Adicionar Bloco</SheetTitle>
             </SheetHeader>
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <Input placeholder="Buscar por nome do bloco..." className="pl-10 h-10 bg-slate-50 border-slate-200" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
          </div>
          
          <Tabs defaultValue="vazio" value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col overflow-hidden">
             <div className="px-6 py-2 border-b border-slate-100 bg-white shrink-0 relative">
                <ScrollArea className="w-full">
                   <TabsList className="h-10 bg-transparent p-0 gap-2 flex w-max">
                      <TabsTrigger value="vazio" className="data-[state=active]:bg-[#FBB03B] data-[state=active]:text-black rounded-lg px-5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
                         Bloco Vazio
                      </TabsTrigger>
                      {BLOCK_CATEGORIES.map(cat => (
                         <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-[#FBB03B] data-[state=active]:text-black rounded-lg px-5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
                            {cat}
                         </TabsTrigger>
                      ))}
                   </TabsList>
                </ScrollArea>
             </div>

             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeCategory === 'vazio' && searchQuery === '' ? (
                   <div className="flex flex-col items-center justify-center pt-24 text-center">
                       <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                           <Plus className="w-8 h-8 text-[#FBB03B]" />
                       </div>
                       <h3 className="text-xl font-bold text-slate-800 mb-2">Bloco Vazio</h3>
                       <p className="text-slate-500 max-w-sm mb-6 text-sm">Use o espaço vazio para codificar layouts do zero. Requer habilidades avançadas.</p>
                       <Button disabled variant="outline" className="border-slate-300 font-bold bg-white">Recurso em Breve</Button>
                   </div>
                ) : (
                   <div className="grid grid-cols-2 gap-6">
                       {filteredCategories.map(def => (
                          <div key={def.type} className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#FBB03B] hover:shadow-lg transition-all duration-300">
                             <div className="w-full aspect-[280/160] bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4 relative overflow-hidden" dangerouslySetInnerHTML={{ __html: def.thumbnail }} />
                             <div className="p-4 flex items-center justify-between bg-white z-10 relative">
                                <span className="font-semibold text-sm text-slate-800">{def.name}</span>
                                <Button size="sm" className="bg-[#FBB03B] hover:bg-[#f0a824] text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity h-8 px-4" onClick={() => addBlock(def.type, insertAfterIndex)}>Usar</Button>
                             </div>
                          </div>
                       ))}
                       {filteredCategories.length === 0 && (
                          <div className="col-span-2 py-20 text-center flex flex-col items-center">
                             <Search className="w-10 h-10 text-slate-300 mb-3" />
                             <p className="text-slate-500 font-semibold">Nenhum bloco encontrado na categoria.</p>
                          </div>
                       )}
                   </div>
                )}
             </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  )
}
