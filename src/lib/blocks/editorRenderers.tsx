import React from "react";
import type { SectionStyles } from "./types";

type OnChange = (key: string, value: any) => void;

// Estilo padrão para elementos editáveis inline
const editableStyle: React.CSSProperties = {
  outline: "none",
  cursor: "text",
  borderRadius: 4,
  transition: "box-shadow 0.15s",
};

function EditableText({
  tag: Tag = "div",
  value,
  onChange,
  style,
  placeholder = "Clique para editar",
}: {
  tag?: string | React.ElementType;
  value: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const Component = Tag as any;
  return (
    <Component
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) =>
        onChange(e.currentTarget.innerText || "")
      }
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        e.currentTarget.style.boxShadow = "0 0 0 2px #FBB03B";
      }}
      onBlurCapture={(e: React.FocusEvent<HTMLElement>) => {
        e.currentTarget.style.boxShadow = "none";
      }}
      title={placeholder}
      style={{ ...editableStyle, ...style }}
      dangerouslySetInnerHTML={{ __html: value || "" }}
    />
  );
}

// ─────────────────────────────────────────────
// header_1
// ─────────────────────────────────────────────
function Header1Editor({
  data,
  styles,
  onChange,
}: {
  data: Record<string, any>;
  styles: SectionStyles;
  onChange: OnChange;
}) {
  return (
    <section
      style={{
        backgroundColor: styles.backgroundColor || "#fff",
        backgroundImage: data.background_image
          ? `url('${data.background_image}')`
          : styles.backgroundImage
            ? `url('${styles.backgroundImage}')`
            : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`,
        position: "relative",
      }}
    >
      {styles.overlayColor && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: styles.overlayColor,
            opacity: (styles.overlayOpacity || 0) / 100,
          }}
        />
      )}
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {data.logo_url && (
          <img
            src={data.logo_url}
            alt="Logo"
            style={{ height: 48, marginBottom: 32 }}
          />
        )}
        <EditableText
          tag="h1"
          value={data.headline || ""}
          onChange={(v) => onChange("headline", v)}
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#1e293b",
            marginBottom: 24,
            lineHeight: 1.1,
          }}
        />
        <EditableText
          tag="p"
          value={data.subheadline || ""}
          onChange={(v) => onChange("subheadline", v)}
          style={{
            fontSize: 20,
            color: "#475569",
            marginBottom: 40,
            lineHeight: 1.5,
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {data.cta1_texto && (
            <EditableText
              tag="span"
              value={data.cta1_texto}
              onChange={(v) => onChange("cta1_texto", v)}
              style={{
                display: "inline-block",
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "16px 32px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
              }}
            />
          )}
          {data.cta2_texto && (
            <EditableText
              tag="span"
              value={data.cta2_texto}
              onChange={(v) => onChange("cta2_texto", v)}
              style={{
                display: "inline-block",
                backgroundColor: "transparent",
                color: "#3b82f6",
                border: "2px solid #3b82f6",
                padding: "14px 32px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// form_lead_1
// ─────────────────────────────────────────────
function FormLead1Editor({
  data,
  styles,
  onChange,
}: {
  data: Record<string, any>;
  styles: SectionStyles;
  onChange: OnChange;
}) {
  return (
    <section
      style={{
        backgroundColor: styles.backgroundColor || "#fff",
        padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`,
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <EditableText
          tag="h2"
          value={data.titulo || ""}
          onChange={(v) => onChange("titulo", v)}
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#1e293b",
            margin: "0 0 12px",
          }}
        />
        <EditableText
          tag="p"
          value={data.subtitulo || ""}
          onChange={(v) => onChange("subtitulo", v)}
          style={{
            fontSize: 17,
            color: "#64748b",
            margin: "0 0 32px",
            lineHeight: 1.5,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            textAlign: "left",
          }}
        >
          {data.mostrar_nome !== false && (
            <input
              type="text"
              placeholder="Seu nome completo"
              disabled
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 15,
                color: "#1e293b",
                boxSizing: "border-box",
                fontFamily: "inherit",
                background: "white",
              }}
            />
          )}
          {data.mostrar_email !== false && (
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              disabled
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 15,
                color: "#1e293b",
                boxSizing: "border-box",
                fontFamily: "inherit",
                background: "white",
              }}
            />
          )}
          {data.mostrar_telefone !== false && (
            <input
              type="tel"
              placeholder="WhatsApp com DDD"
              disabled
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 15,
                color: "#1e293b",
                boxSizing: "border-box",
                fontFamily: "inherit",
                background: "white",
              }}
            />
          )}
          <EditableText
            tag="span"
            value={data.botao_texto || "Quero participar"}
            onChange={(v) => onChange("botao_texto", v)}
            style={{
              display: "block",
              width: "100%",
              padding: 16,
              backgroundColor: data.botao_cor || "#FBB03B",
              color: data.botao_texto_cor || "#1A1A1A",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              textAlign: "center",
              marginTop: 4,
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Mapa exportado
// ─────────────────────────────────────────────
export const editorRenderers: Record<
  string,
  (
    data: Record<string, any>,
    styles: SectionStyles,
    onChange: OnChange,
  ) => React.ReactNode
> = {
  header_1: (data, styles, onChange) => (
    <Header1Editor data={data} styles={styles} onChange={onChange} />
  ),
  form_lead_1: (data, styles, onChange) => (
    <FormLead1Editor data={data} styles={styles} onChange={onChange} />
  ),
};
