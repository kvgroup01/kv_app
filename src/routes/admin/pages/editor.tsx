import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "sonner";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
// @ts-ignore
import gjsPresetWebpage from "grapesjs-preset-webpage";
import { usePage, useUpdatePage } from "../../../hooks/usePages";

const KV_BLOCKS = [
  {
    id: "kv-hero",
    label: "🎯 Hero",
    category: "KVision Blocos",
    content: `<section style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:80px 20px;text-align:center;min-height:500px;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:800px;margin:0 auto;">
    <h1 style="font-family:Inter,sans-serif;font-size:48px;font-weight:900;color:white;margin:0 0 20px;line-height:1.1;">Seu título principal aqui</h1>
    <p style="font-family:Inter,sans-serif;font-size:20px;color:rgba(255,255,255,0.85);margin:0 0 40px;line-height:1.6;">Uma descrição convincente que explica o valor da sua oferta em poucas palavras.</p>
    <a href="#" style="display:inline-block;background:#f59e0b;color:white;font-family:Inter,sans-serif;font-size:18px;font-weight:700;padding:18px 48px;border-radius:50px;text-decoration:none;box-shadow:0 4px 20px rgba(245,158,11,0.4);">QUERO PARTICIPAR →</a>
  </div>
</section>`,
  },
  {
    id: "kv-capture",
    label: "📋 Formulário de Captura",
    category: "KVision Blocos",
    content: `<section style="background:#f8fafc;padding:60px 20px;text-align:center;">
  <div style="max-width:500px;margin:0 auto;background:white;padding:48px;border-radius:16px;box-shadow:0 4px 40px rgba(0,0,0,0.08);">
    <h2 style="font-family:Inter,sans-serif;font-size:28px;font-weight:800;color:#1e293b;margin:0 0 8px;">Garanta sua vaga gratuita</h2>
    <p style="font-family:Inter,sans-serif;font-size:16px;color:#64748b;margin:0 0 32px;">Preencha o formulário e receba o acesso imediatamente.</p>
    <form style="display:flex;flex-direction:column;gap:16px;">
      <input type="text" placeholder="Seu nome completo" style="padding:16px;border:2px solid #e2e8f0;border-radius:8px;font-family:Inter,sans-serif;font-size:16px;width:100%;box-sizing:border-box;"/>
      <input type="email" placeholder="Seu melhor e-mail" style="padding:16px;border:2px solid #e2e8f0;border-radius:8px;font-family:Inter,sans-serif;font-size:16px;width:100%;box-sizing:border-box;"/>
      <button type="submit" style="background:#10b981;color:white;font-family:Inter,sans-serif;font-size:18px;font-weight:700;padding:18px;border-radius:8px;border:none;cursor:pointer;width:100%;">QUERO MEU ACESSO GRÁTIS →</button>
    </form>
    <p style="font-family:Inter,sans-serif;font-size:13px;color:#94a3b8;margin:16px 0 0;">🔒 Seus dados estão seguros. Sem spam.</p>
  </div>
</section>`,
  },
  {
    id: "kv-benefits",
    label: "✅ Benefícios",
    category: "KVision Blocos",
    content: `<section style="padding:80px 20px;background:white;">
  <div style="max-width:1100px;margin:0 auto;">
    <h2 style="font-family:Inter,sans-serif;font-size:36px;font-weight:800;color:#1e293b;text-align:center;margin:0 0 60px;">O que você vai aprender</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
      <div style="text-align:center;padding:32px 24px;">
        <div style="font-size:48px;margin-bottom:16px;">🎯</div>
        <h3 style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:#1e293b;margin:0 0 12px;">Benefício 1</h3>
        <p style="font-family:Inter,sans-serif;font-size:16px;color:#64748b;line-height:1.6;margin:0;">Descreva o primeiro grande benefício que o participante vai ter acesso.</p>
      </div>
      <div style="text-align:center;padding:32px 24px;">
        <div style="font-size:48px;margin-bottom:16px;">🚀</div>
        <h3 style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:#1e293b;margin:0 0 12px;">Benefício 2</h3>
        <p style="font-family:Inter,sans-serif;font-size:16px;color:#64748b;line-height:1.6;margin:0;">Descreva o segundo grande benefício que o participante vai ter acesso.</p>
      </div>
      <div style="text-align:center;padding:32px 24px;">
        <div style="font-size:48px;margin-bottom:16px;">💎</div>
        <h3 style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:#1e293b;margin:0 0 12px;">Benefício 3</h3>
        <p style="font-family:Inter,sans-serif;font-size:16px;color:#64748b;line-height:1.6;margin:0;">Descreva o terceiro grande benefício que o participante vai ter acesso.</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "kv-testimonials",
    label: "💬 Depoimentos",
    category: "KVision Blocos",
    content: `<section style="padding:80px 20px;background:#f8fafc;">
  <div style="max-width:1100px;margin:0 auto;">
    <h2 style="font-family:Inter,sans-serif;font-size:36px;font-weight:800;color:#1e293b;text-align:center;margin:0 0 60px;">O que dizem nossos alunos</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="background:white;padding:32px;border-radius:16px;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
        <p style="font-family:Inter,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;font-style:italic;">"Depoimento incrível aqui. Fale sobre a transformação que o produto trouxe."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>
          <div><p style="font-family:Inter,sans-serif;font-size:15px;font-weight:700;color:#1e293b;margin:0;">Nome do Cliente</p><p style="font-family:Inter,sans-serif;font-size:13px;color:#94a3b8;margin:0;">Profissão / Cidade</p></div>
        </div>
      </div>
      <div style="background:white;padding:32px;border-radius:16px;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
        <p style="font-family:Inter,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;font-style:italic;">"Outro depoimento poderoso que convence o visitante a tomar uma ação."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>
          <div><p style="font-family:Inter,sans-serif;font-size:15px;font-weight:700;color:#1e293b;margin:0;">Nome do Cliente</p><p style="font-family:Inter,sans-serif;font-size:13px;color:#94a3b8;margin:0;">Profissão / Cidade</p></div>
        </div>
      </div>
      <div style="background:white;padding:32px;border-radius:16px;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
        <p style="font-family:Inter,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;font-style:italic;">"Resultado concreto: antes eu tinha X problema, depois consegui Y resultado."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>
          <div><p style="font-family:Inter,sans-serif;font-size:15px;font-weight:700;color:#1e293b;margin:0;">Nome do Cliente</p><p style="font-family:Inter,sans-serif;font-size:13px;color:#94a3b8;margin:0;">Profissão / Cidade</p></div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "kv-video",
    label: "▶️ Vídeo",
    category: "KVision Blocos",
    content: `<section style="padding:80px 20px;background:white;text-align:center;">
  <div style="max-width:800px;margin:0 auto;">
    <h2 style="font-family:Inter,sans-serif;font-size:36px;font-weight:800;color:#1e293b;margin:0 0 16px;">Assista ao vídeo completo</h2>
    <p style="font-family:Inter,sans-serif;font-size:18px;color:#64748b;margin:0 0 40px;">Entenda tudo sobre o método antes de garantir sua vaga.</p>
    <div style="position:relative;padding-bottom:56.25%;height:0;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.15);">
      <iframe src="https://www.youtube.com/embed/SEU_VIDEO_ID" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe>
    </div>
  </div>
</section>`,
  },
  {
    id: "kv-cta",
    label: "🔥 CTA Final",
    category: "KVision Blocos",
    content: `<section style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:80px 20px;text-align:center;">
  <div style="max-width:700px;margin:0 auto;">
    <h2 style="font-family:Inter,sans-serif;font-size:40px;font-weight:900;color:white;margin:0 0 16px;line-height:1.1;">Não perca essa oportunidade</h2>
    <p style="font-family:Inter,sans-serif;font-size:18px;color:rgba(255,255,255,0.7);margin:0 0 40px;line-height:1.6;">Vagas limitadas. Garanta a sua agora antes que encerrem.</p>
    <a href="#" style="display:inline-block;background:#f59e0b;color:white;font-family:Inter,sans-serif;font-size:20px;font-weight:800;padding:20px 56px;border-radius:50px;text-decoration:none;box-shadow:0 4px 30px rgba(245,158,11,0.5);">GARANTIR MINHA VAGA →</a>
    <p style="font-family:Inter,sans-serif;font-size:14px;color:rgba(255,255,255,0.4);margin:20px 0 0;">🔒 Pagamento 100% seguro</p>
  </div>
</section>`,
  },
  {
    id: "kv-countdown",
    label: "⏱️ Countdown",
    category: "KVision Blocos",
    content: `<section style="padding:60px 20px;background:#fef3c7;text-align:center;">
  <div style="max-width:600px;margin:0 auto;">
    <p style="font-family:Inter,sans-serif;font-size:16px;font-weight:600;color:#92400e;margin:0 0 24px;text-transform:uppercase;letter-spacing:2px;">⚡ OFERTA EXPIRA EM</p>
    <div style="display:flex;justify-content:center;gap:16px;">
      <div style="background:#1e293b;color:white;padding:20px 24px;border-radius:12px;min-width:80px;"><div style="font-family:Inter,sans-serif;font-size:40px;font-weight:900;line-height:1;">12</div><div style="font-family:Inter,sans-serif;font-size:12px;color:#94a3b8;margin-top:4px;">HORAS</div></div>
      <div style="background:#1e293b;color:white;padding:20px 24px;border-radius:12px;min-width:80px;"><div style="font-family:Inter,sans-serif;font-size:40px;font-weight:900;line-height:1;">34</div><div style="font-family:Inter,sans-serif;font-size:12px;color:#94a3b8;margin-top:4px;">MINUTOS</div></div>
      <div style="background:#1e293b;color:white;padding:20px 24px;border-radius:12px;min-width:80px;"><div style="font-family:Inter,sans-serif;font-size:40px;font-weight:900;line-height:1;">57</div><div style="font-family:Inter,sans-serif;font-size:12px;color:#94a3b8;margin-top:4px;">SEGUNDOS</div></div>
    </div>
  </div>
</section>`,
  },
  {
    id: "kv-footer",
    label: "📌 Rodapé",
    category: "KVision Blocos",
    content: `<footer style="background:#0f172a;padding:40px 20px;text-align:center;">
  <p style="font-family:Inter,sans-serif;font-size:14px;color:#475569;margin:0;">© 2026 Nome da Empresa. Todos os direitos reservados.</p>
  <p style="font-family:Inter,sans-serif;font-size:12px;color:#334155;margin:8px 0 0;">Política de Privacidade · Termos de Uso</p>
</footer>`,
  },
];

export default function PagesEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = React.useRef<Editor | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [aiModalOpen, setAiModalOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [generatingAI, setGeneratingAI] = React.useState(false);

  const { data: page, isLoading } = usePage(id ?? null);
  const updatePage = useUpdatePage();

  const handleGenerateAI = async () => {
    if (!prompt.trim() || !editorRef.current) return;
    setGeneratingAI(true);
    try {
      const res = await fetch("https://sync.kvgroupbr.com.br/pages/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) throw new Error("Erro na solicitação");
      const { html } = await res.json();
      if (html) {
        editorRef.current.setComponents(html);
        editorRef.current.setStyle('');
        toast.success("Página gerada com sucesso!");
        setAiModalOpen(false);
        setPrompt("");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar página com IA");
    } finally {
      setGeneratingAI(false);
    }
  };

  React.useEffect(() => {
    if (!containerRef.current || isLoading || initializedRef.current) return;
    initializedRef.current = true;

    const editor = grapesjs.init({
      container: containerRef.current,
      fromElement: false,
      height: "100%",
      width: "auto",
      plugins: [gjsPresetWebpage],
      pluginsOpts: { [gjsPresetWebpage as any]: {} },
      storageManager: false,
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
        ],
      },
    });

    KV_BLOCKS.forEach((b) =>
      editor.BlockManager.add(b.id, {
        label: b.label,
        category: b.category,
        content: b.content,
      })
    );

    if (page?.gjs_data) {
      editor.loadProjectData(page.gjs_data);
    }

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
      initializedRef.current = false;
    };
  }, [isLoading, page]);

  const handleSave = async (publish = false) => {
    if (!editorRef.current || !page) return;
    publish ? setPublishing(true) : setSaving(true);
    try {
      const projectData = editorRef.current.getProjectData();
      const html = editorRef.current.getHtml();
      const css = editorRef.current.getCss();
      await updatePage.mutateAsync({
        id: page.id,
        gjs_data: projectData,
        html,
        css,
        ...(publish
          ? { status: "published" as const, publicado_em: new Date().toISOString() }
          : {}),
      });
      toast.success(publish ? "Página publicada!" : "Rascunho salvo!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "0 16px", height: "52px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, zIndex: 10 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/pages")}
          style={{ color: "#94a3b8", gap: "6px" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div style={{ width: "1px", height: "24px", background: "#1e293b" }} />
        <span style={{ color: "white", fontWeight: 600, fontSize: "14px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {page?.nome}
        </span>
        <Badge
          variant={page?.status === "published" ? "default" : "secondary"}
          style={{ fontSize: "11px", flexShrink: 0 }}
        >
          {page?.status === "published" ? "Publicada" : "Rascunho"}
        </Badge>
        <Button
          size="sm"
          onClick={() => setAiModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Gerar com IA
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving}
          style={{ borderColor: "#334155", color: "#94a3b8", gap: "6px" }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar
        </Button>
        <Button
          size="sm"
          onClick={() => handleSave(true)}
          disabled={publishing}
          style={{ background: "#16a34a", color: "white", gap: "6px" }}
        >
          {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
          Publicar
        </Button>
      </div>

      {/* GrapesJS editor */}
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden" }} />

      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Gerar Página com IA
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Descreva detalhadamente a página que você quer gerar. A IA criará a estrutura e os textos para você.
            </p>
            <Textarea
              placeholder="Ex: landing page de captura para curso de inglês online, fundo azul escuro, tom profissional e moderno"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={generatingAI}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiModalOpen(false)} disabled={generatingAI}>
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateAI}
              disabled={!prompt.trim() || generatingAI}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              {generatingAI ? (
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
