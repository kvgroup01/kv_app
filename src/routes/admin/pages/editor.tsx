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
import { Separator } from '../../../components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { 
  ArrowLeft, Monitor, Smartphone, Eye, EyeOff, 
  Trash2, ChevronUp, ChevronDown, Undo2, Redo2,
  Plus, Search, GripVertical, Pencil, Globe, X, Copy,
  ChevronLeft, ChevronRight
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const historyIndexRef = useRef(historyIndex)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const scrollCategories = (dir: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: dir === 'right' ? 160 : -160, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    historyIndexRef.current = historyIndex
  }, [historyIndex])

  // Inicializa o estado com os dados da página
  useEffect(() => {
    if (page?.nome) {
      setPageName(page.nome)
    }
  }, [page?.nome])

  useEffect(() => {
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
    const newBlocks = blocks.filter((b) => b.id !== blockId)
    setBlocks(newBlocks)
    setIsDirty(true)
    pushHistoryDebounced(newBlocks)
    if (editingBlockId === blockId) setEditingBlockId(null)
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

  if (isLoading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Buscando editor...</div>
  if (!page) return <div className="p-8 text-center text-red-500">Página não encontrada</div>

  const renderField = (field: FieldSchema, value: any, onChange: (val: any) => void, blockId: string) => {
    switch (field.type) {
      case 'textarea':
        return <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={4} className="text-[13px] bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white" />
      case 'boolean':
        return <Switch checked={!!value} onCheckedChange={onChange} />
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-[13px] bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white">
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[13px] focus:bg-[#f2f2f2] dark:focus:bg-[#2a2a2a]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'color':
        return (
          <div className="flex gap-2">
            <input type="color" className="w-8 h-8 p-1 border border-[#e5e5e5] dark:border-[#2a2a2a] rounded cursor-pointer shrink-0 bg-white dark:bg-[#1c1c1e]" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
            <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="h-8 font-mono text-[13px] uppercase bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white" />
          </div>
        )
      case 'array':
        return (
          <div className="space-y-2 rounded-lg border border-[#e5e5e5] dark:border-[#2a2a2a] p-3 bg-[#f2f2f2] dark:bg-[#1c1c1e]">
            {((value as any[]) || []).map((item, i) => (
              <div key={i} className="bg-white dark:bg-[#2a2a2a] rounded-lg border border-[#e5e5e5] dark:border-[#3a3a3a] p-3 space-y-3 relative group/item">
                <button title="Remover item" onClick={() => handleRemoveArrayItem(blockId, field.key, i)} className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-[#a3a3a3] hover:text-red-500 rounded transition-colors opacity-0 group-hover/item:opacity-100">
                  <Trash2 className="w-3.5 h-3.5 text-inherit" />
                </button>
                {field.subFields?.map((subF) => (
                  <div key={subF.key} className="space-y-1.5 mt-2">
                    <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium tracking-normal">{subF.label}</label>
                    {renderField(subF, item[subF.key], (val) => handleUpdateArrayItem(blockId, field.key, i, subF.key, val), blockId)}
                  </div>
                ))}
              </div>
            ))}
            <button className="w-full h-8 border border-dashed border-[#d1d1d1] dark:border-[#484848] rounded-lg text-[12px] text-[#a3a3a3] hover:border-[#FBB03B] hover:text-[#FBB03B] transition-colors flex items-center justify-center gap-1.5 bg-white dark:bg-[#1c1c1e]" onClick={() => handleAddArrayItem(blockId, field.key, field.subFields || [])}>
              <Plus className="w-3.5 h-3.5 text-inherit" /> Adicionar item
            </button>
          </div>
        )
      case 'text':
      case 'url':
      case 'image':
      default:
        return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={field.type === 'image' ? 'URL da Imagem' : ''} className="h-8 text-[13px] bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white" />
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
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#f0f0f2] font-sans">
      {/* 1. TOPBAR - Atualizado visual*/}
      <div 
        className="h-[44px] border-b flex items-center justify-between px-4 shrink-0 z-30"
        style={{ backgroundColor: '#1A1A1A', borderBottomColor: '#2a2a2a' }}
      >
        {/* ESQUERDA */}
        <div className="flex items-center gap-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 hover:text-[#d1d1d1] text-[13px] font-medium transition-colors px-2 h-full bg-transparent border-none outline-none cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-inherit" /> Páginas
          </button>
          <div className="w-px h-4 bg-[#3a3a3a] mx-3" />
          {isEditingName ? (
            <Input 
              autoFocus
              value={pageName} 
              onChange={(e) => setPageName(e.target.value)} 
              className="h-7 w-52 bg-[#2a2a2a] border border-[#3a3a3a] text-white text-[13px] rounded-md px-2 focus-visible:ring-1 focus-visible:ring-[#FBB03B] focus-visible:ring-offset-0" 
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            />
          ) : (
            <div 
              className="text-[13px] font-medium cursor-pointer hover:text-[#d1d1d1] transition-colors flex items-center gap-1.5"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onClick={() => setIsEditingName(true)}
            >
              {pageName}
              <Pencil className="w-3 h-3 text-inherit" />
            </div>
          )}
        </div>

        {/* CENTRO */}
        <div className="absolute left-1/2 -translate-x-1/2 items-center bg-[#2a2a2a] rounded-full p-0.5 border border-[#3a3a3a] hidden md:flex">
          <button 
            onClick={() => setViewport('desktop')}
            className={cn(viewport === 'desktop' ? 'flex items-center gap-1.5 px-3 h-6 rounded-full bg-[#FBB03B] text-[12px] font-semibold transition-all' : 'flex items-center gap-1.5 px-3 h-6 rounded-full hover:text-white text-[12px] font-medium transition-all')}
            style={{ color: viewport === 'desktop' ? '#1A1A1A' : 'rgba(255,255,255,0.85)' }}
          >
            <Monitor className="w-3.5 h-3.5 text-inherit" /> Desktop
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={cn(viewport === 'mobile' ? 'flex items-center gap-1.5 px-3 h-6 rounded-full bg-[#FBB03B] text-[12px] font-semibold transition-all' : 'flex items-center gap-1.5 px-3 h-6 rounded-full hover:text-white text-[12px] font-medium transition-all')}
            style={{ color: viewport === 'mobile' ? '#1A1A1A' : 'rgba(255,255,255,0.85)' }}
          >
            <Smartphone className="w-3.5 h-3.5 text-inherit" /> Mobile
          </button>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-2">
          {page?.status === 'published' ? (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              Publicado
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[#d1d1d1] bg-[#2a2a2a] border border-[#3a3a3a] px-2 py-0.5 rounded-md">
              Rascunho
            </span>
          )}
          <button
            title="Pré-visualizar em nova aba"
            onClick={handlePreview}
            className="w-7 h-7 flex items-center justify-center hover:text-white transition-colors rounded-md hover:bg-[#2a2a2a] bg-transparent border-none outline-none cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            <Eye className="w-3.5 h-3.5 text-inherit" />
          </button>
          <div className="w-px h-4 bg-[#3a3a3a]" />
          <button
            onClick={handleSave}
            className={cn(
              "h-7 px-3 text-[13px] font-medium rounded-md border transition-all cursor-pointer",
              isDirty
                ? "border-[#FBB03B]/40 hover:bg-[#FBB03B]/10"
                : "border-[#484848] bg-transparent hover:border-[#767676]"
            )}
            style={{ color: isDirty ? '#FBB03B' : 'rgba(255,255,255,0.85)' }}
          >
            {isDirty ? '· Salvar' : 'Salvo'}
          </button>
          <button
            onClick={handlePublish}
            className="h-7 px-3 text-[13px] font-semibold rounded-md bg-[#FBB03B] hover:bg-[#f0a824] transition-colors border-none outline-none cursor-pointer flex items-center gap-1"
            style={{ color: '#1A1A1A' }}
          >
            <Globe className="w-3.5 h-3.5 text-inherit" /> Publicar
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* 3. CANVAS - Principal ao centro */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-[#f0f0f2] pr-[300px]">
          
          {/* UNDO / REDO Pill - Canto inferior esquerdo flotante */}
          <div className="fixed bottom-6 left-6 z-50 flex items-center bg-[#1A1A1A] border border-[#2a2a2a] rounded-lg overflow-hidden h-8">
             <button title="Desfazer" disabled={historyIndex <= 0} onClick={undo} className="w-8 h-8 flex items-center justify-center hover:bg-[#2a2a2a] disabled:cursor-not-allowed transition-colors" style={{ color: 'rgba(255,255,255,0.85)', opacity: historyIndex <= 0 ? 0.35 : 1 }}><Undo2 className="w-3.5 h-3.5 text-inherit" /></button>
             <div className="w-px h-4 bg-[#2a2a2a]" />
             <button title="Refazer" disabled={historyIndex >= history.length - 1} onClick={redo} className="w-8 h-8 flex items-center justify-center hover:bg-[#2a2a2a] disabled:cursor-not-allowed transition-colors" style={{ color: 'rgba(255,255,255,0.85)', opacity: historyIndex >= history.length - 1 ? 0.35 : 1 }}><Redo2 className="w-3.5 h-3.5 text-inherit" /></button>
          </div>

          <div className="w-full flex justify-center sticky top-0 py-0 z-20 pointer-events-none">
             <p className="text-center text-[11px] text-[#a3a3a3] pt-3 pb-1 font-medium tracking-wide select-none pointer-events-auto">
               {viewport === 'desktop' ? 'Desktop · 1024px' : 'Mobile · 390px'}
             </p>
          </div>
          
          <div className="py-4 pb-40 px-4 flex flex-col items-center min-h-[calc(100vh-100px)]">
             {blocks.length === 0 ? (
               // ESTADO VAZIO
               <div className="flex flex-col items-center justify-center py-24 px-8 w-full max-w-2xl mx-auto text-center">
                 <svg width="180" height="120" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-20">
                     <rect x="2" y="2" width="236" height="156" rx="14" stroke="#a3a3a3" strokeWidth="4" strokeDasharray="8 8"/>
                     <line x1="40" y1="40" x2="200" y2="40" stroke="#a3a3a3" strokeWidth="4" strokeLinecap="round"/>
                     <line x1="40" y1="60" x2="160" y2="60" stroke="#a3a3a3" strokeWidth="4" strokeLinecap="round"/>
                     <line x1="40" y1="80" x2="180" y2="80" stroke="#a3a3a3" strokeWidth="4" strokeLinecap="round"/>
                     <rect x="40" y="100" width="80" height="24" rx="6" fill="#a3a3a3"/>
                 </svg>
                 <h3 className="text-[17px] font-semibold text-[#1A1A1A] mb-2 tracking-[-0.01em]">Sua página está em branco</h3>
                 <p className="text-[14px] text-[#767676] mb-8 text-center max-w-xs leading-relaxed">Crie seu layout adicionando blocos pré-construídos para compor sua Landing Page perfeita.</p>
                 <Button 
                    className="bg-[#FBB03B] text-[#1A1A1A] font-semibold text-[14px] px-6 py-2.5 rounded-lg hover:bg-[#f0a824] transition-colors flex items-center gap-2 h-auto"
                    onClick={() => { setInsertAfterIndex(-1); setShowBlockModal(true) }}
                 >
                    <Plus className="w-5 h-5" strokeWidth={3} /> Adicionar primeiro bloco
                 </Button>
               </div>
             ) : (
               <div className={cn("bg-white min-h-[500px] w-full transition-all duration-300 relative shadow-sm flex flex-col", viewport === 'desktop' ? 'max-w-4xl mx-auto border-x border-[#e6e6e6]' : 'max-w-[390px] mx-auto border border-[#e6e6e6] rounded-b-xl mt-4')}>
                  {blocks.map((block, index) => {
                     const def = getBlockByType(block.type)
                     if (!def) return null
                     const html = def.render(block.data, block.sectionStyles)

                     return (
                        <div key={block.id} className="w-full relative flex flex-col">
                           {/* Add block above */}
                           <div className={cn("w-full h-8 flex items-center justify-center -my-4 relative z-30 cursor-pointer pointer-events-auto transition-opacity duration-200", editingBlockId === block.id ? "opacity-0 pointer-events-none" : "opacity-0 hover:opacity-100")} onClick={() => { setInsertAfterIndex(index - 1); setShowBlockModal(true) }}>
                              <div className="bg-[#FBB03B] text-[#1A1A1A] text-[11px] font-semibold px-3 py-1 rounded-md flex items-center gap-1 hover:bg-[#f0a824] transition-colors shadow-none">
                                <Plus className="w-3 h-3" strokeWidth={3} /> Inserir Acima
                              </div>
                           </div>

                           <div 
                              className={cn("relative group transition-all", block.hidden && "opacity-40 grayscale")}
                              style={{
                                outlineOffset: '-2px',
                                outline: selectedBlockId === block.id || editingBlockId === block.id ? '2px solid #FBB03B' : 'none'
                              }}
                              onMouseEnter={() => setSelectedBlockId(block.id)}
                              onMouseLeave={() => setSelectedBlockId(null)}
                              onClick={() => setEditingBlockId(block.id)}
                           >
                              {/* FLOTING TOOLBAR - Acima do bloco */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: 'white' }}
                                className={cn("absolute top-2 right-2 bg-slate-900 border border-slate-700 rounded-lg items-center gap-1 p-1 px-1.5 shadow-2xl z-50 transition-all", editingBlockId === block.id ? "flex" : "hidden")}
                              >
                                      <button title="Subir" onClick={(e) => { e.stopPropagation(); moveUp(index) }} disabled={index === 0} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 rounded-md transition-colors"><ChevronUp className="w-3.5 h-3.5 text-inherit"/></button>
                                      <button title="Descer" onClick={(e) => { e.stopPropagation(); moveDown(index) }} disabled={index === blocks.length - 1} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 rounded-md transition-colors"><ChevronDown className="w-3.5 h-3.5 text-inherit"/></button>
                                      <div className="w-px h-4 bg-slate-700 mx-0.5" />
                                      <button title="Ocultar" onClick={(e) => { e.stopPropagation(); toggleHidden(block.id) }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 rounded-md transition-colors">{block.hidden ? <EyeOff className="w-3.5 h-3.5 text-inherit"/> : <Eye className="w-3.5 h-3.5 text-inherit"/>}</button>
                                      <button title="Duplicar" onClick={(e) => { 
                                         e.stopPropagation()
                                         const newBlocks = [...blocks]
                                         newBlocks.splice(index + 1, 0, { ...block, id: uuidv4() })
                                         setBlocks(newBlocks); setIsDirty(true); pushHistoryDebounced(newBlocks)
                                      }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 rounded-md transition-colors"><Copy className="w-3.5 h-3.5 text-inherit"/></button>
                                      <div className="w-px h-4 bg-slate-700 mx-0.5" />
                                      <button title="Excluir" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(block.id) }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5 text-inherit"/></button>
                              </div>

                              <div dangerouslySetInnerHTML={{ __html: html }} className="min-h-[40px]" />
                              
                              {block.hidden && <div className="absolute top-4 left-4 bg-slate-900 border border-slate-700 text-white tracking-widest text-[10px] uppercase font-bold px-3 py-1.5 rounded shadow-lg">Oculto</div>}
                           </div>

                           {/* Add block below (special case for last block) */}
                           {index === blocks.length - 1 && (
                              <div className={cn("w-full h-8 flex items-center justify-center -my-4 relative z-30 cursor-pointer pointer-events-auto transition-opacity duration-200 mt-2", editingBlockId === block.id ? "opacity-0 pointer-events-none" : "opacity-0 hover:opacity-100")} onClick={() => { setInsertAfterIndex(index); setShowBlockModal(true) }}>
                                 <div className="bg-[#FBB03B] text-[#1A1A1A] text-[11px] font-semibold px-3 py-1 rounded-md flex items-center gap-1 hover:bg-[#f0a824] transition-colors shadow-none">
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
        <div className="w-[300px] bg-white dark:bg-[#1c1c1e] border-l border-[#e5e5e5] dark:border-[#2a2a2a] shrink-0 z-20 flex flex-col h-full absolute right-0 top-0 overflow-hidden">
           {editingBlockId && editingBlock && editingBlockDef ? (
              // FORMULÁRIO DE EDIÇÃO
              <div className="flex flex-col h-full w-full">
                 <div className="h-11 border-b border-[#e5e5e5] dark:border-[#2a2a2a] flex items-center justify-between px-4 bg-white dark:bg-[#1c1c1e] shrink-0">
                    <div className="flex gap-2 items-baseline">
                       <p className="text-[11px] text-[#767676] dark:text-[#a3a3a3] font-medium">{editingBlockDef.type}</p>
                       <h3 className="text-[13px] font-semibold text-[#1A1A1A] dark:text-white tracking-[-0.01em] leading-tight">{editingBlockDef.name}</h3>
                    </div>
                    <button className="w-6 h-6 flex items-center justify-center text-[#767676] dark:text-[#a3a3a3] hover:text-[#1A1A1A] dark:hover:text-white rounded transition-colors bg-transparent border-none cursor-pointer outline-none" onClick={() => setEditingBlockId(null)}><X className="w-4 h-4 text-inherit"/></button>
                 </div>
                 
                 <Tabs defaultValue="conteudo" className="flex-1 flex flex-col w-full overflow-hidden">
                    <TabsList className="flex w-full border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1e] rounded-none h-9 p-0 px-4 gap-4 shrink-0">
                       <TabsTrigger value="conteudo" className="h-full rounded-none border-b-2 border-transparent text-[12px] font-medium text-[#767676] dark:text-[#a3a3a3] px-0 pb-0 data-[state=active]:border-[#FBB03B] data-[state=active]:text-[#1A1A1A] dark:data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-all">Conteúdo</TabsTrigger>
                       <TabsTrigger value="secao" className="h-full rounded-none border-b-2 border-transparent text-[12px] font-medium text-[#767676] dark:text-[#a3a3a3] px-0 pb-0 data-[state=active]:border-[#FBB03B] data-[state=active]:text-[#1A1A1A] dark:data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-all">Seção</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1c1c1e]">
                       <TabsContent value="conteudo" className="p-4 m-0 space-y-4">
                           {editingBlockDef.fields.map(field => (
                              <div key={field.key} className="space-y-1.5">
                                 <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium tracking-normal">{field.label}</label>
                                 {renderField(field, editingBlock.data[field.key], (val) => updateBlockData(editingBlock.id, field.key, val), editingBlock.id)}
                              </div>
                           ))}
                       </TabsContent>
                       
                       <TabsContent value="secao" className="p-4 m-0 space-y-4">
                          <div className="space-y-1.5">
                             <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium tracking-normal">Imagem de Fundo (URL)</label>
                             <Input value={editingBlock.sectionStyles.backgroundImage || ''} onChange={(e) => updateBlockStyles(editingBlock.id, { backgroundImage: e.target.value })} placeholder="Ex: https://..." className="bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white h-8 text-[13px]" />
                          </div>
                          
                          <div className="space-y-1.5">
                             <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium tracking-normal">Cor de Fundo</label>
                             <div className="flex gap-2">
                                <input type="color" className="w-8 h-8 p-1 border border-[#e5e5e5] dark:border-[#2a2a2a] rounded cursor-pointer shrink-0 bg-white dark:bg-[#1c1c1e]" value={editingBlock.sectionStyles.backgroundColor || '#ffffff'} onChange={e => updateBlockStyles(editingBlock.id, { backgroundColor: e.target.value })} />
                                <Input className="h-8 font-mono text-[13px] bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white uppercase" value={editingBlock.sectionStyles.backgroundColor || ''} onChange={e => updateBlockStyles(editingBlock.id, { backgroundColor: e.target.value })} />
                             </div>
                          </div>

                          <div className="space-y-1.5">
                             <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium tracking-normal">Cor de Sobreposição (Overlay)</label>
                             <div className="flex gap-2">
                                <input type="color" className="w-8 h-8 p-1 border border-[#e5e5e5] dark:border-[#2a2a2a] rounded cursor-pointer shrink-0 bg-white dark:bg-[#1c1c1e]" value={editingBlock.sectionStyles.overlayColor || '#000000'} onChange={e => updateBlockStyles(editingBlock.id, { overlayColor: e.target.value })} />
                                <Input className="h-8 font-mono text-[13px] bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white uppercase" value={editingBlock.sectionStyles.overlayColor || ''} onChange={e => updateBlockStyles(editingBlock.id, { overlayColor: e.target.value })} />
                             </div>
                          </div>

                          <div className="space-y-3 pt-3">
                             <div className="flex justify-between items-center">
                                <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium tracking-normal">Opacidade do Overlay</label>
                                <span className="text-[12px] font-mono text-[#767676] dark:text-[#a3a3a3] bg-[#f2f2f2] dark:bg-[#2a2a2a] px-2 py-0.5 rounded-md">{editingBlock.sectionStyles.overlayOpacity || 0}%</span>
                             </div>
                             <Slider min={0} max={100} step={1} value={[editingBlock.sectionStyles.overlayOpacity || 0]} onValueChange={vals => updateBlockStyles(editingBlock.id, { overlayOpacity: vals[0] })} className="py-2 [&_[role=slider]]:bg-[#FBB03B]" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-3">
                             <div className="space-y-1.5">
                                <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium tracking-normal">Espaço Topo (px)</label>
                                <Input type="number" className="h-8 text-[13px] bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white" value={editingBlock.sectionStyles.paddingTop ?? 80} onChange={e => updateBlockStyles(editingBlock.id, { paddingTop: parseInt(e.target.value) || 0 })} />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium tracking-normal">Espaço Base (px)</label>
                                <Input type="number" className="h-8 text-[13px] bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a] text-[#1A1A1A] dark:text-white" value={editingBlock.sectionStyles.paddingBottom ?? 80} onChange={e => updateBlockStyles(editingBlock.id, { paddingBottom: parseInt(e.target.value) || 0 })} />
                             </div>
                          </div>
                       </TabsContent>
                    </div>
                 </Tabs>
              </div>
           ) : (
              // PAINE L DE CAMADAS (LAYERS)
              <div className="flex flex-col h-full w-full bg-white dark:bg-[#1c1c1e]">
                 <div className="h-11 border-b border-[#e5e5e5] dark:border-[#2a2a2a] px-4 flex items-center justify-between shrink-0">
                    <h3 className="text-[13px] font-semibold text-[#1A1A1A] dark:text-white tracking-[-0.01em]">Camadas</h3>
                    <button className="flex items-center gap-1 text-[13px] font-semibold bg-[#FBB03B] text-[#1A1A1A] px-2.5 py-1 rounded-md hover:bg-[#f0a824] transition-colors border-none outline-none cursor-pointer" onClick={() => { setInsertAfterIndex(blocks.length - 1); setShowBlockModal(true) }}>
                       <Plus className="w-3.5 h-3.5 text-inherit" strokeWidth={3} /> Bloco
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1c1c1e] flex flex-col">
                    {blocks.map((block, i) => {
                       const def = getBlockByType(block.type)
                       return (
                         <div 
                           key={block.id} 
                           className={cn("flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-[#f2f2f2] dark:hover:bg-[#2a2a2a] border-b border-[#f2f2f2] dark:border-[#2a2a2a] transition-colors group/layer", selectedBlockId === block.id || editingBlockId === block.id ? "bg-[#FBB03B]/8 dark:bg-[#FBB03B]/10 border-b-[#FBB03B]/20" : "")}
                           onClick={() => setEditingBlockId(block.id)}
                           onMouseEnter={() => setSelectedBlockId(block.id)}
                           onMouseLeave={() => setSelectedBlockId(null)}
                         >
                           <GripVertical className="w-3.5 h-3.5 text-[#d1d1d1] dark:text-[#484848] group-hover/layer:text-[#a3a3a3] shrink-0" />
                           <span className={cn("text-[13px] text-[#1A1A1A] dark:text-white font-medium flex-1 truncate", block.hidden && "text-[#a3a3a3] dark:text-[#767676]")}>{def?.name || 'Bloco'}</span>
                           {block.hidden && <span className="text-[9px] uppercase font-bold text-[#a3a3a3] dark:text-[#767676] mt-0.5">Oculto</span>}
                           
                           <div className="flex items-center gap-0.5 opacity-0 group-hover/layer:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); toggleHidden(block.id) }} className="w-6 h-6 flex items-center justify-center text-[#767676] dark:text-[#a3a3a3] hover:text-[#1A1A1A] dark:hover:text-white rounded transition-colors bg-transparent border-none outline-none cursor-pointer">
                                {block.hidden ? <EyeOff className="w-3.5 h-3.5 text-inherit"/> : <Eye className="w-3.5 h-3.5 text-inherit"/>}
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(block.id) }} className="w-6 h-6 flex items-center justify-center text-[#767676] dark:text-[#a3a3a3] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded transition-colors bg-transparent border-none outline-none cursor-pointer">
                               <Trash2 className="w-3.5 h-3.5 text-inherit" />
                             </button>
                           </div>
                         </div>
                       )
                    })}
                    {blocks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 gap-2 opacity-60">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#d1d1d1]"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
                         <p className="text-[13px] text-[#a3a3a3]">Nenhum bloco ainda</p>
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* 5. MODAL DE BLOCOS - Sheet vindo da direita */}
      <Sheet open={showBlockModal} onOpenChange={setShowBlockModal}>
        <SheetContent side="right" className="w-[640px] sm:max-w-[640px] p-0 flex flex-col border-l border-[#e6e6e6] dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1e] gap-0">
          <div className="px-6 py-5 border-b border-[#e6e6e6] dark:border-[#2a2a2a]">
             <SheetHeader className="text-left space-y-0">
                <SheetTitle className="text-[17px] font-semibold text-[#1A1A1A] dark:text-white tracking-[-0.01em] mb-3">Adicionar Bloco</SheetTitle>
             </SheetHeader>
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#a3a3a3]" />
                <Input placeholder="Buscar por nome do bloco..." className="pl-9 h-9 text-[13px] rounded-lg bg-[#f2f2f2] dark:bg-[#2a2a2a] border-transparent focus-visible:ring-[#FBB03B] text-[#1A1A1A] dark:text-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
             <div className="flex items-center border-b border-[#e6e6e6] dark:border-[#2a2a2a] px-4 py-2 gap-1">
               <button
                 onClick={() => scrollCategories('left')}
                 className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[#767676] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#f2f2f2] dark:hover:bg-[#2a2a2a] transition-colors"
               >
                 <ChevronLeft className="w-4 h-4" />
               </button>

               <div
                 ref={categoryScrollRef}
                 className="flex gap-1.5 overflow-x-auto flex-1"
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
               >
                 <button
                   onClick={() => setActiveCategory('vazio')}
                   className={cn(
                     "px-3 py-1 rounded-md text-[12px] font-medium whitespace-nowrap h-7 transition-colors shrink-0",
                     activeCategory === 'vazio'
                       ? "bg-[#FBB03B] text-[#1A1A1A]"
                       : "bg-[#f2f2f2] dark:bg-[#2a2a2a] text-[#767676] hover:bg-[#e6e6e6] dark:hover:bg-[#333]"
                   )}
                 >
                   Bloco Vazio
                 </button>
                 {BLOCK_CATEGORIES.map(cat => (
                   <button
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={cn(
                       "px-3 py-1 rounded-md text-[12px] font-medium whitespace-nowrap h-7 transition-colors shrink-0",
                       activeCategory === cat
                         ? "bg-[#FBB03B] text-[#1A1A1A]"
                         : "bg-[#f2f2f2] dark:bg-[#2a2a2a] text-[#767676] hover:bg-[#e6e6e6] dark:hover:bg-[#333]"
                     )}
                   >
                     {cat}
                   </button>
                 ))}
               </div>

               <button
                 onClick={() => scrollCategories('right')}
                 className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[#767676] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#f2f2f2] dark:hover:bg-[#2a2a2a] transition-colors"
               >
                 <ChevronRight className="w-4 h-4" />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 bg-[#f2f2f2]/30 dark:bg-[#141414]/50">
                {activeCategory === 'vazio' && searchQuery === '' ? (
                   <div className="flex flex-col items-center justify-center pt-24 text-center">
                       <div className="w-16 h-16 bg-[#FBB03B]/10 rounded-full flex items-center justify-center mb-4">
                           <Plus className="w-8 h-8 text-[#FBB03B]" />
                       </div>
                       <h3 className="text-[17px] font-semibold text-[#1A1A1A] dark:text-white tracking-[-0.01em] mb-2">Bloco Vazio</h3>
                       <p className="text-[#767676] max-w-sm mb-6 text-[14px]">Use o espaço vazio para codificar layouts do zero. Requer habilidades avançadas.</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-2 gap-4">
                       {filteredCategories.map(def => (
                          <div key={def.type} className="group flex flex-col bg-white dark:bg-[#1c1c1e] border border-[#e6e6e6] dark:border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#FBB03B] dark:hover:border-[#FBB03B] cursor-pointer transition-all" onClick={() => addBlock(def.type, insertAfterIndex)}>
                             <div className="w-full aspect-video bg-[#f2f2f2] dark:bg-[#2a2a2a] flex items-center justify-center border-b border-[#e6e6e6] dark:border-[#2a2a2a]" dangerouslySetInnerHTML={{ __html: def.thumbnail }} />
                             <div className="flex items-center justify-between px-3 py-2.5">
                                <span className="text-[13px] font-medium text-[#1A1A1A] dark:text-white">{def.name}</span>
                                <button className="text-[12px] font-semibold bg-[#FBB03B] text-[#1A1A1A] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[#f0a824] transition-all">Usar</button>
                             </div>
                          </div>
                       ))}
                       {filteredCategories.length === 0 && (
                          <div className="col-span-2 py-20 text-center flex flex-col items-center">
                             <Search className="w-10 h-10 text-[#d1d1d1] dark:text-[#484848] mb-3" />
                             <p className="text-[#a3a3a3] font-medium text-[13px]">Nenhum bloco encontrado na categoria.</p>
                          </div>
                       )}
                   </div>
                )}
             </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bloco?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O bloco será removido permanentemente da página.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteBlock(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
