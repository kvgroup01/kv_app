import { BlockDefinition, BlockCategory } from './types';

export const blockRegistry: BlockDefinition[] = [
  // Headers
  {
    type: 'header_1',
    category: 'Headers',
    name: 'Header Clean Centered',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="40" y="40" width="200" height="20" rx="4" fill="#CBD5E1" /><rect x="60" y="70" width="160" height="10" rx="4" fill="#E2E8F0" /><rect x="100" y="100" width="80" height="24" rx="12" fill="#94A3B8" /></svg>`,
    fields: [
      { key: 'logo_url', label: 'Logo URL', type: 'image' },
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'subheadline', label: 'Subheadline', type: 'textarea' },
      { key: 'cta1_texto', label: 'CTA 1 Text', type: 'text' },
      { key: 'cta1_link', label: 'CTA 1 Link', type: 'url' },
      { key: 'cta2_texto', label: 'CTA 2 Text', type: 'text' },
      { key: 'cta2_link', label: 'CTA 2 Link', type: 'url' },
      { key: 'background_image', label: 'Background Image', type: 'image' },
    ],
    defaultData: {
      headline: 'The Ultimate Solution for Your Business',
      subheadline: 'Increase productivity and sales with our advanced tools.',
      cta1_texto: 'Get Started',
      cta1_link: '#',
      cta2_texto: 'Learn More',
    },
    defaultSectionStyles: { backgroundColor: '#ffffff', paddingTop: 80, paddingBottom: 80 },
    render: (data, styles) => `
      <section style="background-color: ${styles.backgroundColor || '#fff'}; background-image: url('${data.background_image || styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 800px; margin: 0 auto; text-align: center; position: relative; z-index: 10;">
          ${data.logo_url ? `<img src="${data.logo_url}" alt="Logo" style="height: 48px; margin-bottom: 32px;" />` : ''}
          <h1 style="font-size: 48px; font-weight: 800; color: #1e293b; margin-bottom: 24px; line-height: 1.1;">${data.headline || ''}</h1>
          <p style="font-size: 20px; color: #475569; margin-bottom: 40px; line-height: 1.5;">${data.subheadline || ''}</p>
          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            ${data.cta1_texto ? `<a href="${data.cta1_link || '#'}" style="background-color: #3b82f6; color: white; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">${data.cta1_texto}</a>` : ''}
            ${data.cta2_texto ? `<a href="${data.cta2_link || '#'}" style="background-color: transparent; color: #3b82f6; border: 2px solid #3b82f6; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">${data.cta2_texto}</a>` : ''}
          </div>
        </div>
      </section>
    `
  },
  {
    type: 'header_2',
    category: 'Headers',
    name: 'Header Two Columns',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="20" y="40" width="100" height="16" rx="4" fill="#CBD5E1" /><rect x="20" y="65" width="80" height="8" rx="4" fill="#E2E8F0" /><rect x="20" y="90" width="50" height="16" rx="8" fill="#94A3B8" /><rect x="140" y="40" width="120" height="100" rx="8" fill="#E2E8F0" /></svg>`,
    fields: [
      { key: 'logo_url', label: 'Logo URL', type: 'image' },
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'subheadline', label: 'Subheadline', type: 'textarea' },
      { key: 'cta1_texto', label: 'CTA 1 Text', type: 'text' },
      { key: 'cta1_link', label: 'CTA 1 Link', type: 'url' },
      { key: 'cta2_texto', label: 'CTA 2 Text', type: 'text' },
      { key: 'cta2_link', label: 'CTA 2 Link', type: 'url' },
      { key: 'background_image', label: 'Background Image', type: 'image' },
    ],
    defaultData: {
      headline: 'Boost Your Productivity',
      subheadline: 'The all-in-one platform to manage your tasks.',
      cta1_texto: 'Get Started',
      background_image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop',
    },
    defaultSectionStyles: { backgroundColor: '#f8fafc', paddingTop: 100, paddingBottom: 100 },
    render: (data, styles) => `
      <section style="background-color: ${styles.backgroundColor || '#f8fafc'}; background-image: url('${data.background_image || styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 100}px 24px ${styles.paddingBottom || 100}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 48px; position: relative; z-index: 10;">
          <div style="flex: 1; min-width: 300px;">
            ${data.logo_url ? `<img src="${data.logo_url}" alt="Logo" style="height: 48px; margin-bottom: 32px;" />` : ''}
            <h1 style="font-size: 56px; font-weight: 800; color: #0f172a; margin-bottom: 24px; line-height: 1.1;">${data.headline || ''}</h1>
            <p style="font-size: 20px; color: #475569; margin-bottom: 40px; line-height: 1.5;">${data.subheadline || ''}</p>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              ${data.cta1_texto ? `<a href="${data.cta1_link || '#'}" style="background-color: #0f172a; color: white; padding: 18px 40px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 18px; display: inline-block;">${data.cta1_texto}</a>` : ''}
              ${data.cta2_texto ? `<a href="${data.cta2_link || '#'}" style="background-color: transparent; color: #0f172a; border: 2px solid #0f172a; padding: 16px 40px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 18px; display: inline-block;">${data.cta2_texto}</a>` : ''}
            </div>
          </div>
          <div style="flex: 1; min-width: 300px;">
            <div style="width: 100%; aspect-ratio: 4/3; background-color: rgba(0,0,0,0.05); border-radius: 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);">
                <div style="text-align: center; color: #94a3b8; font-family: monospace;">Media Container</div>
            </div>
          </div>
        </div>
      </section>
    `
  },
  
  // Benefícios
  {
    type: 'benefits_1',
    category: 'Benefícios',
    name: '3 Columns Iconic',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="100" y="20" width="80" height="12" rx="4" fill="#CBD5E1" /><rect x="80" y="40" width="120" height="4" rx="2" fill="#E2E8F0" /><circle cx="50" cy="80" r="16" fill="#E2E8F0" /><rect x="30" y="110" width="40" height="6" rx="3" fill="#CBD5E1" /><rect x="25" y="125" width="50" height="4" rx="2" fill="#E2E8F0" /><circle cx="140" cy="80" r="16" fill="#E2E8F0" /><rect x="120" y="110" width="40" height="6" rx="3" fill="#CBD5E1" /><rect x="115" y="125" width="50" height="4" rx="2" fill="#E2E8F0" /><circle cx="230" cy="80" r="16" fill="#E2E8F0" /><rect x="210" y="110" width="40" height="6" rx="3" fill="#CBD5E1" /><rect x="205" y="125" width="50" height="4" rx="2" fill="#E2E8F0" /></svg>`,
    fields: [
      { key: 'titulo', label: 'Section Title', type: 'text' },
      { key: 'subtitulo', label: 'Section Subtitle', type: 'textarea' },
      { 
        key: 'items', label: 'Benefits', type: 'array', 
        subFields: [
          { key: 'icone_emoji', label: 'Emoji Icon', type: 'text' },
          { key: 'titulo', label: 'Title', type: 'text' },
          { key: 'descricao', label: 'Description', type: 'textarea' },
        ]
      }
    ],
    defaultData: {
      titulo: 'Why Choose Us?',
      subtitulo: 'We provide the best value in the industry.',
      items: [
        { icone_emoji: '🚀', titulo: 'Fast Performance', descricao: 'Optimized for speed to give your users the best experience.' },
        { icone_emoji: '🔒', titulo: 'Secure', descricao: 'Your data is safe with us using end-to-end encryption.' },
        { icone_emoji: '💎', titulo: 'Premium Quality', descricao: 'Top notch design aesthetics that stand out from the crowd.' }
      ]
    },
    defaultSectionStyles: { backgroundColor: '#ffffff', paddingTop: 80, paddingBottom: 80 },
    render: (data, styles) => `
      <section style="background-color: ${styles.backgroundColor || '#ffffff'}; background-image: url('${styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1200px; margin: 0 auto; text-align: center; position: relative; z-index: 10;">
          <h2 style="font-size: 36px; font-weight: 800; color: #1e293b; margin-bottom: 16px;">${data.titulo || ''}</h2>
          <p style="font-size: 18px; color: #64748b; margin-bottom: 64px; max-width: 600px; margin-left: auto; margin-right: auto;">${data.subtitulo || ''}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 32px; justify-content: center;">
            ${(data.items || []).map((item: any) => `
              <div style="flex: 1; min-width: 250px; padding: 24px;">
                <div style="font-size: 40px; margin-bottom: 24px; display: inline-flex; width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; align-items: center; justify-content: center;">${item.icone_emoji || '✅'}</div>
                <h3 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">${item.titulo || ''}</h3>
                <p style="font-size: 16px; color: #475569; line-height: 1.5;">${item.descricao || ''}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `
  },
  {
    type: 'benefits_2',
    category: 'Benefícios',
    name: 'List with Context',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="20" y="30" width="100" height="120" rx="4" fill="#E2E8F0" /><rect x="140" y="40" width="80" height="10" rx="3" fill="#CBD5E1" /><rect x="140" y="70" width="100" height="6" rx="3" fill="#CBD5E1" /><rect x="140" y="100" width="90" height="6" rx="3" fill="#CBD5E1" /></svg>`,
    fields: [
      { key: 'titulo', label: 'Section Title', type: 'text' },
      { key: 'subtitulo', label: 'Section Subtitle', type: 'textarea' },
      { 
        key: 'items', label: 'Benefits', type: 'array', 
        subFields: [
          { key: 'icone_emoji', label: 'Emoji Icon', type: 'text' },
          { key: 'titulo', label: 'Title', type: 'text' },
          { key: 'descricao', label: 'Description', type: 'textarea' },
        ]
      }
    ],
    defaultData: {
      titulo: 'Discover the features',
      subtitulo: 'Everything you need in one place.',
      items: [
        { icone_emoji: '✅', titulo: 'Easy to use', descricao: 'User friendly interface with drag and drop capabilities.' },
        { icone_emoji: '⚡', titulo: 'Customizable', descricao: 'Change colors, fonts and layouts seamlessly.' },
        { icone_emoji: '📈', titulo: 'SEO Ready', descricao: 'Built with organic growth in mind from day one.' }
      ]
    },
    defaultSectionStyles: { backgroundColor: '#f8fafc', paddingTop: 80, paddingBottom: 80 },
    render: (data, styles) => `
      <section style="background-color: ${styles.backgroundColor || '#f8fafc'}; background-image: url('${styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 64px; align-items: center; position: relative; z-index: 10;">
          <div style="flex: 1; min-width: 300px;">
             <div style="width: 100%; aspect-ratio: 4/5; background-color: rgba(0,0,0,0.05); border-radius: 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);">
                <div style="text-align: center; color: #94a3b8; font-family: monospace;">Feature Image</div>
            </div>
          </div>
          <div style="flex: 1; min-width: 300px;">
            <h2 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">${data.titulo || ''}</h2>
            <p style="font-size: 18px; color: #475569; margin-bottom: 40px;">${data.subtitulo || ''}</p>
            <div style="display: flex; flex-direction: column; gap: 24px;">
              ${(data.items || []).map((item: any) => `
                <div style="display: flex; gap: 16px;">
                  <div style="font-size: 24px; padding-top: 2px;">${item.icone_emoji || '•'}</div>
                  <div>
                    <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">${item.titulo || ''}</h3>
                    <p style="font-size: 16px; color: #475569; line-height: 1.5; margin: 0;">${item.descricao || ''}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `
  },

  // Depoimentos
  {
    type: 'testimonials_1',
    category: 'Depoimentos',
    name: 'Cards Grid',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="20" y="40" width="70" height="80" rx="4" fill="#E2E8F0" /><rect x="105" y="40" width="70" height="80" rx="4" fill="#E2E8F0" /><rect x="190" y="40" width="70" height="80" rx="4" fill="#E2E8F0" /></svg>`,
    fields: [
      { key: 'titulo', label: 'Section Title', type: 'text' },
      { 
        key: 'items', label: 'Testimonials', type: 'array', 
        subFields: [
          { key: 'nome', label: 'Name', type: 'text' },
          { key: 'cargo', label: 'Role/Company', type: 'text' },
          { key: 'texto', label: 'Testimonial', type: 'textarea' },
          { key: 'avatar_url', label: 'Avatar URL', type: 'image' },
          { key: 'estrelas', label: 'Rating (1-5)', type: 'select', options: [{label:'5',value:'5'},{label:'4',value:'4'}] },
        ]
      }
    ],
    defaultData: {
      titulo: 'What our clients say',
      items: [
        { nome: 'John Doe', cargo: 'CEO at ACME', texto: 'Incredible product, changed my business for the better. The onboarding was amazing.', avatar_url: '', estrelas: '5' },
        { nome: 'Jane Smith', cargo: 'Manager', texto: 'Very easy to use, and my whole team adapted to it perfectly.', avatar_url: '', estrelas: '5' },
        { nome: 'Peter Parker', cargo: 'Photographer', texto: 'I saved so much time using this template, absolutely amazing.', avatar_url: '', estrelas: '4' },
      ]
    },
    defaultSectionStyles: { backgroundColor: '#f1f5f9', paddingTop: 80, paddingBottom: 80 },
    render: (data, styles) => `
      <section style="background-color: ${styles.backgroundColor || '#f1f5f9'}; background-image: url('${styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1200px; margin: 0 auto; position: relative; z-index: 10;">
          <h2 style="font-size: 36px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 64px;">${data.titulo || ''}</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center;">
            ${(data.items || []).map((item: any) => `
              <div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); flex: 1; min-width: 300px; max-width: 400px; display: flex; flex-direction: column;">
                <div style="color: #fbbf24; font-size: 20px; margin-bottom: 16px; letter-spacing: 2px;">${'★'.repeat(parseInt(item.estrelas) || 5)}</div>
                <p style="font-size: 16px; color: #334155; line-height: 1.6; font-style: italic; margin-bottom: 24px; flex-grow: 1;">"${item.texto || ''}"</p>
                <div style="display: flex; align-items: center; gap: 12px; margin-top: auto;">
                  ${item.avatar_url ? `<img src="${item.avatar_url}" alt="${item.nome}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" />` : `<div style="width: 48px; height: 48px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569;">${item.nome?.charAt(0) || 'U'}</div>`}
                  <div>
                    <h4 style="font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">${item.nome || ''}</h4>
                    <p style="color: #64748b; margin: 0; font-size: 14px;">${item.cargo || ''}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `
  },
  {
    type: 'testimonials_2',
    category: 'Depoimentos',
    name: 'Featured Highlight',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="40" y="50" width="200" height="60" rx="8" fill="#E2E8F0" /><circle cx="140" cy="140" r="16" fill="#CBD5E1" /></svg>`,
    fields: [
      { key: 'titulo', label: 'Section Title', type: 'text' },
      { 
        key: 'items', label: 'Testimonial (First item used)', type: 'array', 
        subFields: [
          { key: 'nome', label: 'Name', type: 'text' },
          { key: 'cargo', label: 'Role/Company', type: 'text' },
          { key: 'texto', label: 'Testimonial', type: 'textarea' },
          { key: 'avatar_url', label: 'Avatar URL', type: 'image' },
        ]
      }
    ],
    defaultData: {
      titulo: 'Loved by creators',
      items: [
        { nome: 'Sarah Connor', cargo: 'Founder at Global Tech', texto: 'This platform is absolutely amazing. Highly recommended for everyone wanting to scale.', avatar_url: '' }
      ]
    },
    defaultSectionStyles: { backgroundColor: '#ffffff', paddingTop: 100, paddingBottom: 100 },
    render: (data, styles) => {
      const item = data.items?.[0] || {};
      return `
      <section style="background-color: ${styles.backgroundColor || '#ffffff'}; background-image: url('${styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 100}px 24px ${styles.paddingBottom || 100}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 800px; margin: 0 auto; text-align: center; position: relative; z-index: 10;">
          ${data.titulo ? `<h2 style="font-size: 16px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px;">${data.titulo}</h2>` : ''}
          <div style="font-size: 80px; color: #e2e8f0; line-height: 0; margin-bottom: 24px; font-family: Georgia, serif;">"</div>
          <p style="font-size: 28px; font-weight: 500; color: #0f172a; line-height: 1.5; margin-bottom: 48px;">${item.texto || ''}</p>
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            ${item.avatar_url ? `<img src="${item.avatar_url}" alt="${item.nome}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin-bottom: 16px;" />` : `<div style="width: 72px; height: 72px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-bottom: 16px; font-size: 24px;">${item.nome?.charAt(0) || 'U'}</div>`}
            <h4 style="font-weight: 800; color: #0f172a; margin: 0 0 4px 0; font-size: 18px;">${item.nome || ''}</h4>
            <p style="color: #64748b; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${item.cargo || ''}</p>
          </div>
        </div>
      </section>
    `;}
  },

  // Formulários
  {
    type: 'forms_1',
    category: 'Formulários',
    name: 'Form Split View',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="20" y="40" width="100" height="16" rx="4" fill="#CBD5E1" /><rect x="140" y="30" width="120" height="120" rx="8" fill="#E2E8F0" /><rect x="150" y="50" width="100" height="10" fill="#CBD5E1" /><rect x="150" y="70" width="100" height="10" fill="#CBD5E1" /><rect x="150" y="90" width="100" height="10" fill="#CBD5E1" /></svg>`,
    fields: [
      { key: 'titulo', label: 'Section Title', type: 'text' },
      { key: 'subtitulo', label: 'Section Subtitle', type: 'textarea' },
      { key: 'botao_texto', label: 'Button Text', type: 'text' },
      { key: 'botao_cor', label: 'Button Color', type: 'color' },
      { 
        key: 'campos', label: 'Fields', type: 'array', 
        subFields: [
          { key: 'label', label: 'Field Label', type: 'text' },
          { key: 'tipo', label: 'Field Type', type: 'select', options: [{label:'text',value:'text'},{label:'email',value:'email'},{label:'tel',value:'tel'}] },
          { key: 'obrigatorio', label: 'Required?', type: 'boolean' },
        ]
      }
    ],
    defaultData: {
      titulo: 'Join the waitlist',
      subtitulo: 'Fill out the form to get early access.',
      botao_texto: 'Save my spot',
      botao_cor: '#0f172a',
      campos: [
        { label: 'Name', tipo: 'text', obrigatorio: true },
        { label: 'Email', tipo: 'email', obrigatorio: true },
      ]
    },
    defaultSectionStyles: { backgroundColor: '#f8fafc', paddingTop: 80, paddingBottom: 80 },
    render: (data, styles) => `
      <section style="background-color: ${styles.backgroundColor || '#f8fafc'}; background-image: url('${styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1000px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 48px; align-items: center; position: relative; z-index: 10;">
          <div style="flex: 1; min-width: 300px;">
            <h2 style="font-size: 40px; font-weight: 800; color: #0f172a; margin-bottom: 24px; line-height: 1.2;">${data.titulo || ''}</h2>
            <p style="font-size: 18px; color: #475569; line-height: 1.6; margin-bottom: 0;">${data.subtitulo || ''}</p>
          </div>
          <div style="flex: 1; min-width: 300px;">
            <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
              <form onsubmit="event.preventDefault(); window.KVSubmitForm && window.KVSubmitForm(Object.fromEntries(new FormData(this)))" style="display: flex; flex-direction: column; gap: 20px;">
                ${(data.campos || []).map((c: any, i: number) => `
                  <div>
                    <label style="display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px;">${c.label} ${c.obrigatorio ? '<span style="color:#ef4444">*</span>' : ''}</label>
                    <input type="${c.tipo || 'text'}" name="field_${i}" ${c.obrigatorio ? 'required' : ''} style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='${data.botao_cor || '#0f172a'}'" onblur="this.style.borderColor='#cbd5e1'" />
                  </div>
                `).join('')}
                <button type="submit" style="background-color: ${data.botao_cor || '#0f172a'}; color: white; border: none; padding: 16px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 8px; width: 100%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">${data.botao_texto}</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    `
  },
  {
    type: 'forms_2',
    category: 'Formulários',
    name: 'Inline Form Centered',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="60" y="50" width="160" height="16" rx="4" fill="#CBD5E1" /><rect x="40" y="80" width="150" height="24" rx="4" fill="#E2E8F0" /><rect x="195" y="80" width="45" height="24" rx="4" fill="#94A3B8" /></svg>`,
    fields: [
      { key: 'titulo', label: 'Section Title', type: 'text' },
      { key: 'subtitulo', label: 'Section Subtitle', type: 'textarea' },
      { key: 'botao_texto', label: 'Button Text', type: 'text' },
      { key: 'botao_cor', label: 'Button Color', type: 'color' },
      { 
        key: 'campos', label: 'Fields', type: 'array', 
        subFields: [
          { key: 'label', label: 'Field Label/Placeholder', type: 'text' },
          { key: 'tipo', label: 'Field Type', type: 'select', options: [{label:'text',value:'text'},{label:'email',value:'email'}] },
          { key: 'obrigatorio', label: 'Required?', type: 'boolean' },
        ]
      }
    ],
    defaultData: {
      titulo: 'Subscribe to newsletter',
      subtitulo: 'Get the latest news in your inbox directly.',
      botao_texto: 'Subscribe',
      botao_cor: '#0f172a',
      campos: [
        { label: 'Enter your email', tipo: 'email', obrigatorio: true },
      ]
    },
    defaultSectionStyles: { backgroundColor: '#ffffff', paddingTop: 80, paddingBottom: 80 },
    render: (data, styles) => `
      <section style="background-color: ${styles.backgroundColor || '#ffffff'}; background-image: url('${styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 600px; margin: 0 auto; text-align: center; position: relative; z-index: 10;">
          <h2 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">${data.titulo || ''}</h2>
          <p style="font-size: 18px; color: #475569; margin-bottom: 32px;">${data.subtitulo || ''}</p>
          <form onsubmit="event.preventDefault(); window.KVSubmitForm && window.KVSubmitForm(Object.fromEntries(new FormData(this)))" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
            ${(data.campos || []).map((c: any, i: number) => `
              <input type="${c.tipo || 'text'}" name="field_${i}" placeholder="${c.label}" ${c.obrigatorio ? 'required' : ''} style="flex: 1; min-width: 250px; padding: 16px 20px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='${data.botao_cor || '#0f172a'}'" onblur="this.style.borderColor='#cbd5e1'" />
            `).join('')}
            <button type="submit" style="background-color: ${data.botao_cor || '#0f172a'}; color: white; border: none; padding: 16px 36px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer;">${data.botao_texto}</button>
          </form>
        </div>
      </section>
    `
  },

  // CTA
  {
    type: 'cta_1',
    category: 'CTA',
    name: 'CTA Block Boxed',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="20" y="30" width="240" height="120" rx="16" fill="#3B82F6" /><rect x="60" y="60" width="160" height="12" rx="4" fill="white" /><rect x="110" y="100" width="60" height="16" rx="8" fill="#F59E0B" /></svg>`,
    fields: [
      { key: 'titulo', label: 'Title', type: 'text' },
      { key: 'subtitulo', label: 'Subtitle', type: 'textarea' },
      { key: 'cta_texto', label: 'Button Text', type: 'text' },
      { key: 'cta_link', label: 'Button Link', type: 'url' },
      { key: 'background_color', label: 'Card Color', type: 'color' },
    ],
    defaultData: {
      titulo: 'Ready to Transform Your Business?',
      subtitulo: 'Join thousands of satisfied customers.',
      cta_texto: 'Get Started Now',
      cta_link: '#',
      background_color: '#3b82f6',
    },
    defaultSectionStyles: { backgroundColor: '#ffffff', paddingTop: 80, paddingBottom: 80 },
    render: (data, styles) => `
      <section style="background-color: ${styles.backgroundColor || '#ffffff'}; background-image: url('${styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 80}px 24px ${styles.paddingBottom || 80}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1000px; margin: 0 auto; position: relative; z-index: 10;">
          <div style="background-color: ${data.background_color || '#3b82f6'}; border-radius: 24px; padding: 64px 32px; text-align: center; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);">
            <h2 style="font-size: 40px; font-weight: 800; color: white; margin-bottom: 16px;">${data.titulo || ''}</h2>
            <p style="font-size: 20px; color: rgba(255,255,255,0.9); margin-bottom: 40px;">${data.subtitulo || ''}</p>
            <a href="${data.cta_link || '#'}" style="display: inline-block; background-color: white; color: ${data.background_color || '#3b82f6'}; padding: 18px 40px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 18px;">${data.cta_texto}</a>
          </div>
        </div>
      </section>
    `
  },
  {
    type: 'cta_2',
    category: 'CTA',
    name: 'CTA Minimal Split',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="white" /><rect x="20" y="80" width="120" height="12" rx="4" fill="#CBD5E1" /><rect x="200" y="80" width="60" height="16" rx="4" fill="#94A3B8" /></svg>`,
    fields: [
      { key: 'titulo', label: 'Title', type: 'text' },
      { key: 'subtitulo', label: 'Subtitle', type: 'text' },
      { key: 'cta_texto', label: 'Button Text', type: 'text' },
      { key: 'cta_link', label: 'Button Link', type: 'url' },
      { key: 'background_color', label: 'Background Color', type: 'color' }, // optional from fields
    ],
    defaultData: {
      titulo: 'Still have questions?',
      subtitulo: 'Talk to our experts today.',
      cta_texto: 'Contact Us',
      cta_link: '#',
    },
    defaultSectionStyles: { backgroundColor: '#f8fafc', paddingTop: 60, paddingBottom: 60 },
    render: (data, styles) => `
      <section style="background-color: ${data.background_color || styles.backgroundColor || '#f8fafc'}; background-image: url('${styles.backgroundImage || ''}'); background-size: cover; background-position: center; padding: ${styles.paddingTop || 60}px 24px ${styles.paddingBottom || 60}px; border-top: 1px solid #e2e8f0; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 32px; position: relative; z-index: 10;">
          <div>
            <h2 style="font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">${data.titulo || ''}</h2>
            <p style="font-size: 16px; color: #64748b; margin: 0;">${data.subtitulo || ''}</p>
          </div>
          <div>
            <a href="${data.cta_link || '#'}" style="display: inline-block; background-color: transparent; color: #0f172a; border: 2px solid #0f172a; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 16px;">${data.cta_texto}</a>
          </div>
        </div>
      </section>
    `
  },

  // Rodapés
  {
    type: 'footer_1',
    category: 'Rodapés',
    name: 'Footer Full Layout',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="#1E293B" /><rect x="20" y="40" width="80" height="12" rx="4" fill="#64748B" /><rect x="140" y="40" width="40" height="8" rx="2" fill="#475569" /><rect x="200" y="40" width="40" height="8" rx="2" fill="#475569" /><rect x="20" y="140" width="240" height="1" fill="#334155" /><rect x="100" y="160" width="80" height="4" rx="2" fill="#475569" /></svg>`,
    fields: [
      { key: 'logo_url', label: 'Logo Image', type: 'image' },
      { key: 'descricao', label: 'Description', type: 'textarea' },
      { 
        key: 'links', label: 'Links', type: 'array', 
        subFields: [
          { key: 'label', label: 'Link Text', type: 'text' },
          { key: 'url', label: 'Link URL', type: 'url' },
        ]
      },
      { key: 'copyright', label: 'Copyright text', type: 'text' }
    ],
    defaultData: {
      descricao: 'The best platform for your products.',
      links: [
        { label: 'Privacy Policy', url: '#' },
        { label: 'Terms of Service', url: '#' },
        { label: 'Contact', url: '#' }
      ],
      copyright: '© 2026 Company. All rights reserved.'
    },
    defaultSectionStyles: { backgroundColor: '#0f172a', paddingTop: 64, paddingBottom: 32 },
    render: (data, styles) => `
      <footer style="background-color: ${styles.backgroundColor || '#0f172a'}; padding: ${styles.paddingTop || 64}px 24px ${styles.paddingBottom || 32}px; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1200px; margin: 0 auto; position: relative; z-index: 10;">
          <div style="display: flex; flex-wrap: wrap; gap: 48px; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 48px; margin-bottom: 32px;">
            <div style="flex: 2; min-width: 280px;">
              ${data.logo_url ? `<img src="${data.logo_url}" alt="Logo" style="height: 32px; margin-bottom: 16px;" />` : `<h3 style="font-size: 24px; font-weight: 800; color: white; margin-bottom: 16px;">Logo</h3>`}
              <p style="font-size: 15px; color: #94a3b8; line-height: 1.6; max-width: 320px;">${data.descricao || ''}</p>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <h4 style="font-size: 16px; font-weight: 700; color: white; margin-bottom: 24px;">Links</h4>
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
                ${(data.links || []).map((l: any) => `
                  <li><a href="${l.url || '#'}" style="color: #94a3b8; text-decoration: none; font-size: 15px;">${l.label || ''}</a></li>
                `).join('')}
              </ul>
            </div>
          </div>
          <div style="text-align: center;">
            <p style="font-size: 14px; color: #64748b; margin: 0;">${data.copyright || ''}</p>
          </div>
        </div>
      </footer>
    `
  },
  {
    type: 'footer_2',
    category: 'Rodapés',
    name: 'Footer Minimal Simple',
    thumbnail: `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="180" fill="#F8FAFC" /><rect x="60" y="80" width="160" height="8" rx="2" fill="#94A3B8" /><rect x="100" y="100" width="80" height="4" rx="2" fill="#CBD5E1" /></svg>`,
    fields: [
      { key: 'logo_url', label: 'Logo Image', type: 'image' },
      { key: 'copyright', label: 'Copyright text', type: 'text' },
      { 
        key: 'links', label: 'Links', type: 'array', 
        subFields: [
          { key: 'label', label: 'Link Text', type: 'text' },
          { key: 'url', label: 'Link URL', type: 'url' },
        ]
      },
    ],
    defaultData: {
      copyright: '© 2026 Company. All rights reserved.',
      links: [
        { label: 'Privacy', url: '#' },
        { label: 'Terms', url: '#' }
      ]
    },
    defaultSectionStyles: { backgroundColor: '#f8fafc', paddingTop: 40, paddingBottom: 40 },
    render: (data, styles) => `
      <footer style="background-color: ${styles.backgroundColor || '#f8fafc'}; padding: ${styles.paddingTop || 40}px 24px ${styles.paddingBottom || 40}px; border-top: 1px solid #e2e8f0; position: relative;">
        ${styles.overlayColor ? `<div style="position: absolute; inset: 0; background-color: ${styles.overlayColor}; opacity: ${(styles.overlayOpacity || 0) / 100};"></div>` : ''}
        <div style="max-width: 1200px; margin: 0 auto; text-align: center; position: relative; z-index: 10;">
          ${data.logo_url ? `<img src="${data.logo_url}" alt="Logo" style="height: 32px; margin-bottom: 24px;" />` : ''}
          <div style="display: flex; gap: 24px; justify-content: center; margin-bottom: 24px;">
            ${(data.links || []).map((l: any) => `
              <a href="${l.url || '#'}" style="color: #64748b; font-size: 14px; text-decoration: none; font-weight: 500;">${l.label || ''}</a>
            `).join('')}
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin: 0;">${data.copyright || ''}</p>
        </div>
      </footer>
    `
  }
];

export const BLOCK_CATEGORIES: BlockCategory[] = [
  'Headers','Benefícios','Depoimentos','Formulários','CTA','Rodapés',
  'Dúvidas','Galeria','Vídeos','Equipes','Planos','Garantias','Timelines'
];

export const getBlocksByCategory = (cat: BlockCategory) =>
  blockRegistry.filter(b => b.category === cat);

export const getBlockByType = (type: string) =>
  blockRegistry.find(b => b.type === type);
