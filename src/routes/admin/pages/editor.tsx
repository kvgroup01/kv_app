import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Sparkles, Undo2, Redo2, Save, Globe, ChevronRight, X, Loader2, Clock } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import { usePage, useUpdatePage } from "../../../hooks/usePages";

const VPS_URL = import.meta.env.VITE_VPS_URL || "https://sync.kvgroupbr.com.br";

function buildIframeSrcdoc(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.23.5/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    [data-section] { cursor: pointer; }
    [data-section]:hover { outline: 2px solid #7c3aed; outline-offset: 2px; }
    [data-section].kv-selected { outline: 3px solid #7c3aed !important; outline-offset: 3px; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .kv-fadeInUp { animation: fadeInUp 0.7s ease forwards; }
    .kv-fadeIn { animation: fadeIn 0.8s ease forwards; }
    .kv-scaleIn { animation: scaleIn 0.5s ease forwards; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Expor hooks no escopo global para o JSX gerado
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var useCallback = React.useCallback;
    var useMemo = React.useMemo;
  </script>
  <script type="text/babel" data-presets="react">
${code}

    const __root = ReactDOM.createRoot(document.getElementById('root'));
    __root.render(React.createElement(LandingPage));
  </script>
  <script>
    // Injetar listeners de seleção após o React renderizar
    setTimeout(function() {
      var sections = document.querySelectorAll('[data-section]');
      sections.forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          document.querySelectorAll('[data-section]').forEach(function(s) {
            s.classList.remove('kv-selected');
          });
          el.classList.add('kv-selected');
          window.parent.postMessage({
            type: 'SECTION_SELECTED',
            sectionId: el.dataset.section,
            sectionLabel: el.dataset.sectionLabel || el.dataset.section
          }, '*');
        });
      });
      document.addEventListener('click', function() {
        document.querySelectorAll('[data-section]').forEach(function(s) {
          s.classList.remove('kv-selected');
        });
        window.parent.postMessage({ type: 'SECTION_DESELECTED' }, '*');
      });
    }, 800);
  </script>
</body>
</html>`;
}

export default function PagesEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading } = usePage(id ?? null);
  const updatePage = useUpdatePage();

  const [code, setCode] = React.useState("");
  const [history, setHistory] = React.useState<{code: string, timestamp: Date}[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [selectedSection, setSelectedSection] = React.useState<{id: string, label: string} | null>(null);
  const [editPrompt, setEditPrompt] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showGenerateModal, setShowGenerateModal] = React.useState(false);
  const [generatePrompt, setGeneratePrompt] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  
  const iframeSrc = React.useMemo(() => buildIframeSrcdoc(code), [code]);

  React.useEffect(() => {
    if (page?.html && history.length === 0) {
      setCode(page.html);
      setHistory([{ code: page.html, timestamp: new Date() }]);
      setHistoryIndex(0);
    }
  }, [page, history]);

  React.useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SECTION_SELECTED') {
        setSelectedSection({ id: e.data.sectionId, label: e.data.sectionLabel });
      }
      if (e.data?.type === 'SECTION_DESELECTED') {
        setSelectedSection(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setHistory(prev => {
      const newHist = prev.slice(0, historyIndex + 1);
      newHist.push({ code: newCode, timestamp: new Date() });
      if (newHist.length > 20) newHist.shift();
      setHistoryIndex(newHist.length - 1);
      return newHist;
    });
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${VPS_URL}/pages/ai-generate-v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatePrompt.trim() })
      });
      if (!res.ok) throw new Error("Erro na solicitação");
      const data = await res.json();
      if (data.code || data.html) {
        handleCodeChange(data.code || data.html);
        setShowGenerateModal(false);
        setGeneratePrompt("");
        toast.success("Página gerada!");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar página");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditSection = async () => {
    if (!editPrompt.trim() || !selectedSection) return;
    setIsEditing(true);
    try {
      const res = await fetch(`${VPS_URL}/pages/ai-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code, 
          sectionId: selectedSection.id, 
          sectionLabel: selectedSection.label, 
          editPrompt: editPrompt.trim() 
        })
      });
      if (!res.ok) throw new Error("Erro na solicitação");
      const data = await res.json();
      if (data.code || data.html) {
        handleCodeChange(data.code || data.html);
        setEditPrompt("");
        setSelectedSection(null);
        toast.success("Seção editada!");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao editar seção");
    } finally {
      setIsEditing(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setCode(history[prevIdx].code);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setCode(history[nextIdx].code);
    }
  };

  const handleSave = async (isPublish = false) => {
    if (!page) return;
    isPublish ? setIsPublishing(true) : setIsSaving(true);
    try {
      await updatePage.mutateAsync({
        id: page.id,
        html: code,
        ...(isPublish
          ? { status: "published", publicado_em: new Date().toISOString() }
          : { status: page.status })
      });
      toast.success(isPublish ? "Página publicada!" : "Rascunho salvo!");
    } catch (e) {
      toast.error("Erro ao salvar página");
    } finally {
      isPublish ? setIsPublishing(false) : setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* TopBar - h-14 border-b */}
      <div className="h-14 border-b border-slate-800 px-4 flex items-center gap-3 shrink-0 bg-slate-900 z-10 w-full relative">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/pages")} className="text-slate-400 gap-2 hover:text-slate-100">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="w-px h-6 bg-slate-800" />
        <span className="font-semibold text-sm flex-1 truncate">{page?.nome}</span>
        <Badge variant={page?.status === "published" ? "default" : "secondary"} className="shrink-0 text-[11px]">
          {page?.status === "published" ? "Publicada" : "Rascunho"}
        </Badge>
        
        <Button
          size="sm"
          onClick={() => setShowGenerateModal(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 ml-2"
        >
          <Sparkles className="w-3.5 h-3.5" /> Gerar com IA
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="border-slate-700 text-slate-400 gap-2 hover:text-slate-100 hover:bg-slate-800"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar
        </Button>
        <Button
          size="sm"
          onClick={() => handleSave(true)}
          disabled={isPublishing}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
          Publicar
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* LeftPanel 280px */}
        <div className="w-[280px] border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0 h-full">
          <div className="p-4 flex items-center justify-between border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Histórico</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleUndo} disabled={historyIndex <= 0}>
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRedo} disabled={historyIndex === history.length - 1}>
                <Redo2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setHistoryIndex(i);
                  setCode(history[i].code);
                }}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                  historyIndex === i 
                    ? "bg-violet-500/10 text-violet-400 font-medium" 
                    : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                )}
              >
                <Clock className="w-3 h-3" />
                {h.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                <span className="ml-auto text-[10px] opacity-50">v{i + 1}</span>
              </button>
            ))}
            {history.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                Nenhuma alteração ainda
              </div>
            )}
          </div>
        </div>

        {/* iframe */}
        <div className="flex-1 relative bg-white overflow-hidden h-full">
          {!code ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-900">
              <div className="max-w-md text-center space-y-4">
                <Sparkles className="w-12 h-12 text-violet-600 mx-auto" />
                <h2 className="text-xl font-bold">Nenhum conteúdo ainda</h2>
                <p className="text-slate-500 text-sm">
                  Comece gerando sua página com Inteligência Artificial
                </p>
                <Button 
                  onClick={() => setShowGenerateModal(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white mt-4 gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Gerar Página Agora
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={iframeSrc}
              className="w-full h-full border-0"
              title="Page Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>

        {/* RightPanel 320px */}
        <div className={cn(
          "w-[320px] bg-slate-900 border-l border-slate-800 shrink-0 h-full flex flex-col transition-all duration-300 absolute right-0 top-0 bottom-0 z-20 shadow-2xl",
          selectedSection ? "translate-x-0" : "translate-x-full"
        )}>
          {selectedSection && (
            <>
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">Editar seção:</h3>
                  <p className="text-xs text-violet-400 mt-0.5 capitalize">{selectedSection.label}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 shrink-0" onClick={() => setSelectedSection(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium">O que você quer mudar?</label>
                  <Textarea
                    placeholder="Ex: Mude a cor de fundo para azul, deixe o texto mais persuasivo e adicione um subtítulo"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="min-h-[120px] bg-slate-950 border-slate-800 resize-none focus-visible:ring-violet-500"
                  />
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-800 bg-slate-900">
                <Button 
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2" 
                  onClick={handleEditSection}
                  disabled={!editPrompt.trim() || isEditing}
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Aplicando edição...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Aplicar edição IA
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              Gerar Página com IA
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-400">
              Descreva detalhadamente a página que você quer gerar. A IA criará a estrutura e os textos para você.
            </p>
            <Textarea
              placeholder="Ex: landing page de captura para curso de inglês online, fundo azul escuro, tom profissional e moderno"
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              rows={4}
              disabled={isGenerating}
              className="bg-slate-950 border-slate-800 focus-visible:ring-violet-500 text-slate-100"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)} disabled={isGenerating} className="border-slate-700 text-slate-300 hover:bg-slate-800 text-white">
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!generatePrompt.trim() || isGenerating}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A IA está criando sua página...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar página
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
