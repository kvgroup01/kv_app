import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '../../lib/supabase'
import { getBlockByType } from '../../lib/blocks/registry'
import type { PageBlock } from '../../lib/blocks/types'

export default function PagePreview() {
  const { slug } = useParams()
  const [html, setHtml] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const blocks: PageBlock[] = data.page_data?.blocks || []
        const renderedHtml = blocks
          .filter((b: PageBlock) => !b.hidden)
          .map((b: PageBlock) => {
            const def = getBlockByType(b.type)
            if (!def) return ''
            return def.render(b.data, b.sectionStyles).replace(/\{\{PAGE_ID\}\}/g, data.id)
          })
          .join('\n')
        setHtml(renderedHtml)
        setLoading(false)
        document.title = data.nome || 'Página'
      })
  }, [slug])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b', fontSize: 16 }}>
        Carregando...
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Esta página não está disponível</p>
        <p style={{ fontSize: 14, margin: 0 }}>A página pode não existir ou ainda não foi publicada.</p>
      </div>
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: html || '' }} />
}
