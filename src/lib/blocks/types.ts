export type BlockCategory =
  | 'Headers'
  | 'Benefícios'
  | 'Depoimentos'
  | 'Formulários'
  | 'CTA'
  | 'Rodapés'
  | 'Dúvidas'
  | 'Galeria'
  | 'Vídeos'
  | 'Equipes'
  | 'Planos'
  | 'Garantias'
  | 'Timelines'

export interface FieldSchema {
  key: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'color' | 'url' | 'boolean' | 'select' | 'array' | 'richtext'
  placeholder?: string
  options?: { label: string; value: string }[]
  subFields?: FieldSchema[] // para type: 'array'
  defaultValue?: any
}

export interface SectionStyles {
  backgroundImage?: string
  backgroundColor?: string
  overlayColor?: string
  overlayOpacity?: number // 0-100
  parallax?: boolean
  paddingTop?: number
  paddingBottom?: number
}

export interface PageBlock {
  id: string
  type: string
  data: Record<string, any>
  sectionStyles: SectionStyles
  hidden: boolean
}

export interface BlockDefinition {
  type: string
  category: BlockCategory
  name: string
  thumbnail: string // SVG inline string
  fields: FieldSchema[]
  defaultData: Record<string, any>
  defaultSectionStyles: SectionStyles
  render: (data: Record<string, any>, styles: SectionStyles) => string
}

export interface PageData {
  blocks: PageBlock[]
}
