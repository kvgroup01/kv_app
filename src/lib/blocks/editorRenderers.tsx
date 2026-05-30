import React, { ReactNode } from 'react'
import type { SectionStyles } from './types'

type OnChange = (key: string, value: any) => void
type OnSelect = (elementKey: string, elementType: 'text' | 'shape') => void

function EditableText({
  tag = 'div',
  elementType,
  value,
  onChange,
  style,
  elementKey,
  onSelectElement,
  isSelected,
  styleOverrides,
}: {
  tag?: string | React.ElementType
  elementType?: 'text' | 'shape'
  value: string
  onChange: (val: string) => void
  style?: React.CSSProperties
  elementKey: string
  onSelectElement: OnSelect
  isSelected: boolean
  styleOverrides?: Record<string, any>
}) {
  const Tag = tag as any
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onClick={() => onSelectElement(elementKey, elementType || 'text')}
      onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.innerText || '')}
      title="Clique para editar"
      style={{
        outline: 'none',
        cursor: 'text',
        borderRadius: 4,
        transition: 'box-shadow 0.1s',
        ...style,
        ...(styleOverrides || {}),
        ...(isSelected ? { boxShadow: '0 0 0 2px #FBB03B' } : {}),
      }}
      dangerouslySetInnerHTML={{ __html: value || '' }}
    />
  )
}

function updateArrayItem(items: any[], i: number, key: string, val: string) {
  const next = [...items]
  next[i] = { ...next[i], [key]: val }
  return next
}

// ── header_1 ──────────────────────────────────────────────
function Header1Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#fff', backgroundImage: data.background_image ? `url('${data.background_image}')` : styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        {data.logo_url && <img src={data.logo_url} alt="Logo" style={{ height: 48, marginBottom: 32 }} />}
        <EditableText tag="h1" value={data.headline || ''} onChange={v => onChange('headline', v)} style={{ fontSize: 48, fontWeight: 800, color: '#1e293b', marginBottom: 24, lineHeight: 1.1 }} {...et('headline')} />
        <EditableText tag="p" value={data.subheadline || ''} onChange={v => onChange('subheadline', v)} style={{ fontSize: 20, color: '#475569', marginBottom: 40, lineHeight: 1.5 }} {...et('subheadline')} />
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {data.cta1_texto && <EditableText tag="span" value={data.cta1_texto} onChange={v => onChange('cta1_texto', v)} style={{ display: 'inline-block', backgroundColor: '#3b82f6', color: 'white', padding: '16px 32px', borderRadius: 8, fontWeight: 600, fontSize: 16 }} {...es('cta1_texto')} />}
          {data.cta2_texto && <EditableText tag="span" value={data.cta2_texto} onChange={v => onChange('cta2_texto', v)} style={{ display: 'inline-block', color: '#3b82f6', border: '2px solid #3b82f6', padding: '14px 32px', borderRadius: 8, fontWeight: 600, fontSize: 16 }} {...es('cta2_texto')} />}
        </div>
      </div>
    </section>
  )
}

// ── header_2 ──────────────────────────────────────────────
function Header2Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#f8fafc', backgroundImage: data.background_image ? `url('${data.background_image}')` : styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 100}px 24px ${styles.paddingBottom || 100}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48, position: 'relative', zIndex: 10 }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          {data.logo_url && <img src={data.logo_url} alt="Logo" style={{ height: 48, marginBottom: 32 }} />}
          <EditableText tag="h1" value={data.headline || ''} onChange={v => onChange('headline', v)} style={{ fontSize: 56, fontWeight: 800, color: '#0f172a', marginBottom: 24, lineHeight: 1.1 }} {...et('headline')} />
          <EditableText tag="p" value={data.subheadline || ''} onChange={v => onChange('subheadline', v)} style={{ fontSize: 20, color: '#475569', marginBottom: 40, lineHeight: 1.5 }} {...et('subheadline')} />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {data.cta1_texto && <EditableText tag="span" value={data.cta1_texto} onChange={v => onChange('cta1_texto', v)} style={{ display: 'inline-block', backgroundColor: '#0f172a', color: 'white', padding: '18px 40px', borderRadius: 8, fontWeight: 600, fontSize: 18 }} {...es('cta1_texto')} />}
            {data.cta2_texto && <EditableText tag="span" value={data.cta2_texto} onChange={v => onChange('cta2_texto', v)} style={{ display: 'inline-block', color: '#0f172a', border: '2px solid #0f172a', padding: '16px 40px', borderRadius: 8, fontWeight: 600, fontSize: 18 }} {...es('cta2_texto')} />}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>Media Container</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── benefits_1 ────────────────────────────────────────────
function Benefits1Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const items: any[] = data.items || []
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#fff', backgroundImage: styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <EditableText tag="h2" value={data.titulo || ''} onChange={v => onChange('titulo', v)} style={{ fontSize: 36, fontWeight: 800, color: '#1e293b', marginBottom: 16 }} {...et('titulo')} />
        <EditableText tag="p" value={data.subtitulo || ''} onChange={v => onChange('subtitulo', v)} style={{ fontSize: 18, color: '#64748b', marginBottom: 64, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }} {...et('subtitulo')} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
          {items.map((item, i) => (
            <div key={i} style={{ flex: 1, minWidth: 250, padding: 24 }}>
              <EditableText tag="div" value={item.icone_emoji || '✅'} onChange={v => onChange('items', updateArrayItem(items, i, 'icone_emoji', v))} style={{ fontSize: 40, marginBottom: 24, display: 'inline-flex', width: 80, height: 80, background: '#f1f5f9', borderRadius: '50%', alignItems: 'center', justifyContent: 'center' }} {...es(`items.${i}.icone_emoji`)} />
              <EditableText tag="h3" value={item.titulo || ''} onChange={v => onChange('items', updateArrayItem(items, i, 'titulo', v))} style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 12 }} {...et(`items.${i}.titulo`)} />
              <EditableText tag="p" value={item.descricao || ''} onChange={v => onChange('items', updateArrayItem(items, i, 'descricao', v))} style={{ fontSize: 16, color: '#475569', lineHeight: 1.5 }} {...et(`items.${i}.descricao`)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── benefits_2 ────────────────────────────────────────────
function Benefits2Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const items: any[] = data.items || []
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#f8fafc', backgroundImage: styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ width: '100%', aspectRatio: '4/5', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>Feature Image</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <EditableText tag="h2" value={data.titulo || ''} onChange={v => onChange('titulo', v)} style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', marginBottom: 16 }} {...et('titulo')} />
          <EditableText tag="p" value={data.subtitulo || ''} onChange={v => onChange('subtitulo', v)} style={{ fontSize: 18, color: '#475569', marginBottom: 40 }} {...et('subtitulo')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 16 }}>
                <EditableText tag="div" value={item.icone_emoji || '•'} onChange={v => onChange('items', updateArrayItem(items, i, 'icone_emoji', v))} style={{ fontSize: 24, paddingTop: 2, minWidth: 32 }} {...es(`items.${i}.icone_emoji`)} />
                <div>
                  <EditableText tag="h3" value={item.titulo || ''} onChange={v => onChange('items', updateArrayItem(items, i, 'titulo', v))} style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }} {...et(`items.${i}.titulo`)} />
                  <EditableText tag="p" value={item.descricao || ''} onChange={v => onChange('items', updateArrayItem(items, i, 'descricao', v))} style={{ fontSize: 16, color: '#475569', lineHeight: 1.5, margin: 0 }} {...et(`items.${i}.descricao`)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── testimonials_1 ────────────────────────────────────────
function Testimonials1Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const items: any[] = data.items || []
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#f1f5f9', backgroundImage: styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <EditableText tag="h2" value={data.titulo || ''} onChange={v => onChange('titulo', v)} style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 64 }} {...et('titulo')} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flex: 1, minWidth: 300, maxWidth: 400, display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#fbbf24', fontSize: 20, marginBottom: 16 }}>{'★'.repeat(parseInt(item.estrelas) || 5)}</div>
              <EditableText tag="p" value={item.texto || ''} onChange={v => onChange('items', updateArrayItem(items, i, 'texto', v))} style={{ fontSize: 16, color: '#334155', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 24, flexGrow: 1 }} {...et(`items.${i}.texto`)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                {item.avatar_url ? <img src={item.avatar_url} alt={item.nome} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 48, height: 48, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569' }}>{item.nome?.charAt(0) || 'U'}</div>}
                <div>
                  <EditableText tag="h4" value={item.nome || ''} onChange={v => onChange('items', updateArrayItem(items, i, 'nome', v))} style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }} {...et(`items.${i}.nome`)} />
                  <EditableText tag="p" value={item.cargo || ''} onChange={v => onChange('items', updateArrayItem(items, i, 'cargo', v))} style={{ color: '#64748b', margin: 0, fontSize: 14 }} {...et(`items.${i}.cargo`)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── testimonials_2 ────────────────────────────────────────
function Testimonials2Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const item = data.items?.[0] || {}
  const u0 = (key: string, val: string) => onChange('items', updateArrayItem(data.items || [item], 0, key, val))
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#fff', backgroundImage: styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 100}px 24px ${styles.paddingBottom || 100}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        {data.titulo && <EditableText tag="h2" value={data.titulo} onChange={v => onChange('titulo', v)} style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 32 }} {...et('titulo')} />}
        <div style={{ fontSize: 80, color: '#e2e8f0', lineHeight: 0, marginBottom: 24, fontFamily: 'Georgia, serif' }}>"</div>
        <EditableText tag="p" value={item.texto || ''} onChange={v => u0('texto', v)} style={{ fontSize: 28, fontWeight: 500, color: '#0f172a', lineHeight: 1.5, marginBottom: 48 }} {...et('item0.texto')} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {item.avatar_url ? <img src={item.avatar_url} alt={item.nome} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }} /> : <div style={{ width: 72, height: 72, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569', marginBottom: 16, fontSize: 24 }}>{item.nome?.charAt(0) || 'U'}</div>}
          <EditableText tag="h4" value={item.nome || ''} onChange={v => u0('nome', v)} style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', fontSize: 18 }} {...et('item0.nome')} />
          <EditableText tag="p" value={item.cargo || ''} onChange={v => u0('cargo', v)} style={{ color: '#64748b', margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }} {...et('item0.cargo')} />
        </div>
      </div>
    </section>
  )
}

// ── forms_1 ───────────────────────────────────────────────
function Forms1Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const campos: any[] = data.campos || []
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#f8fafc', backgroundImage: styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <EditableText tag="h2" value={data.titulo || ''} onChange={v => onChange('titulo', v)} style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', marginBottom: 24, lineHeight: 1.2 }} {...et('titulo')} />
          <EditableText tag="p" value={data.subtitulo || ''} onChange={v => onChange('subtitulo', v)} style={{ fontSize: 18, color: '#475569', lineHeight: 1.6 }} {...et('subtitulo')} />
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {campos.map((c, i) => (
                <div key={i}>
                  <EditableText tag="label" value={c.label || ''} onChange={v => onChange('campos', updateArrayItem(campos, i, 'label', v))} style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 8 }} {...et(`campos.${i}.label`)} />
                  <input type={c.tipo || 'text'} disabled placeholder={c.label} style={{ width: '100%', padding: '14px 16px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>
              ))}
              <EditableText tag="span" value={data.botao_texto || ''} onChange={v => onChange('botao_texto', v)} style={{ display: 'block', backgroundColor: data.botao_cor || '#0f172a', color: 'white', padding: 16, borderRadius: 8, fontSize: 16, fontWeight: 700, textAlign: 'center', marginTop: 8 }} {...es('botao_texto')} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── forms_2 ───────────────────────────────────────────────
function Forms2Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const campos: any[] = data.campos || []
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#fff', backgroundImage: styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <EditableText tag="h2" value={data.titulo || ''} onChange={v => onChange('titulo', v)} style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 16 }} {...et('titulo')} />
        <EditableText tag="p" value={data.subtitulo || ''} onChange={v => onChange('subtitulo', v)} style={{ fontSize: 18, color: '#475569', marginBottom: 32 }} {...et('subtitulo')} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {campos.map((c, i) => <input key={i} type={c.tipo || 'text'} disabled placeholder={c.label} style={{ flex: 1, minWidth: 250, padding: '16px 20px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 16, background: 'white' }} />)}
          <EditableText tag="span" value={data.botao_texto || ''} onChange={v => onChange('botao_texto', v)} style={{ display: 'inline-block', backgroundColor: data.botao_cor || '#0f172a', color: 'white', padding: '16px 36px', borderRadius: 8, fontSize: 16, fontWeight: 700 }} {...es('botao_texto')} />
        </div>
      </div>
    </section>
  )
}

// ── cta_1 ─────────────────────────────────────────────────
function Cta1Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#fff', backgroundImage: styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: data.background_color || '#3b82f6', borderRadius: 24, padding: '64px 32px', textAlign: 'center' }}>
          <EditableText tag="h2" value={data.titulo || ''} onChange={v => onChange('titulo', v)} style={{ fontSize: 40, fontWeight: 800, color: 'white', marginBottom: 16 }} {...et('titulo')} />
          <EditableText tag="p" value={data.subtitulo || ''} onChange={v => onChange('subtitulo', v)} style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 40 }} {...et('subtitulo')} />
          <EditableText tag="span" value={data.cta_texto || ''} onChange={v => onChange('cta_texto', v)} style={{ display: 'inline-block', backgroundColor: 'white', color: data.background_color || '#3b82f6', padding: '18px 40px', borderRadius: 8, fontWeight: 700, fontSize: 18 }} {...es('cta_texto')} />
        </div>
      </div>
    </section>
  )
}

// ── cta_2 ─────────────────────────────────────────────────
function Cta2Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: data.background_color || styles.backgroundColor || '#f8fafc', backgroundImage: styles.backgroundImage ? `url('${styles.backgroundImage}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', padding: `${styles.paddingTop || 60}px 24px ${styles.paddingBottom || 60}px`, borderTop: '1px solid #e2e8f0', position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 32, position: 'relative', zIndex: 10 }}>
        <div>
          <EditableText tag="h2" value={data.titulo || ''} onChange={v => onChange('titulo', v)} style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }} {...et('titulo')} />
          <EditableText tag="p" value={data.subtitulo || ''} onChange={v => onChange('subtitulo', v)} style={{ fontSize: 16, color: '#64748b', margin: 0 }} {...et('subtitulo')} />
        </div>
        <EditableText tag="span" value={data.cta_texto || ''} onChange={v => onChange('cta_texto', v)} style={{ display: 'inline-block', color: '#0f172a', border: '2px solid #0f172a', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 16 }} {...es('cta_texto')} />
      </div>
    </section>
  )
}

// ── footer_1 ──────────────────────────────────────────────
function Footer1Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const links: any[] = data.links || []
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <footer style={{ backgroundColor: styles.backgroundColor || '#0f172a', padding: `${styles.paddingTop || 64}px 24px ${styles.paddingBottom || 32}px`, position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 48, marginBottom: 32 }}>
          <div style={{ flex: 2, minWidth: 280 }}>
            {data.logo_url ? <img src={data.logo_url} alt="Logo" style={{ height: 32, marginBottom: 16 }} /> : <h3 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 16 }}>Logo</h3>}
            <EditableText tag="p" value={data.descricao || ''} onChange={v => onChange('descricao', v)} style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, maxWidth: 320 }} {...et('descricao')} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 24 }}>Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {links.map((l, i) => (
                <li key={i}><EditableText tag="span" value={l.label || ''} onChange={v => onChange('links', updateArrayItem(links, i, 'label', v))} style={{ color: '#94a3b8', fontSize: 15 }} {...et(`links.${i}.label`)} /></li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <EditableText tag="p" value={data.copyright || ''} onChange={v => onChange('copyright', v)} style={{ fontSize: 14, color: '#64748b', margin: 0 }} {...et('copyright')} />
        </div>
      </div>
    </footer>
  )
}

// ── footer_2 ──────────────────────────────────────────────
function Footer2Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const links: any[] = data.links || []
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <footer style={{ backgroundColor: styles.backgroundColor || '#f8fafc', padding: `${styles.paddingTop || 40}px 24px ${styles.paddingBottom || 40}px`, borderTop: '1px solid #e2e8f0', position: 'relative' }}>
      {styles.overlayColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: styles.overlayColor, opacity: (styles.overlayOpacity || 0) / 100 }} />}
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        {data.logo_url && <img src={data.logo_url} alt="Logo" style={{ height: 32, marginBottom: 24 }} />}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 24 }}>
          {links.map((l, i) => <EditableText key={i} tag="span" value={l.label || ''} onChange={v => onChange('links', updateArrayItem(links, i, 'label', v))} style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }} {...et(`links.${i}.label`)} />)}
        </div>
        <EditableText tag="p" value={data.copyright || ''} onChange={v => onChange('copyright', v)} style={{ fontSize: 14, color: '#94a3b8', margin: 0 }} {...et('copyright')} />
      </div>
    </footer>
  )
}

// ── form_lead_1 ───────────────────────────────────────────
function FormLead1Editor({ data, styles, onChange, onSelectElement, selectedElementKey, elementStyles }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const et = (key: string) => ({ elementKey: key, onSelectElement, isSelected: selectedElementKey === key, styleOverrides: elementStyles[key] })
  const es = (key: string) => ({ ...et(key), elementType: 'shape' as const })
  return (
    <section style={{ backgroundColor: styles.backgroundColor || '#fff', padding: `${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px` }}>
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <EditableText tag="h2" value={data.titulo || ''} onChange={v => onChange('titulo', v)} style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: '0 0 12px' }} {...et('titulo')} />
        <EditableText tag="p" value={data.subtitulo || ''} onChange={v => onChange('subtitulo', v)} style={{ fontSize: 17, color: '#64748b', margin: '0 0 32px', lineHeight: 1.5 }} {...et('subtitulo')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          {data.mostrar_nome !== false && <input type="text" placeholder="Seu nome completo" disabled style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: 'white' }} />}
          {data.mostrar_email !== false && <input type="email" placeholder="Seu melhor e-mail" disabled style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: 'white' }} />}
          {data.mostrar_telefone !== false && <input type="tel" placeholder="WhatsApp com DDD" disabled style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: 'white' }} />}
          <EditableText tag="span" value={data.botao_texto || 'Quero participar'} onChange={v => onChange('botao_texto', v)} style={{ display: 'block', width: '100%', padding: 16, backgroundColor: data.botao_cor || '#FBB03B', color: data.botao_texto_cor || '#1A1A1A', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, textAlign: 'center', marginTop: 4, boxSizing: 'border-box' }} {...es('botao_texto')} />
        </div>
      </div>
    </section>
  )
}

// ── custom_html ───────────────────────────────────────────
function CustomHtmlEditor({ data, onChange }: { data: any; styles: SectionStyles; onChange: OnChange; onSelectElement: OnSelect; selectedElementKey: string | null; elementStyles: Record<string, any> }) {
  const [iframeHeight, setIframeHeight] = React.useState(2500)
  const [localHtml, setLocalHtml] = React.useState<string>(data.html || '')
  const lastSaved = React.useRef<string>(data.html || '')

  // Sincroniza do pai apenas quando muda externamente (usuário edita o textarea)
  React.useEffect(() => {
    if (data.html !== lastSaved.current) {
      lastSaved.current = data.html || ''
      setLocalHtml(data.html || '')
    }
  }, [data.html])

  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'kv-iframe-h' && e.data.h) {
        setIframeHeight(Math.max(400, Number(e.data.h)))
      }
      if (e.data?.type === 'kv-save-html' && e.data.html) {
        const newHtml: string = e.data.html
        lastSaved.current = newHtml
        setLocalHtml(newHtml)
        onChange('html', newHtml)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onChange])

  const isFullPage = /^\s*<!doctype/i.test(localHtml) || /^\s*<html/i.test(localHtml)

  const heightScript = (
    '<script data-kv-injected="1">' +
    '(function(){' +
    'function r(){var h=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,document.body.offsetHeight,document.documentElement.offsetHeight);' +
    'if(h>200)window.parent.postMessage({type:"kv-iframe-h",h:h},"*");}' +
    'setTimeout(r,800);setTimeout(r,2000);setTimeout(r,4000);' +
    '})();' +
    '<' + '/script>'
  )

  const editScript = (
    '<script data-kv-injected="1">' +
    '(function(){' +
    // Toolbar styles
    'var TOOLBAR_ID="__kvtb";' +
    'var OVERLAY_ID="__kvov";' +
    'var currentEl=null;' +
    // Create overlay
    'var ov=document.createElement("div");' +
    'ov.id=OVERLAY_ID;' +
    'ov.style.cssText="position:fixed;inset:0;z-index:99998;pointer-events:none;";' +
    // Create toolbar
    'var tb=document.createElement("div");' +
    'tb.id=TOOLBAR_ID;' +
    'tb.style.cssText="position:fixed;z-index:99999;display:none;align-items:center;gap:6px;flex-wrap:wrap;' +
    'background:#1A1A1A;border:1.5px solid #FBB03B;border-radius:10px;padding:8px 10px;' +
    'box-shadow:0 8px 32px rgba(0,0,0,0.6);max-width:340px;";' +
    // Label
    'var lbl=document.createElement("span");' +
    'lbl.style.cssText="font-size:10px;font-weight:700;color:#FBB03B;text-transform:uppercase;letter-spacing:0.1em;width:100%;";' +
    'lbl.textContent="Editar elemento";' +
    'tb.appendChild(lbl);' +
    // Color text
    'var ic=document.createElement("input");ic.type="color";ic.title="Cor do texto";' +
    'ic.style.cssText="width:32px;height:32px;border:1.5px solid #3a3a3a;border-radius:7px;cursor:pointer;padding:2px;background:#2a2a2a;";' +
    'tb.appendChild(ic);' +
    // Color bg
    'var ib=document.createElement("input");ib.type="color";ib.title="Cor de fundo";' +
    'ib.style.cssText="width:32px;height:32px;border:1.5px solid #3a3a3a;border-radius:7px;cursor:pointer;padding:2px;background:#2a2a2a;";' +
    'tb.appendChild(ib);' +
    // Font size
    'var ifs=document.createElement("input");ifs.type="number";ifs.min="8";ifs.max="200";ifs.placeholder="px";' +
    'ifs.style.cssText="width:54px;height:32px;border:1.5px solid #3a3a3a;border-radius:7px;background:#2a2a2a;color:white;text-align:center;font-size:12px;";' +
    'tb.appendChild(ifs);' +
    // Bold
    'var ibold=document.createElement("button");ibold.textContent="B";' +
    'ibold.style.cssText="width:32px;height:32px;border:1.5px solid #3a3a3a;border-radius:7px;background:#2a2a2a;color:white;font-weight:700;font-size:14px;cursor:pointer;";' +
    'tb.appendChild(ibold);' +
    // Italic
    'var iit=document.createElement("button");iit.textContent="I";' +
    'iit.style.cssText="width:32px;height:32px;border:1.5px solid #3a3a3a;border-radius:7px;background:#2a2a2a;color:white;font-style:italic;font-size:14px;cursor:pointer;";' +
    'tb.appendChild(iit);' +
    // Divider
    'var div=document.createElement("span");div.style.cssText="width:1px;height:24px;background:#3a3a3a;display:inline-block;";' +
    'tb.appendChild(div);' +
    // Apply button
    'var iapp=document.createElement("button");iapp.textContent="\\u2713 Aplicar";' +
    'iapp.style.cssText="height:32px;padding:0 12px;border:none;border-radius:7px;background:#FBB03B;color:#1A1A1A;font-weight:800;font-size:12px;cursor:pointer;";' +
    'tb.appendChild(iapp);' +
    // Cancel button
    'var icancel=document.createElement("button");icancel.textContent="\\u2715";' +
    'icancel.style.cssText="width:32px;height:32px;border:1.5px solid #3a3a3a;border-radius:7px;background:#2a2a2a;color:#a3a3a3;font-size:14px;cursor:pointer;";' +
    'tb.appendChild(icancel);' +
    // Helper: rgb to hex
    'function toHex(rgb){var m=rgb.match(/\\d+/g);if(!m||m.length<3)return "#000000";' +
    'return "#"+m.slice(0,3).map(function(n){return ("0"+parseInt(n).toString(16)).slice(-2);}).join("");}' +
    // Show toolbar
    'function showTb(el){' +
    'var cs=window.getComputedStyle(el);' +
    'ic.value=toHex(cs.color||"rgb(0,0,0)");' +
    'var bgc=cs.backgroundColor;' +
    'ib.value=(bgc==="transparent"||bgc==="rgba(0, 0, 0, 0)")?"#050505":toHex(bgc);' +
    'ifs.value=Math.round(parseFloat(cs.fontSize)||16);' +
    'var rect=el.getBoundingClientRect();' +
    'var top=rect.top-58;if(top<10)top=rect.bottom+8;' +
    'tb.style.top=Math.max(8,top)+"px";' +
    'tb.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-350))+"px";' +
    'tb.style.display="flex";}' +
    // Hide toolbar
    'function hideTb(){' +
    'tb.style.display="none";' +
    'if(currentEl){currentEl.contentEditable="false";currentEl.style.outline="";currentEl=null;}}' +
    // Serialize and save
    'function saveHtml(){' +
    'tb.remove();ov.remove();' +
    'if(currentEl){currentEl.contentEditable="false";currentEl.style.outline="";currentEl=null;}' +
    'document.querySelectorAll("[data-kv-injected]").forEach(function(s){s.remove();});' +
    'var html="<!DOCTYPE html>\\n"+document.documentElement.outerHTML;' +
    'window.parent.postMessage({type:"kv-save-html",html:html},"*");}' +
    // Toolbar events
    'ic.addEventListener("input",function(){if(currentEl)currentEl.style.color=ic.value;});' +
    'ib.addEventListener("input",function(){if(currentEl)currentEl.style.backgroundColor=ib.value;});' +
    'ifs.addEventListener("input",function(){if(currentEl)currentEl.style.fontSize=ifs.value+"px";});' +
    'ibold.addEventListener("click",function(){if(!currentEl)return;' +
    'var w=window.getComputedStyle(currentEl).fontWeight;' +
    'currentEl.style.fontWeight=(parseInt(w)>=600)?"400":"700";});' +
    'iit.addEventListener("click",function(){if(!currentEl)return;' +
    'var s=window.getComputedStyle(currentEl).fontStyle;' +
    'currentEl.style.fontStyle=(s==="italic")?"normal":"italic";});' +
    'iapp.addEventListener("click",saveHtml);' +
    'icancel.addEventListener("click",hideTb);' +
    // Click handler
    'var TAGS=["H1","H2","H3","H4","H5","H6","P","SPAN","A","BUTTON","LI","LABEL","STRONG","EM","DIV"];' +
    'document.addEventListener("click",function(e){' +
    'if(e.target.closest&&e.target.closest("#"+TOOLBAR_ID))return;' +
    'var el=e.target;' +
    'while(el&&el!==document.body&&TAGS.indexOf(el.tagName)===-1)el=el.parentElement;' +
    'if(!el||el===document.body)return;' +
    'e.preventDefault();e.stopPropagation();' +
    'if(currentEl&&currentEl!==el){currentEl.contentEditable="false";currentEl.style.outline="";}' +
    'currentEl=el;' +
    'currentEl.contentEditable="true";' +
    'currentEl.style.outline="2px solid #FBB03B";' +
    'currentEl.style.outlineOffset="2px";' +
    'currentEl.focus();' +
    'showTb(el);' +
    '},true);' +
    // Init
    'function init(){document.body.appendChild(ov);document.body.appendChild(tb);}' +
    'if(document.readyState==="complete")setTimeout(init,600);' +
    'else window.addEventListener("load",function(){setTimeout(init,600);});' +
    '})();' +
    '<' + '/script>'
  )

  const buildSrcDoc = (html: string) => {
    const scripts = heightScript + editScript
    if (isFullPage) {
      return html.includes('</body>') ? html.replace('</body>', scripts + '</body>') : html + scripts
    }
    return (
      '<!DOCTYPE html><html><head><meta charset="utf-8"/>' +
      '<style>*{box-sizing:border-box;}body{margin:0;padding:0;}' +
      (data.css || '') +
      '</style></head><body>' +
      html +
      scripts +
      '</body></html>'
    )
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <iframe
        srcDoc={buildSrcDoc(localHtml)}
        style={{ width: '100%', border: 'none', display: 'block', height: iframeHeight }}
        scrolling="auto"
        title="Preview HTML"
      />
    </div>
  )
}

// ── Mapa exportado ────────────────────────────────────────
export const editorRenderers: Record<string, (data: any, styles: SectionStyles, onChange: OnChange, onSelectElement: OnSelect, selectedElementKey: string | null, elementStyles: Record<string, any>) => React.ReactNode> = {
  header_1: (d, s, o, se, sk, es) => <Header1Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  header_2: (d, s, o, se, sk, es) => <Header2Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  benefits_1: (d, s, o, se, sk, es) => <Benefits1Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  benefits_2: (d, s, o, se, sk, es) => <Benefits2Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  testimonials_1: (d, s, o, se, sk, es) => <Testimonials1Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  testimonials_2: (d, s, o, se, sk, es) => <Testimonials2Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  forms_1: (d, s, o, se, sk, es) => <Forms1Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  forms_2: (d, s, o, se, sk, es) => <Forms2Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  cta_1: (d, s, o, se, sk, es) => <Cta1Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  cta_2: (d, s, o, se, sk, es) => <Cta2Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  footer_1: (d, s, o, se, sk, es) => <Footer1Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  footer_2: (d, s, o, se, sk, es) => <Footer2Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  form_lead_1: (d, s, o, se, sk, es) => <FormLead1Editor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
  custom_html: (d, s, o, se, sk, es) => <CustomHtmlEditor data={d} styles={s} onChange={o} onSelectElement={se} selectedElementKey={sk} elementStyles={es} />,
}
